import { useState } from 'react';

export default function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;
  const t = encodeURIComponent(title);
  const u = encodeURIComponent(url);

  const links = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${t}%20${u}`, cls: 'bg-[#25D366]' },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, cls: 'bg-[#1877F2]' },
    { name: 'X', href: `https://twitter.com/intent/tweet?text=${t}&url=${u}`, cls: 'bg-black' },
    { name: 'Telegram', href: `https://t.me/share/url?url=${u}&text=${t}`, cls: 'bg-[#229ED9]' },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold text-gray-600">शेयर करें:</span>
      {links.map((l) => (
        <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer" className={`rounded-full px-3 py-1 text-xs font-bold text-white ${l.cls}`}>
          {l.name}
        </a>
      ))}
      <button onClick={copy} className="rounded-full bg-gray-200 px-3 py-1 text-xs font-bold">
        {copied ? '✓ कॉपी हो गया' : '🔗 लिंक कॉपी'}
      </button>
    </div>
  );
}
