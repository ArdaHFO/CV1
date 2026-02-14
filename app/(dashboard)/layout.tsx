'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import ShaderBackground from '@/components/ui/shader-background';
import { LayoutDashboard, Briefcase, Settings, LogOut, Menu, Crown, Check, Sparkles } from 'lucide-react';
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<'pro-monthly' | 'pro-yearly'>('pro-yearly');
  const [selectedPurchaseType, setSelectedPurchaseType] = useState<'plan' | 'token-pack'>('plan');
  const [selectedTokenPackId, setSelectedTokenPackId] = useState<TokenPackId>('job-search-5');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [isPro, setIsPro] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [remainingTokenSearches, setRemainingTokenSearches] = useState(0);
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
    };

    bootstrap();
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Find Jobs', href: '/jobs', icon: Briefcase },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const plans = [
    {
      id: 'pro-monthly' as const,
      name: 'Pro Monthly',
      price: '$9.99',
      period: '/month',
      description: 'Great for active job seekers needing flexible monthly billing.',
    },
    {
      id: 'pro-yearly' as const,
      name: 'Pro Yearly',
      price: '$79.99',
      period: '/year',
      description: 'Best value with 33% savings and priority feature access.',
      badge: 'Best Value',
    },
  ];

  const tokenPacks = [
    {
      id: 'job-search-5' as const,
      name: '5 Job Search Tokens',
      price: '$4.99',
      description: 'Add 5 extra job searches.',
    },
    {
      id: 'job-search-10' as const,
      name: '10 Job Search Tokens',
      price: '$9.99',
      description: 'Add 10 extra job searches.',
      badge: 'Best Value',
    },
  ];

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0];
  const selectedTokenPack = tokenPacks.find((pack) => pack.id === selectedTokenPackId) ?? tokenPacks[0];
  const selectedPrice = selectedPurchaseType === 'plan' ? selectedPlan.price : selectedTokenPack.price;

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
    <div className={`min-h-screen relative ${isDark ? 'dark' : ''}`}>
      <ShaderBackground isDark={isDark} />
      <div className="relative z-10">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/85 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-700/70 flex items-center justify-between px-4 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <Image src="/cspark-logo.png" alt="CSpark logo" width={40} height={40} className="w-10 h-10 object-contain" />
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">CSpark</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white/85 dark:bg-zinc-900/80 backdrop-blur-2xl border-r border-zinc-200/80 dark:border-zinc-700/70 shadow-2xl transform transition-transform lg:translate-x-0 z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center px-6 border-b border-zinc-200/80 dark:border-zinc-700/70">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/cspark-logo.png" alt="CSpark logo" width={48} height={48} className="w-12 h-12 object-contain" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-violet-500 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-violet-300 dark:to-indigo-400">
                CSpark
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <p className="px-3 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              Navigation
            </p>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/20'
                      : 'text-zinc-700 hover:bg-zinc-100/80 dark:text-zinc-300 dark:hover:bg-zinc-800/80'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-zinc-200/70 text-zinc-600 group-hover:bg-zinc-300/80 dark:bg-zinc-700/80 dark:text-zinc-300 dark:group-hover:bg-zinc-600/90'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium tracking-tight">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="px-4 pb-4">
            <Button
              onClick={() => setUpgradeOpen(true)}
              className="w-full justify-start gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
            >
              <Crown className="h-4 w-4" />
              {isPro ? 'Manage Plan' : 'Upgrade to Pro'}
            </Button>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {isPro
                ? `${subscription?.planName || 'Pro'} active until ${formatReadableDate(subscription?.expiresAt)}`
                : 'Unlock premium CV tools and advanced optimization.'}
            </p>
          </div>

          {/* User Menu */}
          <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-700/70">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 bg-white/70 dark:bg-zinc-800/70 hover:bg-zinc-100/90 dark:hover:bg-zinc-700/80 transition-all">
                  <Avatar>
                    <AvatarFallback>
                      {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {user?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{user?.email}</p>
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
              <Crown className="h-5 w-5 text-amber-500" />
              Upgrade Your Plan
            </DialogTitle>
            <DialogDescription>
                Choose a subscription or buy job-search tokens.
            </DialogDescription>
          </DialogHeader>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Subscriptions</p>
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
                  className={`rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/70 dark:border-blue-400 dark:bg-blue-900/20'
                      : 'border-zinc-200 bg-white/70 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{plan.name}</p>
                    {plan.badge ? <Badge>{plan.badge}</Badge> : null}
                  </div>
                  <p className="mt-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {plan.price}
                    <span className="ml-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{plan.period}</span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{plan.description}</p>
                  {isSelected ? (
                    <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                      <Check className="h-3.5 w-3.5" /> Selected
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Job Search Tokens <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">(Current balance: {remainingTokenSearches})</span>
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
                    className={`rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/70 dark:border-indigo-400 dark:bg-indigo-900/20'
                        : 'border-zinc-200 bg-white/70 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{pack.name}</p>
                      {pack.badge ? <Badge>{pack.badge}</Badge> : null}
                    </div>
                    <p className="mt-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">{pack.price}</p>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{pack.description}</p>
                    {isSelected ? (
                      <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
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
              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 dark:border-green-800/70 dark:bg-green-900/20 dark:text-green-300">
                Current Plan: <span className="font-semibold">{subscription.planName}</span> · Valid until{' '}
                <span className="font-semibold">{formatReadableDate(subscription.expiresAt)}</span>
              </div>
            ) : null}

            {paymentMessage ? (
              <p className={`text-xs ${paymentMessage.includes('successful') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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

          <div className="flex items-center gap-2 rounded-lg border border-zinc-200/70 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
            <Sparkles className="h-3.5 w-3.5" />
            Premium includes unlimited CV versions, advanced optimization, and priority processing.
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
