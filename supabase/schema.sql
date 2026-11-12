-- =====================================================================
--  JHALKO NEWS – Supabase schema + full security (RLS)
--  Supabase Dashboard -> SQL Editor -> New query -> poora paste -> RUN
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Types ----------
do $$ begin
  create type public.user_role as enum ('none', 'staff', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.article_status as enum ('draft', 'pending', 'published', 'rejected');
exception when duplicate_object then null; end $$;

-- ---------- Tables ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '' check (char_length(full_name) <= 80),
  role        public.user_role not null default 'none',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.categories (
  id          serial primary key,
  name        text not null unique check (char_length(name) between 2 and 40),
  slug        text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  sort_order  int not null default 0
);

create table if not exists public.articles (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(title) between 5 and 200),
  slug          text not null unique check (slug ~ '^[a-z0-9-]{3,120}$'),
  summary       text not null default '' check (char_length(summary) <= 400),
  body          text not null check (char_length(body) between 20 and 50000),
  cover_url     text check (cover_url is null or cover_url ~ '^https://'),
  video_url     text check (video_url is null or video_url ~ '^https://(www\.|m\.)?(youtube\.com|youtu\.be)/'),
  category_id   int references public.categories(id) on delete set null,
  tags          text[] not null default '{}' check (array_length(tags, 1) is null or array_length(tags, 1) <= 10),
  author_id     uuid not null default auth.uid() references public.profiles(id),
  author_name   text not null default '',
  status        public.article_status not null default 'draft',
  is_breaking   boolean not null default false,
  is_featured   boolean not null default false,
  location      text check (location is null or char_length(location) <= 60),
  views         bigint not null default 0,
  reject_reason text check (reject_reason is null or char_length(reject_reason) <= 300),
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists articles_pub_idx      on public.articles (status, published_at desc);
create index if not exists articles_cat_idx      on public.articles (category_id, status);
create index if not exists articles_author_idx   on public.articles (author_id);
create index if not exists articles_views_idx    on public.articles (views desc);

create table if not exists public.messages (
  id          bigserial primary key,
  name        text not null check (char_length(name) between 2 and 80),
  phone       text check (phone is null or phone ~ '^[0-9+ -]{7,15}$'),
  email       text check (email is null or (char_length(email) <= 120 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  message     text not null check (char_length(message) between 5 and 2000),
  created_at  timestamptz not null default now()
);

-- ---------- Role helpers (SECURITY DEFINER, fixed search_path) ----------
create or replace function public.my_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = 'admin', false)
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('staff', 'admin'), false)
$$;

-- ---------- New user -> profile (role 'none' – admin hi staff banayega) ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)), 80))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Profile guard: sirf admin role / active badal sakta hai ----------
create or replace function public.guard_profiles()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role or new.is_active is distinct from old.is_active then
      raise exception 'Not allowed';
    end if;
  end if;
  if new.id = auth.uid() and (new.role is distinct from old.role or new.is_active is distinct from old.is_active) then
    raise exception 'Apna khud ka role/status nahi badal sakte';
  end if;
  return new;
end $$;

drop trigger if exists guard_profiles_trg on public.profiles;
create trigger guard_profiles_trg before update on public.profiles
  for each row execute function public.guard_profiles();

-- ---------- Article guard: staff kabhi khud publish nahi kar sakta ----------
create or replace function public.guard_articles()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- views counter function ke liye bypass
  if current_setting('app.views_bump', true) = 'on' then
    return new;
  end if;

  new.updated_at := now();

  if tg_op = 'INSERT' then
    new.author_id := auth.uid();
    new.views := 0;
  else
    new.author_id := old.author_id;
    new.views := old.views;
    new.created_at := old.created_at;
  end if;

  select coalesce(nullif(full_name, ''), 'Jhalko News Desk') into new.author_name
  from public.profiles where id = new.author_id;

  if not public.is_admin() then
    if new.status not in ('draft', 'pending') then
      raise exception 'Staff sirf draft ya review ke liye bhej sakta hai';
    end if;
    if tg_op = 'UPDATE' and old.status = 'published' then
      raise exception 'Published khabar sirf admin edit kar sakta hai';
    end if;
    new.is_breaking := false;
    new.is_featured := false;
    new.published_at := null;
    new.reject_reason := case when tg_op = 'UPDATE' and new.status = 'draft' then old.reject_reason else null end;
  else
    if new.status = 'published' and new.published_at is null then
      new.published_at := now();
    end if;
    if new.status <> 'rejected' then
      new.reject_reason := null;
    end if;
  end if;

  return new;
