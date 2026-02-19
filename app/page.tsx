'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Download,
  FileText,
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
      q: 'Which job platforms does cspark support?',
      a: 'cspark supports LinkedIn, Workday, and CareerOne. Search jobs from any of these platforms and get an AI-optimized CV matched to each role.',
    },
    {
      q: 'Is cspark really free?',
      a: 'Yes. The free plan includes 1 CV, 1 CV import, 1 AI optimization, and 1 job search (up to 25 results). Pro unlocks everything unlimited.',
    },
    {
      q: 'How does the AI optimization work?',
      a: 'AI analyzes job requirements and refines your CV sections to match keywords and priorities.',
    },
    {
      q: 'Is my data secure?',
      a: 'We use encryption, are GDPR compliant, and you control your data and exports.',
    },
    {
      q: 'Can I create multiple CVs?',
      a: 'Free includes 1 CV. Pro includes unlimited CV versions and unlimited CV imports from existing files.',
    },
    {
      q: 'What export formats do you support?',
      a: 'Export to PDF, share with a link, or generate a QR code.',
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
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Image
              src={isDark ? '/favicon-white.png' : '/favicon.png'}
              alt="CSpark logo"
              width={88}
              height={88}
              className="h-20 w-20 object-contain"
            />
            <div className="flex flex-col leading-none">
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
              href="#faq-section"
              className="text-xs font-black uppercase tracking-widest text-black hover:text-[#FF3000] transition-colors"
            >
              FAQ
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
            <Link
              href={currentUser ? '/dashboard' : '/login'}
              className="text-sm font-bold uppercase tracking-widest text-black transition-colors hover:text-[#FF3000]"
            >
              {currentUser ? displayName : 'Sign In'}
            </Link>
            {!currentUser && (
              <Button asChild variant="accent" size="sm">
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

        <section aria-labelledby="hero-heading" className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div>
              <h1 className="text-6xl font-black uppercase leading-[0.9] tracking-tight sm:text-7xl lg:text-[9rem]">
                Search{' '}
                <MorphingText
                  texts={['LinkedIn', 'Workday', 'CareerOne']}
                  colors={{
                    LinkedIn: '#0A66C2',
                    Workday: '#005CB9',
                    CareerOne: '#00A651',
                  }}
                  className="mx-0 inline-block h-[0.9em] w-[9ch] max-w-none align-baseline text-left text-[1em] font-black uppercase leading-[0.9] tracking-tight md:h-[0.9em] md:text-[1em] lg:text-[1em]"
                />{' '}
                Jobs.
                <br />
                Tailor Your CV.
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-medium uppercase tracking-[0.12em] text-black/80">
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
                <div className="w-full shrink-0 overflow-hidden border-2 border-black bg-white px-3 py-2 sm:w-[420px]">
                  <Marquee pauseOnHover speed={18} className="mt-0">
                    <div className="flex items-center gap-6 pr-6">
                      <Image
                        src="/linkedin.png"
                        alt="LinkedIn"
                        width={20}
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
                      <Image
                        src="/launchllama.png"
                        alt="Launch Llama"
                        width={130}
                        height={30}
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

              <div className="mt-8 flex items-center gap-4 border-4 border-black bg-[#F2F2F2] px-6 py-4">
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
                className="mt-4 text-5xl font-black uppercase leading-tight sm:text-6xl"
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
          className="border-t-4 border-black bg-white px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[5fr_7fr]">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.4em] text-[#FF3000]">
                  02. Method
                </div>
                <h2 className="mt-6 text-5xl font-black uppercase leading-tight sm:text-6xl">
                  From job post to ATS-ready CV in minutes.
                </h2>
                <p className="mt-6 text-lg font-medium uppercase tracking-[0.12em] text-black/80">
                  Structured pipeline, visible every step. Search, analyze,
                  optimize, and deliver.
                </p>
                <div className="mt-8 grid gap-4">
                  {[
                    {
                      icon: Search,
                      title: 'Search jobs across platforms',
                    },
                    {
                      icon: Sparkles,
                      title: 'AI extracts role requirements',
                    },
                    {
                      icon: FileText,
                      title: 'CV sections refined for ATS',
                    },
                    {
                      icon: Target,
                      title: 'Preview diffs before applying',
                    },
                  ].map((item, index) => (
                    <div
                      key={item.title}
                      className="group flex items-center gap-4 border-2 border-black bg-[#F2F2F2] px-5 py-4 transition-colors hover:bg-black hover:text-white"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-black bg-white group-hover:border-white group-hover:bg-white/10">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div className="text-sm font-bold uppercase tracking-widest">
                        {String(index + 1).padStart(2, '0')}. {item.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-4 border-black bg-[#F2F2F2] p-8 swiss-dots">
                <div className="grid gap-6 md:grid-cols-2">
                  {[
                    {
                      icon: Search,
                      title: 'Job intelligence',
                      text: 'Fetch real job listings from LinkedIn, Workday & CareerOne.',
                    },
                    {
                      icon: Zap,
                      title: 'Rapid tailoring',
                      text: 'Rewrite summaries and bullet points to align with roles.',
                    },
                    {
                      icon: Shield,
                      title: 'Secure data',
                      text: 'Encryption and GDPR-first handling for every profile.',
                    },
                    {
                      icon: QrCode,
                      title: 'Instant sharing',
                      text: 'Publish links, PDFs, and QR codes on demand.',
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="group border-2 border-black bg-white p-6 transition-colors hover:bg-black hover:text-white"
                    >
                      <div className="flex h-12 w-12 items-center justify-center border-2 border-black bg-[#F2F2F2] group-hover:border-white/20 group-hover:bg-white/10">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <h3 className="mt-4 text-lg font-black uppercase tracking-widest">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm font-medium uppercase tracking-widest text-black/70 group-hover:text-white/70">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="border-t-4 border-black bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[7fr_5fr]">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.4em] text-[#FF3000]">
                  03. Advantages
                </div>
                <h2 className="mt-6 text-5xl font-black uppercase leading-tight sm:text-6xl">
                  Measurable outcomes for every application.
                </h2>
              </div>
              <div className="border-4 border-black bg-[#F2F2F2] p-6 swiss-diagonal">
                <div className="text-xs font-black uppercase tracking-[0.3em] text-[#FF3000]">
                  Performance
                </div>
                <div className="mt-4 text-4xl font-black uppercase">+38%</div>
                <div className="mt-2 text-sm font-bold uppercase tracking-widest text-black/70">
                  Higher callback rate
                </div>
              </div>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: 'Multi-platform sync',
                  text: 'Live role imports from LinkedIn, Workday & CareerOne.',
                  icon: Search,
                },
                {
                  title: 'ATS optimized',
                  text: 'Structured for parsing + keyword density.',
                  icon: Target,
                },
                {
                  title: 'Instant export',
                  text: 'PDF, link, QR, all from one workflow.',
                  icon: Download,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group border-4 border-black bg-white p-6 transition-all hover:bg-[#FF3000] hover:text-white"
                >
                  <div className="flex h-12 w-12 items-center justify-center border-2 border-black bg-[#F2F2F2] group-hover:bg-white group-hover:border-white">
                    <item.icon className="h-6 w-6 text-black group-hover:text-[#FF3000]" />
                  </div>
                  <h3 className="mt-5 text-lg font-black uppercase tracking-widest">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm font-medium uppercase tracking-widest text-black/70 group-hover:text-white/80">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                { label: 'Profiles optimized', value: '124k' },
                { label: 'Jobs scanned weekly', value: '52k' },
                { label: 'Hiring teams reached', value: '8.4k' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="border-4 border-black bg-[#F2F2F2] p-6 text-center"
                >
                  <div className="text-4xl font-black uppercase">{stat.value}</div>
                  <div className="mt-2 text-xs font-bold uppercase tracking-[0.3em] text-black/70">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="border-t-4 border-black bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[5fr_7fr]">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.4em] text-[#FF3000]">
                  04. Pricing
                </div>
                <h2 className="mt-6 text-5xl font-black uppercase leading-tight sm:text-6xl">
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
                <h2 className="mt-6 text-5xl font-black uppercase leading-tight sm:text-6xl">
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
                <h2 className="mt-6 text-5xl font-black uppercase leading-tight sm:text-6xl">
                  Straight answers. Zero noise.
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
              <h2 className="mt-4 text-4xl font-black uppercase leading-tight sm:text-5xl">
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
