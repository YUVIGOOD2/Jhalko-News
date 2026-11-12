import { supabase, isConfigured } from './supabase';
import type { Article, Category } from './types';
import { demoArticles, demoCategories } from './demo';
import { safeSearch } from './utils';

const LIST_COLS =
  'id,title,slug,summary,cover_url,video_url,category_id,tags,author_name,status,is_breaking,is_featured,location,views,published_at,created_at,updated_at';

export async function getCategories(): Promise<Category[]> {
  if (!isConfigured) return demoCategories;
  const { data, error } = await supabase.from('categories').select('*').order('sort_order');
  if (error) throw error;
  return (data ?? []) as Category[];
}

export interface ListOpts {
  categorySlug?: string;
  limit?: number;
  featured?: boolean;
  breaking?: boolean;
  video?: boolean;
  orderBy?: 'published_at' | 'views';
  excludeId?: string;
  sinceDays?: number;
}

export async function listPublished(o: ListOpts = {}): Promise<Article[]> {
  const limit = o.limit ?? 12;
  const order = o.orderBy ?? 'published_at';

  if (!isConfigured) {
    let a = demoArticles.filter((x) => x.status === 'published');
    if (o.categorySlug) a = a.filter((x) => x.categories?.slug === o.categorySlug);
    if (o.featured) a = a.filter((x) => x.is_featured);
    if (o.breaking) a = a.filter((x) => x.is_breaking);
    if (o.video) a = a.filter((x) => x.video_url);
    if (o.excludeId) a = a.filter((x) => x.id !== o.excludeId);
    a = [...a].sort((x, y) =>
      order === 'views' ? y.views - x.views : (y.published_at ?? '').localeCompare(x.published_at ?? ''),
    );
    return a.slice(0, limit);
  }

  const catJoin = o.categorySlug ? 'categories!inner(name,slug)' : 'categories(name,slug)';
  let q = supabase.from('articles').select(`${LIST_COLS},${catJoin}`).eq('status', 'published');
  if (o.categorySlug) q = q.eq('categories.slug', o.categorySlug);
  if (o.featured) q = q.eq('is_featured', true);
  if (o.breaking) q = q.eq('is_breaking', true);
  if (o.video) q = q.not('video_url', 'is', null);
  if (o.excludeId) q = q.neq('id', o.excludeId);
  if (o.sinceDays) q = q.gte('published_at', new Date(Date.now() - o.sinceDays * 86400_000).toISOString());
  const { data, error } = await q.order(order, { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (!/^[a-z0-9-]{3,120}$/.test(slug)) return null;
  if (!isConfigured) return demoArticles.find((a) => a.slug === slug) ?? null;
  const { data, error } = await supabase
    .from('articles')
    .select(`${LIST_COLS},body,categories(name,slug)`)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Article | null;
}

export async function searchArticles(q: string): Promise<Article[]> {
  const s = safeSearch(q);
  if (s.length < 2) return [];
  if (!isConfigured) {
    return demoArticles.filter((a) => a.title.includes(s) || a.summary.includes(s));
  }
  const { data, error } = await supabase
    .from('articles')
    .select(`${LIST_COLS},categories(name,slug)`)
    .eq('status', 'published')
    .or(`title.ilike.%${s}%,summary.ilike.%${s}%`)
    .order('published_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}

export async function bumpViews(id: string) {
  if (!isConfigured) return;
  const key = `jn_v_${id}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    /* storage blocked */
  }
  await supabase.rpc('increment_views', { p_id: id });
}
