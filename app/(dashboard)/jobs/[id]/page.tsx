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
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UpgradeModal } from '@/components/ui/upgrade-modal';
import { useDashboardStore } from '@/lib/store/dashboard-store';
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
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [optimization, setOptimization] = useState<CVOptimizationResult | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [applyingOptimization, setApplyingOptimization] = useState(false);
  const [sourceResumeContent, setSourceResumeContent] = useState<ResumeContent | null>(null);
  const [selectedSuggestionIndexes, setSelectedSuggestionIndexes] = useState<number[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { isDark } = useAppDarkModeState();

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

  const handleOptimize = async () => {
    if (!job || !selectedResumeId) return;

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

    if (!consumeResponse.ok || !consumePayload.success || !consumePayload.allowed) {
      // Show upgrade modal for free users
      setShowUpgradeModal(true);
      return;
    }

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

    setApplyingOptimization(true);
    try {
      const optimizedContent = applyOptimizationToResume(
        sourceResumeContent,
        optimization,
        job,
        selectedSuggestionIndexes
      );

      localStorage.setItem(`resume-content-${selectedResumeId}`, JSON.stringify(optimizedContent));
      localStorage.setItem('lastOptimizedResumeId', selectedResumeId);

      alert('Selected changes applied. Opening editor...');
      router.push(`/editor/${selectedResumeId}?optimized=1`);
    } finally {
      setApplyingOptimization(false);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950',
      medium: 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950',
      low: 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950',
    };
    return colors[priority] || '';
  };

  if (!job) {
    return (
      <div className={`min-h-screen relative flex items-center justify-center ${isDark ? 'dark' : ''}`}>
        <ShaderBackground isDark={isDark} />
        <div className="relative z-10">
          <p className="text-zinc-600 dark:text-zinc-400">Job not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative py-8 ${isDark ? 'dark' : ''}`}>
      <ShaderBackground isDark={isDark} />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 -ml-2"
          onClick={() => router.push('/jobs')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Job Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
                    <CardDescription className="text-lg">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {job.company}
                      </span>
                    </CardDescription>
                  </div>
                  {job.apply_url && (
                    <Button asChild>
                      <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Apply
                      </a>
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {job.employment_type}
                  </span>
                  {job.salary_range && (
                    <span className="flex items-center gap-1 font-medium text-zinc-900 dark:text-zinc-100">
                      <DollarSign className="w-4 h-4" />
                      {job.salary_range}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Description</h3>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-3">Requirements</h3>
                  <ul className="space-y-2">
                    {job.requirements.map((req, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300"
                      >
                        <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CV Optimization Panel */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    CV Optimization
                  </CardTitle>
                  <CardDescription>
                    Optimize your CV to match this job posting
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select CV</label>
                    <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                      <SelectTrigger>
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
                    className="w-full gap-2"
                    onClick={handleOptimize}
                    disabled={!selectedResumeId || optimizing}
                  >
                    {optimizing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Analyze & Optimize
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Optimization Results */}
              {optimization && (
                <>
                  {/* Match Score */}
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                        Job Match Score
                      </p>
                      <p
                        className={`text-5xl font-bold ${getMatchScoreColor(
                          optimization.job_match_score
                        )}`}
                      >
                        {optimization.job_match_score}%
                      </p>
                    </CardContent>
                  </Card>

                  {/* Skills Match */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Skills Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {optimization.matching_skills.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            Matching Skills ({optimization.matching_skills.length})
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {optimization.matching_skills.map((skill) => (
                              <Badge key={skill} className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {optimization.missing_skills.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-red-600 dark:text-red-400">
                            <XCircle className="w-4 h-4" />
                            Missing Skills ({optimization.missing_skills.length})
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {optimization.missing_skills.map((skill) => (
                              <Badge key={skill} className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Suggestions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {optimization.suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className={`p-3 border rounded-lg ${getPriorityColor(
                            suggestion.priority
                          )}`}
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <input
                              type="checkbox"
                              checked={selectedSuggestionIndexes.includes(index)}
                              onChange={() => toggleSuggestion(index)}
                              className="mt-0.5 h-4 w-4"
                            />
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium capitalize mb-1">
                                {suggestion.section} Section
                              </p>
                              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                {suggestion.reason}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.priority}
                            </Badge>
                          </div>
                          {sourceResumeContent && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-6 mb-2 line-clamp-2">
                              Current: {getSectionPreview(sourceResumeContent, suggestion.section)}
                            </p>
                          )}
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 pl-6">
                            {suggestion.suggested}
                          </p>
                        </div>
                      ))}

                      <Button
                        className="w-full gap-2"
                        onClick={handleApplySelectedChanges}
                        disabled={applyingOptimization || selectedSuggestionIndexes.length === 0}
                      >
                        {applyingOptimization ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Applying selected changes...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Apply Selected Changes ({selectedSuggestionIndexes.length})
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  {optimization.recommended_changes.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {optimization.recommended_changes.map((change, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                            >
                              <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              {change}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
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
