/** URL-safe slug (Hindi title par random id lagata hai) */
export function makeSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/^-|-$/g, '');
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 6);
  return `${base || 'news'}-${rand}`;
}

export function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'अभी-अभी';
  if (diff < 3600) return `${Math.floor(diff / 60)} मिनट पहले`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} घंटे पहले`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} दिन पहले`;
  return formatDate(iso);
}

export function formatDate(iso: string | null, withTime = false): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('hi-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function readTime(text = ''): number {
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
}

export function youtubeId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(
    /^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

/** Search text se PostgREST filter ke special characters hata deta hai */
export function safeSearch(q: string): string {
  return q.replace(/[,()%*\\.:"']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
}

export function parseTags(s: string): string[] {
  return Array.from(
    new Set(
      s
        .split(',')
        .map((t) => t.trim().replace(/[<>]/g, '').slice(0, 30))
        .filter(Boolean),
    ),
  ).slice(0, 10);
}

export function compact(n: number): string {
  return new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(n);
}
