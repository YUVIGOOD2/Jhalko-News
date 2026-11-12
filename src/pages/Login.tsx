import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { useTitle } from '../components/useTitle';

const MAX_TRIES = 5;
const LOCK_MS = 5 * 60 * 1000;

function getLock(): { tries: number; until: number } {
  try {
    return JSON.parse(localStorage.getItem('jn_login_lock') || '{"tries":0,"until":0}');
  } catch {
    return { tries: 0, until: 0 };
  }
}
function setLock(v: { tries: number; until: number }) {
  try { localStorage.setItem('jn_login_lock', JSON.stringify(v)); } catch { /* ignore */ }
}

export default function Login() {
  useTitle('Staff Login');
  const { session, profile, loading } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!loading && session && profile) {
      if (profile.role === 'admin') nav('/admin', { replace: true });
      else if (profile.role === 'staff') nav('/staff', { replace: true });
    }
  }, [session, profile, loading, nav]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    const lock = getLock();
    if (lock.until > Date.now()) {
      const m = Math.ceil((lock.until - Date.now()) / 60000);
      return setErr(`बहुत ज़्यादा गलत कोशिशें। ${m} मिनट बाद try करें।`);
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) || password.length < 8) {
      return setErr('सही ईमेल और पासवर्ड (कम से कम 8 अक्षर) डालें।');
    }
    if (!isConfigured) return setErr('Supabase अभी कनेक्ट नहीं है (README देखें)।');

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      const tries = lock.tries + 1;
      setLock(tries >= MAX_TRIES ? { tries: 0, until: Date.now() + LOCK_MS } : { tries, until: 0 });
      // जानबूझकर generic message – attacker को पता न चले कि ईमेल सही है या नहीं
      return setErr('ईमेल या पासवर्ड गलत है।');
    }
    setLock({ tries: 0, until: 0 });
    setPassword('');
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-100">
        <div className="flex justify-center"><Logo /></div>
        <h1 className="mt-6 text-center text-xl font-bold">Staff / Admin Login</h1>
        <p className="mt-1 text-center text-sm text-gray-500">केवल अधिकृत टीम के लिए</p>

        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          {err && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</div>}
          {session && profile && profile.role === 'none' && (
            <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
              आपका account बन गया है पर अभी role नहीं मिला। Admin से permission लें।
            </div>
          )}
          <input className="input" type="email" autoComplete="username" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
          <input className="input" type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={128} />
          <button disabled={busy} className="btn-primary w-full">{busy ? 'Login हो रहा...' : 'Login'}</button>
        </form>
        <Link to="/" className="mt-6 block text-center text-sm text-gray-500 hover:text-brand-deep">← वेबसाइट पर वापस</Link>
      </div>
    </div>
  );
}
