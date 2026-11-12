import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getCategories, listPublished, searchArticles } from '../lib/api';
import type { Article } from '../lib/types';
import { NewsCard } from '../components/NewsCard';
import Spinner from '../components/Spinner';
import { useTitle } from '../components/useTitle';

function Grid({ title, items, loading, more }: { title: string; items: Article[]; loading: boolean; more?: () => void }) {
  return (
    <div className="container-x py-6">
      <h1 className="section-title text-3xl">{title}</h1>
      {loading && !items.length ? (
        <Spinner />
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-gray-500">कोई खबर नहीं मिली।</p>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((a) => <NewsCard key={a.id} a={a} />)}
          </div>
          {more && (
            <div className="mt-8 text-center">
              <button onClick={more} disabled={loading} className="btn-outline">{loading ? 'लोड हो रहा...' : 'और खबरें'}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function CategoryPage() {
  const { slug = '' } = useParams();
  const [name, setName] = useState('');
  const [items, setItems] = useState<Article[]>([]);
  const [limit, setLimit] = useState(16);
  const [loading, setLoading] = useState(true);
  useTitle(name);

  useEffect(() => {
    setLimit(16);
    getCategories().then((c) => setName(c.find((x) => x.slug === slug)?.name ?? 'कैटेगरी')).catch(() => {});
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    listPublished({ categorySlug: slug, limit })
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [slug, limit]);

  return <Grid title={name} items={items} loading={loading} more={items.length >= limit ? () => setLimit((l) => l + 16) : undefined} />;
}

export function VideosPage() {
  useTitle('वीडियो न्यूज़');
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    listPublished({ video: true, limit: 40 }).then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, []);
  return <Grid title="▶ वीडियो न्यूज़" items={items} loading={loading} />;
}

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  useTitle(`खोज: ${q}`);
  useEffect(() => {
    setLoading(true);
    searchArticles(q).then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, [q]);
  return <Grid title={`"${q.slice(0, 60)}" के लिए परिणाम`} items={items} loading={loading} />;
}
