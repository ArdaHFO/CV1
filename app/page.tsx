'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FileText, Sparkles, Globe, Zap, Shield, Lock, Eye, Download,
  CheckCircle, ArrowRight, Users, TrendingUp, Clock, Star,
  Lightbulb, Target, Rocket, ChevronDown, Code, Database,
  Cpu, Layers, Linkedin, Search, Link2, QrCode, Upload, PlusSquare
} from 'lucide-react';
import ShaderBackground from '@/components/ui/shader-background';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { PricingWithChart } from '@/components/ui/pricing-with-chart';
import { GlareCard } from '@/components/ui/glare-card';
import AnimatedTextCycle from '@/components/ui/animated-text-cycle';
import { useAppDarkModeState } from '@/hooks/use-app-dark-mode';
import { getCurrentUser } from '@/lib/auth/auth';
import type { User } from '@/types';

function MetaLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/icons8-meta-50.png"
      alt="Meta logo"
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

  useEffect(() => {
    const loadCurrentUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };

    loadCurrentUser();
  }, []);

  const displayName =
    currentUser?.full_name?.trim() ||
    currentUser?.email?.split('@')[0] ||
    'Dashboard';

  const faqItems = [
    {
      q: 'Can I search for LinkedIn jobs in the platform?',
      a: 'Yes! Our platform integrates with LinkedIn job search. You can browse thousands of job postings directly within our app, and for each job, our AI will automatically analyze the requirements and optimize your CV to match perfectly.',
    },
    {
      q: 'Is CSpark really free?',
      a: 'Yes. CSpark has a freemium plan with 1 CV creation and 1 job search (up to 25 results). You can upgrade to Pro for 10 job searches, higher result limits (25/50/all), and unlimited CV creation.',
    },
    {
      q: 'How does the AI optimization work?',
      a: 'Our AI analyzes job descriptions and optimizes your CV content to match required skills and keywords. It suggests improvements and rewrites sections to make them more compelling.',
    },
    {
      q: 'Is my data secure?',
      a: 'Absolutely. We use bank-level encryption, are GDPR compliant, and never sell your data. You have full control over your information and can delete it anytime.',
    },
    {
      q: 'Can I create multiple CVs?',
      a: 'On Free, you can create 1 CV. On Pro, you can create unlimited CVs and keep separate versions for different applications.',
    },
    {
      q: 'What export formats do you support?',
      a: 'You can export your CV as a high-quality PDF. We also provide shareable online links and QR codes for digital sharing.',
    },
  ];

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'CSpark',
      description:
        'AI resume builder with real-time LinkedIn job search, ATS optimization, and job-specific CV tailoring.',
      applicationCategory: 'CareerApplication',
      operatingSystem: 'Web',
      url: 'https://www.cspark.app',
      offers: [
        {
          '@type': 'Offer',
          name: 'Free',
          price: '0',
          priceCurrency: 'USD',
        },
        {
          '@type': 'Offer',
          name: 'Pro',
          price: '19.99',
          priceCurrency: 'USD',
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a,
        },
      })),
    },
  ];

  return (
    <div className={`min-h-screen relative ${isDark ? 'dark' : ''}`}>
      <ShaderBackground isDark={isDark} />
      
      {/* Navigation */}
      <nav className={`border-b sticky top-0 z-50 ${
        isDark 
          ? 'border-white/10 bg-black/30 backdrop-blur-md' 
          : 'border-gray-200 bg-white/80 backdrop-blur-md shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3.5">
              <Image src="/cspark-logo.png" alt="CSpark logo" width={68} height={68} className="w-[68px] h-[68px] object-contain shrink-0 ml-1" />
              <span className={`text-3xl leading-none font-black text-black`}>
                cspark
              </span>
            </div>
            <div className="flex gap-4 items-center">
              <Link
                href={currentUser ? '/dashboard' : '/login'}
                className={`px-4 py-2 text-sm font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white transition-all`}
              >
                {currentUser ? displayName : 'Sign In'}
              </Link>
              {!currentUser && (
                <Link
                  href="/register"
                  className="px-6 py-2.5 text-sm font-bold uppercase tracking-wider border-2 border-black bg-black text-white hover:bg-[#FF3000] hover:border-[#FF3000] transition-all"
                >
                  Sign Up
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-left space-y-12">
            {/* Trust Badge */}
            <div className="flex items-center">
              <div className={`inline-flex items-center gap-2 px-6 py-3 border-2 border-black bg-white`}>
                <span className="text-xs font-black uppercase tracking-widest text-[#FF3000]">NEW</span>
                <span className="text-sm font-bold text-black">Trusted by 50,000+ professionals</span>
              </div>
            </div>

            <div className="max-w-4xl space-y-6">
              <h1 className={`text-9xl font-black leading-none lowercase text-black`}>
                search<br/>jobs at scale
              </h1>
              <p className="text-2xl font-bold text-black">
                Browse LinkedIn job postings. AI tailors your CV to match each position instantly. Apply with precision.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-start pt-8">
              <Link
                href="/register"
                className="group px-8 py-4 text-lg font-black uppercase tracking-wider border-2 border-black bg-black text-white hover:bg-[#FF3000] hover:border-[#FF3000] transition-all flex items-center gap-2"
              >
                Start Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#workflow"
                className={`px-8 py-4 text-lg font-black uppercase tracking-wider border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all`}
              >
                See Demo
              </Link>
            </div>

            {/* Social Proof */}
            <div className="pt-12 flex items-center gap-8">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-black text-black" />
                ))}
                <span className={`ml-3 text-sm font-bold text-black`}>
                  4.9/5 from thousands
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* LinkedIn Integration Highlight */}
        <section id="workflow" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className={`rounded-3xl p-12 backdrop-blur-md border overflow-hidden relative ${
            isDark 
              ? 'bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-pink-900/30 border-blue-500/20' 
              : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-blue-300'
          }`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}></div>
            </div>

            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border mb-6 ${
                  isDark 
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' 
                    : 'bg-blue-100 border-blue-300 text-blue-700'
                }`}>
                  <Linkedin className="w-4 h-4" />
                  <span className="text-sm font-medium">LinkedIn Integration</span>
                </div>
                
                <h2 className={`text-4xl font-bold mb-6 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Search Jobs on LinkedIn,
                  <br />
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                    Get AI-Optimized CVs
                  </span>
                </h2>
                
                <p className={`text-lg mb-6 leading-relaxed ${
                  isDark ? 'text-white/80' : 'text-gray-700'
                }`}>
                  Browse LinkedIn job postings directly in our platform. For each job, our AI automatically 
                  analyzes the requirements and tailors your CV to maximize your chances.
                </p>

                <div className="space-y-4">
                  {[
                    { icon: Sparkles, text: 'AI analyzes job requirements automatically' },
                    { icon: Target, text: 'CV optimized with relevant keywords & skills' },
                    { icon: Target, text: 'See suggested CV edits before applying them' },
                    { icon: Rocket, text: 'Apply with confidence in minutes' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isDark 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className={`font-medium ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-2xl p-8 backdrop-blur-md border ${
                isDark 
                  ? 'bg-white/5 border-white/10' 
                  : 'bg-white/80 border-gray-200 shadow-xl backdrop-blur-md'
              }`}>
                <div className="space-y-4">
                  {/* Mock Job Card */}
                  <div className={`p-4 rounded-xl border backdrop-blur-md ${
                    isDark 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white/70 border-gray-200'
                  }`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#0A66C2] to-[#004182] flex items-center justify-center text-white font-bold">
                        <Linkedin className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>Senior Software Engineer</h4>
                        <p className={`text-sm ${
                          isDark ? 'text-white/60' : 'text-gray-600'
                        }`}>Google • San Francisco, CA</p>
                      </div>
                      <Linkedin className={`w-5 h-5 ${
                        isDark ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex gap-2 mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isDark 
                          ? 'bg-blue-500/20 text-blue-300' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>React</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isDark 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>TypeScript</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isDark 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-green-100 text-green-700'
                      }`}>Node.js</span>
                    </div>
                  </div>

                  {/* AI Processing Animation */}
                  <div className="flex items-center gap-3 py-3">
                    <div className="flex-1">
                      <div className={`h-2 rounded-full overflow-hidden ${
                        isDark ? 'bg-white/10' : 'bg-gray-200'
                      }`}>
                        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                      </div>
                    </div>
                    <Sparkles className={`w-5 h-5 animate-spin ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>

                  {/* Optimized CV Result */}
                  <div className={`p-4 rounded-xl border backdrop-blur-md ${
                    isDark 
                      ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30' 
                      : 'bg-gradient-to-br from-green-50/80 to-emerald-50/80 border-green-300'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className={`w-5 h-5 ${
                        isDark ? 'text-green-400' : 'text-green-600'
                      }`} />
                      <span className={`font-semibold ${
                        isDark ? 'text-green-300' : 'text-green-700'
                      }`}>CV Optimized!</span>
                    </div>
                    <p className={`text-sm ${
                      isDark ? 'text-white/70' : 'text-gray-600'
                    }`}>
                      Added 12 relevant keywords, enhanced 3 experience descriptions, tailored skills section
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, value: '52,000+', label: 'Active Users' },
              { icon: Sparkles, value: '485,000+', label: 'CVs AI-Optimized' },
              { icon: TrendingUp, value: '91%', label: 'Job Match Rate' },
              { icon: Clock, value: '<5min', label: 'Avg. Creation Time' },
            ].map((stat, index) => (
              <div
                key={index}
                className={`text-center p-6 rounded-2xl backdrop-blur-md border transition-all hover:scale-105 ${
                  isDark 
                    ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                    : 'bg-white/80 border-gray-200 hover:shadow-xl'
                }`}
                style={{
                  animationName: 'fadeInUp',
                  animationDuration: '0.8s',
                  animationTimingFunction: 'ease-out',
                  animationFillMode: 'forwards',
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <stat.icon className={`w-8 h-8 mx-auto mb-3 ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <div className={`text-3xl font-bold mb-1 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {stat.value}
                </div>
                <div className={`text-sm ${
                  isDark ? 'text-white/60' : 'text-gray-600'
                }`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-20">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border mb-6 ${
              isDark 
                ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' 
                : 'bg-blue-100 border-blue-300 text-blue-700'
            }`}>
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">Powerful Features</span>
            </span>
            <h2 className={`text-5xl font-bold mb-6 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Everything You Need to Land Your Dream Job
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              isDark ? 'text-white/70' : 'text-gray-600'
            }`}>
              Our AI-powered platform helps you create tailored CVs for every job, optimize your application, and stand out to recruiters
            </p>
          </div>

          {/* Primary/Core Features - 6 most important */}
          <div className="mb-20">
            <h3 className={`text-2xl font-bold mb-8 text-center ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Core Features
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Linkedin,
                  title: 'LinkedIn Job Search',
                  description: 'Search and browse LinkedIn job postings directly in our platform. Find your perfect role without leaving the app.',
                  gradient: 'from-blue-600 to-blue-800',
                  badge: 'Popular'
                },
                {
                  icon: MetaLogo,
                  title: 'AI-Powered Optimization',
                  description: 'Get AI suggestions tailored to each job posting, then approve selected edits before they are applied to your CV.',
                  gradient: 'from-blue-500 to-cyan-500',
                  badge: 'AI'
                },
                {
                  icon: Target,
                  title: 'Job-Specific Tailoring',
                  description: 'CSpark highlights missing skills and suggests targeted updates so you can customize every CV version faster than ever.',
                  gradient: 'from-purple-500 to-pink-500',
                  badge: 'Featured'
                },
                {
                  icon: PlusSquare,
                  title: 'Custom Sections',
                  description: 'Add personalized sections like Awards, Volunteer Work, or Publications to showcase your unique achievements and stand out.',
                  gradient: 'from-violet-500 to-purple-600',
                  badge: 'New'
                },
                {
                  icon: Upload,
                  title: 'Import Existing CV',
                  description: 'Upload your PDF or DOCX resume to quickly get started. Create a new CV in seconds and start editing.',
                  gradient: 'from-blue-600 to-indigo-700',
                  badge: 'New'
                },
                {
                  icon: Layers,
                  title: 'Multiple CV Versions',
                  description: 'Create and manage different CV versions for various positions. Switch between them effortlessly and keep them organized.',
                  gradient: 'from-green-500 to-emerald-500',
                  badge: ''
                },
              ].map((feature, index) => (
                <GlareCard key={index} className="h-full">
                  <div className={`backdrop-blur-md rounded-2xl p-6 h-full flex flex-col shadow-lg transition-all border hover:scale-105 hover:shadow-2xl ${
                    isDark 
                      ? 'bg-zinc-950/55 border-white/20 hover:bg-zinc-950/65' 
                      : 'bg-white/90 border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      {feature.badge && (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          feature.badge === 'New' 
                            ? 'bg-green-500/20 text-green-400' 
                            : feature.badge === 'Featured'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {feature.badge}
                        </span>
                      )}
                    </div>
                    <h3 className={`text-lg font-bold mb-2 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {feature.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${
                      isDark ? 'text-white/85' : 'text-gray-600'
                    }`}>
                      {feature.description}
                    </p>
                  </div>
                </GlareCard>
              ))}
            </div>
          </div>

          {/* Additional Features - Supporting/Secondary */}
          <div>
            <h3 className={`text-2xl font-bold mb-8 text-center ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Supporting Features
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: Code,
                  title: 'Professional Templates',
                  description: 'Modern, academic, or minimalist templates. All ATS-friendly.',
                  gradient: 'from-orange-500 to-red-500'
                },
                {
                  icon: Download,
                  title: 'Export & Share',
                  description: 'Download as PDF or share with custom URLs and QR codes.',
                  gradient: 'from-indigo-500 to-purple-500'
                },
                {
                  icon: Zap,
                  title: 'Real-Time Preview',
                  description: 'See changes instantly. WYSIWYG editor with live preview.',
                  gradient: 'from-yellow-500 to-orange-500'
                },
                {
                  icon: Lightbulb,
                  title: 'Smart Suggestions',
                  description: 'AI-powered recommendations for better descriptions.',
                  gradient: 'from-pink-500 to-rose-500'
                },
                {
                  icon: Link2,
                  title: 'Shareable Links',
                  description: 'Generate links that never expire (Pro) or last 7 days (Free).',
                  gradient: 'from-sky-500 to-blue-700'
                },
                {
                  icon: QrCode,
                  title: 'QR Codes',
                  description: 'Create scannable QR codes for portfolios and business cards.',
                  gradient: 'from-fuchsia-500 to-violet-600'
                },
                {
                  icon: Database,
                  title: 'Cloud Storage',
                  description: 'Secure cloud storage. Access CVs from anywhere, anytime.',
                  gradient: 'from-cyan-500 to-blue-500'
                },
                {
                  icon: Globe,
                  title: 'Digital Portfolio',
                  description: 'Online link for emails and LinkedIn profiles.',
                  gradient: 'from-teal-500 to-green-500'
                },
              ].map((feature, index) => (
                <div 
                  key={index} 
                  className={`rounded-xl p-4 backdrop-blur-md border transition-all hover:scale-105 ${
                    isDark 
                      ? 'bg-zinc-950/40 border-white/10 hover:bg-zinc-950/60' 
                      : 'bg-white/70 border-gray-200 hover:bg-white/90'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className={`font-semibold mb-1 text-sm ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {feature.title}
                  </h4>
                  <p className={`text-xs leading-snug ${
                    isDark ? 'text-white/75' : 'text-gray-600'
                  }`}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border mb-6 ${
              isDark 
                ? 'bg-violet-500/20 border-violet-500/30 text-violet-300' 
                : 'bg-violet-100 border-violet-300 text-violet-700'
            }`}>
              <Rocket className="w-4 h-4" />
              <span className="text-sm font-semibold">Quick Start</span>
            </span>
            <h2 className={`text-4xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              From Zero to Hired in 3 Steps
            </h2>
            <p className={`text-xl max-w-2xl mx-auto ${
              isDark ? 'text-white/70' : 'text-gray-600'
            }`}>
              Create a professional CV and start applying to jobs in less than 10 minutes - guaranteed
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-4">
            {[
              {
                step: '01',
                title: 'Choose Your Template',
                description: 'Select from our professionally designed templates that suit your industry and style.',
                icon: FileText
              },
              {
                step: '02',
                title: 'Fill in Your Details',
                description: 'Add your experience, education, and skills. Our AI helps you write compelling descriptions.',
                icon: MetaLogo
              },
              {
                step: '03',
                title: 'Download & Share',
                description: 'Export as PDF or share online with a custom link and QR code. Update anytime for free.',
                icon: Rocket
              },
            ].map((step, index) => (
              <div
                key={index}
                className="relative"
              >
                <div className={`rounded-2xl p-8 backdrop-blur-md border transition-all hover:scale-105 h-full ${
                  isDark 
                    ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                    : 'bg-white/80 border-gray-200 hover:shadow-2xl'
                }`}>
                  <div className={`text-7xl font-black mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${
                    isDark ? 'drop-shadow-lg' : ''
                  }`}>
                    {step.step}
                  </div>
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg`}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className={`text-2xl font-bold mb-3 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {step.title}
                  </h3>
                  <p className={isDark ? 'text-white/70' : 'text-gray-600'}>
                    {step.description}
                  </p>
                </div>
                {index < 2 && (
                  <div className={`hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-12 h-12 rounded-full border-2 ${
                    isDark 
                      ? 'bg-zinc-900 border-white/20 text-white/40' 
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Security & Privacy Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className={`rounded-3xl p-12 backdrop-blur-md border ${
            isDark 
              ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/20' 
              : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'
          }`}>
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-6 shadow-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className={`text-4xl font-bold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Your Data, Your Control
              </h2>
              <p className={`text-xl max-w-2xl mx-auto ${
                isDark ? 'text-white/70' : 'text-gray-600'
              }`}>
                Enterprise-grade security and privacy protection for your personal information
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Lock,
                  title: 'End-to-End Encryption',
                  description: 'All your data is encrypted using industry-standard AES-256 encryption both in transit and at rest.',
                },
                {
                  icon: Shield,
                  title: 'GDPR Compliant',
                  description: 'Fully compliant with GDPR, CCPA, and other data protection regulations worldwide.',
                },
                {
                  icon: Eye,
                  title: 'Privacy First',
                  description: 'We never sell your data. You control who can view your CV and can delete your data anytime.',
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl backdrop-blur-md border ${
                    isDark 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white/80 border-gray-200'
                  }`}
                >
                  <item.icon className={`w-10 h-10 mb-4 ${
                    isDark ? 'text-green-400' : 'text-green-600'
                  }`} />
                  <h3 className={`text-lg font-bold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {item.title}
                  </h3>
                  <p className={`text-sm ${
                    isDark ? 'text-white/70' : 'text-gray-600'
                  }`}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className={`mt-8 p-6 rounded-xl border ${
              isDark 
                ? 'bg-white/5 border-white/10' 
                : 'bg-white/80 border-gray-200 backdrop-blur-md'
            }`}>
              <h4 className={`font-semibold mb-3 flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <CheckCircle className="w-5 h-5 text-green-500" />
                Our Security Commitments
              </h4>
              <ul className={`grid md:grid-cols-2 gap-2 text-sm ${
                isDark ? 'text-white/70' : 'text-gray-600'
              }`}>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Regular security audits by third-party experts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  SOC 2 Type II certified infrastructure
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  24/7 threat monitoring and response
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Data backup and disaster recovery
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((faq, index) => (
              <div
                key={index}
                className={`rounded-xl backdrop-blur-md border overflow-hidden ${
                  isDark 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-white/80 border-gray-200'
                }`}
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className={`w-full p-6 text-left flex items-center justify-between transition-colors ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`font-semibold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${
                      expandedFaq === index ? 'rotate-180' : ''
                    } ${isDark ? 'text-white/60' : 'text-gray-600'}`}
                  />
                </button>
                {expandedFaq === index && (
                  <div className={`px-6 pb-6 ${
                    isDark ? 'text-white/70' : 'text-gray-600'
                  }`}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Differentiation */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border mb-6 ${
              isDark
                ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                : 'bg-blue-100 border-blue-300 text-blue-700'
            }`}>
              <Target className="w-4 h-4" />
              <span className="text-sm font-semibold">Positioning</span>
            </span>
            <h2 className={`text-4xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              LinkedIn-first job search + CV tailoring in one place
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              isDark ? 'text-white/70' : 'text-gray-600'
            }`}>
              CSpark replaces the usual tool stack: LinkedIn, docs, and ChatGPT. Search jobs, tailor a CV
              for each role, track applications, and share the result from one dashboard.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {[
              {
                title: 'ResumeWorded',
                copy: 'Great for static CV scoring, but no embedded job search or job-specific workflow.',
              },
              {
                title: 'Kickresume',
                copy: 'Template-first builder with limited job targeting and no LinkedIn pipeline.',
              },
              {
                title: 'ChatGPT',
                copy: 'Powerful writing, but manual copy-paste and no ATS templates or tracking.',
              },
            ].map((item) => (
              <div key={item.title} className={`rounded-2xl border p-6 ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {item.title}
                </h3>
                <p className={`mt-3 text-sm ${
                  isDark ? 'text-white/70' : 'text-gray-600'
                }`}>
                  {item.copy}
                </p>
              </div>
            ))}
          </div>

          <div className={`mt-10 rounded-2xl border p-6 ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
          }`}>
            <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Differentiation Matrix
            </div>
            <div className={`mt-4 grid gap-3 text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              {[
                { label: 'LinkedIn job search inside the product', cspark: 'Yes', other: 'No' },
                { label: 'Job-specific CV tailoring workflow', cspark: 'Yes', other: 'Partial' },
                { label: 'ATS-ready templates + PDF export', cspark: 'Yes', other: 'Varies' },
                { label: 'Shareable CV links + QR', cspark: 'Yes', other: 'Rare' },
                { label: 'Application tracking + notes', cspark: 'Yes', other: 'No' },
              ].map((row) => (
                <div key={row.label} className={`grid grid-cols-[1.6fr_0.7fr_0.7fr] gap-2 rounded-lg p-2 ${
                  isDark ? 'bg-white/5' : 'bg-gray-50'
                }`}>
                  <span className={isDark ? 'text-white/90' : 'text-gray-900'}>{row.label}</span>
                  <span className="text-center font-semibold text-blue-500">{row.cspark}</span>
                  <span className="text-center">{row.other}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product Roadmap */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border mb-6 ${
              isDark
                ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                : 'bg-purple-100 border-purple-300 text-purple-700'
            }`}>
              <Rocket className="w-4 h-4" />
              <span className="text-sm font-semibold">Roadmap Expansion</span>
            </span>
            <h2 className={`text-4xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Build a complete job application system
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              isDark ? 'text-white/70' : 'text-gray-600'
            }`}>
              Product expansion focuses on measurable outcomes: response rate, interviews, and faster hiring cycles.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {[
              {
                icon: Database,
                title: 'Application Tracker',
                copy: 'Track Applied, Screening, Interview, Offer, Rejected. Add interview notes and reminders.',
              },
              {
                icon: Layers,
                title: 'CV Change History + A/B',
                copy: 'Job-specific versions, compare changes, and learn which edits improve response rates.',
              },
              {
                icon: Cpu,
                title: 'Reusable CV Snippets',
                copy: 'Save bullet blocks by category and insert them into future tailored CVs in one click.',
              },
              {
                icon: Linkedin,
                title: 'Chrome Extension (MVP)',
                copy: 'Autofill Easy Apply, pull job details, and sync application status back to CSpark.',
              },
              {
                icon: TrendingUp,
                title: 'Analytics Layer',
                copy: 'Response rate by template, job category, and funnel: Views -> Applications -> Interviews.',
              },
              {
                icon: Shield,
                title: 'Privacy Controls',
                copy: 'Public/private links, expiring QR access, view tracking, and instant revocation.',
              },
            ].map((item) => (
              <div key={item.title} className={`rounded-2xl border p-6 ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
              }`}>
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                  isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'
                }`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {item.title}
                </h3>
                <p className={`mt-3 text-sm ${
                  isDark ? 'text-white/70' : 'text-gray-600'
                }`}>
                  {item.copy}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy + Platform Scope */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className={`rounded-2xl border p-8 ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <Lock className={`w-5 h-5 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Privacy controls built for sharing
                </h3>
              </div>
              <ul className={`space-y-3 text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {[
                  'Public, private, or password-protected CV links',
                  'Expiring links and QR access windows',
                  'View tracking and analytics toggles',
                  'Instant access revocation',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`rounded-2xl border p-8 ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <Globe className={`w-5 h-5 ${isDark ? 'text-purple-300' : 'text-purple-600'}`} />
                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  LinkedIn-first focus, with expansion built in
                </h3>
              </div>
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                CSpark stays LinkedIn-first to deliver the best job-matching workflow today. The roadmap expands
                to other platforms without diluting the core promise: find a job and tailor the CV inside one flow.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border mb-6 ${
              isDark 
                ? 'bg-green-500/20 border-green-500/30 text-green-300' 
                : 'bg-green-100 border-green-300 text-green-700'
            }`}>
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">Transparent Pricing</span>
            </span>
            <h2 className={`text-4xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Simple, Honest Pricing
            </h2>
            <p className={`text-xl max-w-2xl mx-auto ${
              isDark ? 'text-white/70' : 'text-gray-600'
            }`}>
              Start free, upgrade only when you need more. No hidden fees, cancel anytime.
            </p>
          </div>
          <PricingWithChart isDark={isDark} />
        </section>

        {/* Final CTA */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className={`rounded-3xl p-12 md:p-20 text-center backdrop-blur-md border bg-gradient-to-br overflow-hidden relative ${
            isDark 
              ? 'from-blue-900/40 via-purple-900/40 to-blue-900/40 border-blue-500/30' 
              : 'from-blue-50 via-purple-50 to-blue-50 border-blue-300'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5 pointer-events-none" />
            
            <div className="relative z-10 space-y-8">
              <div>
                <h2 className={`text-5xl md:text-6xl font-bold mb-6 leading-tight ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Start Your Journey to<br/>
                  <span className={`${
                    isDark
                      ? 'text-blue-300'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'
                  }`}>
                    Your Dream Job
                  </span>
                </h2>
              </div>
              
              <p className={`text-xl mb-10 max-w-2xl mx-auto leading-relaxed ${
                isDark ? 'text-white/80' : 'text-gray-700'
              }`}>
                Create a professional CV in minutes, get AI-optimized suggestions for every job application, and land more interviews.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 whitespace-nowrap"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="#features"
                  className={`inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold rounded-xl border transition-all hover:scale-105 whitespace-nowrap ${
                    isDark
                      ? 'border-blue-400/50 text-blue-300 hover:bg-blue-500/10'
                      : 'border-blue-300 text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  Explore Features
                  <ChevronDown className="w-5 h-5 -rotate-90" />
                </Link>
              </div>
              
              <p className={`text-sm mt-8 ${
                isDark ? 'text-white/60' : 'text-gray-600'
              }`}>
                ✓ No credit card required  •  ✓ Takes less than 2 minutes  •  ✓ Start creating immediately
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`border-t ${
        isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image src="/cspark-logo.png" alt="CSpark logo" width={56} height={56} className="w-14 h-14 object-contain" />
                <span className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  CSpark
                </span>
              </div>
              <p className={`text-sm ${
                isDark ? 'text-white/60' : 'text-gray-600'
              }`}>
                Create professional CVs powered by AI in minutes.
              </p>
            </div>

            <div>
              <h3 className={`font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Product
              </h3>
              <ul className="space-y-2">
                {['Features', 'Templates', 'Pricing', 'FAQ'].map((item) => (
                  <li key={item}>
                    <Link
                      href="#"
                      className={`text-sm transition-colors ${
                        isDark 
                          ? 'text-white/60 hover:text-white' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className={`font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Company
              </h3>
              <ul className="space-y-2">
                {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <li key={item}>
                    <Link
                      href="#"
                      className={`text-sm transition-colors ${
                        isDark 
                          ? 'text-white/60 hover:text-white' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className={`font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Legal
              </h3>
              <ul className="space-y-2">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'].map((item) => (
                  <li key={item}>
                    <Link
                      href="#"
                      className={`text-sm transition-colors ${
                        isDark 
                          ? 'text-white/60 hover:text-white' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={`pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 ${
            isDark ? 'border-white/10' : 'border-gray-200'
          }`}>
            <p className={`text-sm ${
              isDark ? 'text-white/60' : 'text-gray-600'
            }`}>
              © 2026 CSpark. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${
                isDark ? 'text-white/80' : 'text-gray-700'
              }`}>
                Powered by
              </span>
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                isDark 
                  ? 'bg-blue-500/20 text-blue-100 border border-blue-400/40 shadow-md shadow-blue-500/20' 
                  : 'bg-blue-100 text-blue-800 border border-blue-300'
              }`}>
                <MetaLogo className="h-3.5 w-3.5" />
                Meta LLAMA 3.3 70B
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
