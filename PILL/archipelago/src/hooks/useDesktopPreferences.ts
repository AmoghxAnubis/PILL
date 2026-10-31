import { useEffect, useState } from 'react';

export function useDesktopPreferences() {
  const [preferences, setPreferences] = useState({ light: false, reducedMotion: false });
  useEffect(() => {
    if (!window.matchMedia) return;
    const light = window.matchMedia('(prefers-color-scheme: light)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPreferences({ light: light.matches, reducedMotion: reduced.matches });
    update();
    light.addEventListener('change', update);
    reduced.addEventListener('change', update);
    return () => {
      light.removeEventListener('change', update);
      reduced.removeEventListener('change', update);
    };
  }, []);
  return preferences;
}
