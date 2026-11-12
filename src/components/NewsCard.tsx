import { Link } from 'react-router-dom';
import type { Article } from '../lib/types';
import { timeAgo } from '../lib/utils';

export function Cover({ a, className = '', hero = false }: { a: Article; className?: string; hero?: boolean }) {
  if (a.cover_url) {
    return (
      <img
        src={a.cover_url}
        alt={a.title}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${className}`}
      />
    );
  }
  return (
    <div className={`flex h-full w-full justify-center bg-ink bg-[radial-gradient(circle_at_50%_30%,#2a2a2a,#0A0A0A_70%)] ${hero ? 'items-start pt-6 md:items-center md:pt-0' : 'items-center'} ${className}`}>
      <img src="./logo.png" alt="" aria-hidden className={`${hero ? 'h-24 w-24 md:h-40 md:w-40' : 'h-3/5 max-h-28'} aspect-square rounded-full opacity-90`} />
    </div>
  );
}

function Badge({ a }: { a: Article }) {
  return (
    <div className="absolute left-2 top-2 flex gap-1">
      {a.categories && <span className="rounded bg-brand px-2 py-0.5 text-xs font-bold text-ink">{a.categories.name}</span>}
      {a.video_url && <span className="rounded bg-ink/80 px-2 py-0.5 text-xs font-bold text-white">▶ वीडियो</span>}
    </div>
  );
}

export function HeroCard({ a }: { a: Article }) {
  return (
    <Link to={`/news/${a.slug}`} className="group relative block h-80 overflow-hidden rounded-xl md:h-[420px]">
      <Cover a={a} hero />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <Badge a={a} />
      <div className="absolute bottom-0 p-5 text-white">
        <h2 className="font-head text-2xl font-bold leading-snug decoration-brand decoration-4 group-hover:underline md:text-3xl">{a.title}</h2>
        <p className="mt-2 line-clamp-2 text-gray-200">{a.summary}</p>
        <p className="mt-2 text-xs text-gray-300">{a.location && `${a.location} • `}{timeAgo(a.published_at)}</p>
      </div>
    </Link>
  );
}

export function NewsCard({ a }: { a: Article }) {
  return (
    <Link to={`/news/${a.slug}`} className="group block overflow-hidden rounded-xl border-b-4 border-transparent bg-white shadow-sm ring-1 ring-gray-100 transition hover:border-brand hover:shadow-md">
      <div className="relative aspect-video overflow-hidden">
        <Cover a={a} />
        <Badge a={a} />
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 font-head text-lg font-bold leading-snug group-hover:text-brand-deep">{a.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-600">{a.summary}</p>
        <p className="mt-2 text-xs text-gray-400">{timeAgo(a.published_at)}</p>
      </div>
    </Link>
  );
}

export function ListItem({ a, index }: { a: Article; index?: number }) {
  return (
    <Link to={`/news/${a.slug}`} className="group flex gap-3 border-b py-3 last:border-0">
      {index !== undefined ? (
        <span className="w-8 shrink-0 font-head text-3xl font-extrabold text-brand [-webkit-text-stroke:1px_#0A0A0A]">{index + 1}</span>
      ) : (
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
          <Cover a={a} />
        </div>
      )}
      <div>
        <h4 className="line-clamp-2 font-semibold leading-snug group-hover:text-brand-deep">{a.title}</h4>
        <p className="mt-1 text-xs text-gray-400">{timeAgo(a.published_at)}</p>
      </div>
    </Link>
  );
}
