import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import BreakingTicker from './BreakingTicker';
import { getCategories } from '../lib/api';
import type { Category } from '../lib/types';
import { SITE } from '../config';

export default function Header() {
  const [cats, setCats] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    getCategories().then(setCats).catch(() => setCats([]));
  }, []);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const s = q.trim();
    if (s.length >= 2) {
      nav(`/search?q=${encodeURIComponent(s)}`);
      setOpen(false);
    }
  };

  const today = new Date().toLocaleDateString('hi-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap px-3 py-3 text-[15px] font-bold transition ${
      isActive ? 'bg-ink text-brand' : 'text-ink hover:bg-ink hover:text-brand'
    }`;

  return (
    <header className="sticky top-0 z-40 shadow-md">
      {/* top strip */}
      <div className="hidden border-b border-white/10 bg-ink text-xs text-gray-400 md:block">
        <div className="container-x flex items-center justify-between py-1.5">
          <span>📅 {today}</span>
          <span className="flex gap-4">
            <a href={SITE.social.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-brand">Facebook</a>
            <a href={SITE.social.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-brand">YouTube</a>
            <a href={SITE.social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-brand">Instagram</a>
            <a href={SITE.social.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-brand">WhatsApp</a>
          </span>
        </div>
      </div>

      {/* logo row – black, logo jaisa */}
      <div className="bg-ink">
        <div className="container-x flex items-center justify-between gap-4 py-3">
          <Link to="/" aria-label="Home"><Logo light /></Link>

          <form onSubmit={onSearch} className="hidden flex-1 justify-center md:flex">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              maxLength={60}
              placeholder="खबर खोजें..."
              className="w-full max-w-md rounded-l-full border-2 border-r-0 border-white/20 bg-white/5 px-4 py-2 text-white outline-none placeholder:text-gray-500 focus:border-brand"
            />
            <button className="rounded-r-full bg-brand px-5 font-bold text-ink hover:bg-brand-dark">खोजें</button>
          </form>

          <div className="flex items-center gap-2">
            <a
              href={SITE.liveTv}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-live px-4 py-2 text-sm font-bold text-white hover:brightness-110"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
              </span>
              LIVE
            </a>
            <button
              onClick={() => setOpen((v) => !v)}
              className="rounded-lg border border-white/30 px-3 py-2 text-white md:hidden"
              aria-label="Menu"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* nav – yellow strip */}
      <nav className="bg-brand">
        <div className="container-x no-scrollbar hidden overflow-x-auto md:flex">
          <NavLink to="/" end className={linkCls}>होम</NavLink>
          {cats.map((c) => (
            <NavLink key={c.id} to={`/category/${c.slug}`} className={linkCls}>{c.name}</NavLink>
          ))}
          <NavLink to="/videos" className={linkCls}>वीडियो</NavLink>
          <NavLink to="/contact" className={linkCls}>संपर्क</NavLink>
        </div>

        {open && (
          <div className="md:hidden">
            <form onSubmit={onSearch} className="flex p-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                maxLength={60}
                placeholder="खबर खोजें..."
                className="w-full rounded-l-lg px-3 py-2 text-ink outline-none"
              />
              <button className="rounded-r-lg bg-ink px-4 font-bold text-brand">खोजें</button>
            </form>
            <div className="grid grid-cols-2 pb-2" onClick={() => setOpen(false)}>
              <NavLink to="/" end className={linkCls}>होम</NavLink>
              {cats.map((c) => (
                <NavLink key={c.id} to={`/category/${c.slug}`} className={linkCls}>{c.name}</NavLink>
              ))}
              <NavLink to="/videos" className={linkCls}>वीडियो</NavLink>
              <NavLink to="/contact" className={linkCls}>संपर्क</NavLink>
            </div>
          </div>
        )}
      </nav>

      <BreakingTicker />
    </header>
  );
}
