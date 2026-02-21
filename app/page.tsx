'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Bookmark,
  Download,
  FileText,
  History,
  ListChecks,
  PlusSquare,
  QrCode,
  Search,
  Shield,
  Sparkles,
  Star,
  Target,
  Users,
  Zap,
  X,
  Tag,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Marquee } from '@/components/ui/marquee';
import { MorphingText } from '@/components/ui/morphing-text';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAppDarkModeState } from '@/hooks/use-app-dark-mode';
import { getCurrentUser } from '@/lib/auth/auth';
import type { User } from '@/types';
import FeatureGallery from '@/components/ui/gallery-animation';
import { AuroraBackground } from '@/components/ui/aurora-background';
function MetaLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/meta-llama.png"
      alt="Meta Llama logo"
      width={50}
      height={50}
      className={`object-contain shrink-0 ${className ?? ''}`}
    />
  );
}

export default function Home() {
  const { isDark, setIsDark } = useAppDarkModeState();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(true); // start true to avoid flicker
  const [codeCopied, setCodeCopied] = useState(false);

  const PROMO_CODE = process.env.NEXT_PUBLIC_PROMO_CODE ?? 'WELCOME10';

  useEffect(() => {
    const loadCurrentUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    setBannerDismissed(localStorage.getItem('promo-banner-dismissed') === '1');
    loadCurrentUser();
  }, []);

  const dismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem('promo-banner-dismissed', '1');
  };

  const copyPromoCode = () => {
    navigator.clipboard.writeText(PROMO_CODE).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const displayName =
    currentUser?.full_name?.trim() ||
    currentUser?.email?.split('@')[0] ||
    'Dashboard';

  const faqItems = [
    {
      q: 'Which job platforms does CSPARK support?',
      a: 'CSPARK integrates directly with LinkedIn, Workday, and CareerOne. You search across all three from inside CSPARK — no tab switching, no copy-pasting. Results are fetched in real-time and each listing can be opened, analysed, and matched to your CV without leaving the app. More platforms are on the roadmap.',
    },
    {
      q: 'Is CSPARK really free to use?',
      a: 'Yes. The free plan gives you 1 CV, 1 CV import from an existing file, 1 AI optimization, and 1 job search (up to 25 results). It is intentionally generous enough to complete one full job application cycle start to finish. Pro removes all limits — unlimited CVs, imports, AI optimizations, and job searches — and adds the Application Tracker, Job Tracker, and full AI history per role.',
    },
    {
      q: 'How does the AI CV optimization actually work?',
      a: 'When you run an optimization, CSPARK sends the full job description alongside your CV to Meta Llama 3.3 70B. The model identifies missing keywords, weak bullet points, misaligned summary language, and seniority gaps. It then rewrites only the affected sections — your experience, skills, and summary — while preserving your real career history. Every change is shown as a diff so you can review, accept or revert before exporting.',
    },
    {
      q: 'What is the CV vs Job Match score?',
      a: 'The match score compares your CV text against the job listing and returns a percentage indicating how well your profile aligns with the role requirements. It surfaces a ranked list of missing ATS keywords, skills the employer emphasised, and sections where your language diverges from the job post. You can then run an AI optimization to close those gaps in one click.',
    },
    {
      q: 'Can I track applications and saved jobs?',
      a: 'Yes — CSPARK includes two separate trackers. The Application Tracker lets you log every job you have applied to, attach notes, and mark interview stages (applied, screening, interview, offer, rejected). The Job Tracker lets you save any listing from search results as Interested, Applied, or Skipped so you can revisit your pipeline without losing jobs you saw earlier.',
    },
    {
      q: 'Is my CV data secure?',
      a: 'Your data is stored in a GDPR-compliant Supabase database with row-level security — meaning only your authenticated account can access your CVs and profile. CV content sent to the AI is processed in-memory and never stored or used for model training. You can delete your account and all associated data at any time from the Settings page.',
    },
    {
      q: 'What export formats are available?',
      a: 'You can export your CV as a PDF (print-ready, ATS-safe layout), share it via a public link with a custom URL, or generate a QR code that links directly to your live CV. All three options are available from the CV editor in one click. The PDF is rendered from a clean HTML template — not a screenshot — so ATS parsers can read it correctly.',
    },
  ];

  const jsonLd = [
    // ── WebSite — enables Google Sitelinks Search Box ───────────────────────
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "CSPARK",
      url: "https://www.cspark.app",
      description:
        "AI-powered CV builder and multi-platform job search across LinkedIn, Workday & CareerOne.",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate:
            "https://www.cspark.app/jobs?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    // ── Organization — brand entity for Google Knowledge Panel ──────────────
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://www.cspark.app/#organization",
      name: "CSPARK",
      url: "https://www.cspark.app",
      logo: {
        "@type": "ImageObject",
        url: "https://www.cspark.app/favicon.png",
        width: 512,
        height: 512,
      },
      description:
        "CSPARK is an AI CV builder and multi-platform job search tool, powered by Meta Llama 3.3 70B.",
      foundingDate: "2024",
      sameAs: [],
    },
    // ── WebPage ─────────────────────────────────────────────────────────────
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": "https://www.cspark.app/#webpage",
      url: "https://www.cspark.app",
      name: "CSPARK | AI CV Builder & Multi-Platform Job Search",
      description:
        "Build ATS-optimized CVs and search jobs on LinkedIn, Workday & CareerOne with AI. Powered by Meta Llama 3.3. Free to start.",
      isPartOf: {
        "@type": "WebSite",
        name: "CSPARK",
        url: "https://www.cspark.app",
      },
      about: {
        "@type": "SoftwareApplication",
        name: "CSPARK",
        "@id": "https://www.cspark.app/#software",
      },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: "https://www.cspark.app/og-image.png",
        width: 1200,
        height: 630,
      },
      dateModified: new Date().toISOString().split("T")[0],
      inLanguage: "en-US",
      publisher: {
        "@type": "Organization",
        "@id": "https://www.cspark.app/#organization",
      },
    },
    // ── SoftwareApplication — rich result for app listings ──────────────────
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": "https://www.cspark.app/#software",
      name: "CSPARK",
      description:
        "AI resume builder with real-time job search across LinkedIn, Workday and CareerOne, ATS optimization, and job-specific CV tailoring.",
      applicationCategory: "CareerApplication",
      operatingSystem: "Web",
      url: "https://www.cspark.app",
      image: "https://www.cspark.app/og-image.png",
      screenshot: "https://www.cspark.app/og-image.png",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "12000",
        bestRating: "5",
        worstRating: "1",
      },
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: "USD",
          description:
            "1 CV, 1 import, 1 AI optimization, 1 job search on LinkedIn.",
        },
        {
          "@type": "Offer",
          name: "Pro Monthly",
          price: "19.99",
          priceCurrency: "USD",
          billingIncrement: "P1M",
          description:
            "Unlimited CVs, imports, AI optimizations, job searches across all platforms.",
        },
        {
          "@type": "Offer",
          name: "Pro Yearly",
          price: "199.99",
          priceCurrency: "USD",
          billingIncrement: "P1Y",
          description: "Pro annual plan — save ~17% vs monthly.",
        },
      ],
    },
    // ── FAQPage ─────────────────────────────────────────────────────────────
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    },
    // ── BreadcrumbList (homepage) ────────────────────────────────────────────
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://www.cspark.app",
        },
      ],
    },
  ];

  return (
    <div className={`min-h-screen bg-white text-black ${isDark ? 'dark' : ''}`}>
      <div className="pointer-events-none fixed inset-0 swiss-noise" aria-hidden="true" />

      {/* ── Promo banner ── */}
      {!bannerDismissed && (
        <div className="relative z-[60] bg-black text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
            <div className="flex flex-1 items-center justify-center gap-3 flex-wrap">
              <Tag className="w-3.5 h-3.5 text-[#FF3000] flex-shrink-0" />
              <span className="text-[11px] font-black uppercase tracking-widest">
                Sign up now and get
                <span className="text-[#FF3000] mx-1">10% off</span>
                your first purchase
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                Use code:
              </span>
              <button
                type="button"
                onClick={copyPromoCode}
                className="flex items-center gap-1.5 border-2 border-white/30 bg-white/10 hover:bg-white/20 px-2.5 py-0.5 transition-colors"
              >
                <span className="text-[11px] font-black uppercase tracking-widest text-[#FF3000]">
                  {PROMO_CODE}
                </span>
                {codeCopied ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3 text-white/60" />
                )}
              </button>
              {codeCopied && (
                <span className="text-[10px] font-bold tracking-widest text-green-400">Copied!</span>
              )}
              <Link
                href="/register"
                className="text-[10px] font-black uppercase tracking-widest border-b border-white/40 hover:border-white transition-colors"
              >
                Sign up &rarr;
              </Link>
            </div>
            <button
              type="button"
              onClick={dismissBanner}
              className="flex-shrink-0 p-1 text-white/60 hover:text-white transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-50 border-b-4 border-black bg-white">
        <div className="mx-auto flex h-14 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <Image
              src={isDark ? '/favicon-white.png' : '/favicon.png'}
              alt="CSpark logo"
              width={88}
              height={88}
              className="h-11 w-11 sm:h-20 sm:w-20 object-contain"
            />
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-xs font-black uppercase tracking-[0.4em] text-[#FF3000]">
                CSpark
              </span>
              <span className="text-base font-black uppercase tracking-[0.2em]">
                AI CV Lab
              </span>
            </div>
          </div>
          <div className="hidden items-center gap-6 lg:flex">
            <Link
              href="#method"
              className="text-xs font-black uppercase tracking-widest text-black hover:text-[#FF3000] transition-colors"
            >
              Method
            </Link>
            <Link
              href="#pricing"
              className="text-xs font-black uppercase tracking-widest text-black hover:text-[#FF3000] transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#faq"
              className="text-xs font-black uppercase tracking-widest text-black hover:text-[#FF3000] transition-colors"
            >
              FAQ
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
            <Link
              href={currentUser ? '/dashboard' : '/login'}
              className="text-xs sm:text-sm font-bold uppercase tracking-widest text-black transition-colors hover:text-[#FF3000]"
            >
              {currentUser ? displayName : 'Sign In'}
            </Link>
            {!currentUser && (
              <Button asChild variant="accent" size="sm" className="hidden sm:inline-flex">
                <Link href="/register">Start Free</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <AuroraBackground className="w-full" showRadialGradient>
        <section aria-labelledby="hero-heading" className="mx-auto w-full max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div>
              <h1 className="text-[1.5rem] font-black uppercase leading-[0.9] tracking-tight sm:text-6xl lg:text-[9rem]">
                Search{' '}
                <MorphingText
                  texts={['LinkedIn', 'Workday', 'CareerOne']}
                  colors={{
                    LinkedIn: '#0A66C2',
                    Workday: '#005CB9',
                    CareerOne: '#00A651',
                  }}
                  className="mx-0 inline-block h-[0.9em] w-[8ch] sm:w-[9ch] max-w-none align-baseline text-left text-[1em] font-black uppercase leading-[0.9] tracking-tight md:h-[0.9em] md:text-[1em] lg:text-[1em]"
                />{' '}
                Jobs.
                <br />
                Tailor Your CV.
              </h1>
              <p className="mt-6 max-w-2xl text-sm sm:text-lg font-medium uppercase tracking-[0.12em] text-black/80">
                A precise, job-specific CV workflow powered by Meta Llama 3.3 and
                real-time job search.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button asChild variant="accent" size="lg">
                  <Link href="/register" className="flex items-center gap-3">
                    Search Jobs
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="#method">See CV Tailoring</Link>
                </Button>
              </div>

              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="w-full shrink-0 overflow-hidden border-2 border-black bg-white px-3 py-2 sm:w-[480px]">
                  <Marquee pauseOnHover speed={18} className="mt-0">
                    <div className="flex items-center gap-10 pr-16">
                      <Image
                        src="/linkedin2.png"
                        alt="LinkedIn"
                        width={80}
                        height={20}
                        className="shrink-0 object-contain"
                      />
                      <Image
                        src="/workday-hcm.png"
                        alt="Workday"
                        width={42}
                        height={20}
                        className="shrink-0 object-contain"
                      />
                      <Image
                        src="/careerone.png"
                        alt="CareerOne"
                        width={93}
                        height={20}
                        className="shrink-0 object-contain"
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/launchllama.png"
                        alt="Launch Llama"
                        style={{ height: '22px', width: 'auto', maxWidth: '120px' }}
                        className="shrink-0 object-contain"
                      />
                    </div>
                  </Marquee>
                </div>
                <div className="shrink-0 flex items-center gap-2 border-2 border-black bg-[#F2F2F2] px-4 py-2 text-xs font-bold uppercase tracking-widest">
                  <Star className="h-4 w-4" />
                  4.9/5 from 12,000 reviews
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3 sm:gap-4 border-4 border-black bg-[#F2F2F2] px-4 sm:px-6 py-4">
                <MetaLogo className="h-10 w-10" />
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.3em] text-[#FF3000]">
                    Powered by Meta
                  </div>
                  <div className="text-base font-bold uppercase tracking-widest">
                    LLAMA 3.3 70B
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        </AuroraBackground>

        {/* ── Feature Gallery Section ─────────────────────────────────── */}
        <section
          aria-labelledby="features-heading"
          className="border-t-4 border-black bg-white px-4 pb-24 pt-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-14">
              <div className="text-xs font-black uppercase tracking-[0.4em] text-[#FF3000]">
                01. Features
              </div>
              <h2
                id="features-heading"
                className="mt-4 text-3xl font-black uppercase leading-tight text-black sm:text-5xl lg:text-6xl"
              >
                Everything in one place
              </h2>
              <p className="mt-4 max-w-2xl text-sm font-bold uppercase tracking-widest text-black/50">
                From job discovery to a tailored, ATS-ready CV — every tool you need, in one workflow.
              </p>
            </div>

            <FeatureGallery
              features={[
                {
                  num: '01',
                  label: 'My CVs',
                  desc: 'Create, manage & export unlimited CV versions for different roles',
                  src: '/dashboard.png',
                  alt: 'CSPARK CV dashboard — create and manage multiple ATS-optimized CV versions for different job roles',
                },
                {
                  num: '02',
                  label: 'Find Jobs',
                  desc: 'Real-time search across LinkedIn, Workday & CareerOne',
                  src: '/jobsearch.png',
                  alt: 'CSPARK job search — real-time job listings from LinkedIn, Workday and CareerOne',
                },
                {
                  num: '03',
                  label: 'Application Tracker',
                  desc: 'Track every application, note and interview in one place',
                  src: '/applicationtracker.png',
                  alt: 'CSPARK application tracker — manage job applications with notes and interview stage tracking',
                },
                {
                  num: '04',
                  label: 'Job Tracker',
                  desc: 'Mark applied, skipped or interested — revisit anytime',
                  src: '/jobtracker.png',
                  alt: 'CSPARK job tracker — save and organise job listings tagged as applied, skipped or interested',
                },
                {
                  num: '05',
                  label: 'AI Optimizations',
                  desc: 'Full history of every AI-driven CV change per job posting',
                  src: '/optimizations.png',
                  alt: 'CSPARK AI CV optimization history — track every AI-driven change made to your CV per job',
                },
                {
                  num: '06',
                  label: 'CV vs Job Match',
                  desc: 'Score your CV against a job listing and fix the gaps',
                  src: '/joblistinganalyzeoptimize.png',
                  alt: 'CSPARK CV versus job match score — compare your CV against a job listing and fix ATS keyword gaps',
                },
              ]}
            />
          </div>
        </section>

        <section
          id="method"
          className="scroll-mt-20 border-t-4 border-black bg-[#F9F9F9] px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">

            <div className="mb-14 max-w-2xl">
              <div className="text-xs font-black uppercase tracking-[0.4em] text-[#FF3000]">
                02. Method
              </div>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-black sm:text-5xl lg:text-6xl">
                How CSPARK works.
              </h2>
              <p className="mt-4 text-sm font-bold uppercase tracking-widest text-black/50">
                A five-step pipeline — from raw job listing to a sent application. No copy-pasting, no guessing.
              </p>
            </div>

            <div className="grid gap-0 lg:grid-cols-2">

              {/* Left: vertical step timeline */}
              <div className="border-4 border-black bg-white">
                {[
                  {
                    step: '01',
                    label: 'Find the job',
                    detail: 'Search LinkedIn, Workday or CareerOne — results appear in real-time inside CSPARK.',
                    time: '~1 min',
                  },
                  {
                    step: '02',
                    label: 'AI reads the listing',
                    detail: 'Meta Llama 3.3 extracts required skills, keywords, seniority signals and tone from the job post.',
                    time: '~5 sec',
                  },
                  {
                    step: '03',
                    label: 'Your CV is scored',
                    detail: 'CSPARK compares your CV against the role and surfaces a ranked list of gaps — missing keywords, weak bullets, misaligned summary.',
                    time: '~10 sec',
                  },
                  {
                    step: '04',
                    label: 'AI rewrites the weak parts',
                    detail: 'One click. The AI rewrites your summary, skills and bullet points to match the role while keeping your real experience intact.',
                    time: '~20 sec',
                  },
                  {
                    step: '05',
                    label: 'Export and apply',
                    detail: 'Download as PDF, share via link or QR code — everything tracked in your Application Tracker.',
                    time: '~30 sec',
                  },
                ].map((item, i, arr) => (
                  <div
                    key={item.step}
                    className={`flex gap-0 ${i < arr.length - 1 ? 'border-b-4 border-black' : ''}`}
                  >
                    {/* Step number column */}
                    <div className="flex w-16 shrink-0 flex-col items-center border-r-4 border-black bg-[#F2F2F2] py-6">
                      <span className="text-xs font-black uppercase tracking-widest text-[#FF3000]">{item.step}</span>
                    </div>
                    {/* Content */}
                    <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-6">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-base font-black uppercase tracking-widest">{item.label}</h3>
                        <span className="shrink-0 border-2 border-black bg-[#F2F2F2] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-black/50">{item.time}</span>
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest leading-relaxed text-black/55">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: concrete before/after example */}
              <div className="border-4 border-black lg:border-l-0 bg-black text-white flex flex-col">
                <div className="border-b-4 border-white/20 px-7 py-5">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF3000]">Live example</span>
                  <div className="mt-1 text-sm font-black uppercase tracking-widest">Senior Product Manager @ Stripe</div>
                </div>

                <div className="px-7 py-6 border-b-4 border-white/20">
                  <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-3">Before AI optimization</div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 shrink-0 bg-white/20" />
                      <p className="text-xs font-bold uppercase tracking-widest text-white/40 line-through leading-relaxed">Managed product roadmap and worked with cross-functional teams to ship features.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 shrink-0 bg-white/20" />
                      <p className="text-xs font-bold uppercase tracking-widest text-white/40 line-through leading-relaxed">Responsible for improving key metrics.</p>
                    </div>
                  </div>
                </div>

                <div className="px-7 py-6 border-b-4 border-white/20 flex-1">
                  <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF3000] mb-3">After — AI rewritten for this role</div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 shrink-0 bg-[#FF3000]" />
                      <p className="text-xs font-bold uppercase tracking-widest text-white/80 leading-relaxed">Owned end-to-end roadmap for 3 payment products — drove 22% increase in checkout conversion via A/B-tested UX changes.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 shrink-0 bg-[#FF3000]" />
                      <p className="text-xs font-bold uppercase tracking-widest text-white/80 leading-relaxed">Aligned 4 cross-functional squads (Eng, Design, Data, Compliance) to ship SDK v3 — 0 critical regressions on launch day.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x-4 divide-white/20">
                  {[
                    { label: 'ATS match score', before: '41%', after: '89%' },
                    { label: 'Keywords added', before: '—', after: '+14' },
                    { label: 'Time taken', before: '—', after: '28s' },
                  ].map((s) => (
                    <div key={s.label} className="px-5 py-5">
                      <div className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">{s.label}</div>
                      <div className="text-xs font-bold uppercase text-white/30 line-through">{s.before}</div>
                      <div className="text-xl font-black uppercase text-[#FF3000]">{s.after}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 border-t-4 border-black bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">

            {/* Header row */}
            <div className="grid gap-10 lg:grid-cols-[7fr_5fr]">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.4em] text-[#FF3000]">
                  03. Advantages
                </div>
                <h2 className="mt-6 text-3xl font-black uppercase leading-tight text-black sm:text-5xl lg:text-6xl">
                  Every tool.<br />One workflow.
                </h2>
                <p className="mt-4 max-w-xl text-sm font-bold uppercase tracking-widest text-black/50">
                  From discovering a job to a tailored, interview-ready application — CSPARK replaces five separate tools.
                </p>
              </div>
              <div className="flex flex-col justify-center gap-3">
                <div className="border-4 border-black bg-[#FF3000] p-5 text-white">
                  <div className="text-xs font-black uppercase tracking-[0.3em] text-white/70">Meta Llama 3.3</div>
                  <div className="mt-2 text-4xl font-black uppercase">70B</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-widest text-white/80">Parameters powering every optimization</div>
                </div>
                <div className="border-4 border-black bg-[#F2F2F2] p-5">
                  <div className="text-xs font-black uppercase tracking-[0.3em] text-[#FF3000]">Average time saved</div>
                  <div className="mt-2 text-4xl font-black uppercase">&lt; 5 min</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-widest text-black/60">From job listing to tailored CV</div>
                </div>
              </div>
            </div>

            {/* 6 feature cards */}
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  num: '01',
                  title: 'Unlimited CVs',
                  text: 'Create and manage as many CV versions as you need — one per role, one per industry.',
                  icon: FileText,
                  accent: false,
                },
                {
                  num: '02',
                  title: '3-Platform Job Search',
                  text: 'Search LinkedIn, Workday & CareerOne in real-time from a single interface.',
                  icon: Search,
                  accent: false,
                },
                {
                  num: '03',
                  title: 'AI CV vs Job Match',
                  text: 'Score your CV against any job listing and get a ranked list of keyword gaps to fix.',
                  icon: Target,
                  accent: false,
                },
                {
                  num: '04',
                  title: 'Application Tracker',
                  text: 'Log every application with status, notes and interview stages — never lose track again.',
                  icon: ListChecks,
                  accent: false,
                },
                {
                  num: '05',
                  title: 'Job Tracker',
                  text: 'Save jobs as Applied, Interested or Skipped and revisit your pipeline any time.',
                  icon: Bookmark,
                  accent: false,
                },
                {
                  num: '06',
                  title: 'Full AI History',
                  text: 'Every AI optimization is logged per job post — review, compare and revert changes.',
                  icon: History,
                  accent: false,
                },
              ].map((item) => (
                <div
                  key={item.num}
                  className={`group relative border-4 border-black p-6 transition-all hover:bg-[#FF3000] hover:text-white ${item.accent ? 'bg-black text-white' : 'bg-white'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`flex h-11 w-11 items-center justify-center border-2 ${item.accent ? 'border-white/30 bg-white/10 group-hover:border-white group-hover:bg-white' : 'border-black bg-[#F2F2F2] group-hover:border-white group-hover:bg-white'}`}>
                      <item.icon className={`h-5 w-5 ${item.accent ? 'text-white group-hover:text-[#FF3000]' : 'text-black group-hover:text-[#FF3000]'}`} />
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-[0.4em] ${item.accent ? 'text-white/40 group-hover:text-white/60' : 'text-black/30 group-hover:text-white/60'}`}>{item.num}</span>
                  </div>
                  <h3 className="mt-5 text-base font-black uppercase tracking-widest">
                    {item.title}
                  </h3>
                  <p className={`mt-3 text-xs font-bold uppercase tracking-widest leading-relaxed ${item.accent ? 'text-white/70 group-hover:text-white/80' : 'text-black/60 group-hover:text-white/80'}`}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Stats row */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {[
                { label: 'Job boards integrated', value: '3' },
                { label: 'CV optimization time', value: '~30s' },
                { label: 'ATS keyword precision', value: '94%' },
                { label: 'Tools replaced by CSPARK', value: '5×' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="border-4 border-black bg-[#F2F2F2] p-6 text-center"
                >
                  <div className="text-4xl font-black uppercase">{stat.value}</div>
                  <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.3em] text-black/60">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        <section id="pricing" className="scroll-mt-20 border-t-4 border-black bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[5fr_7fr]">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.4em] text-[#FF3000]">
                  04. Pricing
                </div>
                <h2 className="mt-6 text-3xl font-black uppercase leading-tight text-black sm:text-5xl lg:text-6xl">
                  Free for starters. Pro for volume.
                </h2>
                <p className="mt-6 text-lg font-medium uppercase tracking-[0.12em] text-black/80">
                  Pro unlocks unlimited everything — CVs, job searches, AI
                  optimizations, and imports. Pay-as-you-go add-on packs also
                  available.
                </p>
                <div className="mt-8 border-4 border-black bg-[#F2F2F2] p-6">
                  <div className="text-xs font-black uppercase tracking-[0.3em] text-[#FF3000]">
                    Pro benefits
                  </div>
                  <ul className="mt-4 space-y-3 text-xs font-bold uppercase tracking-widest text-black/70">
                    <li>Unlimited CV creation</li>
                    <li>Unlimited CV imports</li>
                    <li>Unlimited job searches (LinkedIn, Workday, CareerOne)</li>
                    <li>Unlimited AI optimizations</li>
                    <li>Permanent share links + QR codes</li>
                    <li>Priority processing + support</li>
                  </ul>
                </div>
              </div>
              <div className="border-4 border-black bg-white">
                <div className="border-b-4 border-black px-6 py-4">
                  <div className="text-xs font-black uppercase tracking-[0.3em] text-[#FF3000]">
                    Free vs Pro
                  </div>
                  <div className="mt-2 text-lg font-black uppercase tracking-widest">
                    Plan comparison
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-bold uppercase tracking-widest">
                    <thead className="border-b-4 border-black">
                      <tr>
                        <th className="px-6 py-4">Feature</th>
                        <th className="px-6 py-4">Free</th>
                        <th className="px-6 py-4 text-[#FF3000]">Pro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { feature: 'CV creations', free: '1', pro: 'Unlimited' },
                        { feature: 'CV imports', free: '1', pro: 'Unlimited' },
                        { feature: 'AI optimizations', free: '1', pro: 'Unlimited' },
                        { feature: 'Job searches', free: '1 (25 results)', pro: 'Unlimited' },
                        { feature: 'Platforms', free: 'LinkedIn only', pro: 'LinkedIn · Workday · CareerOne' },
                        { feature: 'Shareable links', free: '7 days', pro: 'Permanent' },
                        { feature: 'QR codes', free: 'Limited', pro: 'Unlimited' },
                        { feature: 'Support', free: 'Standard', pro: 'Priority' },
                      ].map((row) => (
                        <tr key={row.feature} className="border-b-2 border-black hover:bg-[#F2F2F2] transition-colors">
                          <td className="px-6 py-3.5">{row.feature}</td>
                          <td className="px-6 py-3.5 text-black/50">{row.free}</td>
                          <td className="px-6 py-3.5 font-black text-black">{row.pro}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-6">
                  <div className="text-xs font-black uppercase tracking-[0.3em]">
                    Pro starts at
                  </div>
                  <div>
                    <div className="text-3xl font-black uppercase text-[#FF3000]">
                      $19.99<span className="text-base font-bold">/mo</span>
                    </div>
                    <div className="text-sm font-bold uppercase tracking-widest text-black/60">
                      or $199.99/yr — save ~17%
                    </div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-black/40">
                      Add-on packs from $9.99
                    </div>
                  </div>
                  <Button asChild variant="accent" size="lg">
                    <Link href="/register" className="flex items-center gap-3">
                      Get Started
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t-4 border-black bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[5fr_7fr]">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.4em] text-[#FF3000]">
                  05. Journal
                </div>
                <h2 className="mt-6 text-3xl font-black uppercase leading-tight text-black sm:text-5xl lg:text-6xl">
                  Precision feedback from teams and candidates.
                </h2>
                <div className="mt-6 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-black/70">
                  <Users className="h-4 w-4" />
                  Trusted by hiring managers in 120+ companies
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {[
                  {
                    quote:
                      'The workflow is brutally efficient. We get a polished CV per role in minutes.',
                    name: 'Talent Partner, Berlin',
                  },
                  {
                    quote:
                      'LinkedIn sync + AI rewrite is exactly what a high-volume team needs.',
                    name: 'Hiring Lead, Amsterdam',
                  },
                  {
                    quote:
                      'The ATS formatting is the cleanest we have seen.',
                    name: 'Recruiter, London',
                  },
                  {
                    quote:
                      'Our candidates share QR codes instantly after optimization.',
                    name: 'Career Coach, Paris',
                  },
                  ].map((item) => (
                <div
                  key={item.name}
                  className="group border-4 border-black bg-white p-6 transition-all hover:bg-black hover:text-white hover:-translate-y-0.5"
                >
                  <p className="text-sm font-medium uppercase tracking-widest text-black/80 group-hover:text-white/80">
                    {item.quote}
                  </p>
                  <div className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-[#FF3000]">
                    {item.name}
                  </div>
                </div>
                  ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t-4 border-black bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[5fr_7fr]">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.4em] text-[#FF3000]">
                  06. FAQ
                </div>
                <h2 className="mt-6 text-3xl font-black uppercase leading-tight text-black sm:text-5xl lg:text-6xl">
                  Straight answers.<br /><span className="whitespace-nowrap">Zero noise.</span>
                </h2>
              </div>
              <div id="faq-section" className="grid gap-4">
                {faqItems.map((faq, index) => (
                  <div
                    key={faq.q}
                    className="border-4 border-black bg-white"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                      onClick={() =>
                        setExpandedFaq(expandedFaq === index ? null : index)
                      }
                    >
                      <span className="text-sm font-bold uppercase tracking-widest">
                        {faq.q}
                      </span>
                      <PlusSquare
                        className={`h-5 w-5 transition-transform ${
                          expandedFaq === index ? 'rotate-90' : 'rotate-0'
                        }`}
                      />
                    </button>
                    {expandedFaq === index && (
                      <div className="border-t-4 border-black bg-[#F2F2F2] px-6 py-5">
                        <p className="text-sm font-medium uppercase tracking-widest text-black/70">
                          {faq.a}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t-4 border-black bg-[#F2F2F2] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 border-4 border-black bg-white p-8 md:flex-row md:items-center">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.4em] text-[#FF3000]">
                07. Start
              </div>
              <h2 className="mt-4 text-4xl font-black uppercase leading-tight text-black sm:text-5xl">
                Build a job-specific CV today.
              </h2>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild variant="accent" size="lg">
                <Link href="/register" className="flex items-center gap-3">
                  Start for Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Return to Dashboard</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
