'use client';

import { useEffect, useState } from 'react';
import {
  APP_SETTINGS_STORAGE_KEY,
  applyAppSettingsToDocument,
  defaultAppSettings,
  normalizeAppSettings,
} from '@/lib/app-settings';

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

  const updateDarkMode = (nextIsDark: boolean) => {
    if (typeof window === 'undefined') {
      setIsDark(nextIsDark);
      return;
    }

    const rawSettings = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
    const currentSettings = rawSettings
      ? normalizeAppSettings(JSON.parse(rawSettings))
      : defaultAppSettings;

    const updatedSettings = {
      ...currentSettings,
      appearance: {
        ...currentSettings.appearance,
        theme: nextIsDark ? ('dark' as const) : ('light' as const),
      },
    };

    window.localStorage.setItem(
      APP_SETTINGS_STORAGE_KEY,
      JSON.stringify(updatedSettings)
    );
    applyAppSettingsToDocument(updatedSettings);
    setIsDark(nextIsDark);
  };

  return { isDark, setIsDark: updateDarkMode };
}