end $$;

drop trigger if exists guard_articles_trg on public.articles;
create trigger guard_articles_trg before insert or update on public.articles
  for each row execute function public.guard_articles();

-- ---------- Views counter (public, sirf published) ----------
create or replace function public.increment_views(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.views_bump', 'on', true);
  update public.articles set views = views + 1 where id = p_id and status = 'published';
  perform set_config('app.views_bump', 'off', true);
end $$;

revoke all on function public.increment_views(uuid) from public;
grant execute on function public.increment_views(uuid) to anon, authenticated;

-- ---------- ROW LEVEL SECURITY ----------
alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.articles   enable row level security;
alter table public.messages   enable row level security;

-- profiles
drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- categories
drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories for select using (true);

drop policy if exists "categories admin write" on public.categories;
create policy "categories admin write" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- articles
drop policy if exists "articles read" on public.articles;
create policy "articles read" on public.articles for select using (
  status = 'published'
  or (auth.uid() is not null and author_id = auth.uid() and public.is_staff())
  or public.is_admin()
);

drop policy if exists "articles staff insert" on public.articles;
create policy "articles staff insert" on public.articles
  for insert to authenticated with check (public.is_staff());

drop policy if exists "articles update" on public.articles;
create policy "articles update" on public.articles
  for update to authenticated
  using (public.is_admin() or (public.is_staff() and author_id = auth.uid() and status <> 'published'))
  with check (public.is_admin() or (public.is_staff() and author_id = auth.uid()));

drop policy if exists "articles delete" on public.articles;
create policy "articles delete" on public.articles
  for delete to authenticated
  using (public.is_admin() or (public.is_staff() and author_id = auth.uid() and status in ('draft', 'rejected')));

-- messages (public sirf bhej sakta hai, padh sirf admin)
drop policy if exists "messages public insert" on public.messages;
create policy "messages public insert" on public.messages for insert to anon, authenticated with check (true);

drop policy if exists "messages admin read" on public.messages;
create policy "messages admin read" on public.messages for select to authenticated using (public.is_admin());

drop policy if exists "messages admin delete" on public.messages;
create policy "messages admin delete" on public.messages for delete to authenticated using (public.is_admin());

-- ---------- STORAGE: news images ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('news-images', 'news-images', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit,
                               allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "news images staff upload" on storage.objects;
create policy "news images staff upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'news-images' and public.is_staff()
              and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "news images delete" on storage.objects;
create policy "news images delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'news-images'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ---------- Default categories ----------
insert into public.categories (name, slug, sort_order) values
  ('सीकर', 'sikar', 1),
  ('राजस्थान', 'rajasthan', 2),
  ('देश', 'desh', 3),
  ('राजनीति', 'rajniti', 4),
  ('क्राइम', 'crime', 5),
  ('खेल', 'khel', 6),
  ('शिक्षा', 'shiksha', 7),
  ('मनोरंजन', 'manoranjan', 8)
on conflict (slug) do nothing;

-- =====================================================================
--  PEHLA ADMIN BANANE KE LIYE (apna user banane ke baad, email badal ke run karein):
--  update public.profiles set role = 'admin', full_name = 'Admin'
--  where id = (select id from auth.users where email = 'aapka-email@example.com');
--  (Ye SQL Editor me chalta hai – trigger yahan auth.uid() null hone par bhi
--   admin check karta hai, isliye niche wali line use karein:)
-- =====================================================================
-- alter table public.profiles disable trigger guard_profiles_trg;
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'aapka-email@example.com');
-- alter table public.profiles enable trigger guard_profiles_trg;
