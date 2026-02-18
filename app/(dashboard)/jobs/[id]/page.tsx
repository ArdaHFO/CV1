'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ShaderBackground from '@/components/ui/shader-background';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  DollarSign,
  ExternalLink,
  Sparkles,
  CheckCircle,
  XCircle,
  Loader2,
  EyeOff,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UpgradeModal } from '@/components/ui/upgrade-modal';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import { getCurrentUser } from '@/lib/auth/auth';
import { createApplication } from '@/lib/database/applications';
import { getActiveResumeVersion } from '@/lib/database/resumes';
import { trackJob, getJobStatus, removeTrackedJob, type JobTrackerStatus } from '@/lib/job-tracker';
import { useAppDarkModeState } from '@/hooks/use-app-dark-mode';
import type { Job, CVOptimizationResult, Resume, ResumeContent } from '@/types';

// Mock job data (same as API)
const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'Tech Innovations Inc.',
    location: 'New York, USA',
    description: 'We are seeking an experienced Frontend Developer to join our dynamic team. You will be responsible for building modern, responsive web applications using React and TypeScript.',
    requirements: [
      '5+ years of experience in frontend development',
      'Expert knowledge of React, TypeScript, and Next.js',
      'Experience with state management (Redux, Zustand)',
      'Strong understanding of web performance optimization',
      'Excellent problem-solving skills',
    ],
    skills: ['React', 'TypeScript', 'Next.js', 'Redux', 'Zustand', 'HTML', 'CSS', 'JavaScript', 'Git', 'Webpack'],
    salary_range: '$120,000 - $160,000',
    employment_type: 'full-time',
    posted_date: '2026-02-10',
    apply_url: 'https://example.com/apply/1',
    source: 'mock',
  },
  {
    id: '2',
    title: 'Full Stack Developer',
    company: 'Digital Solutions Ltd.',
    location: 'San Francisco, USA',
    description: 'Join our innovative team building scalable web applications. We need a versatile developer comfortable with both frontend and backend technologies.',
    requirements: [
      '3+ years of full stack development experience',
      'Proficiency in React and Node.js',
      'Experience with PostgreSQL or MongoDB',
      'Knowledge of REST APIs and GraphQL',
      'Understanding of cloud platforms (AWS, GCP)',
    ],
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'MongoDB', 'REST API', 'GraphQL', 'AWS', 'Docker', 'Kubernetes'],
    salary_range: '$100,000 - $140,000',
    employment_type: 'full-time',
    posted_date: '2026-02-12',
    apply_url: 'https://example.com/apply/2',
    source: 'mock',
  },
  {
    id: '3',
    title: 'React Developer',
    company: 'StartupHub',
    location: 'Remote',
    description: 'Fast-growing startup seeking a passionate React developer to help build the next generation of web applications. Great opportunity for growth.',
    requirements: [
      '2+ years of React development',
      'Experience with modern JavaScript (ES6+)',
      'Familiarity with responsive design',
      'Good communication skills',
      'Ability to work independently',
    ],
    skills: ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Tailwind CSS', 'Git', 'REST API'],
    salary_range: '$80,000 - $110,000',
    employment_type: 'full-time',
    posted_date: '2026-02-13',
    apply_url: 'https://example.com/apply/3',
    source: 'mock',
  },
  {
    id: '4',
    title: 'UI/UX Designer & Frontend Developer',
    company: 'Creative Agency',
    location: 'London, UK',
    description: 'Unique role combining design and development. Create beautiful, user-friendly interfaces and bring them to life with code.',
    requirements: [
      'Strong portfolio demonstrating UI/UX skills',
      'Proficiency in Figma or Adobe XD',
      'Frontend development experience (React preferred)',
      'Understanding of design systems',
      'Creative problem-solving abilities',
    ],
    skills: ['Figma', 'Adobe XD', 'React', 'JavaScript', 'CSS', 'Tailwind CSS', 'Design Systems', 'Prototyping'],
    salary_range: '£50,000 - £70,000',
    employment_type: 'full-time',
    posted_date: '2026-02-09',
    apply_url: 'https://example.com/apply/4',
    source: 'mock',
  },
  {
    id: '5',
    title: 'Frontend Developer Intern',
    company: 'BigTech Corp',
    location: 'Seattle, USA',
    description: 'Summer internship opportunity for aspiring frontend developers. Work on real projects, learn from experienced mentors, and grow your skills.',
    requirements: [
      'Currently pursuing CS degree or related field',
      'Basic knowledge of HTML, CSS, JavaScript',
      'Familiarity with React or similar frameworks',
      'Enthusiasm to learn',
      'Team player',
    ],
    skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Git'],
    salary_range: '$25/hour',
    employment_type: 'internship',
    posted_date: '2026-02-11',
    apply_url: 'https://example.com/apply/5',
    source: 'mock',
  },
  {
    id: '6',
    title: 'Senior Software Engineer',
    company: 'Enterprise Solutions',
    location: 'Boston, USA',
    description: 'Lead development of enterprise-grade applications. Work with cutting-edge technologies and mentor junior developers.',
    requirements: [
      '7+ years of software development experience',
      'Strong architectural and design skills',
      'Experience with microservices',
      'Leadership and mentoring abilities',
      'Excellent communication skills',
    ],
    skills: ['React', 'Node.js', 'TypeScript', 'Microservices', 'Docker', 'Kubernetes', 'AWS', 'PostgreSQL', 'Redis', 'CI/CD'],
    salary_range: '$150,000 - $190,000',
    employment_type: 'full-time',
    posted_date: '2026-02-08',
    apply_url: 'https://example.com/apply/6',
    source: 'mock',
  },
];

