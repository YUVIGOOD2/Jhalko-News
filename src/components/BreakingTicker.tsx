import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPublished } from '../lib/api';
import type { Article } from '../lib/types';

export default function BreakingTicker() {
  const [items, setItems] = useState<Article[]>([]);

  useEffect(() => {
    listPublished({ breaking: true, limit: 10 }).then(setItems).catch(() => setItems([]));
  }, []);

  if (!items.length) return null;
  const loop = [...items, ...items];

  return (
    <div className="flex items-stretch overflow-hidden border-b border-gray-200 bg-white">
      <span className="z-10 flex shrink-0 items-center gap-1 bg-live px-4 text-sm font-extrabold text-white">
        ⚡ ब्रेकिंग
      </span>
      <div className="relative flex-1 overflow-hidden py-2">
        <div className="flex w-max animate-ticker gap-10 hover:[animation-play-state:paused]">
          {loop.map((a, i) => (
            <Link key={`${a.id}-${i}`} to={`/news/${a.slug}`} className="whitespace-nowrap text-sm font-semibold text-ink hover:underline hover:decoration-brand hover:decoration-2">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-brand ring-1 ring-ink align-middle" />
              {a.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
