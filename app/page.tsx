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
              <span className={`text-3xl leading-none font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent`}>
                CSpark
              </span>
            </div>
            <div className="flex gap-4 items-center">
              <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
              <Link
                href={currentUser ? '/dashboard' : '/login'}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  isDark 
                    ? 'text-white/80 hover:text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {currentUser ? displayName : 'Sign In'}
              </Link>
              {!currentUser && (
                <Link
                  href="/register"
                  className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  Sign Up
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Trust Badge */}
            <div className="flex justify-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border ${
                isDark 
                  ? 'bg-green-500/20 border-green-500/30 text-green-300' 
                  : 'bg-green-100 border-green-300 text-green-700'
              }`}>
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Trusted by 50,000+ professionals</span>
              </div>
            </div>

            <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Create Your Perfect CV
              <br />
              <span className={`${
                isDark
                  ? 'text-violet-100 drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)]'
                  : 'bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent'
              }`}>
                10x{' '}
                <AnimatedTextCycle
                  words={[
                    'Smarter',
                    'Sharper',
                    'Quicker',
                    'Better',
                    'Stronger',
                  ]}
                  interval={2600}
                  className={`${
                    isDark
                      ? 'text-fuchsia-200 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]'
                      : 'bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent'
                  }`}
                />{' '}
                with AI
              </span>
            </h1>

            <p className={`max-w-3xl mx-auto text-xl leading-relaxed ${
              isDark ? 'text-white/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]' : 'text-gray-700'
            }`}>
              Transform your job search with CSpark. Get job-specific CV suggestions for every listing,
              review each change, and approve only what you want to apply.
            </p>

            {/* AI Badge */}
            <div className="flex justify-center">
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-md border transition-all hover:scale-105 ${
                isDark 
                  ? 'bg-gradient-to-r from-blue-500/30 via-violet-500/30 to-purple-500/30 border-blue-400/50 shadow-lg shadow-blue-500/30' 
                  : 'bg-gradient-to-r from-blue-100 to-violet-100 border-blue-400/60 shadow-lg'
              }`}>
                <MetaLogo className="h-5 w-5" />
                <span className={`text-sm font-bold tracking-wide ${
                  isDark ? 'text-blue-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]' : 'text-blue-700'
                }`}>
                  Powered by Meta LLAMA 3.3 70B
                </span>
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  isDark ? 'bg-blue-400' : 'bg-blue-500'
                }`}></div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link
                href="/register"
                className="group px-8 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105 flex items-center gap-2"
              >
                Start Building for Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#features"
                className={`px-8 py-4 text-lg font-semibold border-2 rounded-xl backdrop-blur-sm transition-all hover:scale-105 ${
                  isDark 
                    ? 'border-white/30 bg-white/10 text-white hover:bg-white/20' 
                    : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                }`}
              >
                Explore Features
              </Link>
            </div>

            {/* Social Proof */}
            <div className="pt-8 flex flex-wrap justify-center items-center gap-8">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
                <span className={`ml-2 text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  4.9/5 from 12,000+ reviews
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* LinkedIn Integration Highlight */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
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
                    { icon: Search, text: 'Search thousands of LinkedIn job postings' },
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
              { icon: Users, value: '50,000+', label: 'Active Users' },
              { icon: FileText, value: '200,000+', label: 'CVs Created' },
              { icon: TrendingUp, value: '85%', label: 'Success Rate' },
              { icon: Clock, value: '<10min', label: 'Avg. Creation Time' },
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
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Everything You Need to Land Your Dream Job
            </h2>
            <p className={`text-xl max-w-2xl mx-auto ${
              isDark ? 'text-white/70' : 'text-gray-600'
            }`}>
              Powerful features designed to make CV creation effortless and effective
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Linkedin,
                title: 'LinkedIn Job Search',
                description: 'Search and browse LinkedIn job postings directly in our platform. Find your perfect role without leaving the app.',
                gradient: 'from-blue-600 to-blue-800'
              },
              {
                icon: MetaLogo,
                title: 'AI-Powered Optimization',
                description: 'Get AI suggestions tailored to each job posting, then approve selected edits before they are applied to your CV.',
                gradient: 'from-blue-500 to-cyan-500'
              },
              {
                icon: Target,
                title: 'Job-Specific Tailoring',
                description: 'For each LinkedIn job, CSpark highlights missing skills and suggests targeted updates so you can customize every CV version faster.',
                gradient: 'from-purple-500 to-pink-500'
              },
              {
                icon: Layers,
                title: 'Multiple CV Versions',
                description: 'Create and manage different CV versions for various positions. Switch between them effortlessly.',
                gradient: 'from-green-500 to-emerald-500'
              },
              {
                icon: Code,
                title: 'Professional Templates',
                description: 'Choose from modern, academic, or minimalist templates. All professionally designed and ATS-friendly.',
                gradient: 'from-orange-500 to-red-500'
              },
              {
                icon: Download,
                title: 'Export & Share',
                description: 'Download as PDF or share with custom URLs and QR codes. Perfect for digital portfolios and applications.',
                gradient: 'from-indigo-500 to-purple-500'
              },
              {
                icon: Link2,
                title: 'Share with Link',
                description: 'Generate shareable CV links instantly. Free users get 7-day links, Pro users get permanent links that never expire.',
                gradient: 'from-sky-500 to-blue-700'
              },
              {
                icon: QrCode,
                title: 'Share with QR Code',
                description: 'Create a scannable QR code for your CV to use on portfolios, business cards, and event badges.',
                gradient: 'from-fuchsia-500 to-violet-600'
              },
              {
                icon: Zap,
                title: 'Real-Time Preview',
                description: 'See your changes instantly with our live preview. What you see is exactly what you get in the final PDF.',
                gradient: 'from-yellow-500 to-orange-500'
              },
              {
                icon: Globe,
                title: 'Digital Portfolio',
                description: 'Get a shareable online link for your CV. Perfect for email signatures and LinkedIn profiles.',
                gradient: 'from-teal-500 to-green-500'
              },
              {
                icon: Lightbulb,
                title: 'Smart Suggestions',
                description: 'Get AI-powered recommendations for improving your experience descriptions and skill sections.',
                gradient: 'from-pink-500 to-rose-500'
              },
              {
                icon: Database,
                title: 'Cloud Storage',
                description: 'Your CVs are securely stored in the cloud. Access them from anywhere, on any device.',
                gradient: 'from-cyan-500 to-blue-500'
              },
              {
                icon: PlusSquare,
                title: 'Custom Sections',
                description: 'Add personalized sections like Awards, Volunteer Work, or Publications to showcase your unique achievements and stand out.',
                gradient: 'from-violet-500 to-purple-600'
              },
              {
                icon: Upload,
                title: 'Import Existing CV',
                description: 'Upload your PDF or DOCX resume and let AI automatically extract and optimize the content. Start editing instantly.',
                gradient: 'from-blue-600 to-indigo-700'
              },
            ].map((feature, index) => (
              <GlareCard key={index} className="h-full">
                <div className={`backdrop-blur-md rounded-2xl p-6 h-full flex flex-col shadow-lg transition-all border hover:scale-105 ${
                  isDark 
                    ? 'bg-zinc-950/55 border-white/20 hover:bg-zinc-950/65 shadow-2xl' 
                    : 'bg-white/90 border-gray-200 hover:shadow-2xl'
                }`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className={`text-xl font-semibold mb-2 ${
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
        </section>

        {/* How It Works */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Create Your CV in 3 Simple Steps
            </h2>
            <p className={`text-xl max-w-2xl mx-auto ${
              isDark ? 'text-white/70' : 'text-gray-600'
            }`}>
              Get from zero to professional CV in less than 10 minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
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
                <div className={`rounded-2xl p-8 backdrop-blur-md border transition-all hover:scale-105 ${
                  isDark 
                    ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                    : 'bg-white/80 border-gray-200 hover:shadow-2xl'
                }`}>
                  <div className={`text-6xl font-bold mb-6 ${
                    isDark ? 'text-white/10' : 'text-gray-100'
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
                  <ArrowRight className={`hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 ${
                    isDark ? 'text-white/20' : 'text-gray-300'
                  }`} />
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

        {/* Testimonials */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Loved by Job Seekers Worldwide
            </h2>
            <p className={`text-xl max-w-2xl mx-auto ${
              isDark ? 'text-white/70' : 'text-gray-600'
            }`}>
              Join thousands of professionals who landed their dream jobs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Sarah Johnson',
                role: 'Senior Software Engineer',
                company: 'Google',
                content: 'This tool helped me land my dream job at Google! The AI suggestions made my experience stand out.',
                avatar: '👩‍💻',
              },
              {
                name: 'Michael Chen',
                role: 'Product Manager',
                company: 'Meta',
                content: 'I created 5 different CV versions for different roles. The customization options are incredible!',
                avatar: '👨‍💼',
              },
              {
                name: 'Emily Rodriguez',
                role: 'Data Scientist',
                company: 'Amazon',
                content: 'The templates are so professional. I got 3x more interview calls after using this platform.',
                avatar: '👩‍🔬',
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl backdrop-blur-3xl backdrop-saturate-200 border transition-all hover:scale-105 ${
                  isDark 
                    ? 'bg-white/[0.08] border-white/20 hover:bg-white/[0.12]' 
                    : 'bg-white/30 border-gray-200/50 hover:shadow-xl'
                }`}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className={`mb-6 italic ${
                  isDark ? 'text-white/80' : 'text-gray-700'
                }`}>
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{testimonial.avatar}</div>
                  <div>
                    <div className={`font-semibold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {testimonial.name}
                    </div>
                    <div className={`text-sm ${
                      isDark ? 'text-white/60' : 'text-gray-600'
                    }`}>
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
            {[
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
            ].map((faq, index) => (
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

        {/* Pricing */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <PricingWithChart isDark={isDark} />
        </section>

        {/* Final CTA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className={`rounded-3xl p-12 md:p-16 text-center backdrop-blur-md border bg-gradient-to-br ${
            isDark 
              ? 'from-blue-900/30 to-purple-900/30 border-blue-500/20' 
              : 'from-blue-100 to-purple-100 border-blue-300'
          }`}>
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Ready to Build Your Perfect CV?
            </h2>
            <p className={`text-xl mb-8 max-w-2xl mx-auto ${
              isDark ? 'text-white/80' : 'text-gray-700'
            }`}>
              Join 50,000+ professionals who are landing better jobs with CSpark
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-10 py-5 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105"
            >
              Get Started Free — No Credit Card Required
              <ArrowRight className="w-5 h-5" />
            </Link>
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
