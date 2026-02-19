'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, MapPin, Briefcase, ExternalLink, EyeOff, CheckCircle2, RotateCcw, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ShaderBackground from '@/components/ui/shader-background';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppDarkModeState } from '@/hooks/use-app-dark-mode';
import { getCurrentUser } from '@/lib/auth/auth';
import { getJobStatus, trackJob, removeTrackedJob, type JobTrackerStatus } from '@/lib/job-tracker';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import type { Job } from '@/types';

type PlanTier = 'freemium' | 'pro';

export default function JobsPage() {
  const router = useRouter();
  const { setUpgradeModalOpen } = useDashboardStore();
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('all');
  const [experienceLevel, setExperienceLevel] = useState('all');
  const [datePosted, setDatePosted] = useState('all');
  const [resultLimit, setResultLimit] = useState('25');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [platform, setPlatform] = useState<'linkedin' | 'workday' | 'careerone'>('linkedin');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [planTier, setPlanTier] = useState<PlanTier>('freemium');
  const [remainingSearches, setRemainingSearches] = useState(1);
  const [remainingTokenSearches, setRemainingTokenSearches] = useState(0);
  const [usageMessage, setUsageMessage] = useState('');
  // job-tracker statuses (jobId → status)
  const [jobStatuses, setJobStatuses] = useState<Record<string, JobTrackerStatus>>({});
  const { isDark } = useAppDarkModeState();

  // Load tracker statuses from localStorage
  const refreshStatuses = (jobList: Job[]) => {
    const statuses: Record<string, JobTrackerStatus> = {};
    for (const job of jobList) {
      const s = getJobStatus(job.id);
      if (s) statuses[job.id] = s;
    }
    setJobStatuses(statuses);
  };

  const handleSkip = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    trackJob(job, 'skipped');
    setJobStatuses((prev) => ({ ...prev, [job.id]: 'skipped' }));
  };

  const handleUndoTrack = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    removeTrackedJob(jobId);
    setJobStatuses((prev) => { const next = { ...prev }; delete next[jobId]; return next; });
  };

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

  // Normalize a job from API/cache/localStorage — older sessions or some sources may store
  // fields as objects like {id,name}.
  const normalizeJob = (job: Job): Job => {
    const raw = job as unknown as Record<string, unknown>;
    const toText = (value: unknown, fallback = ''): string => {
      if (typeof value === 'string') return value;
      if (value == null) return fallback;
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const picked = obj.name ?? obj.label ?? obj.title ?? obj.description;
        if (typeof picked === 'string') return picked;
        return fallback;
      }
      return fallback;
    };

    return {
      ...job,
      title: toText(raw.title, 'No Title'),
      company: toText(raw.company, 'Unknown Company'),
      location: toText(raw.location, ''),
      salary_range: toText(raw.salary_range, ''),
      posted_date: toText(raw.posted_date, ''),
      employment_type: toText(raw.employment_type, 'full-time') as Job['employment_type'],
      apply_url: toText(raw.apply_url, ''),
      skills: (job.skills || []).map((s: unknown) =>
        typeof s === 'string' ? s : ((s as { name?: string })?.name ?? String(s))
      ),
    };
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
          const jobsData = (JSON.parse(savedJobs) as Job[]).map(normalizeJob);
          const safeLimit = canUseResultLimitOption(tier, resultLimit) ? resultLimit : '25';
          setJobs(applySelectedLimit(jobsData, safeLimit));
          refreshStatuses(applySelectedLimit(jobsData, safeLimit));
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
      const cacheKey = `job-search-${platform}-${keywords}-${location}-${employmentType}-${experienceLevel}-${datePosted}-${effectiveLimit}-${remoteOnly}`;
      const cached = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(`${cacheKey}-time`);
      
      if (cached && cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < 5 * 60 * 1000) { // 5 minutes
          const cachedData = JSON.parse(cached);
          if (Array.isArray(cachedData) && cachedData.length > 0) {
            console.log('✅ Using cached results (age:', Math.round(age / 1000), 'seconds) - API call saved!');
            const normalizedCached = cachedData.map(normalizeJob);
            setJobs(applySelectedLimit(normalizedCached, effectiveLimit));
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
        source: platform,
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

        const rawJobs: Job[] = (data.jobs || []).map(normalizeJob);
        const limitedJobs = applySelectedLimit(rawJobs, effectiveLimit);
        setJobs(limitedJobs);
        refreshStatuses(limitedJobs);
        console.log('Jobs state updated with', rawJobs.length, 'jobs');
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

  const getEmploymentTypeBorder = (type: string) => {
    const borders: Record<string, string> = {
      'full-time': 'border-black bg-black text-white',
      'part-time': 'border-black bg-white text-black',
      'contract': 'border-[#FF3000] bg-[#FF3000] text-white',
      'internship': 'border-black bg-[#F2F2F2] text-black',
    };
    return borders[type] || 'border-black bg-[#F2F2F2] text-black';
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
    <div className={`min-h-screen relative ${isDark ? 'dark' : ''} bg-white text-black`}>
      <ShaderBackground isDark={isDark} />
      <div className="relative z-10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-4 mb-2">
              <h1 className="text-3xl font-black uppercase tracking-widest">
                Job Search
              </h1>
              {/* Platform toggle */}
              <div className="flex border-2 border-black overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPlatform('linkedin')}
                  className={`flex items-center gap-2 px-3 py-1.5 transition-colors ${
                    platform === 'linkedin' ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#F2F2F2]'
                  }`}
                >
                  <Image src="/linkedin.png" alt="LinkedIn" width={16} height={16} className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">LinkedIn</span>
                </button>
                <div className="w-[2px] bg-black" />
                <button
                  type="button"
                  onClick={() => {
                    if (planTier !== 'pro') { setUpgradeModalOpen(true); return; }
                    setPlatform('workday');
                  }}
                  className={`relative flex items-center gap-2 px-3 py-1.5 transition-colors ${
                    platform === 'workday' ? 'bg-black text-white' : planTier !== 'pro' ? 'bg-[#F2F2F2] text-black/40 cursor-not-allowed' : 'bg-white text-black hover:bg-[#F2F2F2]'
                  }`}
                >
                  <Image
                    src="/workday-hcm.png"
                    alt="Workday"
                    width={423}
                    height={200}
                    className={`h-4 w-auto [image-rendering:crisp-edges] ${
                      platform === 'workday' ? 'brightness-0 invert' : planTier !== 'pro' ? 'opacity-40' : ''
                    }`}
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest">Workday</span>
                  {planTier !== 'pro' && <Lock className="h-3 w-3 text-[#FF3000]" />}
                </button>
                <div className="w-[2px] bg-black" />
                <button
                  type="button"
                  onClick={() => {
                    if (planTier !== 'pro') { setUpgradeModalOpen(true); return; }
                    setPlatform('careerone');
                  }}
                  className={`relative flex items-center gap-2 px-3 py-1.5 transition-colors ${
                    platform === 'careerone' ? 'bg-black text-white' : planTier !== 'pro' ? 'bg-[#F2F2F2] text-black/40 cursor-not-allowed' : 'bg-white text-black hover:bg-[#F2F2F2]'
                  }`}
                >
                  <Image
                    src="/careerone.png"
                    alt="CareerOne"
                    width={247}
                    height={53}
                    className={`h-4 w-auto [image-rendering:crisp-edges] ${
                      platform === 'careerone' ? 'brightness-0 invert' : planTier !== 'pro' ? 'opacity-40' : ''
                    }`}
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest">CareerOne</span>
                  {planTier !== 'pro' && <Lock className="h-3 w-3 text-[#FF3000]" />}
                </button>
              </div>
              <div className="px-3 py-1.5 border-2 border-black bg-white">
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {platform === 'linkedin' ? 'Powered by LinkedIn' : platform === 'workday' ? 'Powered by Workday' : 'Powered by CareerOne'}
                </span>
              </div>
              {platform === 'careerone' && (
                <div className="px-3 py-1.5 border-2 border-[#FF3000] bg-[#FF3000]/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FF3000]">🇦🇺 Australia &amp; NZ Only</span>
                </div>
              )}
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-black/60">
              Search and optimize your CV to match job requirements
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 border-2 border-black bg-[#F2F2F2] text-[10px] font-black uppercase tracking-widest">
                {planTier === 'pro' ? 'Pro' : 'Freemium'} — {remainingSearches} search{remainingSearches !== 1 ? 'es' : ''} left{remainingTokenSearches > 0 ? ` + ${remainingTokenSearches} token` : ''}
              </span>
            </div>
          {usageMessage && (
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-[#FF3000]">{usageMessage}</p>
          )}
        </div>

        {/* Search Form */}
        <div className="mb-8 border-4 border-black bg-white p-6">
            {/* Row 1: Main Search Fields */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
              <div className="md:col-span-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                  <Input
                    placeholder="Job title, keywords, or company"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-9 border-2 border-black focus:ring-2 focus:ring-[#FF3000] focus:border-[#FF3000]"
                  />
                </div>
              </div>

              <div className="md:col-span-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                  <Input
                    placeholder={platform === 'careerone' ? 'Location not supported for CareerOne' : 'Location (optional)'}
                    value={platform === 'careerone' ? '' : location}
                    onChange={(e) => { if (platform !== 'careerone') setLocation(e.target.value); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    disabled={platform === 'careerone'}
                    className={`pl-9 border-2 border-black focus:ring-2 focus:ring-[#FF3000] focus:border-[#FF3000] ${platform === 'careerone' ? 'opacity-40 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <Button onClick={handleSearch} disabled={loading} variant="accent" className="w-full gap-2">
                  <Search className="w-4 h-4" />
                  {loading ? 'Searching...' : 'Search Jobs'}
                </Button>
              </div>
            </div>

            {/* Row 2: Advanced Filters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t-2 border-black items-center">
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger className="border-2 border-black font-bold uppercase text-xs tracking-widest">
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
                <SelectTrigger className="border-2 border-black font-bold uppercase text-xs tracking-widest">
                  <SelectValue placeholder="Experience" />
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
                <SelectTrigger className="border-2 border-black font-bold uppercase text-xs tracking-widest">
                  <SelectValue placeholder="Date Posted" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Time</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                </SelectContent>
              </Select>

              <Select value={resultLimit} onValueChange={setResultLimit}>
                <SelectTrigger className="border-2 border-black font-bold uppercase text-xs tracking-widest">
                  <SelectValue placeholder="Listings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 listings</SelectItem>
                  <SelectItem value="50" disabled={!canUseResultLimitOption(planTier, '50')}>
                    {canUseResultLimitOption(planTier, '50') ? '50 listings' : '🔒 50 listings (Pro)'}
                  </SelectItem>
                  <SelectItem value="all" disabled={!canUseResultLimitOption(planTier, 'all')}>
                    {canUseResultLimitOption(planTier, 'all') ? 'All listings' : '🔒 All listings (Pro)'}
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Remote Only + Clear — fixed height row, no layout shift */}
              <div className="flex items-center gap-2 h-10">
                <button
                  type="button"
                  onClick={() => setRemoteOnly((v) => !v)}
                  className={`flex items-center gap-2 cursor-pointer select-none h-10 px-3 border-2 border-black flex-1 transition-colors ${
                    remoteOnly ? 'bg-black text-white' : 'bg-white text-black'
                  }`}
                >
                  {/* Swiss square toggle */}
                  <span className={`relative inline-flex h-5 w-9 shrink-0 items-center border-2 transition-colors ${
                    remoteOnly ? 'border-white bg-black' : 'border-black bg-white'
                  }`}>
                    <span className={`absolute top-0.5 h-3 w-3 transition-transform duration-150 ${
                      remoteOnly ? 'translate-x-4 bg-white' : 'translate-x-0.5 bg-black'
                    }`} />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Remote</span>
                </button>
                {(employmentType !== 'all' || experienceLevel !== 'all' || datePosted !== 'all' || resultLimit !== '25' || remoteOnly) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="text-[10px] font-black uppercase tracking-widest h-10 px-3 shrink-0"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
        </div>

        {/* Results count */}
        {searched && !loading && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p className="text-xs font-black uppercase tracking-widest">
              {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} found
            </p>
            {employmentType !== 'all' && <span className="px-2 py-0.5 border-2 border-black text-[10px] font-black uppercase tracking-widest">{employmentType}</span>}
            {experienceLevel !== 'all' && <span className="px-2 py-0.5 border-2 border-black text-[10px] font-black uppercase tracking-widest">{experienceLevel}</span>}
            {datePosted !== 'all' && <span className="px-2 py-0.5 border-2 border-black text-[10px] font-black uppercase tracking-widest">{datePosted === '24h' ? 'Last 24h' : datePosted === 'week' ? 'Past Week' : 'Past Month'}</span>}
            {remoteOnly && <span className="px-2 py-0.5 border-2 border-[#FF3000] text-[10px] font-black uppercase tracking-widest text-[#FF3000]">Remote Only</span>}
          </div>
        )}
        
        {/* Loading State */}
        {loading && (
          <div className="border-4 border-black bg-white py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-black border-t-[#FF3000] animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest">Searching {platform === 'linkedin' ? 'LinkedIn' : platform === 'workday' ? 'Workday' : 'CareerOne'} jobs...</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 max-w-xs text-center">
                Fetching real-time data — typically 1–2 minutes
              </p>
            </div>
          </div>
        )}

        {/* Job Listings */}
        {!loading && jobs.length > 0 ? (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className={`border-2 border-black bg-white hover:bg-black hover:text-white transition-colors duration-150 cursor-pointer group p-5 ${
                jobStatuses[job.id] === 'skipped' ? 'opacity-40' : ''
              }`}
              onClick={() => router.push(`/jobs/${job.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-base font-black uppercase tracking-widest leading-tight group-hover:text-white">{job.title}</h3>
                    {jobStatuses[job.id] === 'skipped' && (
                      <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border-2 border-black/40 bg-[#F2F2F2] text-black/50">
                        Skipped
                      </span>
                    )}
                    {jobStatuses[job.id] === 'applied' && (
                      <span className="flex-shrink-0 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border-2 border-green-600 bg-green-50 text-green-700">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Applied
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest text-black/60 group-hover:text-white/60">
                    <span>{job.company}</span>
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                    )}
                    <span>{formatDate(job.posted_date)}</span>
                    {job.salary_range && <span>{job.salary_range}</span>}
                  </div>
                </div>
                <span className={`shrink-0 px-2 py-0.5 border-2 text-[10px] font-black uppercase tracking-widest ${getEmploymentTypeBorder(job.employment_type)} group-hover:bg-white group-hover:text-black group-hover:border-white`}>
                  {job.employment_type}
                </span>
              </div>

              {job.description && (
                <p className="mt-3 text-xs text-black/70 group-hover:text-white/70 line-clamp-2">
                  {job.description}
                </p>
              )}

              {job.skills && job.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.skills.slice(0, 6).map((skill, idx) => (
                    <span key={`${job.id}-skill-${idx}`} className="px-2 py-0.5 border border-black/30 text-[10px] font-bold uppercase tracking-widest group-hover:border-white/40 group-hover:text-white/80">
                      {typeof skill === 'string' ? skill : (skill as { name?: string })?.name ?? ''}
                    </span>
                  ))}
                  {job.skills.length > 6 && (
                    <span className="px-2 py-0.5 border border-black/30 text-[10px] font-bold uppercase tracking-widest group-hover:border-white/40 group-hover:text-white/80">
                      +{job.skills.length - 6}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between gap-2">
                {/* Skip / Undo button */}
                {jobStatuses[job.id] === 'skipped' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-2 border-black/40 text-black/50 text-[10px] font-black uppercase tracking-widest group-hover:text-white group-hover:border-white/40"
                    onClick={(e) => handleUndoTrack(e, job.id)}
                  >
                    <RotateCcw className="w-3 h-3" />
                    Undo Skip
                  </Button>
                ) : jobStatuses[job.id] === 'applied' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-2 border-black/40 text-black/50 text-[10px] font-black uppercase tracking-widest cursor-default group-hover:text-white group-hover:border-white/40"
                    disabled
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Tracked
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-2 border-black text-[10px] font-black uppercase tracking-widest group-hover:bg-white group-hover:text-black group-hover:border-black"
                    onClick={(e) => handleSkip(e, job)}
                  >
                    <EyeOff className="w-3 h-3" />
                    Skip
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-2 border-black bg-white text-black hover:bg-black hover:text-white group-hover:bg-white group-hover:text-black group-hover:border-black"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/jobs/${job.id}`);
                  }}
                >
                  <img src="/meta-llama.png" alt="AI" className="w-4 h-4 object-contain" />
                  Optimize CV
                </Button>
              </div>
            </div>
          ))}
        </div>
        ) : null}

        {/* Empty State */}
        {!loading && searched && jobs.length === 0 && (
          <div className="border-4 border-black bg-white py-16 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-black/30" />
            <h3 className="text-base font-black uppercase tracking-widest mb-2">No jobs found</h3>
            {platform === 'careerone' ? (
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-[#FF3000]">
                  CareerOne only covers Australia &amp; New Zealand
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-black/60">
                  Try different keywords — location filter is not supported
                </p>
              </div>
            ) : (
              <p className="text-xs font-bold uppercase tracking-widest text-black/60">
                Try adjusting your search criteria or keywords
              </p>
            )}
          </div>
        )}

        {/* Initial State */}
        {!loading && !searched && (
          <div className="border-4 border-black bg-white py-16 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-black/30" />
            <h3 className="text-base font-black uppercase tracking-widest mb-2">Start your job search</h3>
            <p className="text-xs font-bold uppercase tracking-widest text-black/60">
              Enter keywords to find relevant job opportunities
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
