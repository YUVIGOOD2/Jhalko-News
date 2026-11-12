import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

export interface PanelLink {
  to: string;
  label: string;
  end?: boolean;
}

export default function PanelLayout({ title, links, children }: { title: string; links: PanelLink[]; children: ReactNode }) {
  const { profile, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b-4 border-brand bg-ink text-white">
        <div className="container-x flex flex-wrap items-center justify-between gap-3 py-3">
          <Link to="/"><Logo size={40} light /></Link>
          <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase text-ink">{title}</span>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline">👤 {profile?.full_name || 'User'} ({profile?.role})</span>
            <button onClick={() => void signOut()} className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-brand hover:text-ink">Logout</button>
          </div>
        </div>
        <nav className="container-x no-scrollbar flex gap-1 overflow-x-auto">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-semibold ${isActive ? 'bg-brand text-ink' : 'text-gray-300 hover:text-brand'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="container-x py-6">{children}</main>
    </div>
  );
}

export function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    draft: 'bg-gray-200 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-800',
    published: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };
  const label: Record<string, string> = { draft: 'Draft', pending: 'Review में', published: 'Published', rejected: 'Rejected' };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${map[s] ?? ''}`}>{label[s] ?? s}</span>;
}
