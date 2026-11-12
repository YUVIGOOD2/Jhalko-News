import { useEffect, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getCategories } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { Article, Category, Status } from '../../lib/types';
import { makeSlug, parseTags, youtubeId } from '../../lib/utils';
import { processImage } from '../../lib/image';
import PanelLayout, { StatusBadge } from '../../components/PanelLayout';
import ArticleBody from '../../components/ArticleBody';
import Spinner from '../../components/Spinner';
import { useTitle } from '../../components/useTitle';
import { staffLinks } from './StaffDashboard';

const empty = {
  title: '',
  summary: '',
  body: '',
  category_id: '',
  tags: '',
  location: 'सीकर',
  video_url: '',
  cover_url: '',
  is_breaking: false,
  is_featured: false,
};

export default function ArticleEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const { session, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  useTitle(id ? 'खबर Edit करें' : 'नई खबर');

  const [cats, setCats] = useState<Category[]>([]);
  const [f, setF] = useState(empty);
  const [status, setStatus] = useState<Status>('draft');
  const [slug, setSlug] = useState('');
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    getCategories().then(setCats).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) {
      setF(empty);
      setStatus('draft');
      setSlug('');
      setRejectReason(null);
      return;
    }
    setLoading(true);
    supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          setMsg({ ok: false, text: 'खबर नहीं मिली या आपको permission नहीं है।' });
        } else {
          const a = data as Article;
          setF({
            title: a.title,
            summary: a.summary,
            body: a.body ?? '',
            category_id: a.category_id ? String(a.category_id) : '',
            tags: a.tags.join(', '),
            location: a.location ?? '',
            video_url: a.video_url ?? '',
            cover_url: a.cover_url ?? '',
            is_breaking: a.is_breaking,
            is_featured: a.is_featured,
          });
          setStatus(a.status);
          setSlug(a.slug);
          setRejectReason(a.reject_reason ?? null);
        }
        setLoading(false);
      });
  }, [id]);

  const locked = !isAdmin && status === 'published';
  const set = (k: keyof typeof empty) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const validate = (): string | null => {
    const t = f.title.trim();
    if (t.length < 5 || t.length > 200) return 'Headline 5 से 200 अक्षर की होनी चाहिए।';
    if (f.summary.trim().length > 400) return 'Summary 400 अक्षर से कम रखें।';
    const b = f.body.trim();
    if (b.length < 20 || b.length > 50000) return 'खबर का content कम से कम 20 अक्षर का हो।';
    if (!f.category_id) return 'Category चुनें।';
    if (f.video_url.trim() && !youtubeId(f.video_url.trim())) return 'सिर्फ सही YouTube link डालें।';
    if (f.location.length > 60) return 'Location छोटी रखें।';
    return null;
  };

  const save = async (target: Status) => {
    const err = validate();
    if (err) return setMsg({ ok: false, text: err });
    if (!session) return;
    setBusy(true);
    setMsg(null);

    const payload: Record<string, unknown> = {
      title: f.title.trim(),
      summary: f.summary.trim(),
      body: f.body.trim(),
      category_id: Number(f.category_id),
      tags: parseTags(f.tags),
      location: f.location.trim() || null,
      video_url: f.video_url.trim() || null,
      cover_url: f.cover_url || null,
      status: target,
    };
    if (isAdmin) {
      payload.is_breaking = f.is_breaking;
      payload.is_featured = f.is_featured;
    }

    let newId = id;
    if (id) {
      const { error } = await supabase.from('articles').update(payload).eq('id', id);
      if (error) {
        setBusy(false);
        return setMsg({ ok: false, text: 'Save नहीं हुआ: ' + error.message });
      }
    } else {
      const s = makeSlug(f.title);
      const { data, error } = await supabase.from('articles').insert({ ...payload, slug: s }).select('id').single();
      if (error || !data) {
        setBusy(false);
        return setMsg({ ok: false, text: 'Save नहीं हुआ: ' + (error?.message ?? '') });
      }
      newId = (data as { id: string }).id;
      setSlug(s);
    }

    setBusy(false);
    setStatus(target);
    const texts: Record<Status, string> = {
      draft: '✓ Draft save हो गया।',
      pending: '✓ खबर Admin के review के लिए भेज दी गई।',
      published: '✓ खबर Publish हो गई!',
      rejected: 'Rejected',
    };
    setMsg({ ok: true, text: texts[target] });
    if (!id && newId) nav(`/staff/edit/${newId}`, { replace: true });
  };

  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !session) return;
    setUploading(true);
    setMsg(null);
    try {
      const blob = await processImage(file);
      const rand = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, '0')).join('');
      const path = `${session.user.id}/${Date.now()}-${rand}.webp`;
      const { error } = await supabase.storage.from('news-images').upload(path, blob, {
        contentType: 'image/webp',
        upsert: false,
        cacheControl: '31536000',
      });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from('news-images').getPublicUrl(path);
      setF((p) => ({ ...p, cover_url: data.publicUrl }));
    } catch (er) {
      setMsg({ ok: false, text: (er as Error).message });
    } finally {
      setUploading(false);
    }
  };

  const links = isAdmin ? [...staffLinks, { to: '/admin', label: '🛡️ Admin Panel' }] : staffLinks;

  if (loading) return <PanelLayout title="Editor" links={links}><Spinner /></PanelLayout>;

  return (
    <PanelLayout title="Editor" links={links}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/staff" className="text-sm text-gray-500 hover:text-brand-deep">← वापस</Link>
          <h1 className="text-xl font-bold">{id ? 'खबर Edit करें' : 'नई खबर लिखें'}</h1>
          {id && <StatusBadge s={status} />}
        </div>
        <button onClick={() => setPreview((v) => !v)} className="btn-outline">{preview ? '✏️ Editor' : '👁 Preview'}</button>
      </div>

      {msg && <div className={`mb-4 rounded-lg p-3 ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</div>}
      {rejectReason && status !== 'published' && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">❌ Admin ने reject किया: {rejectReason} — सुधार करके दोबारा भेजें।</div>
      )}
      {locked && <div className="mb-4 rounded-lg bg-yellow-50 p-3 text-yellow-800">यह खबर Published है – अब सिर्फ Admin बदलाव कर सकता है।</div>}

      {preview ? (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h1 className="font-head text-3xl font-extrabold">{f.title || 'Headline'}</h1>
          <p className="mt-2 text-lg text-gray-600">{f.summary}</p>
          {f.cover_url && <img src={f.cover_url} alt="" className="mt-4 w-full rounded-xl" />}
          <ArticleBody text={f.body} />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <fieldset disabled={locked || busy} className="space-y-4 rounded-xl bg-white p-5 shadow-sm lg:col-span-2">
            <div>
              <label className="label">Headline *</label>
              <input className="input text-lg font-semibold" maxLength={200} value={f.title} onChange={set('title')} placeholder="खबर की हेडलाइन" />
              <p className="mt-1 text-right text-xs text-gray-400">{f.title.length}/200</p>
            </div>
            <div>
              <label className="label">Summary (छोटा सार)</label>
              <textarea className="input min-h-[70px]" maxLength={400} value={f.summary} onChange={set('summary')} placeholder="1-2 लाइन में खबर का सार" />
            </div>
            <div>
              <label className="label">पूरी खबर *</label>
              <textarea className="input min-h-[380px] font-[inherit] leading-relaxed" maxLength={50000} value={f.body} onChange={set('body')} placeholder={'पहला पैराग्राफ...\n\n## सब-हेडिंग\n\nदूसरा पैराग्राफ...\n\n> किसी का बयान (quote)\n\n- बुलेट पॉइंट'} />
              <p className="mt-1 text-xs text-gray-500">Tip: खाली लाइन = नया पैराग्राफ, "## " = हेडिंग, "&gt; " = quote, "- " = बुलेट</p>
            </div>
          </fieldset>

          <div className="space-y-4">
            <fieldset disabled={locked || busy} className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
              <div>
                <label className="label">Category *</label>
                <select className="input" value={f.category_id} onChange={set('category_id')}>
                  <option value="">-- चुनें --</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" maxLength={60} value={f.location} onChange={set('location')} placeholder="सीकर" />
              </div>
              <div>
                <label className="label">Tags (comma से अलग)</label>
                <input className="input" maxLength={300} value={f.tags} onChange={set('tags')} placeholder="सीकर, पुलिस, चुनाव" />
              </div>
              <div>
                <label className="label">YouTube Video Link</label>
                <input className="input" maxLength={200} value={f.video_url} onChange={set('video_url')} placeholder="https://youtu.be/..." />
              </div>
              <div>
                <label className="label">Cover Photo</label>
                {f.cover_url && (
                  <div className="relative mb-2">
                    <img src={f.cover_url} alt="" className="aspect-video w-full rounded-lg object-cover" />
                    <button type="button" onClick={() => setF((p) => ({ ...p, cover_url: '' }))} className="absolute right-2 top-2 rounded bg-black/70 px-2 text-sm text-white">✕</button>
                  </div>
                )}
                <label className={`btn-outline block cursor-pointer text-center ${uploading ? 'opacity-50' : ''}`}>
                  {uploading ? 'Upload हो रहा...' : '📷 फोटो चुनें'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={upload} disabled={uploading} />
                </label>
                <p className="mt-1 text-xs text-gray-500">JPG/PNG/WebP, auto-compress होगी</p>
              </div>

              {isAdmin && (
                <div className="space-y-2 rounded-lg bg-brand-light/50 p-3">
                  <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={f.is_breaking} onChange={set('is_breaking')} /> ⚡ Breaking News</label>
                  <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={f.is_featured} onChange={set('is_featured')} /> ⭐ Featured (Top Story)</label>
                </div>
              )}
            </fieldset>

            {!locked && (
              <div className="space-y-2 rounded-xl bg-white p-5 shadow-sm">
                <button disabled={busy || uploading} onClick={() => void save('draft')} className="btn-outline w-full">💾 Draft Save करें</button>
                {isAdmin ? (
                  <button disabled={busy || uploading} onClick={() => void save('published')} className="btn-primary w-full">🚀 {status === 'published' ? 'Update करें' : 'अभी Publish करें'}</button>
                ) : (
                  <button disabled={busy || uploading} onClick={() => void save('pending')} className="btn-primary w-full">📤 Review के लिए भेजें</button>
                )}
                {status === 'published' && slug && <Link to={`/news/${slug}`} className="block pt-2 text-center text-sm text-brand-deep underline">Live खबर देखें</Link>}
              </div>
            )}
          </div>
        </div>
      )}
    </PanelLayout>
  );
}
