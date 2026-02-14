'use client';

import { useEffect } from 'react';
import {
  APP_SETTINGS_STORAGE_KEY,
  applyAppSettingsToDocument,
  readAppSettingsFromStorage,
} from '@/lib/app-settings';

export default function GlobalSettingsSync() {
  useEffect(() => {
    const applyFromStorage = () => {
      applyAppSettingsToDocument(readAppSettingsFromStorage());
    };

    applyFromStorage();

    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== APP_SETTINGS_STORAGE_KEY) return;
      applyFromStorage();
    };

    const onVisibilityChange = () => {
      if (!document.hidden) {
        applyFromStorage();
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemThemeChange = () => {
      const settings = readAppSettingsFromStorage();
      if (settings.appearance.theme === 'system') {
        applyAppSettingsToDocument(settings);
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', applyFromStorage);
    document.addEventListener('visibilitychange', onVisibilityChange);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', onSystemThemeChange);
    } else {
      mediaQuery.addListener(onSystemThemeChange);
    }

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', applyFromStorage);
      document.removeEventListener('visibilitychange', onVisibilityChange);

      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', onSystemThemeChange);
      } else {
        mediaQuery.removeListener(onSystemThemeChange);
      }
    };
  }, []);

  return null;
}
