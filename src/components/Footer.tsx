import { Link } from 'react-router-dom';
import Logo from './Logo';
import { SITE } from '../config';

export default function Footer() {
  return (
    <footer className="mt-12 border-t-4 border-brand bg-ink text-gray-400">
      <div className="container-x grid gap-8 py-10 md:grid-cols-3">
        <div>
          <Logo light size={72} />
          <p className="mt-4 text-sm leading-relaxed">
            {SITE.tagline}। सीकर, शेखावाटी, राजस्थान और देश-दुनिया की ताज़ा, सच्ची और निष्पक्ष खबरें।
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-bold text-brand">लिंक</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-brand">हमारे बारे में</Link></li>
            <li><Link to="/contact" className="hover:text-brand">संपर्क करें / खबर भेजें</Link></li>
            <li><Link to="/videos" className="hover:text-brand">वीडियो न्यूज़</Link></li>
            <li><Link to="/privacy" className="hover:text-brand">प्राइवेसी पॉलिसी</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-bold text-brand">संपर्क</h4>
          <ul className="space-y-2 text-sm">
            <li>📍 {SITE.city}</li>
            <li>📞 {SITE.phone}</li>
            <li>✉️ {SITE.email}</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {[
              ['Facebook', SITE.social.facebook],
              ['YouTube', SITE.social.youtube],
              ['Instagram', SITE.social.instagram],
            ].map(([n, u]) => (
              <a key={n} href={u} target="_blank" rel="noopener noreferrer" className="rounded border border-white/15 px-3 py-1 text-white hover:border-brand hover:bg-brand hover:text-ink">
                {n}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-4 text-xs md:flex-row">
          <span>© {new Date().getFullYear()} {SITE.name}. सर्वाधिकार सुरक्षित।</span>
          <span className="flex gap-4">
            <Link to="/login" className="hover:text-brand">Staff Login</Link>
            <span>Developed by {SITE.developer.name}</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
