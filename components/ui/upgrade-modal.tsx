'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, Crown, Loader2 } from 'lucide-react';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: 'cv-creation' | 'cv-optimization' | 'job-search';
  title?: string;
  description?: string;
}

const plans = [
  {
    id: 'pro-monthly' as const,
    name: 'Pro Monthly',
    price: '$19.99',
    period: '/month',
    description: 'Flexible monthly billing.',
    benefits: [
      'Unlimited CV versions',
      'Unlimited AI optimizations',
      'Advanced ATS scoring',
      'Priority support',
      'Permanent shareable links',
    ],
  },
  {
    id: 'pro-yearly' as const,
    name: 'Pro Yearly',
    price: '$199.99',
    period: '/year',
    description: 'Best value — ~17% savings.',
    badge: 'Best Value',
    benefits: [
      'Everything in Monthly',
      '~17% savings vs monthly',
      'Unlimited CV versions',
      'Unlimited AI optimizations',
      'Priority support',
    ],
  },
];

export function UpgradeModal({
  open,
  onOpenChange,
  feature = 'cv-creation',
  title,
  description,
}: UpgradeModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<'pro-monthly' | 'pro-yearly'>('pro-yearly');
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const featureConfig = {
    'cv-creation': {
      title: 'Unlock Unlimited CVs',
      description: 'Free plan allows only 1 CV. Upgrade to Pro for unlimited CVs.',
    },
    'cv-optimization': {
      title: 'Unlock Unlimited AI Optimizations',
      description: 'You have used your free optimization quota. Upgrade to Pro for unlimited AI-powered optimizations.',
    },
    'job-search': {
      title: 'Unlock More Job Searches',
      description: 'Free plan allows only 1 job search. Upgrade to Pro for 10 searches per cycle.',
    },
  };

  const config = featureConfig[feature];

  const handleCheckout = async () => {
    setErrorMsg('');
    setProcessing(true);
    try {
      const res = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseType: 'plan', planId: selectedPlanId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setErrorMsg(data.error || 'Unable to start checkout. Please try again.');
        setProcessing(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setErrorMsg('Unable to connect to Stripe right now. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-4 border-black">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-5 w-5 text-[#FF3000]" />
            <DialogTitle className="font-black uppercase tracking-widest">
              {title || config.title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-black/60">
            {description || config.description}
          </DialogDescription>
        </DialogHeader>

        {/* Plan cards */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={`relative border-2 p-4 text-left transition-colors ${
                  isSelected ? 'border-black bg-black text-white' : 'border-black bg-white text-black hover:bg-[#F2F2F2]'
                }`}
              >
                {plan.badge && (
                  <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-[#FF3000] text-white">
                    {plan.badge}
                  </span>
                )}
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">{plan.name}</p>
                <p className="text-xl font-black">
                  {plan.price}
                  <span className={`text-[10px] font-bold ml-1 ${isSelected ? 'text-white/60' : 'text-black/50'}`}>{plan.period}</span>
                </p>
                <p className={`text-[10px] font-bold mt-1 mb-3 ${isSelected ? 'text-white/60' : 'text-black/50'}`}>{plan.description}</p>
                <ul className="space-y-1">
                  {plan.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-1.5">
                      <Check className={`h-3 w-3 mt-0.5 shrink-0 ${isSelected ? 'text-[#FF3000]' : 'text-black/50'}`} />
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${isSelected ? 'text-white/80' : 'text-black/60'}`}>{b}</span>
                    </li>
                  ))}
                </ul>
                {isSelected && (
                  <div className="mt-3 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#FF3000]">
                    <Check className="h-3 w-3" /> Selected
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {errorMsg && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF3000] mt-1">{errorMsg}</p>
        )}

        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 border-2 border-black"
            disabled={processing}
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleCheckout}
            variant="accent"
            className="flex-1 gap-2"
            disabled={processing}
          >
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
            ) : (
              <><Crown className="h-4 w-4" /> Upgrade to Pro</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
