'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, ExternalLink, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ShaderBackground from '@/components/ui/shader-background';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppDarkModeState } from '@/hooks/use-app-dark-mode';
import { getCurrentUser } from '@/lib/auth/auth';
import type { Job } from '@/types';

type PlanTier = 'freemium' | 'pro';

export default function JobsPage() {
  const router = useRouter();
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('all');
  const [experienceLevel, setExperienceLevel] = useState('all');
  const [datePosted, setDatePosted] = useState('all');
  const [resultLimit, setResultLimit] = useState('25');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [planTier, setPlanTier] = useState<PlanTier>('freemium');
  const [remainingSearches, setRemainingSearches] = useState(1);
  const [remainingTokenSearches, setRemainingTokenSearches] = useState(0);
  const [usageMessage, setUsageMessage] = useState('');
  const { isDark } = useAppDarkModeState();

  const canUseResultLimitOption = (tier: PlanTier, limit: string) => {
    if (tier === 'pro') return true;
    return limit === '25';
  };

  const loadBillingStatus = async () => {
    const response = await fetch('/api/billing/status');
    const payload = (await response.json()) as {
      success?: boolean;
      status?: { planTier: PlanTier; remaining: { jobSearches: number; tokenJobSearches: number } };
    };

    if (!response.ok || !payload.success || !payload.status) {
      setPlanTier('freemium');
      setRemainingSearches(1);
      setRemainingTokenSearches(0);
      return { tier: 'freemium' as PlanTier, searchesLeft: 1 };
    }

    setPlanTier(payload.status.planTier);
    setRemainingSearches(payload.status.remaining.jobSearches);
    setRemainingTokenSearches(payload.status.remaining.tokenJobSearches ?? 0);
    return { tier: payload.status.planTier, searchesLeft: payload.status.remaining.jobSearches };
  };

  const applySelectedLimit = (jobsList: Job[], limitValue: string): Job[] => {
    if (limitValue === 'all') return jobsList;
    const parsedLimit = parseInt(limitValue, 10);
    if (Number.isNaN(parsedLimit) || parsedLimit <= 0) return jobsList;
    return jobsList.slice(0, parsedLimit);
  };
  
  // Restore jobs from localStorage on component mount
  useEffect(() => {
    const bootstrap = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.replace('/login');
        return;
      }

      const { tier } = await loadBillingStatus();

      if (tier === 'freemium') {
        setResultLimit('25');
      } else if (resultLimit === '25') {
        setResultLimit('all');
      }

      const savedJobs = localStorage.getItem('lastJobSearch');
      if (savedJobs) {
        try {
          const jobsData = JSON.parse(savedJobs);
          const safeLimit = canUseResultLimitOption(tier, resultLimit) ? resultLimit : '25';
          setJobs(applySelectedLimit(jobsData, safeLimit));
          setSearched(true);
          console.log('✅ Restored', jobsData.length, 'jobs from localStorage');
        } catch (error) {
          console.error('Failed to parse saved jobs:', error);
        }
      }
    };

    bootstrap();
  }, [resultLimit, router]);
  
  // Debug: Log when jobs state changes
  useEffect(() => {
    console.log('Jobs state changed:', jobs.length, 'jobs');
    if (jobs.length > 0) {
      console.log('First job in state:', jobs[0]);
    }
  }, [jobs]);

  const handleSearch = async () => {
    if (!keywords.trim()) return;

    setUsageMessage('');

    const billingStatus = await loadBillingStatus();
    const effectiveTier = billingStatus.tier;

    const effectiveLimit = canUseResultLimitOption(effectiveTier, resultLimit) ? resultLimit : '25';
    if (effectiveLimit !== resultLimit) {
      setResultLimit('25');
      setUsageMessage('Freemium plan allows only 25 listings per search. Upgrade to Pro to unlock 50 and all.');
    }

    const remainingBeforeSearch = billingStatus.searchesLeft;
    if (remainingBeforeSearch <= 0) {
      setUsageMessage(
        effectiveTier === 'pro'
          ? 'You reached your Pro quota (10 searches). Buy token packs to continue.'
          : 'Freemium allows 1 job search. Upgrade to Pro or buy token packs to continue.'
      );
      setSearched(true);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      // Check cache first (5 minutes validity)
      const cacheKey = `job-search-${keywords}-${location}-${employmentType}-${experienceLevel}-${datePosted}-${effectiveLimit}-${remoteOnly}`;
      const cached = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(`${cacheKey}-time`);
      
      if (cached && cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < 5 * 60 * 1000) { // 5 minutes
          const cachedData = JSON.parse(cached);
          if (Array.isArray(cachedData) && cachedData.length > 0) {
            console.log('✅ Using cached results (age:', Math.round(age / 1000), 'seconds) - API call saved!');
            setJobs(applySelectedLimit(cachedData, effectiveLimit));
            setLoading(false);
            return;
          }
          console.log('⚠️ Cached result is empty, fetching fresh data instead');
        } else {
          console.log('❌ Cache expired, fetching fresh data');
        }
      }

      const params = new URLSearchParams({
        keywords,
        limit: effectiveLimit,
        ...(location && { location }),
        ...(employmentType !== 'all' && { employment_type: employmentType }),
        ...(experienceLevel !== 'all' && { experience_level: experienceLevel }),
        ...(datePosted !== 'all' && { date_posted: datePosted }),
        ...(remoteOnly && { remote: 'true' }),
      });

      const response = await fetch(`/api/jobs/search?${params}`);
      const data = await response.json();
      
      console.log('API response:', data);
      console.log('Jobs received:', data.jobs?.length || 0);

      if (data.success) {
        const consumeResponse = await fetch('/api/billing/consume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'job-search' }),
        });

        const consumePayload = (await consumeResponse.json()) as {
          success?: boolean;
          allowed?: boolean;
          message?: string;
          status?: { remaining: { jobSearches: number } };
        };

        if (!consumeResponse.ok || !consumePayload.success || !consumePayload.allowed) {
          setUsageMessage(
            consumePayload.message ||
              (effectiveTier === 'pro'
                ? 'You reached your Pro quota (10 searches). Buy token packs to continue.'
                : 'Freemium allows 1 job search. Upgrade to Pro or buy token packs to continue.')
          );
          setJobs([]);
          return;
        }

        setRemainingSearches(consumePayload.status?.remaining.jobSearches ?? 0);

        const limitedJobs = applySelectedLimit(data.jobs || [], effectiveLimit);
        setJobs(limitedJobs);
        console.log('Jobs state updated with', data.jobs.length, 'jobs');
        // Save to cache
        localStorage.setItem(cacheKey, JSON.stringify(limitedJobs));
        localStorage.setItem(`${cacheKey}-time`, Date.now().toString());
        console.log('💾 Results cached for 5 minutes');
        // Save jobs to localStorage so detail page can access them
        localStorage.setItem('lastJobSearch', JSON.stringify(limitedJobs));
      } else {
        console.error('API returned success=false');
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setEmploymentType('all');
    setExperienceLevel('all');
    setDatePosted('all');
    setResultLimit('25');
    setRemoteOnly(false);
  };

  const getEmploymentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'full-time': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'part-time': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'contract': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'internship': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };
    return colors[type] || 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className={`min-h-screen relative ${isDark ? 'dark' : ''}`}>
      <ShaderBackground isDark={isDark} />
      <div className="relative z-10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-3 duration-700">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
              Find Your Next Opportunity
            </h1>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#0077B5] to-[#00A0DC] shadow-lg">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span className="text-white font-semibold text-sm">Powered by LinkedIn</span>
            </div>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0077B5]/10 dark:bg-[#0077B5]/20 text-[#0077B5] dark:text-[#00A0DC] font-medium text-sm border border-[#0077B5]/20">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn Jobs
            </span>
            <span>Search and optimize your CV to match job requirements</span>
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
            <Badge variant="outline" className="text-xs bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm border-blue-200 dark:border-blue-900">
              💾 Smart Caching (5min)
            </Badge>
            <Badge variant="outline" className="text-xs bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm border-indigo-200 dark:border-indigo-900">
              🎯 Advanced Filters
            </Badge>
            <Badge variant="outline" className="text-xs bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm border-violet-200 dark:border-violet-900">
              ⚡ Choose how many job listings to fetch
            </Badge>
            <Badge variant="outline" className="text-xs bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm border-amber-200 dark:border-amber-900">
              {planTier === 'pro'
                ? `Pro total searches left: ${remainingSearches} (${remainingTokenSearches} token)`
                : `Freemium total searches left: ${remainingSearches} (${remainingTokenSearches} token)`}
            </Badge>
          </div>
          {usageMessage && (
            <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">{usageMessage}</p>
          )}
        </div>

        {/* Search Form */}
        <Card className="mb-8 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-zinc-200/70 dark:border-zinc-800 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <CardContent className="pt-6">
            {/* Row 1: Main Search Fields */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
              <div className="md:col-span-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <Input
                    placeholder="Job title, keywords, or company"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="md:col-span-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <Input
                    placeholder="Location (optional)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <Button onClick={handleSearch} disabled={loading} className="w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300">
                  <Search className="w-4 h-4" />
                  {loading ? 'Searching...' : 'Search Jobs'}
                </Button>
              </div>
            </div>

            {/* Row 2: Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Job Types</SelectItem>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>

              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Experience Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="entry">Entry Level</SelectItem>
                  <SelectItem value="mid">Mid Level</SelectItem>
                  <SelectItem value="senior">Senior Level</SelectItem>
                  <SelectItem value="lead">Lead/Manager</SelectItem>
                </SelectContent>
              </Select>

              <Select value={datePosted} onValueChange={setDatePosted}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Posted" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Time</SelectItem>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                </SelectContent>
              </Select>

              <Select value={resultLimit} onValueChange={setResultLimit}>
                <SelectTrigger>
                  <SelectValue placeholder="Listings to Show" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">Show 25 listings</SelectItem>
                  <SelectItem value="50" disabled={!canUseResultLimitOption(planTier, '50')}>
                    {canUseResultLimitOption(planTier, '50') ? 'Show 50 listings' : '🔒 Show 50 listings (Pro only)'}
                  </SelectItem>
                  <SelectItem value="all" disabled={!canUseResultLimitOption(planTier, 'all')}>
                    {canUseResultLimitOption(planTier, 'all') ? 'Show all listings' : '🔒 Show all listings (Pro only)'}
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <div className="flex items-center flex-1">
                  <label className="w-full cursor-pointer rounded-md border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 px-3 py-2 transition-all hover:border-blue-300 dark:hover:border-blue-700 hover:bg-white/90 dark:hover:bg-zinc-900/70">
                    <input
                      type="checkbox"
                      checked={remoteOnly}
                      onChange={(e) => setRemoteOnly(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Remote Only
                      </span>
                      <span className="relative inline-flex h-6 w-11 items-center">
                        <span className="absolute inset-0 rounded-full bg-zinc-300 dark:bg-zinc-700 transition-colors peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600" />
                        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                      </span>
                    </div>
                  </label>
                </div>
                
                {(employmentType !== 'all' || experienceLevel !== 'all' || datePosted !== 'all' || resultLimit !== '25' || remoteOnly) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && !loading && (
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} found
                  {jobs.length > 0 && ` (showing ${jobs.length} results)`}
                </p>
                {jobs.length > 0 && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                    Source: {jobs[0]?.source || 'unknown'} • 
                    {localStorage.getItem(`job-search-${keywords}-${location}-${employmentType}-${experienceLevel}-${datePosted}-${resultLimit}-${remoteOnly}-time`) && 
                     ' Cached results (5min validity)'}
                  </p>
                )}
              </div>
              
              {/* Active Filters Display */}
              {(employmentType !== 'all' || experienceLevel !== 'all' || datePosted !== 'all' || resultLimit !== '25' || remoteOnly) && (
                <div className="flex flex-wrap gap-2">
                  {employmentType !== 'all' && (
                    <Badge variant="secondary" className="capitalize">
                      {employmentType}
                    </Badge>
                  )}
                  {experienceLevel !== 'all' && (
                    <Badge variant="secondary" className="capitalize">
                      {experienceLevel} Level
                    </Badge>
                  )}
                  {datePosted !== 'all' && (
                    <Badge variant="secondary">
                      {datePosted === '24h' ? 'Last 24h' : datePosted === 'week' ? 'Past Week' : 'Past Month'}
                    </Badge>
                  )}
                  {resultLimit !== '25' && (
                    <Badge variant="secondary">
                      {resultLimit === 'all' ? 'Show all listings' : `Show ${resultLimit} listings`}
                    </Badge>
                  )}
                  {remoteOnly && (
                    <Badge variant="secondary">
                      Remote Only
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {loading && (
          <Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-zinc-200/70 dark:border-zinc-800 shadow-xl">
            <CardContent className="text-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0077B5]"></div>
                  <svg className="w-12 h-12 animate-pulse" viewBox="0 0 24 24" fill="#0077B5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  Searching LinkedIn jobs...
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 max-w-md">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0077B5]/10 dark:bg-[#0077B5]/20 text-[#0077B5] dark:text-[#00A0DC] font-medium text-sm border border-[#0077B5]/20 mr-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </span>
                  Scraping real-time data from LinkedIn. This typically takes 1-2 minutes.
                  Please be patient while we fetch the latest job postings.
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  💡 Tip: Reduce your search scope for faster results
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Job Listings */}
        {!loading && jobs.length > 0 ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-700">
          {jobs.map((job) => {
            return (
            <Card
              key={job.id}
              className="hover:shadow-2xl transition-all duration-300 cursor-pointer bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-zinc-200/70 dark:border-zinc-800 hover:scale-[1.01] hover:-translate-y-0.5"
              onClick={() => router.push(`/jobs/${job.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1">{job.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4 text-base">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge className={getEmploymentTypeColor(job.employment_type)}>
                    {job.employment_type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-700 dark:text-zinc-300 mb-4 line-clamp-3">
                  {job.description}
                </p>

                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills.slice(0, 6).map((skill, idx) => (
                      <Badge key={`${job.id}-skill-${idx}`} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                    {job.skills.length > 6 && (
                      <Badge variant="secondary">+{job.skills.length - 6} more</Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center gap-4">
                    {job.salary_range && (
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {job.salary_range}
                      </span>
                    )}
                    <span>{formatDate(job.posted_date)}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/jobs/${job.id}`);
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Optimize CV
                  </Button>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
        ) : null}

        {/* Empty State */}
        {!loading && searched && jobs.length === 0 && (
          <Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-dashed border-zinc-300 dark:border-zinc-700 shadow-lg">
            <CardContent className="text-center py-16">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-zinc-400 dark:text-zinc-600" />
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                No jobs found
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Try adjusting your search criteria or keywords
              </p>
            </CardContent>
          </Card>
        )}

        {/* Initial State */}
        {!loading && !searched && (
          <Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-dashed border-zinc-300 dark:border-zinc-700 shadow-lg">
            <CardContent className="text-center py-16">
              <Search className="w-16 h-16 mx-auto mb-4 text-zinc-400 dark:text-zinc-600" />
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Start your job search
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Enter keywords to find relevant job opportunities
              </p>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}
