import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, listPublished } from '../lib/api';
import type { Article, Category } from '../lib/types';
import { HeroCard, ListItem, NewsCard } from '../components/NewsCard';
import Spinner from '../components/Spinner';
import { useTitle } from '../components/useTitle';
import { SITE } from '../config';

interface Section {
  cat: Category;
  items: Article[];
}

export default function Home() {
  useTitle();
  const [latest, setLatest] = useState<Article[]>([]);
  const [featured, setFeatured] = useState<Article | null>(null);
  const [trending, setTrending] = useState<Article[]>([]);
  const [videos, setVideos] = useState<Article[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [lat, feat, trend, vid, cats] = await Promise.all([
          listPublished({ limit: 13 }),
          listPublished({ featured: true, limit: 1 }),
          listPublished({ orderBy: 'views', limit: 6, sinceDays: 7 }),
          listPublished({ video: true, limit: 4 }),
          getCategories(),
        ]);
        setLatest(lat);
        setFeatured(feat[0] ?? lat[0] ?? null);
        setTrending(trend.length ? trend : lat.slice(0, 6));
        setVideos(vid);
        const secs = await Promise.all(
          cats.slice(0, 4).map(async (cat) => ({ cat, items: await listPublished({ categorySlug: cat.slug, limit: 4 }) })),
        );
        setSections(secs.filter((s) => s.items.length));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spinner full />;
  if (error) return <p className="container-x py-20 text-center text-gray-500">खबरें लोड नहीं हो पाईं, कृपया पेज रिफ्रेश करें।</p>;
  if (!featured) return <p className="container-x py-20 text-center text-gray-500">अभी कोई खबर नहीं है।</p>;

  const side = latest.filter((a) => a.id !== featured.id).slice(0, 5);
  const grid = latest.filter((a) => a.id !== featured.id).slice(5, 13);

  return (
    <div className="container-x space-y-10 py-6">
      {/* Hero */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><HeroCard a={featured} /></div>
        <aside className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <h3 className="section-title">ताज़ा खबरें</h3>
          {side.map((a) => <ListItem key={a.id} a={a} />)}
        </aside>
      </section>

      {/* Latest grid + trending */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h3 className="section-title">मुख्य खबरें</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            {grid.map((a) => <NewsCard key={a.id} a={a} />)}
          </div>
        </div>
        <aside className="space-y-6">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h3 className="section-title">🔥 ट्रेंडिंग</h3>
            {trending.map((a, i) => <ListItem key={a.id} a={a} index={i} />)}
          </div>
          <div className="rounded-xl bg-brand p-5 text-ink">
            <h4 className="font-head text-xl font-bold">आपके पास कोई खबर है?</h4>
            <p className="mt-1 text-sm text-ink/80">अपने इलाके की खबर, फोटो या वीडियो हमें भेजें।</p>
            <div className="mt-4 flex gap-2">
              <Link to="/contact" className="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-brand">खबर भेजें</Link>
              <a href={SITE.social.whatsapp} target="_blank" rel="noopener noreferrer" className="rounded-lg border-2 border-ink px-4 py-2 text-sm font-bold">WhatsApp</a>
            </div>
          </div>
        </aside>
      </section>

      {/* Videos */}
      {videos.length > 0 && (
        <section className="rounded-2xl border-t-4 border-brand bg-ink p-5 text-white">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-head text-2xl font-bold"><span className="text-brand">▶</span> वीडियो न्यूज़</h3>
            <Link to="/videos" className="text-sm font-semibold text-brand hover:underline">सभी देखें →</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {videos.map((a) => (
              <Link key={a.id} to={`/news/${a.slug}`} className="group">
                <div className="relative aspect-video overflow-hidden rounded-lg">
                  {a.cover_url ? (
                    <img src={a.cover_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-black" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center text-5xl text-brand opacity-90 transition group-hover:scale-110">▶</span>
                </div>
                <h4 className="mt-2 line-clamp-2 font-semibold group-hover:text-brand">{a.title}</h4>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Category sections */}
      {sections.map(({ cat, items }) => (
        <section key={cat.id}>
          <div className="flex items-center justify-between">
            <h3 className="section-title">{cat.name}</h3>
            <Link to={`/category/${cat.slug}`} className="text-sm font-semibold text-brand-deep hover:underline">और देखें →</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((a) => <NewsCard key={a.id} a={a} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
