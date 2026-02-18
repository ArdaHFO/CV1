'use client';

import { useState, useEffect } from 'react';
import ShaderBackground from '@/components/ui/shader-background';
import {
  Bell,
  Lock,
  Palette,
  User,
  Download,
  Upload,
  Globe,
  Moon,
  Sun,
  Trash2,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  APP_SETTINGS_STORAGE_KEY,
  applyAppSettingsToDocument,
  defaultAppSettings,
  normalizeAppSettings,
  resolveIsDarkMode,
  type AppSettings,
} from '@/lib/app-settings';
import { getCurrentUser } from '@/lib/auth/auth';

type Settings = AppSettings;
const defaultSettings = defaultAppSettings;

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<keyof Settings>('profile');
  const [saved, setSaved] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Load settings from localStorage
  useEffect(() => {
    const bootstrap = async () => {
      let baseSettings = defaultSettings;

      const savedSettings = localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings) as Partial<Settings>;
          baseSettings = normalizeAppSettings(parsed);
        } catch (error) {
          console.error('Failed to load settings:', error);
          baseSettings = defaultSettings;
        }
      }

      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          baseSettings = {
            ...baseSettings,
            profile: {
              ...baseSettings.profile,
              fullName: currentUser.full_name || baseSettings.profile.fullName,
              email: currentUser.email || baseSettings.profile.email,
            },
          };
        }
      } catch (error) {
        console.error('Failed to load current user for settings profile:', error);
      }

      setSettings(baseSettings);
      setIsLoaded(true);
    };

    bootstrap();
  }, []);

  // Persist settings automatically so all controls remain functional without extra steps
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings, isLoaded]);

  // Apply appearance and localization settings immediately
  useEffect(() => {
    if (!isLoaded) return;
    applyAppSettingsToDocument(settings);
    setIsDark(resolveIsDarkMode(settings));
  }, [settings.appearance, settings.language, isLoaded]);

  useEffect(() => {
    if (!isLoaded || settings.appearance.theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setIsDark(mediaQuery.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [isLoaded, settings.appearance.theme]);

  const saveSettings = () => {
    localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cspark-settings-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  const importSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string) as Partial<Settings>;
        const normalized = normalizeAppSettings(imported);
        setSettings(normalized);
        localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
        alert('Settings imported successfully!');
      } catch (error) {
        alert('Failed to import settings');
      }
    };
    reader.readAsText(file);
  };

  const resetSettings = () => {
    if (confirm('Are you sure? This will reset all settings to defaults.')) {
      setSettings(defaultSettings);
      localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(defaultSettings));
    }
  };

  const updateSetting = (section: keyof Settings, key: string, value: any) => {
    setSaved(false);
    setSettings((prev) => {
      // Handle language as a direct value, not an object
      if (section === 'language') {
        return {
          ...prev,
          [section]: value,
        };
      }
      
      // Handle object-based sections
      return {
        ...prev,
        [section]: {
          ...(prev[section] as Record<string, any>),
          [key]: value,
        },
      };
    });
  };

  return (
    <div className={`min-h-screen relative ${isDark ? 'dark' : ''}`}>
      <ShaderBackground isDark={isDark} />
      <div className="relative z-10 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-3 duration-700">
          <h1 className="text-5xl font-black leading-none text-black dark:text-white mb-2 uppercase">SETTINGS</h1>
          <p className="text-base text-black dark:text-white font-medium">
            CUSTOMIZE YOUR CSPARK EXPERIENCE WITH COMPREHENSIVE SETTINGS AND PREFERENCES
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tab Navigation */}
          <div className="lg:col-span-1">
            <Card className="bg-white dark:bg-black border-2 border-black dark:border-white">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {[
                    { id: 'profile', label: 'Profile', icon: User },
                    { id: 'appearance', label: 'Appearance', icon: Palette },
                    { id: 'notifications', label: 'Notifications', icon: Bell },
                    { id: 'privacy', label: 'Privacy', icon: Lock },
                    { id: 'integrations', label: 'Integrations', icon: Globe },
                    { id: 'language', label: 'Language', icon: Globe },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as keyof Settings)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-black uppercase transition-all duration-300 border-2 ${
                        activeTab === id
                          ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                          : 'border-transparent text-black dark:text-white hover:border-black dark:hover:border-white hover:bg-white/50 dark:hover:bg-black/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </nav>

                <div className="mt-6 pt-4 border-t-2 border-black dark:border-white space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs border-2 border-black bg-white text-black hover:bg-black hover:text-white dark:border-white dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black font-black uppercase" onClick={exportSettings}>
                    <Download className="w-4 h-4" />
                    Export Settings
                  </Button>
                  <label className="block">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 text-xs border-2 border-black bg-white text-black hover:bg-black hover:text-white dark:border-white dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black font-black uppercase"
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4" />
                        Import Settings
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept=".json"
                      onChange={importSettings}
                      className="hidden"
                    />
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 text-xs text-red-600 dark:text-red-400"
                    onClick={resetSettings}
                  >
                    <Trash2 className="w-4 h-4" />
                    Reset to Defaults
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-zinc-200/70 dark:border-zinc-800 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-500">
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Manage your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                      Full Name
                    </label>
                    <Input
                      value={settings.profile.fullName}
                      onChange={(e) => updateSetting('profile', 'fullName', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) => updateSetting('profile', 'email', e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                      Phone
                    </label>
                    <Input
                      value={settings.profile.phone}
                      onChange={(e) => updateSetting('profile', 'phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                      Location
                    </label>
                    <Input
                      value={settings.profile.location}
                      onChange={(e) => updateSetting('profile', 'location', e.target.value)}
                      placeholder="City, Country"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                      Bio
                    </label>
                    <textarea
                      value={settings.profile.bio}
                      onChange={(e) => updateSetting('profile', 'bio', e.target.value)}
                      placeholder="Tell us about yourself"
                      className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 min-h-24"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-zinc-200/70 dark:border-zinc-800 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-500">
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>Customize how CSpark looks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                      Theme
                    </label>
                    <Select
                      value={settings.appearance.theme}
                      onValueChange={(value) => updateSetting('appearance', 'theme', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <span className="flex items-center gap-2">
                            <Sun className="w-4 h-4" /> Light
                          </span>
                        </SelectItem>
                        <SelectItem value="dark">
                          <span className="flex items-center gap-2">
                            <Moon className="w-4 h-4" /> Dark
                          </span>
                        </SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                      Font Size
                    </label>
                    <Select
                      value={settings.appearance.fontSize}
                      onValueChange={(value) => updateSetting('appearance', 'fontSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sm">Small</SelectItem>
                        <SelectItem value="base">Normal</SelectItem>
                        <SelectItem value="lg">Large</SelectItem>
                        <SelectItem value="xl">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                      Color Scheme
                    </label>
                    <Select
                      value={settings.appearance.colorScheme}
                      onValueChange={(value) => updateSetting('appearance', 'colorScheme', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zinc">Zinc (Default)</SelectItem>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-zinc-100/80 dark:bg-zinc-800/70 rounded-lg border border-zinc-200/70 dark:border-zinc-700/70">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Compact Mode</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">Reduce spacing and padding</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.appearance.compactMode}
                      onChange={(e) => updateSetting('appearance', 'compactMode', e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-zinc-200/70 dark:border-zinc-800 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-500">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Control how and when you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      key: 'emailNotifications',
                      label: 'Email Notifications',
                      description: 'Receive email updates about your account',
                    },
                    {
                      key: 'jobAlerts',
                      label: 'Job Alerts',
                      description: 'Get notified about new job opportunities matching your skills',
                    },
                    {
                      key: 'aiSuggestions',
                      label: 'AI Suggestions',
                      description: 'Receive AI-powered suggestions for CV improvements',
                    },
                    {
                      key: 'weeklyDigest',
                      label: 'Weekly Digest',
                      description: 'Send a summary email every Sunday',
                    },
                    {
                      key: 'soundEnabled',
                      label: 'Sound Effects',
                      description: 'Play sounds for important notifications',
                    },
                  ].map(({ key, label, description }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 bg-zinc-100/80 dark:bg-zinc-800/70 rounded-lg border border-zinc-200/70 dark:border-zinc-700/70"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">{description}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications[key as keyof typeof settings.notifications] === true}
                        onChange={(e) =>
                          updateSetting('notifications', key, e.target.checked)
                        }
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-zinc-200/70 dark:border-zinc-800 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-500">
                <CardHeader>
                  <CardTitle>Privacy & Data</CardTitle>
                  <CardDescription>Manage your privacy settings and data preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                      Profile Visibility
                    </label>
                    <Select
                      value={settings.privacy.profileVisibility}
                      onValueChange={(value) => updateSetting('privacy', 'profileVisibility', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private (Only you)</SelectItem>
                        <SelectItem value="linked-in-only">LinkedIn Only</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                      Data Retention
                    </label>
                    <Select
                      value={settings.privacy.dataRetention}
                      onValueChange={(value) => updateSetting('privacy', 'dataRetention', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 Days</SelectItem>
                        <SelectItem value="90">90 Days</SelectItem>
                        <SelectItem value="180">6 Months</SelectItem>
                        <SelectItem value="365">1 Year</SelectItem>
                        <SelectItem value="forever">Forever</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        key: 'shareMetrics',
                        label: 'Share Usage Metrics',
                        description: 'Help us improve by sharing anonymous usage data',
                      },
                      {
                        key: 'allowAnalytics',
                        label: 'Analytics',
                        description: 'Allow tracking for analytics and improvements',
                      },
                    ].map(({ key, label, description }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 bg-zinc-100/80 dark:bg-zinc-800/70 rounded-lg border border-zinc-200/70 dark:border-zinc-700/70"
                      >
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">{description}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.privacy[key as keyof typeof settings.privacy] === true}
                          onChange={(e) => updateSetting('privacy', key, e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Integrations */}
            {activeTab === 'integrations' && (
              <Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-zinc-200/70 dark:border-zinc-800 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-500">
                <CardHeader>
                  <CardTitle>Integrations</CardTitle>
                  <CardDescription>Connect third-party services to CSpark</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      name: 'LinkedIn',
                      description: 'Connect your LinkedIn account for job search integration',
                      key: 'linkedinConnected',
                    },
                    {
                      name: 'Google Drive',
                      description: 'Sync your CVs with Google Drive storage',
                      key: 'googleDriveConnected',
                    },
                    {
                      name: 'Slack',
                      description: 'Get CV improvement suggestions in your Slack',
                      key: 'slackConnected',
                    },
                  ].map(({ name, description, key }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 bg-zinc-100/80 dark:bg-zinc-800/70 rounded-lg border border-zinc-200/70 dark:border-zinc-700/70"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{name}</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">{description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            settings.integrations[key as keyof typeof settings.integrations]
                              ? 'default'
                              : 'outline'
                          }
                        >
                          {settings.integrations[key as keyof typeof settings.integrations]
                            ? 'Connected'
                            : 'Not Connected'}
                        </Badge>
                        <Button
                          size="sm"
                          variant={
                            settings.integrations[key as keyof typeof settings.integrations]
                              ? 'outline'
                              : 'default'
                          }
                          onClick={() =>
                            updateSetting(
                              'integrations',
                              key,
                              !settings.integrations[key as keyof typeof settings.integrations]
                            )
                          }
                        >
                          {settings.integrations[key as keyof typeof settings.integrations]
                            ? 'Disconnect'
                            : 'Connect'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Language Settings */}
            {activeTab === 'language' && (
              <Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-zinc-200/70 dark:border-zinc-800 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-500">
                <CardHeader>
                  <CardTitle>Language & Localization</CardTitle>
                  <CardDescription>Choose your preferred language</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                      Interface Language
                    </label>
                    <Select
                      value={settings.language}
                      onValueChange={(value) => updateSetting('language', 'language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="tr">Türkçe (Turkish)</SelectItem>
                        <SelectItem value="es">Español (Spanish)</SelectItem>
                        <SelectItem value="de">Deutsch (German)</SelectItem>
                        <SelectItem value="fr">Français (French)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      💡 Language preference is applied immediately and saved automatically.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save Button */}
            <div className="mt-6 flex items-center justify-between">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                {saved && '✅ Settings saved successfully!'}
              </div>
              <Button onClick={saveSettings} className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                <Save className="w-4 h-4" />
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
