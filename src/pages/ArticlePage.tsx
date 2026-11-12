import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { bumpViews, getArticleBySlug, listPublished } from '../lib/api';
import type { Article } from '../lib/types';
import { compact, formatDate, readTime, youtubeId } from '../lib/utils';
import { Cover, ListItem } from '../components/NewsCard';
import Spinner from '../components/Spinner';
import ShareBar from '../components/ShareBar';
import ArticleBody from '../components/ArticleBody';
import { useTitle } from '../components/useTitle';

export default function ArticlePage() {
  const { slug = '' } = useParams();
  const [a, setA] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useTitle(a?.title, a?.summary);

  useEffect(() => {
    setLoading(true);
    window.scrollTo(0, 0);
    getArticleBySlug(slug)
      .then(async (art) => {
        setA(art);
        if (art) {
          void bumpViews(art.id);
          const rel = await listPublished({
            categorySlug: art.categories?.slug,
            excludeId: art.id,
            limit: 6,
          });
          setRelated(rel);
        }
      })
      .catch(() => setA(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Spinner full />;
  if (!a)
    return (
      <div className="container-x py-20 text-center">
        <h1 className="text-2xl font-bold">खबर नहीं मिली</h1>
        <Link to="/" className="btn-primary mt-6 inline-block">होम पर जाएं</Link>
      </div>
    );

  const vid = youtubeId(a.video_url);

  return (
    <div className="container-x grid gap-8 py-6 lg:grid-cols-3">
      <article className="lg:col-span-2">
        <nav className="mb-3 text-sm text-gray-500">
          <Link to="/" className="hover:text-brand-deep">होम</Link>
          {a.categories && (
            <>
              {' / '}
              <Link to={`/category/${a.categories.slug}`} className="hover:text-brand-deep">{a.categories.name}</Link>
            </>
          )}
        </nav>

        <h1 className="font-head text-3xl font-extrabold leading-tight md:text-4xl">{a.title}</h1>
        {a.summary && <p className="mt-3 text-lg text-gray-600">{a.summary}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-y py-3 text-sm text-gray-500">
          <span className="font-semibold text-ink">✍️ {a.author_name}</span>
          {a.location && <span>📍 {a.location}</span>}
          <span>🕒 {formatDate(a.published_at, true)}</span>
          <span>📖 {readTime(a.body)} मिनट</span>
          <span>👁 {compact(a.views)}</span>
        </div>

        <div className="my-4"><ShareBar title={a.title} /></div>

        {vid ? (
          <div className="aspect-video overflow-hidden rounded-xl bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${vid}`}
              title={a.title}
              className="h-full w-full"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            />
          </div>
        ) : (
          <div className="group aspect-video overflow-hidden rounded-xl">
            <Cover a={a} />
          </div>
        )}

        <ArticleBody text={a.body ?? ''} />

        {a.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {a.tags.map((t) => (
              <Link key={t} to={`/search?q=${encodeURIComponent(t)}`} className="rounded-full bg-gray-100 px-3 py-1 text-sm hover:bg-brand hover:text-ink">
                #{t}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 border-t pt-4"><ShareBar title={a.title} /></div>
      </article>

      <aside className="space-y-6">
        <div className="sticky top-40 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <h3 className="section-title">संबंधित खबरें</h3>
          {related.length ? related.map((r) => <ListItem key={r.id} a={r} />) : <p className="text-sm text-gray-500">कोई संबंधित खबर नहीं।</p>}
        </div>
      </aside>
    </div>
  );
}
