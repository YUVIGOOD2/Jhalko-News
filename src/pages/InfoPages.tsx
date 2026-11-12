import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isConfigured } from '../lib/supabase';
import { SITE } from '../config';
import { useTitle } from '../components/useTitle';

export function ContactPage() {
  useTitle('संपर्क करें');
  const [f, setF] = useState({ name: '', phone: '', email: '', message: '', website: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [err, setErr] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    if (f.website) return; // honeypot – bots
    const name = f.name.trim();
    const phone = f.phone.trim();
    const email = f.email.trim();
    const message = f.message.trim();
    if (name.length < 2 || name.length > 80) return setErr('सही नाम लिखें।');
    if (phone && !/^[0-9+ -]{7,15}$/.test(phone)) return setErr('सही मोबाइल नंबर लिखें।');
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setErr('सही ईमेल लिखें।');
    if (!phone && !email) return setErr('मोबाइल या ईमेल में से एक जरूरी है।');
    if (message.length < 5 || message.length > 2000) return setErr('संदेश 5 से 2000 अक्षर का हो।');
    try {
      const last = Number(localStorage.getItem('jn_msg_t') || 0);
      if (Date.now() - last < 60_000) return setErr('कृपया 1 मिनट बाद फिर भेजें।');
    } catch { /* ignore */ }

    if (!isConfigured) return setErr('Demo mode – Supabase अभी कनेक्ट नहीं है।');
    setState('sending');
    const { error } = await supabase.from('messages').insert({ name, phone: phone || null, email: email || null, message });
    if (error) {
      setState('err');
      setErr('संदेश नहीं भेजा जा सका, बाद में कोशिश करें।');
      return;
    }
    try { localStorage.setItem('jn_msg_t', String(Date.now())); } catch { /* ignore */ }
    setState('ok');
    setF({ name: '', phone: '', email: '', message: '', website: '' });
  };

  return (
    <div className="container-x grid gap-8 py-10 md:grid-cols-2">
      <div>
        <h1 className="section-title text-3xl">संपर्क करें / खबर भेजें</h1>
        <p className="text-gray-600">अपने इलाके की कोई खबर, शिकायत या विज्ञापन के लिए हमसे संपर्क करें।</p>
        <ul className="mt-6 space-y-3">
          <li>📍 {SITE.city}</li>
          <li>📞 {SITE.phone}</li>
          <li>✉️ {SITE.email}</li>
        </ul>
        <a href={SITE.social.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-primary mt-6 inline-block">WhatsApp पर भेजें</a>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100" noValidate>
        {state === 'ok' && <div className="rounded-lg bg-green-50 p-3 text-green-700">✓ धन्यवाद! आपका संदेश मिल गया।</div>}
        {err && <div className="rounded-lg bg-red-50 p-3 text-red-700">{err}</div>}
        <input className="input" placeholder="आपका नाम *" maxLength={80} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className="input" placeholder="मोबाइल नंबर" inputMode="tel" maxLength={15} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <input className="input" placeholder="ईमेल" type="email" maxLength={120} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <textarea className="input min-h-[140px]" placeholder="आपकी खबर / संदेश *" maxLength={2000} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
        {/* honeypot */}
        <input tabIndex={-1} autoComplete="off" className="hidden" aria-hidden value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
        <button disabled={state === 'sending'} className="btn-primary w-full">{state === 'sending' ? 'भेज रहे हैं...' : 'भेजें'}</button>
      </form>
    </div>
  );
}

export function AboutPage() {
  useTitle('हमारे बारे में');
  return (
    <div className="container-x max-w-3xl py-10">
      <h1 className="section-title text-3xl">हमारे बारे में</h1>
      <div className="prose-news">
        <p>{SITE.nameHi} ({SITE.name}) सीकर, राजस्थान से संचालित एक डिजिटल मीडिया चैनल है। हमारा उद्देश्य है – {SITE.tagline}।</p>
        <p>हम सीकर, शेखावाटी, राजस्थान और देश की ताज़ा खबरें, वीडियो रिपोर्ट और ग्राउंड रिपोर्टिंग आप तक पहुंचाते हैं। हर खबर को प्रकाशित करने से पहले हमारी संपादकीय टीम उसकी जांच करती है।</p>
        <h2>हमसे जुड़ें</h2>
        <p>खबर, विज्ञापन या सुझाव के लिए <Link to="/contact" className="text-brand-deep underline">संपर्क पेज</Link> पर जाएं।</p>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  useTitle('प्राइवेसी पॉलिसी');
  return (
    <div className="container-x max-w-3xl py-10">
      <h1 className="section-title text-3xl">प्राइवेसी पॉलिसी</h1>
      <div className="prose-news">
        <p>हम पाठकों से कोई लॉगिन या निजी जानकारी नहीं मांगते। संपर्क फॉर्म में दी गई जानकारी (नाम, मोबाइल/ईमेल, संदेश) केवल आपसे संपर्क करने के लिए सुरक्षित रखी जाती है और किसी तीसरे पक्ष को नहीं दी जाती।</p>
        <p>वेबसाइट पर YouTube वीडियो privacy-enhanced (nocookie) मोड में दिखाए जाते हैं।</p>
      </div>
    </div>
  );
}

export function NotFound() {
  useTitle('पेज नहीं मिला');
  return (
    <div className="container-x py-24 text-center">
      <div className="font-head text-7xl font-extrabold text-brand-deep">404</div>
      <p className="mt-3 text-gray-600">यह पेज मौजूद नहीं है।</p>
      <Link to="/" className="btn-primary mt-6 inline-block">होम पर जाएं</Link>
    </div>
  );
}
