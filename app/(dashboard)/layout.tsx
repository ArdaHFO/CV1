'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import ShaderBackground from '@/components/ui/shader-background';
import { LayoutDashboard, Briefcase, Settings, LogOut, Menu, Crown, Check, Sparkles, ListChecks, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getCurrentUser, signOut } from '@/lib/auth/auth';
import { useAppDarkModeState } from '@/hooks/use-app-dark-mode';
import type { User } from '@/types';

type SubscriptionData = {
  status: 'active' | 'inactive';
  planId: 'pro-monthly' | 'pro-yearly';
  planName: string;
  amount: string;
  paidAt: string;
  expiresAt?: string;
  paymentMethod: string;
};

type TokenPackId = 'job-search-5' | 'job-search-10';
type CvImportPackId = 'cv-import-5' | 'cv-import-10';
type AiOptimizePackId = 'ai-optimize-5' | 'ai-optimize-10';
type PurchaseType = 'plan' | 'token-pack' | 'cv-import-pack' | 'ai-optimize-pack';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<'pro-monthly' | 'pro-yearly'>('pro-yearly');
  const [selectedPurchaseType, setSelectedPurchaseType] = useState<PurchaseType>('plan');
  const [selectedTokenPackId, setSelectedTokenPackId] = useState<TokenPackId>('job-search-5');
  const [selectedCvImportPackId, setSelectedCvImportPackId] = useState<CvImportPackId>('cv-import-5');
  const [selectedAiOptimizePackId, setSelectedAiOptimizePackId] = useState<AiOptimizePackId>('ai-optimize-5');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [isPro, setIsPro] = useState(false);
  const [proInfoOpen, setProInfoOpen] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [remainingTokenSearches, setRemainingTokenSearches] = useState(0);
  const [quotas, setQuotas] = useState<{
    cvCreations: number | 'unlimited';
    cvImports: number | 'unlimited';
    cvOptimizations: number | 'unlimited';
    jobSearches: number | 'unlimited';
  } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { isDark } = useAppDarkModeState();

  const formatReadableDate = (isoDate?: string) => {
    if (!isoDate) return 'Unknown';
    const parsedDate = new Date(isoDate);
    if (Number.isNaN(parsedDate.getTime())) return 'Unknown';
    return parsedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const resolveActiveSubscription = (data: SubscriptionData | null) => {
    if (!data || data.status !== 'active' || !data.expiresAt) return null;
    const isStillActive = new Date(data.expiresAt).getTime() > Date.now();
    return isStillActive ? data : null;
  };

  const loadBillingStatus = async () => {
    const response = await fetch('/api/billing/status');
    const payload = (await response.json()) as {
      success?: boolean;
      status?: {
        planTier: 'freemium' | 'pro';
        subscription: {
          status: 'active' | 'inactive';
          planId: string | null;
          planName: string | null;
          amount: string | null;
          paidAt: string | null;
          expiresAt: string | null;
          paymentMethod: string | null;
        };
        remaining: {
          tokenJobSearches: number;
          cvCreations: number | 'unlimited';
          cvImports: number | 'unlimited';
          cvOptimizations: number | 'unlimited';
          jobSearches: number;
        };
      };
    };

    if (!response.ok || !payload.success || !payload.status) {
      setIsPro(false);
      setSubscription(null);
      setRemainingTokenSearches(0);
      return;
    }

    setRemainingTokenSearches(payload.status.remaining.tokenJobSearches ?? 0);

    setQuotas({
      cvCreations: payload.status.remaining.cvCreations,
      cvImports: payload.status.remaining.cvImports,
      cvOptimizations: payload.status.remaining.cvOptimizations,
      jobSearches: payload.status.remaining.jobSearches,
    });

    const mappedSubscription: SubscriptionData = {
      status: payload.status.subscription.status,
      planId: (payload.status.subscription.planId as 'pro-monthly' | 'pro-yearly') || 'pro-monthly',
      planName: payload.status.subscription.planName || 'Pro',
      amount: payload.status.subscription.amount || '$0',
      paidAt: payload.status.subscription.paidAt || new Date().toISOString(),
      expiresAt: payload.status.subscription.expiresAt || undefined,
      paymentMethod: payload.status.subscription.paymentMethod || 'Stripe Checkout',
    };

    if (payload.status.planTier === 'pro' && resolveActiveSubscription(mappedSubscription)) {
      setIsPro(true);
      setSubscription(mappedSubscription);
    } else {
      setIsPro(false);
      setSubscription(null);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.replace('/login');
        return;
      }
      setUser(currentUser);

      const searchParams = new URLSearchParams(window.location.search);
      const checkoutStatus = searchParams.get('checkout');
      const checkoutType = searchParams.get('checkoutType');
      const paidPlan = searchParams.get('plan');
      const tokenPack = searchParams.get('tokenPack');

      if (checkoutStatus === 'success') {
        if (checkoutType === 'token-pack' && (tokenPack === 'job-search-5' || tokenPack === 'job-search-10')) {
          await fetch('/api/billing/checkout-success', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ purchaseType: 'token-pack', tokenPackId: tokenPack }),
          });

          const cleanUrl = `${window.location.origin}/dashboard`;
          window.history.replaceState({}, '', cleanUrl);
          setPaymentMessage(
            `Payment successful! ${tokenPack === 'job-search-10' ? 10 : 5} job-search tokens were added.`
          );
        } else if (checkoutType === 'cv-import-pack') {
          const cvImportPack = searchParams.get('cvImportPack');
          if (cvImportPack === 'cv-import-5' || cvImportPack === 'cv-import-10') {
            await fetch('/api/billing/checkout-success', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ purchaseType: 'cv-import-pack', cvImportPackId: cvImportPack }),
            });
            const cleanUrl = `${window.location.origin}/dashboard`;
            window.history.replaceState({}, '', cleanUrl);
            setPaymentMessage(
              `Payment successful! ${cvImportPack === 'cv-import-10' ? 10 : 5} CV import credit(s) added.`
            );
          }
        } else if (checkoutType === 'ai-optimize-pack') {
          const aiOptimizePack = searchParams.get('aiOptimizePack');
          if (aiOptimizePack === 'ai-optimize-5' || aiOptimizePack === 'ai-optimize-10') {
            await fetch('/api/billing/checkout-success', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ purchaseType: 'ai-optimize-pack', aiOptimizePackId: aiOptimizePack }),
            });
            const cleanUrl = `${window.location.origin}/dashboard`;
            window.history.replaceState({}, '', cleanUrl);
            setPaymentMessage(
              `Payment successful! ${aiOptimizePack === 'ai-optimize-10' ? 10 : 5} AI optimize credit(s) added.`
            );
          }
        } else if (paidPlan === 'pro-monthly' || paidPlan === 'pro-yearly') {
          await fetch('/api/billing/checkout-success', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ purchaseType: 'plan', planId: paidPlan }),
          });

          const cleanUrl = `${window.location.origin}/dashboard`;
          window.history.replaceState({}, '', cleanUrl);
          setPaymentMessage('Payment successful! Your Pro plan is now active.');
        }
      }

      if (checkoutStatus === 'cancelled') {
        const cleanUrl = `${window.location.origin}/dashboard`;
        window.history.replaceState({}, '', cleanUrl);
        setPaymentMessage('Checkout was cancelled. You can try again anytime.');
      }

      await loadBillingStatus();

      // Open upgrade dialog pre-selected based on query param
      const openUpgrade = searchParams.get('openUpgrade');
      if (openUpgrade === 'cv-import') {
        setSelectedPurchaseType('cv-import-pack');
        setSelectedCvImportPackId('cv-import-5');
        setUpgradeOpen(true);
        window.history.replaceState({}, '', window.location.pathname);
      } else if (openUpgrade === 'true' || openUpgrade === '1') {
        setSelectedPurchaseType('plan');
        setUpgradeOpen(true);
        window.history.replaceState({}, '', window.location.pathname);
      }
    };

    bootstrap();
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Find Jobs', href: '/jobs', icon: Briefcase },
    { name: 'Applications', href: '/applications', icon: ListChecks },
    { name: 'Optimizations', href: '/optimizations', icon: History },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const plans = [
    {
      id: 'pro-monthly' as const,
      name: 'Pro Monthly',
      price: '$19.99',
      period: '/month',
      description: 'Flexible monthly billing for active job seekers.',
      benefits: [
        'Unlimited CV creation',
        'Unlimited CV imports',
        'Unlimited job searches',
        'Unlimited AI optimizations',
        'Advanced ATS scoring',
        'Priority support',
        'Shareable links (permanent)',
        'Unlimited QR codes',
      ],
    },
    {
      id: 'pro-yearly' as const,
      name: 'Pro Yearly',
      price: '$199.99',
      period: '/year',
      description: 'Best value — save vs monthly with priority access.',
      badge: 'Best Value',
      benefits: [
        'Everything in Monthly',
        '~17% savings vs monthly',
        'Unlimited CV creation',
        'Unlimited CV imports',
        'Unlimited job searches',
        'Unlimited AI optimizations',
        'Advanced ATS scoring',
        'Priority support',
      ],
    },
  ];

  const tokenPacks = [
    {
      id: 'job-search-5' as const,
      name: '5 Job Search Tokens',
      price: '$9.99',
      description: 'Add 5 extra job searches.',
    },
    {
      id: 'job-search-10' as const,
      name: '10 Job Search Tokens',
      price: '$14.99',
      description: 'Add 10 extra job searches.',
      badge: 'Best Value',
    },
  ];

  const cvImportPacks = [
    {
      id: 'cv-import-5' as const,
      name: '5 CV Imports',
      price: '$9.99',
      description: 'Import 5 additional CVs.',
    },
    {
      id: 'cv-import-10' as const,
      name: '10 CV Imports',
      price: '$14.99',
      description: 'Import up to 10 CVs.',
      badge: 'Best Value',
    },
  ];

  const aiOptimizePacks = [
    {
      id: 'ai-optimize-5' as const,
      name: '5 AI Optimizations',
      price: '$9.99',
      description: 'Run 5 more AI CV optimizations.',
    },
    {
      id: 'ai-optimize-10' as const,
      name: '10 AI Optimizations',
      price: '$14.99',
      description: 'Run 10 more AI CV optimizations.',
      badge: 'Best Value',
    },
  ];

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0];
  const selectedTokenPack = tokenPacks.find((pack) => pack.id === selectedTokenPackId) ?? tokenPacks[0];
  const selectedCvImportPack = cvImportPacks.find((pack) => pack.id === selectedCvImportPackId) ?? cvImportPacks[0];
  const selectedAiOptimizePack = aiOptimizePacks.find((pack) => pack.id === selectedAiOptimizePackId) ?? aiOptimizePacks[0];
  const selectedPrice =
    selectedPurchaseType === 'plan'
      ? selectedPlan.price
      : selectedPurchaseType === 'cv-import-pack'
      ? selectedCvImportPack.price
      : selectedPurchaseType === 'ai-optimize-pack'
      ? selectedAiOptimizePack.price
      : selectedTokenPack.price;

  const handlePayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPaymentMessage('');

    const activeSubscription = resolveActiveSubscription(subscription);
    if (selectedPurchaseType === 'plan' && activeSubscription) {
      setIsPro(true);
      setSubscription(activeSubscription);
      setPaymentMessage(
        `Your ${activeSubscription.planName} membership is active until ${formatReadableDate(activeSubscription.expiresAt)}.`
      );
      return;
    }

    setProcessingPayment(true);

    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          selectedPurchaseType === 'plan'
            ? { purchaseType: 'plan', planId: selectedPlan.id }
            : selectedPurchaseType === 'cv-import-pack'
            ? { purchaseType: 'cv-import-pack', cvImportPackId: selectedCvImportPack.id }
            : selectedPurchaseType === 'ai-optimize-pack'
            ? { purchaseType: 'ai-optimize-pack', aiOptimizePackId: selectedAiOptimizePack.id }
            : { purchaseType: 'token-pack', tokenPackId: selectedTokenPack.id }
        ),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setPaymentMessage(data.error || 'Unable to start Stripe checkout.');
        setProcessingPayment(false);
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      setPaymentMessage('Unable to connect to Stripe right now. Please try again.');
      setProcessingPayment(false);
    }
  };

  return (
    <div className={`min-h-screen relative ${isDark ? 'dark' : ''} bg-white text-black`}>
      <ShaderBackground isDark={isDark} />
      <div className="relative z-10">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b-4 border-black flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <Image src="/favicon.png" alt="CSpark logo" width={40} height={40} className="w-10 h-10 object-contain border-2 border-black" />
          <span className="text-sm font-black uppercase tracking-widest">CSpark</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r-4 border-black transform transition-transform lg:translate-x-0 z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center px-6 border-b-4 border-black">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/favicon.png" alt="CSpark logo" width={48} height={48} className="w-12 h-12 object-contain border-2 border-black" />
              <span className="text-sm font-black uppercase tracking-widest">CSpark</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <p className="px-3 pt-1 pb-2 text-[10px] font-black uppercase tracking-[0.3em] text-black/60">
              Navigation
            </p>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-2 border-2 border-black transition-colors ${
                    isActive
                      ? 'bg-black text-white'
                      : 'bg-white text-black hover:bg-[#FF3000] hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center border-2 border-black transition-colors ${
                      isActive
                        ? 'bg-white text-black'
                        : 'bg-[#F2F2F2] text-black group-hover:bg-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="px-4 pb-4">
            {/* Quota display */}
            {quotas && (
              <div className="mb-3 border-2 border-black bg-[#F2F2F2] p-3 space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-black/60 mb-2">
                  {isPro ? 'Pro Plan — Active' : 'Free Plan Limits'}
                </p>
                {isPro ? (
                  // Pro: show unlimited badges
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['CV Creation', 'CV Import', 'AI Optimize', 'Job Search'] as string[]).map((label) => (
                      <div key={label} className="flex items-center justify-between border border-black bg-white px-1.5 py-0.5 gap-1">
                        <span className="text-[8px] font-black uppercase tracking-widest truncate">{label}</span>
                        <span className="text-[9px] font-black text-black shrink-0">∞</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Freemium: progress bars
                  ([
                    { label: 'CV Creation', value: quotas.cvCreations, max: 1 },
                    { label: 'CV Import', value: quotas.cvImports, max: 1 },
                    { label: 'AI Optimize', value: quotas.cvOptimizations, max: 2 },
                    { label: 'Job Search', value: quotas.jobSearches, max: 1 },
                  ] as { label: string; value: number | 'unlimited'; max: number }[]).map(({ label, value, max }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {value === 'unlimited' ? '∞' : `${value}/${max}`}
                        </span>
                      </div>
                      <div className="h-1.5 border border-black bg-white">
                        <div
                          className="h-full bg-black transition-all"
                          style={{
                            width: value === 'unlimited' ? '100%' : `${Math.min(100, ((value as number) / max) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            <Button
              onClick={() => isPro ? setProInfoOpen(true) : setUpgradeOpen(true)}
              variant="accent"
              className="w-full justify-start gap-2"
            >
              <Crown className="h-4 w-4" />
              {isPro ? 'Pro Subscription' : 'Upgrade to Pro'}
            </Button>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-black/60">
              {isPro
                ? `${subscription?.planName || 'Pro'} active until ${formatReadableDate(subscription?.expiresAt)}`
                : 'Unlock premium CV tools and advanced optimization.'}
            </p>
          </div>

          {/* User Menu */}
          <div className="p-4 border-t-4 border-black">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-3 border-2 border-black bg-white transition-colors hover:bg-[#F2F2F2]">
                  <Avatar>
                    <AvatarFallback>
                      {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-black uppercase tracking-widest">
                      {user?.full_name || 'User'}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/60">{user?.email}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-8">{children}</div>
      </main>

      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-[#FF3000]" />
              Upgrade Your Plan
            </DialogTitle>
            <DialogDescription>
                Choose a subscription or buy job-search tokens.
            </DialogDescription>
          </DialogHeader>

            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest">Subscriptions</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {plans.map((plan) => {
                const isSelected = selectedPurchaseType === 'plan' && selectedPlanId === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => {
                    setSelectedPurchaseType('plan');
                    setSelectedPlanId(plan.id);
                  }}
                  className={`group relative border-2 border-black p-4 text-left transition-colors overflow-hidden ${
                    isSelected ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'
                  }`}
                >
                  {/* Default view */}
                  <div className="transition-opacity duration-200 group-hover:opacity-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-widest">{plan.name}</p>
                      {'badge' in plan && plan.badge ? <Badge>{plan.badge}</Badge> : null}
                    </div>
                    <p className="mt-2 text-xl font-black uppercase">
                      {plan.price}
                      <span className="ml-1 text-xs font-bold uppercase tracking-widest text-current/70">{plan.period}</span>
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-current/70">{plan.description}</p>
                    {isSelected ? (
                      <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                        <Check className="h-3.5 w-3.5" /> Selected
                      </div>
                    ) : null}
                  </div>
                  {/* Hover benefits panel */}
                  <div className="absolute inset-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col bg-black text-white overflow-hidden">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#FF3000] mb-1.5 shrink-0">What you get</p>
                    <ul className="space-y-0.5 overflow-hidden">
                      {'benefits' in plan && plan.benefits?.map((b) => (
                        <li key={b} className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest leading-tight">
                          <Check className="h-2.5 w-2.5 shrink-0 text-[#FF3000]" />
                          <span className="truncate">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </button>
              );
            })}
          </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest">
              Job Search Tokens <span className="text-[10px] font-bold uppercase tracking-widest text-black/60">(Current balance: {remainingTokenSearches})</span>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {tokenPacks.map((pack) => {
                const isSelected = selectedPurchaseType === 'token-pack' && selectedTokenPackId === pack.id;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => {
                      setSelectedPurchaseType('token-pack');
                      setSelectedTokenPackId(pack.id);
                    }}
                    className={`border-2 border-black p-4 text-left transition-colors ${
                      isSelected ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#F2F2F2]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-widest">{pack.name}</p>
                      {pack.badge ? <Badge>{pack.badge}</Badge> : null}
                    </div>
                    <p className="mt-2 text-xl font-black uppercase">{pack.price}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-current/70">{pack.description}</p>
                    {isSelected ? (
                      <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                        <Check className="h-3.5 w-3.5" /> Selected
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest">CV Import Credits <span className="text-[10px] font-bold uppercase tracking-widest text-black/60">(Current balance: {quotas ? (quotas.cvImports === 'unlimited' ? '\u221e' : quotas.cvImports) : '...'})</span></p>
            <div className="grid gap-3 sm:grid-cols-2">
              {cvImportPacks.map((pack) => {
                const isSelected = selectedPurchaseType === 'cv-import-pack' && selectedCvImportPackId === pack.id;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => {
                      setSelectedPurchaseType('cv-import-pack');
                      setSelectedCvImportPackId(pack.id);
                    }}
                    className={`border-2 border-black p-4 text-left transition-colors ${
                      isSelected ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#F2F2F2]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-widest">{pack.name}</p>
                      {pack.badge ? <Badge>{pack.badge}</Badge> : null}
                    </div>
                    <p className="mt-2 text-xl font-black uppercase">{pack.price}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-current/70">{pack.description}</p>
                    {isSelected ? (
                      <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                        <Check className="h-3.5 w-3.5" /> Selected
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest">AI Optimize Credits <span className="text-[10px] font-bold uppercase tracking-widest text-black/60">(Current balance: {quotas ? (quotas.cvOptimizations === 'unlimited' ? '\u221e' : quotas.cvOptimizations) : '...'})</span></p>
            <div className="grid gap-3 sm:grid-cols-2">
              {aiOptimizePacks.map((pack) => {
                const isSelected = selectedPurchaseType === 'ai-optimize-pack' && selectedAiOptimizePackId === pack.id;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => {
                      setSelectedPurchaseType('ai-optimize-pack');
                      setSelectedAiOptimizePackId(pack.id);
                    }}
                    className={`border-2 border-black p-4 text-left transition-colors ${
                      isSelected ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#F2F2F2]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-widest">{pack.name}</p>
                      {'badge' in pack && pack.badge ? <Badge>{pack.badge}</Badge> : null}
                    </div>
                    <p className="mt-2 text-xl font-black uppercase">{pack.price}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-current/70">{pack.description}</p>
                    {isSelected ? (
                      <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                        <Check className="h-3.5 w-3.5" /> Selected
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <form className="space-y-3" onSubmit={handlePayment}>
            {isPro && subscription ? (
              <div className="border-2 border-black bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-black">
                Current Plan: <span className="font-semibold">{subscription.planName}</span> · Valid until{' '}
                <span className="font-semibold">{formatReadableDate(subscription.expiresAt)}</span>
              </div>
            ) : null}

            {paymentMessage ? (
              <p className={`text-[10px] font-bold uppercase tracking-widest ${paymentMessage.includes('successful') ? 'text-black' : 'text-[#FF3000]'}`}>
                {paymentMessage}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUpgradeOpen(false)} disabled={processingPayment}>
                Close
              </Button>
              <Button type="submit" className="gap-2" disabled={processingPayment}>
                {processingPayment ? 'Redirecting to Stripe...' : `Continue to Stripe (${selectedPrice})`}
              </Button>
            </DialogFooter>
          </form>

          <div className="flex items-center gap-2 border-2 border-black bg-[#F2F2F2] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-black/70">
            <Sparkles className="h-3.5 w-3.5 text-[#FF3000]" />
            Premium includes unlimited CV versions, advanced optimization, and priority processing.
          </div>
        </DialogContent>
      </Dialog>

      {/* Pro Subscription Info Dialog */}
      <Dialog open={proInfoOpen} onOpenChange={setProInfoOpen}>
        <DialogContent className="border-4 border-black bg-white p-0 max-w-sm">
          <DialogHeader className="border-b-4 border-black p-5">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-[#FF3000]" />
              <DialogTitle className="text-sm font-black uppercase tracking-widest">Pro Subscription</DialogTitle>
            </div>
            <DialogDescription className="text-[11px] font-bold uppercase tracking-widest text-black/60 mt-1">
              Your current plan details
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-3">
            {/* Status badge */}
            <div className="flex items-center justify-between border-2 border-black bg-[#F2F2F2] px-3 py-2">
              <span className="text-[10px] font-black uppercase tracking-widest">Status</span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5">Active</span>
            </div>

            {/* Plan name */}
            <div className="flex items-center justify-between border-2 border-black bg-[#F2F2F2] px-3 py-2">
              <span className="text-[10px] font-black uppercase tracking-widest">Plan</span>
              <span className="text-[10px] font-black uppercase tracking-widest">{subscription?.planName || 'Pro'}</span>
            </div>

            {/* Amount */}
            {subscription?.amount && (
              <div className="flex items-center justify-between border-2 border-black bg-[#F2F2F2] px-3 py-2">
                <span className="text-[10px] font-black uppercase tracking-widest">Amount Paid</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{subscription.amount}</span>
              </div>
            )}

            {/* Paid at */}
            {subscription?.paidAt && (
              <div className="flex items-center justify-between border-2 border-black bg-[#F2F2F2] px-3 py-2">
                <span className="text-[10px] font-black uppercase tracking-widest">Purchased</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{formatReadableDate(subscription.paidAt)}</span>
              </div>
            )}

            {/* Expires at */}
            <div className="flex items-center justify-between border-2 border-black bg-[#F2F2F2] px-3 py-2">
              <span className="text-[10px] font-black uppercase tracking-widest">Valid Until</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#FF3000]">{formatReadableDate(subscription?.expiresAt)}</span>
            </div>

            {/* Features */}
            <div className="border-2 border-black bg-[#F2F2F2] px-3 py-2 space-y-1.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-black/60 mb-2">Included Features</p>
              {['Unlimited CV Versions', 'Unlimited AI Optimization', 'Unlimited Job Searches', 'Unlimited CV Imports', 'Priority Processing'].map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-black shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="border-t-4 border-black p-4">
            <Button
              onClick={() => setProInfoOpen(false)}
              variant="accent"
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
    </div>
  );
}
