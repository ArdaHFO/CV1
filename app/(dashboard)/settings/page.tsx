'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Settings = AppSettings;
const defaultSettings = defaultAppSettings;

// ─── Memory Card Easter Egg ──────────────────────────────────────────────────────────────────────────────
const MEM_EMOJIS = ['🎯','🚀','🎮','💡','🔥','⚡','🎨','🏆'];
type MC = { id: number; emoji: string; flipped: boolean; matched: boolean };
function MemoryGame() {
  const shuffle = () =>
    [...MEM_EMOJIS,...MEM_EMOJIS]
      .map((emoji,i)=>({id:i,emoji,flipped:false,matched:false}))
      .sort(()=>Math.random()-0.5);
  const [board,setBoard] = useState<MC[]>(shuffle);
  const [sel,setSel] = useState<number[]>([]);
  const [lock,setLock] = useState(false);
  const [moves,setMoves] = useState(0);
  const [won,setWon] = useState(false);
  const flip = (id:number) => {
    if(lock) return;
    const c=board.find(x=>x.id===id);
    if(!c||c.flipped||c.matched) return;
    const nb=board.map(x=>x.id===id?{...x,flipped:true}:x);
    setBoard(nb);
    const ns=[...sel,id];
    if(ns.length===2){
      setMoves(m=>m+1); setLock(true);
      const [a,b]=ns.map(sid=>nb.find(x=>x.id===sid)!);
      if(a.emoji===b.emoji){
        const mb=nb.map(x=>ns.includes(x.id)?{...x,matched:true}:x);
        setBoard(mb); setSel([]); setLock(false);
        if(mb.every(x=>x.matched)) setWon(true);
      } else {
        setTimeout(()=>{setBoard(p=>p.map(x=>ns.includes(x.id)?{...x,flipped:false}:x));setSel([]);setLock(false);},900);
      }
    } else setSel(ns);
  };
  const reset=()=>{setBoard(shuffle());setSel([]);setLock(false);setMoves(0);setWon(false);};
  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
        <span>Moves: {moves}</span>
        <span className="text-black/40">·</span>
        <span>Matched: {board.filter(c=>c.matched).length/2} / {MEM_EMOJIS.length}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {board.map(card=>(
          <button key={card.id} type="button" onClick={()=>flip(card.id)}
            className={`w-14 h-14 border-4 text-2xl flex items-center justify-center transition-all duration-200 ${
              card.matched?'border-black bg-black text-white cursor-default':
              card.flipped?'border-[#FF3000] bg-white':
              'border-black bg-[#F2F2F2] hover:bg-black hover:text-white cursor-pointer'
            }`}>{card.flipped||card.matched?card.emoji:'?'}</button>
        ))}
      </div>
      {won&&(
        <div className="text-center space-y-2">
          <p className="text-base font-black uppercase tracking-widest">🎉 Solved in {moves} moves!</p>
          <button type="button" onClick={reset} className="border-4 border-black bg-black text-white px-4 py-1.5 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-colors">Play Again</button>
        </div>
      )}
    </div>
  );
}
// ──────────────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<keyof Settings>('profile');
  const [saved, setSaved] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Easter egg: click 'Settings' title 5× to open Memory Card game
  const [memOpen, setMemOpen] = useState(false);
  const memCountRef = useRef(0);
  const memTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSettingsTitleClick = () => {
    memCountRef.current += 1;
    if (memTimerRef.current) clearTimeout(memTimerRef.current);
    if (memCountRef.current >= 5) { memCountRef.current = 0; setMemOpen(true); return; }
    memTimerRef.current = setTimeout(() => { memCountRef.current = 0; }, 2000);
  };

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
  }, [settings.appearance, isLoaded]);

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
    <div className={`min-h-screen relative ${isDark ? 'dark' : ''} bg-white text-black`}>
      <ShaderBackground isDark={isDark} />
      <div className="relative z-10 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-baseline gap-2 group/title">
              <h1 className="text-3xl font-black uppercase tracking-widest cursor-default" onClick={handleSettingsTitleClick}>Settings</h1>
              <span
                className="text-[10px] text-black/20 group-hover/title:text-black/40 transition-colors cursor-default select-none relative"
                title="psst... something is hidden here 🎮"
              >✦</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 mt-1">
              Customize your CSpark experience
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Sidebar nav */}
            <div className="lg:col-span-1">
              <div className="border-4 border-black bg-white">
                <div className="p-4 border-b-2 border-black">
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/60">Navigation</p>
                </div>
                <nav className="p-2">
                  {[
                    { id: 'profile', label: 'Profile', icon: User },
                    { id: 'appearance', label: 'Appearance', icon: Palette },
                    { id: 'notifications', label: 'Notifications', icon: Bell },
                    { id: 'privacy', label: 'Privacy', icon: Lock },
                    { id: 'integrations', label: 'Integrations', icon: Globe },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as keyof Settings)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        activeTab === id
                          ? 'bg-black text-white'
                          : 'hover:bg-[#F2F2F2] text-black'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-black uppercase tracking-widest">{label}</span>
                    </button>
                  ))}
                </nav>

                <div className="p-3 border-t-2 border-black space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 border-2 border-black text-[10px] font-black uppercase tracking-widest" onClick={exportSettings}>
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                  <label className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 border-2 border-black text-[10px] font-black uppercase tracking-widest" asChild>
                      <span>
                        <Upload className="w-4 h-4" />
                        Import
                      </span>
                    </Button>
                    <input type="file" accept=".json" onChange={importSettings} className="hidden" />
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 border-2 border-[#FF3000] text-[#FF3000] hover:bg-[#FF3000] hover:text-white text-[10px] font-black uppercase tracking-widest"
                    onClick={resetSettings}
                  >
                    <Trash2 className="w-4 h-4" />
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            {/* Content panels */}
            <div className="lg:col-span-3">

              {/* Profile */}
              {activeTab === 'profile' && (
                <div className="border-4 border-black bg-white">
                  <div className="p-5 border-b-2 border-black">
                    <p className="text-base font-black uppercase tracking-widest">Profile Settings</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 mt-1">Manage your personal information</p>
                  </div>
                  <div className="p-5 space-y-5">
                    {[
                      { key: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Enter your full name' },
                      { key: 'email', label: 'Email', type: 'email', placeholder: 'Enter your email' },
                      { key: 'phone', label: 'Phone', type: 'text', placeholder: 'Enter your phone number' },
                      { key: 'location', label: 'Location', type: 'text', placeholder: 'City, Country' },
                    ].map(({ key, label, type, placeholder }) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest block">{label}</label>
                        <Input
                          type={type}
                          value={settings.profile[key as keyof typeof settings.profile] as string}
                          onChange={(e) => updateSetting('profile', key, e.target.value)}
                          placeholder={placeholder}
                          className="border-2 border-black"
                        />
                      </div>
                    ))}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest block">Bio</label>
                      <textarea
                        value={settings.profile.bio}
                        onChange={(e) => updateSetting('profile', 'bio', e.target.value)}
                        placeholder="Tell us about yourself"
                        className="w-full px-3 py-2 border-2 border-black bg-white text-black min-h-24 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3000]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance */}
              {activeTab === 'appearance' && (
                <div className="border-4 border-black bg-white">
                  <div className="p-5 border-b-2 border-black">
                    <p className="text-base font-black uppercase tracking-widest">Appearance</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 mt-1">Customize how CSpark looks</p>
                  </div>
                  <div className="p-5 space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest block">Theme</label>
                      <Select value={settings.appearance.theme} onValueChange={(v) => updateSetting('appearance', 'theme', v)}>
                        <SelectTrigger className="border-2 border-black"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light"><span className="flex items-center gap-2"><Sun className="w-4 h-4" /> Light</span></SelectItem>
                          <SelectItem value="dark"><span className="flex items-center gap-2"><Moon className="w-4 h-4" /> Dark</span></SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest block">Font Size</label>
                      <Select value={settings.appearance.fontSize} onValueChange={(v) => updateSetting('appearance', 'fontSize', v)}>
                        <SelectTrigger className="border-2 border-black"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sm">Small</SelectItem>
                          <SelectItem value="base">Normal</SelectItem>
                          <SelectItem value="lg">Large</SelectItem>
                          <SelectItem value="xl">Extra Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest block">Color Scheme</label>
                      <Select value={settings.appearance.colorScheme} onValueChange={(v) => updateSetting('appearance', 'colorScheme', v)}>
                        <SelectTrigger className="border-2 border-black"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zinc">Zinc (Default)</SelectItem>
                          <SelectItem value="blue">Blue</SelectItem>
                          <SelectItem value="purple">Purple</SelectItem>
                          <SelectItem value="green">Green</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between p-4 border-2 border-black bg-[#F2F2F2]">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest">Compact Mode</p>
                        <p className="text-[10px] font-bold text-black/60 mt-0.5">Reduce spacing and padding</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.appearance.compactMode}
                        onChange={(e) => updateSetting('appearance', 'compactMode', e.target.checked)}
                        className="w-5 h-5 accent-black cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeTab === 'notifications' && (
                <div className="border-4 border-black bg-white">
                  <div className="p-5 border-b-2 border-black">
                    <p className="text-base font-black uppercase tracking-widest">Notification Preferences</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 mt-1">Control how and when you receive notifications</p>
                  </div>
                  <div className="p-5 space-y-3">
                    {[
                      { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive email updates about your account' },
                      { key: 'jobAlerts', label: 'Job Alerts', description: 'Get notified about new job opportunities' },
                      { key: 'aiSuggestions', label: 'AI Suggestions', description: 'Receive AI-powered CV improvement suggestions' },
                      { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Summary email every Sunday' },
                      { key: 'soundEnabled', label: 'Sound Effects', description: 'Play sounds for important notifications' },
                    ].map(({ key, label, description }) => (
                      <div key={key} className="flex items-center justify-between p-4 border-2 border-black bg-[#F2F2F2]">
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest">{label}</p>
                          <p className="text-[10px] font-bold text-black/60 mt-0.5">{description}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.notifications[key as keyof typeof settings.notifications] === true}
                          onChange={(e) => updateSetting('notifications', key, e.target.checked)}
                          className="w-5 h-5 accent-black cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Privacy */}
              {activeTab === 'privacy' && (
                <div className="border-4 border-black bg-white">
                  <div className="p-5 border-b-2 border-black">
                    <p className="text-base font-black uppercase tracking-widest">Privacy & Data</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 mt-1">Manage your privacy settings and data preferences</p>
                  </div>
                  <div className="p-5 space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest block">Profile Visibility</label>
                      <Select value={settings.privacy.profileVisibility} onValueChange={(v) => updateSetting('privacy', 'profileVisibility', v)}>
                        <SelectTrigger className="border-2 border-black"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Private (Only you)</SelectItem>
                          <SelectItem value="linked-in-only">LinkedIn Only</SelectItem>
                          <SelectItem value="public">Public</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest block">Data Retention</label>
                      <Select value={settings.privacy.dataRetention} onValueChange={(v) => updateSetting('privacy', 'dataRetention', v)}>
                        <SelectTrigger className="border-2 border-black"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 Days</SelectItem>
                          <SelectItem value="90">90 Days</SelectItem>
                          <SelectItem value="180">6 Months</SelectItem>
                          <SelectItem value="365">1 Year</SelectItem>
                          <SelectItem value="forever">Forever</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      {[
                        { key: 'shareMetrics', label: 'Share Usage Metrics', description: 'Help us improve by sharing anonymous usage data' },
                        { key: 'allowAnalytics', label: 'Analytics', description: 'Allow tracking for analytics and improvements' },
                      ].map(({ key, label, description }) => (
                        <div key={key} className="flex items-center justify-between p-4 border-2 border-black bg-[#F2F2F2]">
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest">{label}</p>
                            <p className="text-[10px] font-bold text-black/60 mt-0.5">{description}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.privacy[key as keyof typeof settings.privacy] === true}
                            onChange={(e) => updateSetting('privacy', key, e.target.checked)}
                            className="w-5 h-5 accent-black cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Integrations */}
              {activeTab === 'integrations' && (
                <div className="border-4 border-black bg-white">
                  <div className="p-5 border-b-2 border-black">
                    <p className="text-base font-black uppercase tracking-widest">Integrations</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 mt-1">Connect third-party services to CSpark</p>
                  </div>
                  <div className="p-5 space-y-3">
                    {[
                      { name: 'LinkedIn', description: 'Connect your LinkedIn account for job search integration', key: 'linkedinConnected' },
                      { name: 'Google Drive', description: 'Sync your CVs with Google Drive storage', key: 'googleDriveConnected' },
                      { name: 'Slack', description: 'Get CV improvement suggestions in your Slack', key: 'slackConnected' },
                    ].map(({ name, description, key }) => {
                      const isConnected = settings.integrations[key as keyof typeof settings.integrations];
                      return (
                        <div key={key} className="flex items-center justify-between p-4 border-2 border-black bg-[#F2F2F2]">
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest">{name}</p>
                            <p className="text-[10px] font-bold text-black/60 mt-0.5">{description}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`border-2 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 ${
                              isConnected ? 'border-black bg-black text-white' : 'border-black text-black'
                            }`}>
                              {isConnected ? 'Connected' : 'Not Connected'}
                            </span>
                            <Button
                              size="sm"
                              variant={isConnected ? 'outline' : 'accent'}
                              className={isConnected ? 'border-2 border-[#FF3000] text-[#FF3000] hover:bg-[#FF3000] hover:text-white' : ''}
                              onClick={() => updateSetting('integrations', key, !isConnected)}
                            >
                              {isConnected ? 'Disconnect' : 'Connect'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}



              {/* Save row */}
              <div className="mt-6 flex items-center justify-between">
                <div className="text-[10px] font-black uppercase tracking-widest text-black/60">
                  {saved && '✓ Settings saved!'}
                </div>
                <Button onClick={saveSettings} variant="accent" className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Settings
                </Button>
              </div>

            </div>
          </div>
        </div>
      </div>
      {/* ── Memory Card Easter Egg Dialog ── */}
      <Dialog open={memOpen} onOpenChange={setMemOpen}>
        <DialogContent className="sm:max-w-sm border-4 border-black">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-widest flex items-center gap-2">
              🧠 Memory Game
              <span className="text-[9px] font-black uppercase tracking-[0.3em] border-2 border-black px-2 py-0.5">Easter Egg</span>
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-black/60">
              Match all the pairs to win.
            </DialogDescription>
          </DialogHeader>
          <MemoryGame />
        </DialogContent>
      </Dialog>
    </div>
  );
}
