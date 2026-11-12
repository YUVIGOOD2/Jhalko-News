import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Article, Category, Message, Profile, Role, Status } from '../../lib/types';
import { compact, formatDate, safeSearch, timeAgo } from '../../lib/utils';
import PanelLayout, { StatusBadge } from '../../components/PanelLayout';
import Spinner from '../../components/Spinner';
import { Stat } from '../staff/StaffDashboard';
import { useTitle } from '../../components/useTitle';

const adminLinks = [
  { to: '/admin', label: '📊 Dashboard', end: true },
  { to: '/admin/review', label: '⏳ Review Queue' },
  { to: '/admin/articles', label: '📰 सभी खबरें' },
  { to: '/admin/categories', label: '🗂 Categories' },
  { to: '/admin/team', label: '👥 Team' },
  { to: '/admin/messages', label: '✉️ Messages' },
  { to: '/staff/new', label: '✍️ नई खबर' },
];

function AdminShell({ children }: { children: ReactNode }) {
  return <PanelLayout title="Admin Panel" links={adminLinks}>{children}</PanelLayout>;
}

const ART_COLS = 'id,title,slug,status,views,author_name,is_breaking,is_featured,published_at,updated_at,reject_reason,categories(name)';

/* ---------------- Dashboard ---------------- */
export function AdminDashboard() {
  useTitle('Admin Dashboard');
  const [stats, setStats] = useState<Record<string, number>>({});
  const [top, setTop] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const count = async (s?: Status) => {
        let q = supabase.from('articles').select('id', { count: 'exact', head: true });
        if (s) q = q.eq('status', s);
        const { count: c } = await q;
        return c ?? 0;
      };
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [all, pub, pend, draft, todayC, msgs, staff, topRes] = await Promise.all([
        count(),
        count('published'),
        count('pending'),
        count('draft'),
        supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published').gte('published_at', today.toISOString()).then((r) => r.count ?? 0),
        supabase.from('messages').select('id', { count: 'exact', head: true }).then((r) => r.count ?? 0),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['staff', 'admin']).then((r) => r.count ?? 0),
        supabase.from('articles').select(ART_COLS).eq('status', 'published').order('views', { ascending: false }).limit(8),
      ]);
      setStats({ all, pub, pend, draft, todayC, msgs, staff });
      setTop((topRes.data ?? []) as unknown as Article[]);
      setLoading(false);
    })();
  }, []);

  return (
    <AdminShell>
      {loading ? <Spinner /> : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
            <Stat label="कुल खबरें" value={stats.all} />
            <Stat label="Published" value={stats.pub} color="text-green-600" />
            <Stat label="आज Publish" value={stats.todayC} color="text-brand-deep" />
            <Stat label="Review बाकी" value={stats.pend} color="text-yellow-600" />
            <Stat label="Drafts" value={stats.draft} />
            <Stat label="Team" value={stats.staff} />
            <Stat label="Messages" value={stats.msgs} />
          </div>
          {stats.pend > 0 && (
            <Link to="/admin/review" className="mt-6 block rounded-xl bg-yellow-100 p-4 font-semibold text-yellow-900 hover:bg-yellow-200">
              ⏳ {stats.pend} खबरें आपके review का इंतज़ार कर रही हैं →
            </Link>
          )}
          <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-bold">🔥 सबसे ज़्यादा पढ़ी गई खबरें</h2>
            <table className="w-full text-sm">
              <tbody>
                {top.map((a, i) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-2 pr-2 font-bold text-gray-400">{i + 1}</td>
                    <td className="py-2"><Link to={`/news/${a.slug}`} className="hover:text-brand-deep">{a.title}</Link></td>
                    <td className="py-2 text-right font-semibold">👁 {compact(a.views)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminShell>
  );
}

/* ---------------- Review Queue ---------------- */
export function ReviewQueue() {
  useTitle('Review Queue');
  const [items, setItems] = useState<Article[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [body, setBody] = useState<Record<string, Article>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('articles').select(ART_COLS).eq('status', 'pending').order('updated_at');
    setItems((data ?? []) as unknown as Article[]);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const toggle = async (id: string) => {
    setOpen(open === id ? null : id);
    if (!body[id]) {
      const { data } = await supabase.from('articles').select('*').eq('id', id).single();
      if (data) setBody((b) => ({ ...b, [id]: data as Article }));
    }
  };

  const publish = async (a: Article) => {
    const { error } = await supabase.from('articles').update({ status: 'published' }).eq('id', a.id);
    if (error) alert(error.message);
    else void load();
  };
  const reject = async (a: Article) => {
    const reason = prompt('Reject करने का कारण लिखें (staff को दिखेगा):')?.trim();
    if (!reason) return;
    const { error } = await supabase.from('articles').update({ status: 'rejected', reject_reason: reason.slice(0, 300) }).eq('id', a.id);
    if (error) alert(error.message);
    else void load();
  };

  return (
    <AdminShell>
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h1 className="mb-4 text-xl font-bold">⏳ Review Queue ({items.length})</h1>
        {loading ? <Spinner /> : items.length === 0 ? (
          <p className="py-10 text-center text-gray-500">🎉 कोई pending खबर नहीं।</p>
        ) : items.map((a) => (
          <div key={a.id} className="border-b py-4 last:border-0">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">{a.title}</p>
                <p className="text-xs text-gray-500">✍️ {a.author_name} • {a.categories?.name} • {timeAgo(a.updated_at)}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => void toggle(a.id)} className="btn-sm">{open === a.id ? 'बंद करें' : 'पढ़ें'}</button>
                <Link to={`/staff/edit/${a.id}`} className="btn-sm">Edit</Link>
                <button onClick={() => void publish(a)} className="btn-sm bg-green-600 text-white">✓ Publish</button>
                <button onClick={() => void reject(a)} className="btn-sm text-red-600">✕ Reject</button>
              </div>
            </div>
            {open === a.id && (
              <div className="mt-3 rounded-lg bg-gray-50 p-4 text-sm">
                {body[a.id] ? (
                  <>
                    {body[a.id].cover_url && <img src={body[a.id].cover_url!} alt="" className="mb-3 max-h-64 rounded-lg" />}
                    <p className="font-semibold">{body[a.id].summary}</p>
                    <p className="mt-2 whitespace-pre-line">{body[a.id].body}</p>
                    {body[a.id].video_url && <p className="mt-2 text-blue-600">🎬 {body[a.id].video_url}</p>}
                  </>
                ) : <Spinner />}
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

/* ---------------- All Articles ---------------- */
export function AllArticles() {
  useTitle('सभी खबरें');
  const [items, setItems] = useState<Article[]>([]);
  const [status, setStatus] = useState<Status | 'all'>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const PER = 25;

  const load = async () => {
    setLoading(true);
    let query = supabase.from('articles').select(ART_COLS).order('updated_at', { ascending: false }).range(page * PER, page * PER + PER - 1);
    if (status !== 'all') query = query.eq('status', status);
    const s = safeSearch(q);
    if (s.length >= 2) query = query.ilike('title', `%${s}%`);
    const { data } = await query;
    setItems((data ?? []) as unknown as Article[]);
    setLoading(false);
  };
  useEffect(() => { void load(); }, [status, page]);

  const patch = async (a: Article, p: Partial<Article>) => {
    const { error } = await supabase.from('articles').update(p).eq('id', a.id);
    if (error) alert(error.message);
    else void load();
  };
  const del = async (a: Article) => {
    if (!confirm(`पक्का delete करें?\n\n"${a.title}"\n\nयह वापस नहीं आएगी।`)) return;
    const { error } = await supabase.from('articles').delete().eq('id', a.id);
    if (error) alert(error.message);
    else void load();
  };

  return (
    <AdminShell>
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(['all', 'published', 'pending', 'draft', 'rejected'] as const).map((s) => (
            <button key={s} onClick={() => { setPage(0); setStatus(s); }} className={`rounded-full px-3 py-1 text-sm font-semibold ${status === s ? 'bg-brand text-ink' : 'bg-gray-100'}`}>{s}</button>
          ))}
          <form onSubmit={(e) => { e.preventDefault(); setPage(0); void load(); }} className="ml-auto flex">
            <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={60} placeholder="Headline खोजें" className="input !rounded-r-none" />
            <button className="rounded-r-lg bg-ink px-4 text-white">🔍</button>
          </form>
        </div>

        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-gray-500">
                  <th className="py-2">Headline</th><th>Status</th><th>Author</th><th>Views</th><th>⚡</th><th>⭐</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} className="border-b align-top last:border-0">
                    <td className="max-w-sm py-3 pr-3">
                      <p className="font-semibold">{a.title}</p>
                      <p className="text-xs text-gray-400">{a.categories?.name} • {formatDate(a.published_at ?? a.updated_at)}</p>
                    </td>
                    <td className="py-3"><StatusBadge s={a.status} /></td>
                    <td className="py-3">{a.author_name}</td>
                    <td className="py-3">{compact(a.views)}</td>
                    <td className="py-3"><input type="checkbox" checked={a.is_breaking} onChange={() => void patch(a, { is_breaking: !a.is_breaking })} /></td>
                    <td className="py-3"><input type="checkbox" checked={a.is_featured} onChange={() => void patch(a, { is_featured: !a.is_featured })} /></td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        {a.status === 'published' && <Link to={`/news/${a.slug}`} className="btn-sm">देखें</Link>}
                        <Link to={`/staff/edit/${a.id}`} className="btn-sm">Edit</Link>
                        {a.status === 'published'
                          ? <button onClick={() => void patch(a, { status: 'draft' })} className="btn-sm">Unpublish</button>
                          : <button onClick={() => void patch(a, { status: 'published' })} className="btn-sm text-green-700">Publish</button>}
                        <button onClick={() => void del(a)} className="btn-sm text-red-600">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && <p className="py-10 text-center text-gray-500">कोई खबर नहीं।</p>}
          </div>
        )}
        <div className="mt-4 flex justify-between">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="btn-outline disabled:opacity-40">← पिछला</button>
          <span className="text-sm text-gray-500">Page {page + 1}</span>
          <button disabled={items.length < PER} onClick={() => setPage((p) => p + 1)} className="btn-outline disabled:opacity-40">अगला →</button>
        </div>
      </div>
    </AdminShell>
  );
}

/* ---------------- Categories ---------------- */
export function CategoriesManager() {
  useTitle('Categories');
  const [cats, setCats] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setCats((data ?? []) as Category[]);
  };
  useEffect(() => { void load(); }, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    const n = name.trim();
    const s = slug.trim().toLowerCase();
    if (n.length < 2 || n.length > 40) return setErr('नाम 2-40 अक्षर का हो।');
    if (!/^[a-z0-9-]{2,40}$/.test(s)) return setErr('Slug में सिर्फ english छोटे अक्षर, नंबर और - (जैसे: krishi)');
    const { error } = await supabase.from('categories').insert({ name: n, slug: s, sort_order: cats.length + 1 });
    if (error) return setErr(error.message);
    setName(''); setSlug(''); void load();
  };

  const move = async (c: Category, dir: -1 | 1) => {
    const i = cats.findIndex((x) => x.id === c.id);
    const other = cats[i + dir];
    if (!other) return;
    await supabase.from('categories').update({ sort_order: other.sort_order }).eq('id', c.id);
    await supabase.from('categories').update({ sort_order: c.sort_order }).eq('id', other.id);
    void load();
  };

  const del = async (c: Category) => {
    if (!confirm(`"${c.name}" category delete करें? (इसकी खबरें बिना category के रह जाएंगी)`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', c.id);
    if (error) alert(error.message);
    else void load();
  };

  return (
    <AdminShell>
      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={add} className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">नई Category</h2>
          {err && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{err}</p>}
          <input className="input" placeholder="नाम (जैसे: कृषि)" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
          <input className="input" placeholder="slug (जैसे: krishi)" value={slug} onChange={(e) => setSlug(e.target.value)} maxLength={40} />
          <button className="btn-primary">+ जोड़ें</button>
        </form>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold">Categories (menu का क्रम)</h2>
          {cats.map((c, i) => (
            <div key={c.id} className="flex items-center justify-between border-b py-2 last:border-0">
              <span><b>{c.name}</b> <span className="text-xs text-gray-400">/{c.slug}</span></span>
              <span className="flex gap-1">
                <button disabled={i === 0} onClick={() => void move(c, -1)} className="btn-sm disabled:opacity-30">↑</button>
                <button disabled={i === cats.length - 1} onClick={() => void move(c, 1)} className="btn-sm disabled:opacity-30">↓</button>
                <button onClick={() => void del(c)} className="btn-sm text-red-600">🗑</button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

/* ---------------- Team ---------------- */
export function TeamManager() {
  useTitle('Team');
  const { session } = useAuth();
  const [people, setPeople] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at');
    setPeople((data ?? []) as Profile[]);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const update = async (p: Profile, patch: Partial<Profile>) => {
    if (patch.role === 'admin' && !confirm(`${p.full_name} को ADMIN बनाएं? Admin के पास पूरी power होती है।`)) return;
    const { error } = await supabase.from('profiles').update(patch).eq('id', p.id);
    if (error) alert(error.message);
    else void load();
  };

  return (
    <AdminShell>
      <div className="mb-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
        <b>नया Staff कैसे जोड़ें:</b> Supabase Dashboard → Authentication → Users → <b>Add user</b> (email + strong password, "Auto confirm" ✓)।
        फिर यहां उस user का role <b>staff</b> कर दें। Public signup बंद रखें – कोई बाहरी व्यक्ति account नहीं बना सकता।
      </div>
      <div className="rounded-xl bg-white p-5 shadow-sm">
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead><tr className="border-b text-left text-xs uppercase text-gray-500"><th className="py-2">नाम</th><th>Role</th><th>Status</th><th>जुड़े</th></tr></thead>
              <tbody>
                {people.map((p) => {
                  const me = p.id === session?.user.id;
                  return (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-3">
                        <NameEdit p={p} onSave={(full_name) => void update(p, { full_name })} />
                        {me && <span className="ml-1 text-xs text-brand-deep">(आप)</span>}
                      </td>
                      <td className="py-3">
                        <select disabled={me} value={p.role} onChange={(e) => void update(p, { role: e.target.value as Role })} className="rounded border px-2 py-1">
                          <option value="none">none (no access)</option>
                          <option value="staff">staff (reporter)</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="py-3">
                        <button disabled={me} onClick={() => void update(p, { is_active: !p.is_active })} className={`rounded-full px-3 py-1 text-xs font-bold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} disabled:opacity-60`}>
                          {p.is_active ? 'Active' : 'Blocked'}
                        </button>
                      </td>
                      <td className="py-3 text-gray-500">{formatDate(p.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function NameEdit({ p, onSave }: { p: Profile; onSave: (n: string) => void }) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(p.full_name);
  if (!edit) return <button onClick={() => setEdit(true)} className="font-semibold hover:text-brand-deep" title="नाम बदलें">{p.full_name || '(no name)'} ✎</button>;
  return (
    <span className="inline-flex gap-1">
      <input value={v} maxLength={80} onChange={(e) => setV(e.target.value)} className="rounded border px-2 py-1" />
      <button onClick={() => { onSave(v.trim()); setEdit(false); }} className="btn-sm">✓</button>
    </span>
  );
}

/* ---------------- Messages ---------------- */
export function MessagesPage() {
  useTitle('Messages');
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(200);
    setItems((data ?? []) as Message[]);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const del = async (m: Message) => {
    if (!confirm('यह message delete करें?')) return;
    await supabase.from('messages').delete().eq('id', m.id);
    void load();
  };

  return (
    <AdminShell>
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h1 className="mb-4 text-xl font-bold">✉️ Public Messages / खबर सूचना ({items.length})</h1>
        {loading ? <Spinner /> : items.length === 0 ? <p className="py-10 text-center text-gray-500">कोई message नहीं।</p> : items.map((m) => (
          <div key={m.id} className="border-b py-4 last:border-0">
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-semibold">{m.name}</p>
                <p className="text-xs text-gray-500">{m.phone && `📞 ${m.phone}`} {m.email && `✉️ ${m.email}`} • {timeAgo(m.created_at)}</p>
              </div>
              <button onClick={() => void del(m)} className="btn-sm text-red-600">🗑</button>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm">{m.message}</p>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
