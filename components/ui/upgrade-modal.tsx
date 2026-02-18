'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircleIcon, Crown, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: 'cv-creation' | 'cv-optimization' | 'job-search';
  title?: string;
  description?: string;
}

export function UpgradeModal({
  open,
  onOpenChange,
  feature = 'cv-creation',
  title,
  description,
}: UpgradeModalProps) {
  const router = useRouter();

  const featureConfig = {
    'cv-creation': {
      title: 'Unlock Unlimited CVs',
      description: 'Free plan allows only 1 CV. Upgrade to Pro to create unlimited professional CVs.',
      icon: '📄',
    },
    'cv-optimization': {
      title: 'Unlock Unlimited CV Optimizations',
      description: 'Free plan allows only 1 CV optimization. Upgrade to Pro for unlimited AI-powered optimizations.',
      icon: '✨',
    },
    'job-search': {
      title: 'Unlock More Job Searches',
      description: 'Free plan allows only 1 job search. Upgrade to Pro for 10 searches per cycle and advanced filters.',
      icon: '🔍',
    },
  };

  const config = featureConfig[feature];

  const handleUpgrade = () => {
    onOpenChange(false);
    router.push('/dashboard?openUpgrade=true');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center border-2 border-black bg-white text-2xl">
              {config.icon}
            </div>
            <Crown className="h-8 w-8 text-[#FF3000]" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            {title || config.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {description || config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 space-y-4">
          <div className="border-2 border-black bg-[#F2F2F2] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#FF3000]" />
              <h4 className="text-xs font-black uppercase tracking-widest">Pro Plan Benefits</h4>
            </div>
            <ul className="space-y-2 text-xs font-bold uppercase tracking-widest text-black/70">
              {[
                'Unlimited CV creation',
                'Unlimited AI-powered CV optimization',
                '10 job searches per cycle',
                'Automatic cover letter generation',
                'Permanent shareable links',
                'Priority support',
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 flex-shrink-0 text-[#FF3000]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-black/70">
            <span>Starting at</span>
            <span className="text-2xl font-black text-[#FF3000]">$19.99</span>
            <span>/month</span>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            className="flex-1"
          >
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
