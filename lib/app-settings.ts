export interface AppSettings {
  profile: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    bio: string;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'sm' | 'base' | 'lg' | 'xl';
    compactMode: boolean;
    colorScheme: 'zinc' | 'blue' | 'purple' | 'green';
  };
  notifications: {
    emailNotifications: boolean;
    jobAlerts: boolean;
    aiSuggestions: boolean;
    weeklyDigest: boolean;
    soundEnabled: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'linked-in-only';
    shareMetrics: boolean;
    allowAnalytics: boolean;
    dataRetention: '30' | '90' | '180' | '365' | 'forever';
  };
  language: 'en' | 'tr' | 'es' | 'de' | 'fr';
  integrations: {
    linkedinConnected: boolean;
    googleDriveConnected: boolean;
    slackConnected: boolean;
  };
}

export const APP_SETTINGS_STORAGE_KEY = 'appSettings';

export const defaultAppSettings: AppSettings = {
  profile: {
    fullName: 'Demo User',
    email: 'demo@example.com',
    phone: '+1 (555) 000-0000',
    location: 'Anywhere, World',
    bio: 'Building better CVs with AI',
  },
  appearance: {
    theme: 'dark',
    fontSize: 'base',
    compactMode: false,
    colorScheme: 'zinc',
  },
  notifications: {
    emailNotifications: true,
    jobAlerts: true,
    aiSuggestions: true,
    weeklyDigest: false,
    soundEnabled: true,
  },
  privacy: {
    profileVisibility: 'private',
    shareMetrics: false,
    allowAnalytics: true,
    dataRetention: '90',
  },
  language: 'en',
  integrations: {
    linkedinConnected: false,
    googleDriveConnected: false,
    slackConnected: false,
  },
};

export function normalizeAppSettings(raw: Partial<AppSettings> | null | undefined): AppSettings {
  if (!raw) {
    return defaultAppSettings;
  }

  return {
    profile: {
      ...defaultAppSettings.profile,
      ...(raw.profile || {}),
    },
    appearance: {
      ...defaultAppSettings.appearance,
      ...(raw.appearance || {}),
    },
    notifications: {
      ...defaultAppSettings.notifications,
      ...(raw.notifications || {}),
    },
    privacy: {
      ...defaultAppSettings.privacy,
      ...(raw.privacy || {}),
    },
    language: raw.language || defaultAppSettings.language,
    integrations: {
      ...defaultAppSettings.integrations,
      ...(raw.integrations || {}),
    },
  };
}

export function resolveIsDarkMode(settings: AppSettings): boolean {
  if (typeof window === 'undefined') {
    return settings.appearance.theme === 'dark';
  }

  if (settings.appearance.theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  return settings.appearance.theme === 'dark';
}

function resolveFontSizePx(settings: AppSettings): string {
  const baseSize =
    settings.appearance.fontSize === 'sm'
      ? 14
      : settings.appearance.fontSize === 'lg'
      ? 17
      : settings.appearance.fontSize === 'xl'
      ? 18
      : 16;

  const adjusted = settings.appearance.compactMode ? baseSize - 1 : baseSize;
  return `${adjusted}px`;
}

export function applyAppSettingsToDocument(settings: AppSettings) {
  if (typeof document === 'undefined') return;

  const shouldUseDark = resolveIsDarkMode(settings);
  document.documentElement.classList.toggle('dark', shouldUseDark);
  document.documentElement.style.fontSize = resolveFontSizePx(settings);
  document.body.classList.toggle('compact-mode', settings.appearance.compactMode);
  document.documentElement.setAttribute('data-color-scheme', settings.appearance.colorScheme);
  document.documentElement.lang = settings.language;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('app-settings-updated'));
  }
}

export function readAppSettingsFromStorage(): AppSettings {
  if (typeof window === 'undefined') return defaultAppSettings;

  const rawValue = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
  if (!rawValue) return defaultAppSettings;

  try {
    return normalizeAppSettings(JSON.parse(rawValue) as Partial<AppSettings>);
  } catch {
    return defaultAppSettings;
  }
}
