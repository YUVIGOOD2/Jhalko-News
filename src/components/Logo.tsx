import { useState } from 'react';
import { SITE } from '../config';

/** Jhalko Sikar logo (public/logo.png) + naam. Dark aur light dono background par chalta hai. */
export default function Logo({ size = 56, light = false, showText = true }: { size?: number; light?: boolean; showText?: boolean }) {
  const [err, setErr] = useState(false);
  return (
    <span className="flex items-center gap-3">
      {!err ? (
        <img
          src="./logo.png"
          alt={`${SITE.nameHi} लोगो`}
          width={size}
          height={size}
          onError={() => setErr(true)}
          className="rounded-full ring-2 ring-brand"
          style={{ width: size, height: size }}
        />
      ) : (
        <span
          className="flex items-center justify-center rounded-full bg-ink font-head font-extrabold text-brand ring-2 ring-brand"
          style={{ width: size, height: size, fontSize: size * 0.42 }}
        >
          झ
        </span>
      )}
      {showText && (
        <span className="leading-none">
          <span className="flex items-center gap-1 font-head text-2xl font-extrabold">
            <span className="rounded-sm bg-brand px-1.5 py-0.5 text-ink">झलको</span>
            <span className={light ? 'text-white' : 'text-ink'}>न्यूज़</span>
          </span>
          <span className="mt-1.5 block text-[11px] font-bold uppercase tracking-[0.25em] text-brand">
            Jhalko Sikar
          </span>
        </span>
      )}
    </span>
  );
}
