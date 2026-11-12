import { useEffect } from 'react';
import { SITE } from '../config';

export function useTitle(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE.name}` : `${SITE.name} | ${SITE.nameHi} – ${SITE.tagline}`;
    if (description) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', description.slice(0, 160));
    }
  }, [title, description]);
}
