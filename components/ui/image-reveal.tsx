'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface Feature {
  id: number;
  num: string;
  label: string;
  desc: string;
  src: string;
}

const features: Feature[] = [
  {
    id: 1,
    num: '01',
    label: 'My CVs',
    desc: 'Create, manage and export unlimited CV versions',
    src: '/dashboard.png',
  },
  {
    id: 2,
    num: '02',
    label: 'Find Jobs',
    desc: 'Real-time search across LinkedIn, Workday & CareerOne',
    src: '/jobsearch.png',
  },
  {
    id: 3,
    num: '03',
    label: 'Application Tracker',
    desc: 'Track every application, note and interview in one place',
    src: '/applicationtracker.png',
  },
  {
    id: 4,
    num: '04',
    label: 'Job Tracker',
    desc: 'Mark jobs as applied or skipped, revisit anytime',
    src: '/jobtracker.png',
  },
  {
    id: 5,
    num: '05',
    label: 'AI Optimizations',
    desc: 'History of every AI-driven CV change per job posting',
    src: '/optimizations.png',
  },
  {
    id: 6,
    num: '06',
    label: 'CV vs Job Match',
    desc: 'Score your CV against a job listing and fix the gaps',
    src: '/joblistinganalyzeoptimize.png',
  },
];

export interface ImageRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'blue-theme' | 'green-theme';
  size?: 'default' | 'compact' | 'expanded';
  asChild?: boolean;
}

const ImageReveal = React.forwardRef<HTMLDivElement, ImageRevealProps>(
  ({ className, ...props }, ref) => {
    const [active, setActive] = useState<Feature>(features[0]);

    const handleActivate = (f: Feature) => {
      if (f.id === active.id) return;
      setActive(f);
    };

    return (
      <div
        ref={ref}
        className={cn('w-full border-4 border-black bg-white overflow-hidden', className)}
        {...props}
      >
        {/* Screenshot preview panel */}
        <div
          className="relative w-full border-b-4 border-black bg-black overflow-hidden"
          style={{ aspectRatio: '16/9' }}
        >
          {features.map((f) => (
            <img
              key={f.id}
              src={f.src}
              alt={f.label}
              className={cn(
                'absolute inset-0 w-full h-full object-cover object-top',
                'transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]',
                f.id === active.id
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-[1.04] translate-y-3 pointer-events-none'
              )}
            />
          ))}

          {/* Bottom bar with active label */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black px-4 py-2.5">
            <div className="flex items-center gap-3">
              <span className="text-[#FF3000] text-[10px] font-black uppercase tracking-[0.35em]">
                {active.num}
              </span>
              <span className="text-white text-[10px] font-black uppercase tracking-widest">
                {active.label}
              </span>
              <span className="hidden sm:block text-white/40 text-[9px] font-bold uppercase tracking-widest">
                — {active.desc}
              </span>
            </div>
            <div className="flex gap-1">
              {features.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleActivate(f)}
                  className={cn(
                    'h-1.5 transition-all duration-300',
                    f.id === active.id ? 'w-6 bg-[#FF3000]' : 'w-1.5 bg-white/30 hover:bg-white/60'
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Feature list */}
        <div className="divide-y-2 divide-black">
          {features.map((f) => {
            const isActive = f.id === active.id;
            return (
              <button
                key={f.id}
                type="button"
                onMouseEnter={() => handleActivate(f)}
                onClick={() => handleActivate(f)}
                className={cn(
                  'group w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors duration-150',
                  isActive ? 'bg-black' : 'bg-white hover:bg-[#F2F2F2]'
                )}
              >
                {/* Number */}
                <span
                  className={cn(
                    'shrink-0 text-[10px] font-black uppercase tracking-[0.2em] w-5 leading-none',
                    isActive ? 'text-[#FF3000]' : 'text-black/25 group-hover:text-black/50'
                  )}
                >
                  {f.num}
                </span>

                {/* Label + description */}
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      'text-[11px] font-black uppercase tracking-widest leading-none',
                      isActive ? 'text-white' : 'text-black'
                    )}
                  >
                    {f.label}
                  </div>
                  <div
                    className={cn(
                      'hidden sm:block text-[10px] font-bold uppercase tracking-widest mt-1 truncate',
                      isActive ? 'text-white/50' : 'text-black/35'
                    )}
                  >
                    {f.desc}
                  </div>
                </div>

                {/* Active pip */}
                <div
                  className={cn(
                    'shrink-0 w-2 h-2 transition-all duration-200',
                    isActive ? 'bg-[#FF3000] scale-100' : 'bg-transparent scale-0'
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

ImageReveal.displayName = 'ImageReveal';

export default ImageReveal;

