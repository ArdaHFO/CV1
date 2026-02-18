'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ShaderBackground from '@/components/ui/shader-background';
import { ArrowRight, Loader2, Rocket, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signIn, signInWithGoogle } from '@/lib/auth/auth';
import { useAppDarkModeState } from '@/hooks/use-app-dark-mode';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4 6.8 2.4 2.6 6.6 2.6 11.8S6.8 21.2 12 21.2c6.9 0 9.1-4.8 9.1-7.3 0-.5 0-.9-.1-1.3H12z" />
      <path fill="#34A853" d="M2.6 7.3l3.2 2.3c.9-2.1 3-3.6 5.5-3.6 1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4 8 2.4 4.5 4.6 2.6 7.3z" />
      <path fill="#4A90E2" d="M12 21.2c2.6 0 4.8-.8 6.4-2.3l-3-2.4c-.8.6-1.9 1.1-3.4 1.1-2.5 0-4.6-1.7-5.4-4l-3.3 2.5c1.9 3.8 5.7 5.1 8.7 5.1z" />
      <path fill="#FBBC05" d="M6.6 13.6c-.2-.6-.4-1.2-.4-1.8s.1-1.2.3-1.8L3.3 7.5C2.8 8.6 2.6 9.8 2.6 11s.3 2.4.8 3.5l3.2-2.4z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { isDark } = useAppDarkModeState();

  const highlights = [
    {
      icon: Sparkles,
      title: 'AI-powered CV optimization',
      description: 'Get role-specific suggestions for each job application.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure and private',
      description: 'Your profile and CV data stays under your control.',
    },
    {
      icon: Rocket,
      title: 'Faster application flow',
      description: 'Search jobs, optimize CV, and apply from one place.',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn({ email, password });

    if ('message' in result) {
      setError(result.message);
      setLoading(false);
      return;
    }

    // Success - redirect to dashboard
    router.push('/dashboard');
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setGoogleLoading(false);
    }
  };

  return (
    <div className={`min-h-screen relative ${isDark ? 'dark' : ''}`}>
      <ShaderBackground isDark={isDark} />
      <div className="relative z-10 min-h-screen flex items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-6 lg:grid-cols-2">
          <div className="hidden lg:flex flex-col justify-between border-2 border-black bg-white p-8 dark:border-white dark:bg-black">
            <div>
              <Link href="/" className="flex items-center gap-3 mb-8">
                <Image src="/cspark-logo.png" alt="CSpark logo" width={64} height={64} className="w-16 h-16 object-contain" />
                <span className="text-3xl font-black text-black dark:text-white">
                  cspark
                </span>
              </Link>

              <p className="text-5xl font-black leading-none text-black dark:text-white mb-4">
                WELCOME BACK
              </p>
              <p className="text-base leading-relaxed text-black dark:text-white">Let&apos;s continue building your next opportunity.</p>

              <div className="mt-8 space-y-4">
                {highlights.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="flex items-start gap-3 border-2 border-black bg-white p-4 dark:border-white dark:bg-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center font-black border border-black dark:border-white">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase text-black dark:text-white">{title}</p>
                      <p className="text-xs leading-snug text-black dark:text-white">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-black dark:text-white">TRUSTED BY CANDIDATES PREPARING TAILORED CVS FOR MODERN HIRING PIPELINES</p>
          </div>

          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md border-2 border-black bg-white dark:border-white dark:bg-black">
              <CardHeader className="space-y-3 pb-2 border-b-2 border-black dark:border-white">
                <div className="flex items-center justify-center lg:hidden">
                  <Link href="/" className="flex items-center gap-3">
                    <Image src="/cspark-logo.png" alt="CSpark logo" width={56} height={56} className="w-14 h-14 object-contain" />
                    <span className="text-2xl font-black text-black dark:text-white">
                      cspark
                    </span>
                  </Link>
                </div>
                <CardTitle className="text-3xl font-black uppercase text-black dark:text-white">SIGN IN</CardTitle>
                <CardDescription className="text-black dark:text-white">
                  ACCESS YOUR DASHBOARD AND CONTINUE OPTIMIZING YOUR CV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {error && (
                <div className="border-2 border-red-500 bg-white dark:bg-black text-red-500 dark:text-red-400 p-3 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="font-black uppercase text-black dark:text-white">EMAIL</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="border-2 border-black bg-white text-black placeholder:text-black/50 dark:border-white dark:bg-black dark:text-white dark:placeholder:text-white/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-black uppercase text-black dark:text-white">PASSWORD</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="border-2 border-black bg-white text-black placeholder:text-black/50 dark:border-white dark:bg-black dark:text-white dark:placeholder:text-white/50"
                />
              </div>

              <Button type="submit" className="w-full gap-2 border-2 border-black bg-black text-white hover:bg-white hover:text-black font-black uppercase dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 border-2 border-black bg-white text-black hover:bg-black hover:text-white dark:border-white dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black font-black uppercase"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
              >
                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </Button>

              <div className="text-center text-sm font-black uppercase text-black dark:text-white">
                Don't have an account?{' '}
                <Link
                  href="/register"
                  className="underline hover:no-underline"
                >
                  Sign Up
                </Link>
              </div>

              <p className="text-center text-xs font-black uppercase text-black dark:text-white">
                BY CONTINUING, YOU AGREE TO SECURE ACCOUNT USAGE AND PLATFORM POLICIES
              </p>
            </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
