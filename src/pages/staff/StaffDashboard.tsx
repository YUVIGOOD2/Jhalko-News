import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Article, Status } from '../../lib/types';
import { compact, timeAgo } from '../../lib/utils';
import PanelLayout, { StatusBadge } from '../../components/PanelLayout';
import Spinner from '../../components/Spinner';
import { useTitle } from '../../components/useTitle';

export const staffLinks = [
  { to: '/staff', label: '📰 मेरी खबरें', end: true },
  { to: '/staff/new', label: '✍️ नई खबर' },
];

export default function StaffDashboard() {
  useTitle('Staff Panel');
  const { session, profile } = useAuth();
  const [items, setItems] = useState<Article[]>([]);
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!session) return;
    setLoading(true);
    const { data } = await supabase
      .from('articles')
      .select('id,title,slug,status,views,reject_reason,updated_at,published_at,categories(name)')
      .eq('author_id', session.user.id)
      .order('updated_at', { ascending: false })
      .limit(200);
    setItems((data ?? []) as unknown as Article[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [session?.user.id]);

  const del = async (a: Article) => {
    if (!confirm(`"${a.title}" को delete करें?`)) return;
    const { error } = await supabase.from('articles').delete().eq('id', a.id);
    if (error) alert('Delete नहीं हुआ: ' + error.message);
    else void load();
  };

  const count = (s: Status) => items.filter((a) => a.status === s).length;
  const shown = filter === 'all' ? items : items.filter((a) => a.status === filter);
  const links = profile?.role === 'admin' ? [...staffLinks, { to: '/admin', label: '🛡️ Admin Panel' }] : staffLinks;

  return (
    <PanelLayout title="Staff Panel" links={links}>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Stat label="कुल खबरें" value={items.length} />
        <Stat label="Published" value={count('published')} color="text-green-600" />
        <Stat label="Review में" value={count('pending')} color="text-yellow-600" />
        <Stat label="Draft" value={count('draft')} />
        <Stat label="कुल Views" value={compact(items.reduce((s, a) => s + (a.views || 0), 0))} color="text-brand-deep" />
      </div>

      <div className="mt-6 rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(['all', 'draft', 'pending', 'published', 'rejected'] as const).map((s) => (
              <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-sm font-semibold ${filter === s ? 'bg-brand text-ink' : 'bg-gray-100'}`}>
                {s === 'all' ? 'सभी' : s}
              </button>
            ))}
          </div>
          <Link to="/staff/new" className="btn-primary">+ नई खबर लिखें</Link>
        </div>

        {loading ? <Spinner /> : shown.length === 0 ? (
          <p className="py-10 text-center text-gray-500">कोई खबर नहीं।</p>
        ) : (
          <div className="divide-y">
            {shown.map((a) => (
              <div key={a.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge s={a.status} />
                    {a.categories && <span className="text-xs text-gray-500">{a.categories.name}</span>}
                    <span className="text-xs text-gray-400">• {timeAgo(a.updated_at)}</span>
                    {a.status === 'published' && <span className="text-xs text-gray-400">• 👁 {compact(a.views)}</span>}
                  </div>
                  <p className="mt-1 truncate font-semibold">{a.title}</p>
                  {a.status === 'rejected' && a.reject_reason && (
                    <p className="mt-1 text-sm text-red-600">❌ कारण: {a.reject_reason}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  {a.status === 'published' ? (
                    <Link to={`/news/${a.slug}`} className="btn-sm">देखें</Link>
                  ) : (
                    <Link to={`/staff/edit/${a.id}`} className="btn-sm">Edit</Link>
                  )}
                  {(a.status === 'draft' || a.status === 'rejected') && (
                    <button onClick={() => void del(a)} className="btn-sm text-red-600">Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PanelLayout>
  );
}

export function Stat({ label, value, color = 'text-ink' }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-extrabold ${color}`}>{value}</p>
    </div>
  );
}