function createFallbackResume(): Resume {
  return {
    id: '1',
    user_id: 'fallback-user',
    title: 'Your First CV',
    slug: 'your-first-cv',
    is_default: true,
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function buildDefaultResumeContent(resumeTitle = 'Professional CV'): ResumeContent {
  return {
    personal_info: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '+1 555 123 4567',
      location: 'New York, USA',
    },
    summary: `${resumeTitle} - Experienced Full Stack Developer with strong React and TypeScript background.`,
    experience: [
      {
        id: 'exp-1',
        company: 'ABC Technology',
        position: 'Senior Frontend Developer',
        location: 'New York, USA',
        start_date: '2022-01',
        end_date: '',
        is_current: true,
        description: 'Developing modern web applications using React, Next.js and TypeScript.',
        achievements: [
          'Improved frontend performance by 40%',
          'Collaborated cross-functionally with product and design teams',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        institution: 'MIT',
        degree: "Bachelor's",
        field: 'Computer Science',
        location: 'Cambridge, USA',
        start_date: '2016-09',
        end_date: '2020-06',
        is_current: false,
      },
    ],
    skills: [
      { id: 'skill-1', name: 'React', category: 'Technical', level: 'expert' },
      { id: 'skill-2', name: 'TypeScript', category: 'Technical', level: 'advanced' },
      { id: 'skill-3', name: 'JavaScript', category: 'Technical', level: 'expert' },
      { id: 'skill-4', name: 'Next.js', category: 'Technical', level: 'advanced' },
    ],
  };
}

function getResumeContent(resumeId: string, resumeTitle?: string): ResumeContent {
  try {
    const storedContent = localStorage.getItem(`resume-content-${resumeId}`);
    if (storedContent) {
      return JSON.parse(storedContent) as ResumeContent;
    }
  } catch (error) {
    console.error('Failed to parse stored resume content:', error);
  }

  return buildDefaultResumeContent(resumeTitle);
}

function applyOptimizationToResume(
  content: ResumeContent,
  result: CVOptimizationResult,
  job: Job,
  selectedSuggestionIndexes: number[]
): ResumeContent {
  const selectedSuggestions = result.suggestions.filter((_, index) =>
    selectedSuggestionIndexes.includes(index)
  );
  const selectedSections = new Set(selectedSuggestions.map((suggestion) => suggestion.section));

  if (selectedSuggestions.length === 0) {
    return content;
  }

  const existingSkillNames = content.skills.map((skill) => skill.name.toLowerCase());
  const shouldApplySkills = selectedSections.has('skills');
  const shouldApplySummary = selectedSections.has('summary');
  const shouldApplyExperience = selectedSections.has('experience');

  const newSkills = shouldApplySkills
    ? result.missing_skills
        .filter((skill) => !existingSkillNames.includes(skill.toLowerCase()))
        .slice(0, 3)
        .map((skill, index) => ({
          id: `skill-auto-${Date.now()}-${index}`,
          name: skill,
          category: 'Job Match',
          level: 'intermediate' as const,
        }))
    : [];

  const summarySuggestionText = selectedSuggestions
    .filter((suggestion) => suggestion.section === 'summary')
    .map((suggestion) => suggestion.suggested)
    .join(' ')
    .trim();

  const optimizedSummary = shouldApplySummary
    ? [
        content.summary?.trim() || '',
        summarySuggestionText,
        `Tailored for ${job.title} at ${job.company}.`,
        result.matching_skills.length > 0
          ? `Strong match areas: ${result.matching_skills.slice(0, 4).join(', ')}.`
          : '',
      ]
        .filter(Boolean)
        .join(' ')
        .trim()
    : content.summary;

  const optimizedExperience = content.experience.map((experience, index) => {
    if (index !== 0 || !shouldApplyExperience) {
      return experience;
    }

    const experienceSuggestionText = selectedSuggestions
      .filter((suggestion) => suggestion.section === 'experience')
      .map((suggestion) => suggestion.suggested)
      .join(' ')
      .trim();

    const keywordSnippet = job.skills.slice(0, 3).join(', ');
    const updatedDescription = [
      experience.description,
      experienceSuggestionText,
      keywordSnippet ? `Relevant for this role: ${keywordSnippet}.` : '',
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      ...experience,
      description: updatedDescription,
    };
  });

  return {
    ...content,
    summary: optimizedSummary,
    experience: optimizedExperience,
    skills: shouldApplySkills ? [...content.skills, ...newSkills] : content.skills,
  };
}

function getSectionPreview(content: ResumeContent, section: 'summary' | 'experience' | 'skills' | 'education') {
  if (section === 'summary') {
    return content.summary || 'No summary yet';
  }

  if (section === 'experience') {
    return content.experience[0]?.description || 'No experience description yet';
  }

  if (section === 'skills') {
    return content.skills.map((skill) => skill.name).join(', ') || 'No skills yet';
  }

  return content.education[0]
    ? `${content.education[0].degree} - ${content.education[0].field}`
    : 'No education yet';
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { resumes } = useDashboardStore();
  const availableResumes = useMemo(
    () => (resumes.length > 0 ? resumes : [createFallbackResume()]),
    [resumes]
  );

  const [job, setJob] = useState<Job | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [optimization, setOptimization] = useState<CVOptimizationResult | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [applyingOptimization, setApplyingOptimization] = useState(false);
  const [sourceResumeContent, setSourceResumeContent] = useState<ResumeContent | null>(null);
  const [selectedSuggestionIndexes, setSelectedSuggestionIndexes] = useState<number[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [trackerStatus, setTrackerStatus] = useState<JobTrackerStatus | null>(null);
  const { isDark } = useAppDarkModeState();

  // Load tracker status for this job
  useEffect(() => {
    if (jobId) setTrackerStatus(getJobStatus(jobId));
  }, [jobId]);

  const handleSkipJob = () => {
    if (!job) return;
    trackJob(job, 'skipped');
    setTrackerStatus('skipped');
  };

  const handleUndoTrack = () => {
    removeTrackedJob(jobId);
    setTrackerStatus(null);
  };

  useEffect(() => {
    // Try to find job from localStorage first (from recent search)
    const lastSearch = localStorage.getItem('lastJobSearch');
    let foundJob: Job | null = null;
    
    if (lastSearch) {
      try {
        const searchedJobs = JSON.parse(lastSearch) as Job[];
        foundJob = searchedJobs.find((j) => j.id === jobId) || null;
        console.log('Found job from localStorage:', foundJob?.title);
      } catch (error) {
        console.error('Error parsing localStorage jobs:', error);
      }
    }
    
    // Fallback to mock data if not found in localStorage
    if (!foundJob) {
      foundJob = mockJobs.find((j) => j.id === jobId) || null;
      console.log('Using mock job as fallback:', foundJob?.title);
    }
    
    setJob(foundJob);

    // Select first resume by default
    if (availableResumes.length > 0) {
      setSelectedResumeId(availableResumes[0].id);
    }
  }, [jobId, availableResumes]);

  useEffect(() => {
    const bootstrapUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    bootstrapUser();
  }, []);

  const handleOptimize = async () => {
    if (!job || !selectedResumeId) return;

    console.log(`[JOB_OPTIMIZE_START] jobId=${job.id}, resumeId=${selectedResumeId}`);

    // Check billing limits before optimization
    const consumeResponse = await fetch('/api/billing/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cv-optimization' }),
    });

    const consumePayload = (await consumeResponse.json()) as {
      success?: boolean;
      allowed?: boolean;
      message?: string;
    };

    console.log(`[JOB_OPTIMIZE_CONSUME] ok=${consumeResponse.ok}, success=${consumePayload.success}, allowed=${consumePayload.allowed}, message=${consumePayload.message}`);

    if (!consumeResponse.ok || !consumePayload.success || !consumePayload.allowed) {
      // Show upgrade modal for free users
      console.log(`[JOB_OPTIMIZE_BLOCKED] Showing upgrade modal`);
      setShowUpgradeModal(true);
      return;
    }

    console.log(`[JOB_OPTIMIZE_ALLOWED] Starting optimization`);
    setOptimizing(true);

    try {
      const selectedResume = availableResumes.find((resume) => resume.id === selectedResumeId);
      const baseResumeContent = getResumeContent(selectedResumeId, selectedResume?.title);

      const response = await fetch('/api/jobs/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: job.description,
          jobRequirements: job.requirements,
          jobSkills: job.skills,
          cvContent: baseResumeContent,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data?.error || 'Optimization failed. Please try again.');
        return;
      }

      setOptimization(data.result);
      setSourceResumeContent(baseResumeContent);
      setSelectedSuggestionIndexes(data.result.suggestions.map((_: unknown, index: number) => index));

      alert('Optimization analysis is ready. Review suggestions and apply approved changes.');
    } catch (error) {
      console.error('Optimization error:', error);
    } finally {
      setOptimizing(false);
    }
  };

  const handleTrackApplication = async () => {
    if (!job || !currentUserId || !selectedResumeId) return;

    const activeVersion = await getActiveResumeVersion(selectedResumeId);

    const created = await createApplication({
      user_id: currentUserId,
      job_id: job.id,
      job_title: job.title,
      company: job.company,
      location: job.location,
      job_url: job.apply_url || null,
      status: 'Applied',
      applied_at: new Date().toISOString().slice(0, 10),
      reminder_at: null,
      resume_id: selectedResumeId,
      resume_version_id: activeVersion?.id ?? null,
    });

    if (created) {
      // Also write to the lightweight localStorage tracker
      try { trackJob(job, 'applied'); } catch { /* best-effort */ }
      alert('Application tracked! Opening your Application Tracker.');
      router.push('/applications');
    } else {
      alert('Could not track application. Please try again.');
    }
  };

  const toggleSuggestion = (index: number) => {
    setSelectedSuggestionIndexes((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    );
  };

  const handleApplySelectedChanges = () => {
    if (!job || !optimization || !sourceResumeContent || !selectedResumeId) {
      return;
    }

    if (selectedSuggestionIndexes.length === 0) {
      alert('Please select at least one suggestion to apply.');
      return;
    }

    // Save optimization payload for step-by-step review in editor
    localStorage.setItem('pendingOptimization', JSON.stringify({
      optimization,
      selectedIndexes: selectedSuggestionIndexes,
      jobTitle: job.title,
      jobCompany: job.company,
      resumeId: selectedResumeId,
    }));

    router.push(`/editor/${selectedResumeId}?pendingReview=1`);
  };

  const getMatchScoreStyle = (score: number) => {
    if (score >= 80) return 'text-black';
    if (score >= 60) return 'text-black';
    return 'text-[#FF3000]';
  };

  const getPriorityStyle = (priority: string) => {
    const styles: Record<string, string> = {
      high: 'border-l-4 border-l-[#FF3000] border border-black bg-white',
      medium: 'border-l-4 border-l-black border border-black bg-[#F2F2F2]',
      low: 'border border-black bg-white',
    };
    return styles[priority] || 'border border-black bg-white';
  };

  if (!job) {
    return (
      <div className={`min-h-screen relative flex items-center justify-center ${isDark ? 'dark' : ''} bg-white text-black`}>
        <ShaderBackground isDark={isDark} />
        <div className="relative z-10 border-4 border-black bg-white p-12 text-center">
          <p className="text-xs font-black uppercase tracking-widest">Job not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/jobs')}>Back to Jobs</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative py-8 ${isDark ? 'dark' : ''} bg-white text-black`}>
      <ShaderBackground isDark={isDark} />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="outline"
          className="mb-6 gap-2"
          onClick={() => router.push('/jobs')}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Job Details ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Title / Meta */}
            <div className="border-4 border-black bg-white">
              <div className="p-6 border-b-2 border-black">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-black uppercase tracking-widest leading-tight">{job.title}</h1>
                    <p className="text-sm font-bold uppercase tracking-widest mt-1">{job.company}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trackerStatus === 'skipped' ? (
                      <Button variant="outline" onClick={handleUndoTrack} className="gap-2 text-black/50">
                        <RotateCcw className="w-4 h-4" />
                        Undo Skip
                      </Button>
                    ) : trackerStatus === 'applied' ? (
                      <Button variant="outline" disabled className="gap-2 text-green-700 border-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        Applied
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={handleSkipJob} className="gap-2">
                        <EyeOff className="w-4 h-4" />
                        Skip
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleTrackApplication} className="gap-2">
                      Track Application
                    </Button>
                    {job.apply_url && (
                      <Button variant="accent" asChild className="gap-2">
                        <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                          Apply
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-black/60">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {job.employment_type}
                  </span>
                  {job.salary_range && (
                    <span className="flex items-center gap-1 text-black">
                      <DollarSign className="w-3 h-3" />
                      {job.salary_range}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="p-6 border-b-2 border-black">
                <h2 className="text-[10px] font-black uppercase tracking-widest mb-3">Description</h2>
                <p className="text-sm leading-relaxed text-black/80">{job.description}</p>
              </div>

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="p-6 border-b-2 border-black">
                  <h2 className="text-[10px] font-black uppercase tracking-widest mb-3">Requirements</h2>
                  <ul className="space-y-2">
                    {job.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-black/80">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-black shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills */}
              <div className="p-6">
                <h2 className="text-[10px] font-black uppercase tracking-widest mb-3">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span key={skill} className="px-2 py-0.5 border-2 border-black text-[10px] font-black uppercase tracking-widest">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── CV Optimization Panel ── */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-4">

              {/* Optimize box */}
              <div className="border-4 border-black bg-white p-5">
                <div className="mb-4">
                  <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    CV Optimization
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 mt-1">
                    Optimize your CV to match this job
                  </p>
                </div>

                <div className="mb-4">
                  <label className="text-[10px] font-black uppercase tracking-widest block mb-2">Select CV</label>
                  <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                    <SelectTrigger className="border-2 border-black font-bold uppercase text-xs tracking-widest">
                      <SelectValue placeholder="Choose a CV" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableResumes.map((resume) => (
                        <SelectItem key={resume.id} value={resume.id}>
                          {resume.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="accent"
                  className="w-full gap-2"
                  onClick={handleOptimize}
                  disabled={!selectedResumeId || optimizing}
                >
                  {optimizing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" />Analyze &amp; Optimize</>
                  )}
                </Button>
              </div>

              {/* Optimization Results */}
              {optimization && (
                <>
                  {/* Match Score */}
                  <div className="border-4 border-black bg-white p-5 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-2">Job Match Score</p>
                    <p className={`text-6xl font-black ${getMatchScoreStyle(optimization.job_match_score)}`}>
                      {optimization.job_match_score}%
                    </p>
                  </div>

                  {/* Skills Analysis */}
                  <div className="border-4 border-black bg-white">
                    <div className="px-5 pt-5 pb-3 border-b-2 border-black">
                      <h2 className="text-[10px] font-black uppercase tracking-widest">Skills Analysis</h2>
                    </div>
                    <div className="p-5 space-y-4">
                      {optimization.matching_skills.length > 0 && (
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1 mb-2">
                            <CheckCircle className="w-3 h-3" />
                            Matching ({optimization.matching_skills.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {optimization.matching_skills.map((skill) => (
                              <span key={skill} className="px-2 py-0.5 border-2 border-black bg-black text-white text-[10px] font-black uppercase tracking-widest">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {optimization.missing_skills.length > 0 && (
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1 mb-2 text-[#FF3000]">
                            <XCircle className="w-3 h-3" />
                            Missing ({optimization.missing_skills.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {optimization.missing_skills.map((skill) => (
                              <span key={skill} className="px-2 py-0.5 border-2 border-[#FF3000] text-[#FF3000] text-[10px] font-black uppercase tracking-widest">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="border-4 border-black bg-white">
                    <div className="px-5 pt-5 pb-3 border-b-2 border-black">
                      <h2 className="text-[10px] font-black uppercase tracking-widest">Suggestions</h2>
                    </div>
                    <div className="p-5 space-y-3">
                      {optimization.suggestions.map((suggestion, index) => (
                        <div key={index} className={`p-3 ${getPriorityStyle(suggestion.priority)}`}>
                          <div className="flex items-start gap-2 mb-2">
                            <input
                              type="checkbox"
                              checked={selectedSuggestionIndexes.includes(index)}
                              onChange={() => toggleSuggestion(index)}
                              className="mt-0.5 h-4 w-4 accent-black shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="text-[10px] font-black uppercase tracking-widest">
                                  {suggestion.section} Section
                                </p>
                                <span className="px-1.5 py-0.5 border border-black text-[9px] font-black uppercase tracking-widest shrink-0">
                                  {suggestion.priority}
                                </span>
                              </div>
                              <p className="text-[10px] font-bold text-black/60 mb-2">{suggestion.reason}</p>
                              {sourceResumeContent && (
                                <p className="text-[10px] text-black/50 mb-1 line-clamp-2">
                                  Current: {getSectionPreview(sourceResumeContent, suggestion.section)}
                                </p>
                              )}
                              <p className="text-xs text-black/80">{suggestion.suggested}</p>
                            </div>
                          </div>
                        </div>
                      ))}

                      <Button
                        variant="accent"
                        className="w-full gap-2 mt-2"
                        onClick={handleApplySelectedChanges}
                        disabled={applyingOptimization || selectedSuggestionIndexes.length === 0}
                      >
                        {applyingOptimization ? (
                          <><Loader2 className="w-4 h-4 animate-spin" />Applying...</>
                        ) : (
                          <><Sparkles className="w-4 h-4" />Apply Selected ({selectedSuggestionIndexes.length})</>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {optimization.recommended_changes.length > 0 && (
                    <div className="border-4 border-black bg-white">
                      <div className="px-5 pt-5 pb-3 border-b-2 border-black">
                        <h2 className="text-[10px] font-black uppercase tracking-widest">Recommendations</h2>
                      </div>
                      <div className="p-5">
                        <ul className="space-y-2">
                          {optimization.recommended_changes.map((change, index) => (
                            <li key={index} className="flex items-start gap-2 text-xs text-black/80">
                              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                              {change}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature="cv-optimization"
      />
    </div>
  );
}
