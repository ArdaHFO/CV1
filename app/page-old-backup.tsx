'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Sparkles, Globe, Zap } from 'lucide-react';
import ShaderBackground from '@/components/ui/shader-background';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { PricingWithChart } from '@/components/ui/pricing-with-chart';
import { GlareCard } from '@/components/ui/glare-card';

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  return (
    <div className={`min-h-screen relative ${isDark ? 'dark' : ''}`}>
      {/* Animated Shader Background - Works in both modes */}
      <ShaderBackground isDark={isDark} />
      
      {/* Navigation */}
      <nav className={`border-b sticky top-0 z-50 ${
        isDark 
          ? 'border-white/10 bg-black/30 backdrop-blur-md' 
          : 'border-gray-200 bg-white/80 backdrop-blur-md shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <FileText className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-900'}`} />
              <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                CV Builder
              </span>
            </div>
            <div className="flex gap-4 items-center">
              <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
              <Link
                href="/login"
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  isDark 
                    ? 'text-white/80 hover:text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className={`px-4 py-2 text-sm font-medium rounded-lg backdrop-blur-sm transition-all ${
                  isDark 
                    ? 'bg-white/20 text-white border border-white/20 hover:bg-white/30' 
                    : 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700'
                }`}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            AI-Powered{' '}
            <span className="bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
              CV Builder
            </span>
          </h1>
          <p className={`max-w-2xl mx-auto text-xl ${
            isDark ? 'text-white/80' : 'text-gray-600'
          }`}>
            Create optimized CVs tailored to specific job postings. Enhance content with AI,
            manage multiple versions, and use academic or modern templates.
          </p>

          {/* AI Powered Badge */}
          <div className="flex justify-center">
            <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full backdrop-blur-md border transition-all hover:scale-105 ${
              isDark 
                ? 'bg-gradient-to-r from-blue-500/20 via-violet-500/20 to-purple-500/20 border-blue-500/30 shadow-lg shadow-blue-500/20' 
                : 'bg-gradient-to-r from-blue-100 via-violet-100 to-purple-100 border-blue-300/50 shadow-lg shadow-blue-300/20'
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                isDark ? 'bg-blue-400' : 'bg-blue-500'
              }`}></div>
              <span className={`text-sm font-semibold bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500 bg-clip-text text-transparent ${
                isDark ? '' : 'opacity-90'
              }`}>
                Powered by Meta LLAMA 3.3 70b
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className={`px-8 py-4 text-lg font-medium rounded-lg transition-all shadow-lg hover:shadow-2xl hover:scale-105 ${
                isDark 
                  ? 'bg-white text-black hover:bg-white/90' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Start Free
            </Link>
            <Link
              href="/dashboard"
              className={`px-8 py-4 text-lg font-medium border-2 rounded-lg backdrop-blur-sm transition-all ${
                isDark 
                  ? 'border-white/30 bg-white/10 text-white hover:bg-white/20' 
                  : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
              }`}
            >
              Go to Dashboard
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-32 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Sparkles className="w-8 h-8" />}
            title="AI Optimization"
            description="Automatically optimize your CV for job postings and add relevant keywords"
            isDark={isDark}
          />
          <FeatureCard
            icon={<FileText className="w-8 h-8" />}
            title="Multiple Versions"
            description="Create and manage separate CV versions for different positions"
            isDark={isDark}
          />
          <FeatureCard
            icon={<Globe className="w-8 h-8" />}
            title="Digital Sharing"
            description="Share your CV easily with QR codes and custom URLs"
            isDark={isDark}
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="LaTeX Support"
            description="Professional LaTeX templates for academic CVs"
            isDark={isDark}
          />
        </div>

        {/* Templates Preview */}
        <div className="mt-32">
          <h2 className={`text-3xl font-bold text-center mb-12 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Professional Templates
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <TemplateCardThumbnail
              template="Modern"
              description="Clean and contemporary design"
              onClick={() => setExpandedTemplate('Modern')}
              isDark={isDark}
            />
            <TemplateCardThumbnail
              template="Academic"
              description="Formal and structured layout"
              onClick={() => setExpandedTemplate('Academic')}
              isDark={isDark}
            />
            <TemplateCardThumbnail
              template="Minimalist"
              description="Elegant and simple design"
              onClick={() => setExpandedTemplate('Minimalist')}
              isDark={isDark}
            />
          </div>
        </div>

        {/* Modals rendered outside grid */}
        {expandedTemplate === 'Modern' && (
          <TemplateModal
            isOpen={true}
            onClose={() => setExpandedTemplate(null)}
            isDark={isDark}
            preview={modernPreview}
          />
        )}
        {expandedTemplate === 'Academic' && (
          <TemplateModal
            isOpen={true}
            onClose={() => setExpandedTemplate(null)}
            isDark={isDark}
            preview={academicPreview}
          />
        )}
        {expandedTemplate === 'Minimalist' && (
          <TemplateModal
            isOpen={true}
            onClose={() => setExpandedTemplate(null)}
            isDark={isDark}
            preview={minimalistPreview}
          />
        )}

        {/* Pricing Section */}
        <div className="mt-32">
          <PricingWithChart isDark={isDark} />
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t mt-32 ${
        isDark ? 'border-white/10' : 'border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center justify-center gap-2">
              <span className={`text-sm font-medium ${
                isDark ? 'text-white/70' : 'text-gray-500'
              }`}>
                AI Technology:
              </span>
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                isDark 
                  ? 'bg-white/10 text-white/80 border border-white/20' 
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}>
                <Sparkles className="w-3 h-3" />
                Meta LLAMA 3.3 70b
              </div>
            </div>
            <p className={`text-center ${
              isDark ? 'text-white/60' : 'text-gray-600'
            }`}>
              © 2026 CV Builder. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function TemplateCardThumbnail({ 
  template, 
  description, 
  onClick,
  isDark,
}: {
  template: string;
  description: string;
  onClick: () => void;
  isDark: boolean;
}) {
  return (
    <GlareCard className="h-full">
      <button
        onClick={onClick}
        className={`backdrop-blur-md rounded-lg p-6 h-full w-full flex flex-col cursor-pointer transition-all duration-300 transform shadow-lg border text-left ${
          isDark 
            ? 'bg-white/10 border-white/20 hover:border-white/40 hover:bg-white/20' 
            : 'bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50'
        } hover:scale-105`}
      >
        <div className="flex-1 flex flex-col">
          {/* CV Thumbnail */}
          <div className={`aspect-[1/1.4] rounded mb-4 p-3 overflow-hidden bg-white border border-gray-200 mb-4`}>
            <div className="text-[0.4rem] text-gray-900 space-y-1 leading-tight">
              <div className="font-bold">SAMPLE CV</div>
              <div className="text-gray-600 text-[0.35rem]">City • email@company.com</div>
              <div className="border-t border-gray-300 pt-1 mt-1">
                <div className="font-bold">SECTION</div>
                <div className="text-gray-600 text-[0.35rem]">Job Title</div>
              </div>
            </div>
          </div>
          <h3 className={`font-semibold text-lg mb-1 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {template}
          </h3>
          <p className={`text-sm ${
            isDark ? 'text-white/60' : 'text-gray-600'
          }`}>
            {description}
          </p>
        </div>
        <div className={`mt-4 px-4 py-2 rounded font-medium transition-all text-sm text-center ${
          isDark 
            ? 'bg-white/20 hover:bg-white/30 text-white' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}>
          Preview
        </div>
      </button>
    </GlareCard>
  );
}

function TemplateModal({
  isOpen,
  onClose,
  isDark,
  preview,
}: {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  preview: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-lg shadow-2xl bg-gray-50 overflow-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full flex items-center justify-center bg-gray-800 hover:bg-gray-900 text-white font-bold text-2xl leading-none"
        >
          ✕
        </button>
        <div className="p-8">
          {preview}
        </div>
      </div>
    </div>
  );
}

const modernPreview = (
  <div className="bg-white text-gray-900 space-y-6 font-serif">
    <div className="border-b-4 border-blue-600 pb-4">
      <h1 className="text-3xl font-bold">ALEX JOHNSON</h1>
      <p className="text-sm text-gray-600">New York, NY • alex.johnson@email.com • (555) 123-4567 • linkedin.com/in/alex</p>
    </div>

    <div>
      <h2 className="text-lg font-bold uppercase tracking-wide mb-2">Professional Summary</h2>
      <p className="text-sm leading-relaxed text-gray-700">Full-stack developer with 6+ years experience designing and implementing scalable web applications. Proven track record of delivering high-quality solutions on time and under budget.</p>
    </div>

    <div>
      <h2 className="text-lg font-bold uppercase tracking-wide mb-3">Experience</h2>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between">
            <span className="font-bold">Senior Developer</span>
            <span className="text-sm text-gray-600">2021 - Present</span>
          </div>
          <p className="text-sm text-gray-600 font-semibold">TechCorp Inc., New York, NY</p>
          <ul className="text-sm text-gray-700 mt-2 space-y-1 list-disc list-inside">
            <li>Led team of 5 engineers building microservices architecture</li>
            <li>Improved application performance by 40% through optimization</li>
            <li>Mentored 3 junior developers in React and Node.js best practices</li>
          </ul>
        </div>
        <div>
          <div className="flex justify-between">
            <span className="font-bold">Software Developer</span>
            <span className="text-sm text-gray-600">2018 - 2021</span>
          </div>
          <p className="text-sm text-gray-600 font-semibold">StartupX, San Francisco, CA</p>
        </div>
      </div>
    </div>

    <div>
      <h2 className="text-lg font-bold uppercase tracking-wide mb-2">Education</h2>
      <div className="flex justify-between">
        <div>
          <p className="font-bold">B.S. Computer Science</p>
          <p className="text-sm text-gray-600">University of California, Berkeley</p>
        </div>
        <span className="text-sm text-gray-600">2018</span>
      </div>
    </div>

    <div>
      <h2 className="text-lg font-bold uppercase tracking-wide mb-2">Technical Skills</h2>
      <p className="text-sm text-gray-700"><span className="font-semibold">Languages:</span> JavaScript, TypeScript, Python, SQL</p>
      <p className="text-sm text-gray-700"><span className="font-semibold">Frameworks:</span> React, Node.js, Next.js, Express</p>
      <p className="text-sm text-gray-700"><span className="font-semibold">Tools:</span> Docker, AWS, Git, PostgreSQL</p>
    </div>
  </div>
);

const academicPreview = (
  <div className="bg-white text-gray-900 space-y-4 font-sans">
    <div className="text-center border-b border-gray-300 pb-4">
      <h1 className="text-2xl font-bold">DR. MARIE CHEN</h1>
      <p className="text-xs text-gray-600 mt-1">marie.chen@university.edu • +1 (555) 987-6543 • Cambridge, MA</p>
    </div>

    <div>
      <h3 className="text-sm font-bold uppercase">EDUCATION</h3>
      <div className="space-y-2 mt-2 text-sm">
        <div>
          <p className="font-semibold">Ph.D. in Computer Science</p>
          <p className="text-gray-600">Stanford University, Stanford, CA — 2018</p>
          <p className="text-gray-600 text-xs">Dissertation: Advanced Machine Learning Architectures for NLP</p>
        </div>
        <div>
          <p className="font-semibold">M.Sc. in Mathematics</p>
          <p className="text-gray-600">MIT, Cambridge, MA — 2015</p>
        </div>
        <div>
          <p className="font-semibold">B.S. in Mathematics and Computer Science</p>
          <p className="text-gray-600">University of Toronto, Toronto, Canada — 2013</p>
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-sm font-bold uppercase">ACADEMIC POSITION</h3>
      <div className="space-y-2 mt-2 text-sm">
        <div>
          <p className="font-semibold">Associate Professor, Department of Computer Science</p>
          <p className="text-gray-600">Harvard University, Cambridge, MA — 2020-Present</p>
          <p className="text-gray-600 text-xs mt-1">Teaching: Advanced Algorithms, Machine Learning, Data Structures</p>
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-sm font-bold uppercase">RESEARCH & PUBLICATIONS</h3>
      <ul className="space-y-1 mt-2 text-sm text-gray-700 list-disc list-inside">
        <li>Chen, M. et al. "Deep Learning for NLP." Nature ML (2023)</li>
        <li>Chen, M., Smith, J. "Efficient Algorithms." ACM Computing (2022)</li>
        <li>Chen, M. "Neural Network Optimization." IEEE (2021)</li>
      </ul>
    </div>

    <div>
      <h3 className="text-sm font-bold uppercase">GRANTS</h3>
      <p className="text-sm text-gray-700 mt-2">NSF CAREER Award, $500,000 (2021-2026)</p>
    </div>
  </div>
);

const minimalistPreview = (
  <div className="bg-white text-gray-900 space-y-5 font-sans">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">JAMES WILSON</h1>
      <p className="text-xs text-gray-500 mt-0.5">San Francisco, CA • james.wilson@email.com • +1 (555) 246-8135</p>
      <p className="text-xs text-gray-500">linkedin.com/in/james-wilson</p>
    </div>

    <div className="border-l-2 border-gray-400 pl-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600">Summary</h3>
      <p className="text-sm text-gray-700 mt-1">Product-focused engineer with 8 years building scalable solutions. Expertise in full-stack development and cloud infrastructure. Passionate about clean code and user-centric design.</p>
    </div>

    <div className="border-l-2 border-gray-400 pl-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-3">Experience</h3>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-bold">Principal Engineer</span>
            <span className="text-xs text-gray-500">2021 – Present</span>
          </div>
          <p className="text-xs text-gray-600 font-semibold">StartupX • San Francisco, CA</p>
          <p className="text-xs text-gray-700 mt-1">Architected platform infrastructure serving 1M+ users. Led cross-functional team of 8.</p>
        </div>
        <div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-bold">Senior Software Engineer</span>
            <span className="text-xs text-gray-500">2018 – 2021</span>
          </div>
          <p className="text-xs text-gray-600 font-semibold">TechCorp • Seattle, WA</p>
        </div>
      </div>
    </div>

    <div className="border-l-2 border-gray-400 pl-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600">Skills</h3>
      <p className="text-sm text-gray-700 mt-1">JavaScript • TypeScript • React • Node.js • Python • PostgreSQL • AWS • Docker • Kubernetes</p>
    </div>

    <div className="border-l-2 border-gray-400 pl-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600">Education</h3>
      <div className="text-sm text-gray-700 mt-1">
        <p className="font-semibold">B.S. Computer Science</p>
        <p className="text-xs text-gray-600">University of Washington, Seattle, WA • 2016</p>
      </div>
    </div>
  </div>
);

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}



function FeatureCard({ icon, title, description, isDark }: FeatureCardProps & { isDark: boolean }) {
  return (
    <GlareCard className="h-full">
      <div className={`backdrop-blur-md rounded-xl p-6 h-full flex flex-col shadow-lg transition-all border ${
        isDark 
          ? 'bg-white/10 border-white/20' 
          : 'bg-white border-gray-200'
      }`}>
        <div className={`mb-4 transition-transform ${
          isDark ? 'text-white' : 'text-blue-600'
        }`}>{icon}</div>
        <h3 className={`text-xl font-semibold mb-2 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          {title}
        </h3>
        <p className={isDark ? 'text-white/70' : 'text-gray-600'}>{description}</p>
      </div>
    </GlareCard>
  );
}
