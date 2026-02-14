'use client';

import { useEffect, useState } from 'react';

function readDarkFromDocument() {
  if (typeof document === 'undefined') return true;
  return document.documentElement.classList.contains('dark');
}

export function useAppDarkModeState() {
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    const sync = () => {
      setIsDark(readDarkFromDocument());
    };

    sync();

    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== 'appSettings') return;
      sync();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', sync);
    window.addEventListener('app-settings-updated', sync as EventListener);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', sync);
      window.removeEventListener('app-settings-updated', sync as EventListener);
    };
  }, []);

  return { isDark, setIsDark };
}
