'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ShaderBackground from '@/components/ui/shader-background';
import { Save, Eye, ArrowLeft, Sparkles, Download, Share2, QrCode, Copy, Check, ZoomIn, ZoomOut, Clock, Search, AlertCircle, Loader2, MoreVertical, CheckCircle2, XCircle, History } from 'lucide-react';
import { VersionHistoryPanel } from '@/features/editor/components/VersionHistoryPanel';
import { saveVersion } from '@/lib/version-history';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getCurrentUser } from '@/lib/auth/auth';
import {
  getActiveResumeVersion,
  createResumeVersion,
  updateResumeVersion,
} from '@/lib/database/resumes';
import { useEditorStore } from '@/lib/store/editor-store';
import { PersonalInfoForm } from '@/features/editor/components/PersonalInfoForm';
import { ExperienceForm } from '@/features/editor/components/ExperienceForm';
import { EducationForm } from '@/features/editor/components/EducationForm';
import { SkillsForm } from '@/features/editor/components/SkillsForm';
import { CustomSectionForm } from '@/features/editor/components/CustomSectionForm';
import { ModernTemplate } from '@/features/editor/templates/ModernTemplate';
import { AzurillTemplate } from '@/features/editor/templates/AzurillTemplate';
import { AcademicTemplate, generateLatexFromContent as generateLatexFromContentHelper } from '@/features/editor/templates/AcademicTemplate';
import { parseLatexToContent } from '@/features/editor/templates/latexParser';
import { useAppDarkModeState } from '@/hooks/use-app-dark-mode';
import type { ResumeContent, TemplateType, Job, CVOptimizationResult, Skill } from '@/types';

// Sanitize CV content loaded from localStorage – older/imported data may have
// skills in various partial shapes ({name,level}, {id,name}, plain strings).
function normalizeLoadedContent(raw: ResumeContent): ResumeContent {
  return {
    ...raw,
    skills: (raw.skills || []).map((s): Skill => {
      if (typeof s === 'string') {
        return { id: `s-${Math.random().toString(36).slice(2)}`, name: s, category: 'Technical', level: 'intermediate' };
      }
      const obj = s as Record<string, unknown>;
      return {
        id: (typeof obj.id === 'string' ? obj.id : null) || `s-${Math.random().toString(36).slice(2)}`,
        name: typeof obj.name === 'string' ? obj.name : '',
        category: typeof obj.category === 'string' ? obj.category : 'Technical',
        level: (['beginner', 'intermediate', 'advanced', 'expert'].includes(obj.level as string)
          ? obj.level
          : 'intermediate') as Skill['level'],
      };
    }),
  };
}

export default function EditorPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = params.id as string;

  const {
    currentVersion,
    content,
    isDirty,
    isSaving,
    setCurrentVersion,
    setContent,
    setIsSaving,
    setIsDirty,
  } = useEditorStore();

  const [loading, setLoading] = useState(false); // Set to false for development
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [linkExpiresAt, setLinkExpiresAt] = useState<string | null>(null);
  const [isProUser, setIsProUser] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ type: string; content: string } | null>(null);
  const [jobDescriptionForOptimization, setJobDescriptionForOptimization] = useState('');
  const [optimizeDialogOpen, setOptimizeDialogOpen] = useState(false);
  const [optimizeQuery, setOptimizeQuery] = useState('');
  const [optimizeLocation, setOptimizeLocation] = useState('');
  const [optimizeJobs, setOptimizeJobs] = useState<Job[]>([]);
  const [optimizeSearching, setOptimizeSearching] = useState(false);
  const [selectedOptimizeJob, setSelectedOptimizeJob] = useState<Job | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<CVOptimizationResult | null>(null);
  const [selectedSuggestionIndexes, setSelectedSuggestionIndexes] = useState<number[]>([]);
  const [applyingOptimization, setApplyingOptimization] = useState(false);
  // Step-by-step review mode
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<number[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [acceptedIndexes, setAcceptedIndexes] = useState<number[]>([]);
  const { isDark } = useAppDarkModeState();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('modern');
  const [zoomLevel, setZoomLevel] = useState(70);
  const [latexCode, setLatexCode] = useState<string>('');
  const [isParsingLatex, setIsParsingLatex] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const lastParsedLatex = useRef<string>('');
  const cvInnerRef = useRef<HTMLDivElement>(null);
  const [cvNativeHeight, setCvNativeHeight] = useState(1123);
  const [showHistory, setShowHistory] = useState(false);

  // Measure the actual rendered height of the CV inner content so the outer
  // wrapper grows correctly for multi-page CVs.
  useEffect(() => {
    const el = cvInnerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (cvInnerRef.current) {
        setCvNativeHeight(cvInnerRef.current.offsetHeight || 1123);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [content, selectedTemplate]);

  useEffect(() => {
    async function loadResumeVersion() {
      const user = await getCurrentUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      const mockEmail = user.email;

      // Load active version or create new one
      // let version = await getActiveResumeVersion(resumeId);

      // Mock version with demo content
      const mockContent: ResumeContent = {
        personal_info: {
          first_name: 'John',
          last_name: 'Doe',
          email: mockEmail,
          phone: '+1 555 123 4567',
          location: 'New York, USA',
          website: 'https://johndoe.com',
          linkedin: 'linkedin.com/in/ahmetyilmaz',
          github: 'github.com/ahmetyilmaz',
        },
        summary: 'Experienced Full Stack Developer. Expert in React, Node.js, and TypeScript.',
        experience: [
          {
            id: '1',
            company: 'ABC Technology',
            position: 'Senior Frontend Developer',
            location: 'New York, USA',
            start_date: '2022-01',
            end_date: '',
            is_current: true,
            description: 'Developing modern web applications using React and Next.js.',
            achievements: [
              'Improved web performance by 40%',
              'Mentored a team of 10+ people',
            ],
          },
          {
            id: '2',
            company: 'XYZ Software',
            position: 'Frontend Developer',
            location: 'Boston, USA',
            start_date: '2020-06',
            end_date: '2021-12',
            is_current: false,
            description: 'Developed SPA applications with Vue.js and React.',
          },
        ],
        education: [
          {
            id: '1',
            institution: 'Massachusetts Institute of Technology',
            degree: "Bachelor's",
            field: 'Computer Engineering',
            location: 'Cambridge, USA',
            start_date: '2016-09',
            end_date: '2020-06',
            is_current: false,
            gpa: '3.5/4.0',
          },
        ],
        skills: [
          { id: '1', name: 'React', category: 'Technical', level: 'expert' },
          { id: '2', name: 'TypeScript', category: 'Technical', level: 'advanced' },
          { id: '3', name: 'Next.js', category: 'Technical', level: 'advanced' },
          { id: '4', name: 'Node.js', category: 'Technical', level: 'intermediate' },
          { id: '5', name: 'Tailwind CSS', category: 'Technical', level: 'advanced' },
        ],
      };

      let initialContent = mockContent;

      try {
        const storedContent = localStorage.getItem(`resume-content-${resumeId}`);
        if (storedContent) {
          initialContent = normalizeLoadedContent(JSON.parse(storedContent) as ResumeContent);
        }
      } catch (error) {
        console.error('Failed to load stored resume content:', error);
      }

      const mockVersion = {
        id: resumeId,
        resume_id: resumeId,
        version_number: 1,
        template_type: 'modern' as const,
        is_active: true,
        content: initialContent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setCurrentVersion(mockVersion);
      setContent(initialContent);

      setLoading(false);
    }

    loadResumeVersion();
  }, [resumeId, router, setCurrentVersion, setContent]);

  // Auto-start review mode if navigated from jobs page with pending optimization
  useEffect(() => {
    if (!content || loading) return;
    const pendingReview = new URLSearchParams(window.location.search).get('pendingReview');
    if (pendingReview !== '1') return;

    const raw = localStorage.getItem('pendingOptimization');
    if (!raw) return;

    try {
      const { optimization, selectedIndexes, jobTitle, jobCompany } = JSON.parse(raw) as {
        optimization: CVOptimizationResult;
        selectedIndexes: number[];
        jobTitle: string;
        jobCompany: string;
        resumeId: string;
      };

      localStorage.removeItem('pendingOptimization');

      // Normalize skills arrays in case they contain old-format objects
      const normalizeOptResult = (r: CVOptimizationResult): CVOptimizationResult => ({
        ...r,
        missing_skills: (r.missing_skills || []).map((s) =>
          typeof s === 'string' ? s : (s as { name?: string })?.name ?? ''
        ).filter(Boolean),
        matching_skills: (r.matching_skills || []).map((s) =>
          typeof s === 'string' ? s : (s as { name?: string })?.name ?? ''
        ).filter(Boolean),
        top_keywords: (r.top_keywords || []).map((s) =>
          typeof s === 'string' ? s : (s as { name?: string })?.name ?? String(s)
        ).filter(Boolean),
      });

      // Set up fake job for history saving
      setSelectedOptimizeJob({ id: 'jobs-page', title: jobTitle, company: jobCompany } as Job);
      setOptimizationResult(normalizeOptResult(optimization));
      setSelectedSuggestionIndexes(selectedIndexes);

      // Start step-by-step review
      setReviewQueue([...selectedIndexes]);
      setReviewIndex(0);
      setAcceptedIndexes([]);
      setReviewMode(true);
    } catch (e) {
      console.error('Failed to load pending optimization:', e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, loading]);

  // Generate LaTeX code when content changes or academic template is selected
  useEffect(() => {
    if (content && selectedTemplate === 'academic' && !latexCode) {
      const generatedLatex = generateLatexFromContentHelper(content);
      setLatexCode(generatedLatex);
      lastParsedLatex.current = generatedLatex; // Mark as already parsed to avoid re-parsing
    }
  }, [content, selectedTemplate, latexCode]);

  // Manual sync function
  const syncLatexToCV = (silent = false) => {
    if (!latexCode || !content) return;
    
    setIsParsingLatex(true);
    
    try {
      const parsed = parseLatexToContent(latexCode);
      
      if (parsed) {
        // Merge parsed data with existing content
        const updatedContent: ResumeContent = {
          personal_info: {
            ...content.personal_info,
            ...parsed.personal_info,
          },
          summary: parsed.summary || content.summary,
          experience: parsed.experience && parsed.experience.length > 0 
            ? parsed.experience 
            : content.experience,
          education: parsed.education && parsed.education.length > 0 
            ? parsed.education 
            : content.education,
          skills: parsed.skills && parsed.skills.length > 0 
            ? parsed.skills 
            : content.skills,
        };
        
        lastParsedLatex.current = latexCode;
        setContent(updatedContent);
        setIsDirty(true);
        
        // Only show alert if not in silent mode (manual sync)
        if (!silent) {
          alert('✅ CV updated from LaTeX code!');
        }
      } else {
        if (!silent) {
          alert('⚠️ Could not parse LaTeX. Please check your syntax.');
        }
      }
    } catch (error) {
      console.error('Parse error:', error);
      if (!silent) {
        alert('❌ Error parsing LaTeX code.');
      }
    } finally {
      setIsParsingLatex(false);
    }
  };

  // Parse LaTeX and update content when LaTeX code changes (only if auto-sync enabled)
  useEffect(() => {
    if (!autoSync || selectedTemplate !== 'academic' || !latexCode) return;
    
    // Skip if this is the same LaTeX we already parsed
    if (latexCode === lastParsedLatex.current) return;

    const timeoutId = setTimeout(() => {
      syncLatexToCV(true); // true = silent mode, no popup
    }, 2000); // Debounce 2 seconds

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latexCode, selectedTemplate, autoSync]);

  const handleSave = async () => {
    if (!currentVersion || !content) return;

    setIsSaving(true);

    // Mock save for development
    // const updated = await updateResumeVersion(currentVersion.id, content);

    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 500));

    localStorage.setItem(`resume-content-${resumeId}`, JSON.stringify(content));

    // Snapshot to version history
    try {
      saveVersion(resumeId, content, 'Manual save');
    } catch { /* best-effort */ }

    setIsDirty(false);
    // TODO: Show success toast
    alert('CV saved successfully!');

    setIsSaving(false);
  };

  const handleDownloadPDF = async () => {
    if (!content) return;

    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          template: selectedTemplate,
          fileName: `cv-${resumeId}.pdf`,
          latexCode: selectedTemplate === 'academic' ? latexCode : undefined,
        }),
      });

      const data = await response.json();

      if (data.html) {
        // Create a blob from the HTML
        const blob = new Blob([data.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // Open print dialog
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.addEventListener('load', () => {
            printWindow.print();
          });
        }
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF');
    }
  };

  const handleGenerateQR = async () => {
    if (!showQR && content) {
      // Try to create shared link via API
      try {
        const response = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeId,
            content,
            template: selectedTemplate,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setShareUrl(data.shareUrl);
          setLinkExpiresAt(data.expiresAt);
          setIsProUser(data.isPro);
          
          // Generate QR code with shared link
          const qrImageUrl = `/api/qr?url=${encodeURIComponent(data.shareUrl)}&size=400`;
          setQrUrl(qrImageUrl);
        } else {
          // Fallback to base64 encoding if API fails
          console.warn('API failed, using fallback base64 encoding:', data);
          const cvDataString = JSON.stringify(content);
          const encodedData = btoa(unescape(encodeURIComponent(cvDataString)));
          const previewUrl = `${window.location.origin}/preview/demo/${resumeId}?data=${encodeURIComponent(encodedData)}&template=${selectedTemplate}`;
          setShareUrl(previewUrl);
          const qrImageUrl = `/api/qr?url=${encodeURIComponent(previewUrl)}&size=400`;
          setQrUrl(qrImageUrl);
        }
      } catch (error) {
        // Fallback to base64 encoding if API fails
        console.warn('API error, using fallback base64 encoding:', error);
        const cvDataString = JSON.stringify(content);
        const encodedData = btoa(unescape(encodeURIComponent(cvDataString)));
        const previewUrl = `${window.location.origin}/preview/demo/${resumeId}?data=${encodeURIComponent(encodedData)}&template=${selectedTemplate}`;
        setShareUrl(previewUrl);
        const qrImageUrl = `/api/qr?url=${encodeURIComponent(previewUrl)}&size=400`;
        setQrUrl(qrImageUrl);
      }
    }
    setShowQR(!showQR);
  };

  const handleCopyLink = async () => {
    if (!content) return;
    
    // Create shared link via API if not already created
    if (!shareUrl) {
      try {
        const response = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeId,
            content,
            template: selectedTemplate,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setShareUrl(data.shareUrl);
          setLinkExpiresAt(data.expiresAt);
          setIsProUser(data.isPro);
          navigator.clipboard.writeText(data.shareUrl);
        } else {
          // Fallback to base64 encoding if API fails
          console.warn('API failed, using fallback base64 encoding:', data);
          const cvDataString = JSON.stringify(content);
          const encodedData = btoa(unescape(encodeURIComponent(cvDataString)));
          const previewUrl = `${window.location.origin}/preview/demo/${resumeId}?data=${encodeURIComponent(encodedData)}&template=${selectedTemplate}`;
          setShareUrl(previewUrl);
          navigator.clipboard.writeText(previewUrl);
        }
      } catch (error) {
        // Fallback to base64 encoding if API fails
        console.warn('API error, using fallback base64 encoding:', error);
        const cvDataString = JSON.stringify(content);
        const encodedData = btoa(unescape(encodeURIComponent(cvDataString)));
        const previewUrl = `${window.location.origin}/preview/demo/${resumeId}?data=${encodeURIComponent(encodedData)}&template=${selectedTemplate}`;
        setShareUrl(previewUrl);
        navigator.clipboard.writeText(previewUrl);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
    }
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrUrl) return;
    
    // Create a temporary link to download the QR code image
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `cv-${resumeId}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOptimizeSearch = async () => {
    if (!optimizeQuery.trim()) return;

    setOptimizeSearching(true);
    setOptimizeJobs([]);
    try {
      const params = new URLSearchParams({
        keywords: optimizeQuery,
        location: optimizeLocation,
        employmentType: 'all',
        experienceLevel: 'all',
        datePosted: 'all',
        remoteOnly: 'false',
        limit: '10',
      });

      const response = await fetch(`/api/jobs/search?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        alert(payload?.error || 'Job search failed. Please try again.');
        return;
      }

      setOptimizeJobs(Array.isArray(payload.jobs) ? payload.jobs : []);
    } catch (error) {
      console.error('Job search error:', error);
      alert('Job search failed. Please try again.');
    } finally {
      setOptimizeSearching(false);
    }
  };

  const handleOptimizeForJob = async (job: Job) => {
    if (!content) return;

    setAiLoading(true);
    setOptimizationResult(null);
    setSelectedSuggestionIndexes([]);
    setSelectedOptimizeJob(job);
    setJobDescriptionForOptimization(job.description || '');

    try {
      const response = await fetch('/api/jobs/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: job.description,
          jobRequirements: job.requirements,
          jobSkills: job.skills,
          cvContent: content,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data?.error || 'Optimization failed. Please try again.');
        return;
      }

      setOptimizationResult(data.result as CVOptimizationResult);
      setSelectedSuggestionIndexes(
        (data.result?.suggestions || []).map((_: unknown, index: number) => index)
      );
    } catch (error) {
      console.error('Optimization error:', error);
      alert('Failed to optimize resume');
    } finally {
      setAiLoading(false);
    }
  };

  const toggleSuggestion = (index: number) => {
    setSelectedSuggestionIndexes((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    );
  };

  /** Start the step-by-step review flow for selected suggestions */
  const startReviewMode = () => {
    if (!optimizationResult || selectedSuggestionIndexes.length === 0) return;
    setReviewQueue([...selectedSuggestionIndexes]);
    setReviewIndex(0);
    setAcceptedIndexes([]);
    setReviewMode(true);
  };

  /** Accept the current suggestion in the review queue */
  const handleReviewAccept = () => {
    const idx = reviewQueue[reviewIndex];
    const nextAccepted = [...acceptedIndexes, idx];
    if (reviewIndex + 1 >= reviewQueue.length) {
      // Last one — finish
      setAcceptedIndexes(nextAccepted);
      finishReview(nextAccepted);
    } else {
      setAcceptedIndexes(nextAccepted);
      setReviewIndex(reviewIndex + 1);
    }
  };

  /** Skip the current suggestion in the review queue */
  const handleReviewSkip = () => {
    if (reviewIndex + 1 >= reviewQueue.length) {
      finishReview(acceptedIndexes);
    } else {
      setReviewIndex(reviewIndex + 1);
    }
  };

  /** Apply all accepted suggestions, save, and record history */
  const finishReview = async (finalAccepted: number[]) => {
    setReviewMode(false);
    if (!content || !optimizationResult) return;
    if (finalAccepted.length === 0) {
      // Nothing accepted — just close review
      return;
    }

    setApplyingOptimization(true);
    try {
      const updatedContent: ResumeContent = {
        ...content,
        experience: content.experience.map((exp) => ({ ...exp })),
        skills: [...content.skills],
      };

      for (const index of finalAccepted) {
        const suggestion = optimizationResult.suggestions[index];
        if (!suggestion) continue;

        if (suggestion.section === 'summary' && suggestion.suggested) {
          updatedContent.summary = suggestion.suggested;
        }

        if (suggestion.section === 'experience') {
          let targetIndex =
            suggestion.experience_index != null && suggestion.experience_index >= 0
              ? suggestion.experience_index
              : -1;

          if (targetIndex === -1 && suggestion.current) {
            const currentLower = suggestion.current.toLowerCase();
            targetIndex = updatedContent.experience.findIndex(
              (exp) =>
                exp.description?.toLowerCase().includes(currentLower.slice(0, 40)) ||
                exp.position?.toLowerCase().includes(currentLower.slice(0, 20))
            );
          }
          if (targetIndex === -1) targetIndex = 0;

          if (updatedContent.experience[targetIndex]) {
            updatedContent.experience[targetIndex] = {
              ...updatedContent.experience[targetIndex],
              description: suggestion.suggested,
            };
          }
        }

        if (suggestion.section === 'skills' && suggestion.suggested) {
          const newSkillNames = suggestion.suggested
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          for (const skillName of newSkillNames) {
            const alreadyExists = updatedContent.skills.some(
              (s) => s.name.toLowerCase() === skillName.toLowerCase()
            );
            if (!alreadyExists) {
              updatedContent.skills = [
                ...updatedContent.skills,
                {
                  id: crypto.randomUUID?.() || `skill-${Date.now()}-${Math.random()}`,
                  name: skillName,
                  category: 'Technical',
                  level: 'intermediate' as const,
                },
              ];
            }
          }
        }
      }

      // Add missing skills
      for (const skill of optimizationResult.missing_skills) {
        const clean = (typeof skill === 'string' ? skill : (skill as { name?: string })?.name ?? '').trim();
        if (!clean) continue;
        const alreadyExists = updatedContent.skills.some(
          (s) => s.name.toLowerCase() === clean.toLowerCase()
        );
        if (!alreadyExists) {
          updatedContent.skills = [
            ...updatedContent.skills,
            {
              id: crypto.randomUUID?.() || `missing-skill-${Date.now()}-${Math.random()}`,
              name: clean,
              category: 'Technical',
              level: 'intermediate' as const,
            },
          ];
        }
      }

      setContent(updatedContent);
      setIsDirty(true);

      if (currentVersion) {
        setIsSaving(true);
        try {
          await new Promise((resolve) => setTimeout(resolve, 300));
          localStorage.setItem(`resume-content-${resumeId}`, JSON.stringify(updatedContent));

          // Snapshot to version history
          try {
            const jt = selectedOptimizeJob?.title || 'Unknown Job';
            const co = selectedOptimizeJob?.company || '';
            const ms = optimizationResult.job_match_score;
            saveVersion(
              resumeId,
              updatedContent,
              co ? `Optimized for ${co} – ${jt}` : `Optimized for ${jt}`,
              { jobTitle: jt, company: co, matchScore: ms }
            );
          } catch { /* best-effort */ }

          setIsDirty(false);
        } finally {
          setIsSaving(false);
        }
      }

      // Save optimization history record
      try {
        const historyEntry = {
          id: crypto.randomUUID?.() || `opt-${Date.now()}`,
          timestamp: new Date().toISOString(),
          resumeId,
          jobTitle: selectedOptimizeJob?.title || 'Unknown Job',
          company: selectedOptimizeJob?.company || '',
          jobLocation: selectedOptimizeJob?.location || '',
          matchScore: optimizationResult.job_match_score,
          appliedChanges: finalAccepted.map((i) => ({
            section: optimizationResult.suggestions[i]?.section,
            current: optimizationResult.suggestions[i]?.current || '',
            suggested: optimizationResult.suggestions[i]?.suggested || '',
            reason: optimizationResult.suggestions[i]?.reason || '',
          })),
          totalSuggestions: optimizationResult.suggestions.length,
        };
        const prev = JSON.parse(localStorage.getItem('cs-optimization-history') || '[]');
        localStorage.setItem('cs-optimization-history', JSON.stringify([historyEntry, ...prev].slice(0, 50)));
      } catch {
        // history save is best-effort
      }

      setOptimizationResult(null);
      setSelectedSuggestionIndexes([]);
    } finally {
      setApplyingOptimization(false);
    }
  };

  const handleRestoreVersion = (restoredContent: ResumeContent, versionLabel: string) => {
    if (!content) return;
    // Snapshot current state first so the user can undo the restore
    try {
      saveVersion(resumeId, content, `Auto-save before restoring "${versionLabel}"`);
    } catch { /* best-effort */ }
    setContent(restoredContent);
    localStorage.setItem(`resume-content-${resumeId}`, JSON.stringify(restoredContent));
    setIsDirty(false);
    // Snapshot the restored state too
    try {
      saveVersion(resumeId, restoredContent, `Restored: ${versionLabel}`);
    } catch { /* best-effort */ }
  };

  const handleAIOptimize = async () => {
    if (!selectedOptimizeJob) {
      setOptimizeDialogOpen(true);
      return;
    }

    await handleOptimizeForJob(selectedOptimizeJob);
  };

  const handleAIExtractKeywords = async () => {
    if (!content) return;

    setAiLoading(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extract-keywords',
          resumeContent: content,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Extract JSON from Groq response which may contain wrapping text
        let jsonContent = data.result;
        
        // Try to extract JSON if it's wrapped in markdown code blocks or text
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
        }
        
        setAiResult({
          type: 'keywords',
          content: jsonContent,
        });
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Keyword extraction error:', error);
      alert('Failed to extract keywords');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        <div className="w-10 h-10 border-4 border-black border-t-[#FF3000] animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative ${isDark ? 'dark' : ''} bg-white text-black`}>
      <ShaderBackground isDark={isDark} />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
              <Button 
                onClick={() => router.push('/dashboard')} 
                size="sm"
                variant="outline"
                className="gap-2 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="min-w-0">
                <h1 className="text-base font-black uppercase tracking-widest leading-none">
                  Edit CV
                </h1>
                {isDirty && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF3000] mt-0.5">Unsaved changes</p>
                )}
              </div>
              
              {/* Template Selector */}
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <label htmlFor="template-select" className="text-xs font-black uppercase tracking-widest whitespace-nowrap">
                  Template:
                </label>
                <select
                  id="template-select"
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value as TemplateType)}
                  className="px-3 py-1.5 text-xs font-black uppercase tracking-widest border-2 border-black bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#FF3000]"
                >
                  <option value="modern">Modern</option>
                  <option value="azurill">Azurill</option>
                  <option value="academic">Academic (LaTeX)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="secondary" className="gap-2" onClick={() => setOptimizeDialogOpen(true)}>
                <img src="/meta-llama.png" alt="AI" className="w-4 h-4 object-contain" />
                <span className="hidden md:inline">Optimize</span>
              </Button>
              <Button size="sm" variant="secondary" className="gap-2" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">PDF</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="border-2 border-black h-9 w-9 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={handleAIExtractKeywords} disabled={aiLoading}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Extract Keywords
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCopyLink}>
                    {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleGenerateQR}>
                    <QrCode className="mr-2 h-4 w-4" />
                    QR Code
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                variant="outline"
                className="border-2 border-black gap-2"
                onClick={() => setShowHistory(true)}
              >
                <History className="w-4 h-4" />
                <span className="hidden md:inline">History</span>
              </Button>
              <Button onClick={handleSave} disabled={!isDirty || isSaving} size="sm" variant="accent" className="gap-2">
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 min-h-screen">
      {/* Editor Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Features Modal */}
        {aiResult?.type === 'keywords' && (
          <div className="mb-8 border-4 border-black bg-white">
            <div className="p-5 border-b-2 border-black flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FF3000]" />
                <p className="text-base font-black uppercase tracking-widest">AI Keywords</p>
              </div>
              <Button variant="outline" size="sm" className="border-2 border-black h-8 w-8 p-0" onClick={() => setAiResult(null)}>✕</Button>
            </div>
            <div className="p-5 space-y-4">
              {(() => {
                try {
                  const parsed = typeof aiResult.content === 'string'
                    ? JSON.parse(aiResult.content)
                    : aiResult.content;

                  const allKeywords = [
                    ...(parsed.technicalSkills || []),
                    ...(parsed.softSkills || []),
                    ...(parsed.tools || []),
                    ...(parsed.keywords || []),
                  ];

                  return (
                    <>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-3">Extracted Keywords</p>
                        <div className="flex flex-wrap gap-2">
                          {allKeywords.map((keyword, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-3 py-1 border-2 border-black bg-[#F2F2F2] text-black text-xs font-bold uppercase tracking-widest"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                      {parsed.summary && (
                        <div className="border-2 border-black bg-[#F2F2F2] p-3">
                          <p className="text-xs text-black/70">
                            <span className="font-black uppercase tracking-widest">Summary: </span>
                            {parsed.summary}
                          </p>
                        </div>
                      )}
                      <Button
                        onClick={() => {
                          const keywordText = allKeywords.join(', ');
                          navigator.clipboard.writeText(keywordText);
                          alert('Keywords copied to clipboard!');
                        }}
                        variant="outline"
                        className="w-full gap-2 border-2 border-black"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Keywords
                      </Button>
                    </>
                  );
                } catch (error) {
                  console.error('Failed to parse keywords:', error);
                  return (
                    <div className="text-xs text-black/70">
                      Failed to parse keywords. Raw response:
                      <pre className="mt-2 p-2 border-2 border-black bg-[#F2F2F2] text-xs overflow-auto">
                        {aiResult.content}
                      </pre>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        )}

        {optimizationResult && (
          <div className="mb-8 border-4 border-black bg-white relative">

            {/* ── Step-by-step review overlay ── */}
            {reviewMode && (() => {
              const currentSuggestion = optimizationResult.suggestions[reviewQueue[reviewIndex]];
              if (!currentSuggestion) return null;
              const sectionLabel =
                currentSuggestion.section === 'experience' && currentSuggestion.experience_index != null
                  ? `Experience #${currentSuggestion.experience_index + 1}`
                  : currentSuggestion.section.charAt(0).toUpperCase() + currentSuggestion.section.slice(1);
              return (
                <div className="absolute inset-0 z-20 bg-white flex flex-col border-4 border-black overflow-y-auto">
                  {/* Review header */}
                  <div className="p-4 border-b-2 border-black bg-black text-white flex items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-[#FF3000]" />
                      <span className="text-sm font-black uppercase tracking-widest">Review Changes</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black uppercase tracking-widest text-white/70">
                        {reviewIndex + 1} / {reviewQueue.length}
                      </span>
                      <button
                        className="text-xs font-black uppercase tracking-widest text-white/50 hover:text-white"
                        onClick={() => setReviewMode(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 bg-[#F2F2F2] border-b border-black shrink-0">
                    <div
                      className="h-full bg-[#FF3000] transition-all"
                      style={{ width: `${((reviewIndex) / reviewQueue.length) * 100}%` }}
                    />
                  </div>

                  <div className="p-5 flex-1 space-y-4">
                    {/* Section + meta badges */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border-2 border-black">{sectionLabel}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border border-black/40 text-black/60">{currentSuggestion.impact || 'Relevance'}</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border ${
                        currentSuggestion.priority === 'high' ? 'border-[#FF3000] text-[#FF3000]' : 'border-black/40 text-black/40'
                      }`}>{currentSuggestion.priority}</span>
                    </div>

                    {/* Reason */}
                    <p className="text-xs font-bold uppercase tracking-widest text-black/60">{currentSuggestion.reason}</p>

                    {/* Current text — red */}
                    {currentSuggestion.current ? (
                      <div className="border-2 border-[#FF3000] bg-[#FF3000]/5 p-3 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#FF3000] mb-1">Current Text (will be replaced)</p>
                        <p className="text-xs text-black leading-relaxed whitespace-pre-wrap">{currentSuggestion.current}</p>
                      </div>
                    ) : (
                      <div className="border-2 border-[#FF3000]/40 bg-[#FF3000]/5 p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#FF3000]/60 mb-1">Current Text</p>
                        <p className="text-xs text-black/40 italic">— empty / not set —</p>
                      </div>
                    )}

                    {/* Suggested text — green */}
                    <div className="border-2 border-green-600 bg-green-50 p-3 space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-green-700 mb-1">Suggested Replacement</p>
                      <p className="text-xs text-black leading-relaxed whitespace-pre-wrap">{currentSuggestion.suggested}</p>
                    </div>

                    {/* Accept / Skip buttons */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        style={{ backgroundColor: '#16a34a', color: 'white', borderColor: '#16a34a' }}
                        className="flex-1 gap-2 border-2 font-black uppercase tracking-widest text-xs hover:opacity-90"
                        onClick={handleReviewAccept}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 gap-2 border-2 border-black font-black uppercase tracking-widest text-xs hover:bg-[#FF3000] hover:text-white hover:border-[#FF3000]"
                        onClick={handleReviewSkip}
                      >
                        <XCircle className="w-4 h-4" />
                        Skip
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}
            {/* Header */}
            <div className="p-5 border-b-2 border-black flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Sparkles className="w-5 h-5 text-[#FF3000]" />
                  <p className="text-base font-black uppercase tracking-widest">
                    {optimizationResult.job_title_detected ? `Optimized for: ${optimizationResult.job_title_detected}` : 'Job Optimization'}
                  </p>
                </div>
                {selectedOptimizeJob && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 mt-1">
                    {selectedOptimizeJob.title} at {selectedOptimizeJob.company}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`border-2 text-xs font-black uppercase tracking-widest px-2 py-0.5 ${
                    optimizationResult.job_match_score >= 70
                      ? 'border-black bg-black text-white'
                      : optimizationResult.job_match_score >= 40
                      ? 'border-black bg-[#F2F2F2] text-black'
                      : 'border-[#FF3000] bg-[#FF3000] text-white'
                  }`}
                >
                  {optimizationResult.job_match_score}% Match
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-2 border-black h-8 w-8 p-0"
                  onClick={() => { setOptimizationResult(null); setSelectedSuggestionIndexes([]); }}
                >
                  ✕
                </Button>
              </div>
            </div>

            <div className="p-5 space-y-6">
              {/* Match Breakdown */}
              {optimizationResult.match_breakdown && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3">Match Breakdown</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(
                      [
                        { label: 'Keywords', value: optimizationResult.match_breakdown.keywords },
                        { label: 'Experience', value: optimizationResult.match_breakdown.experience },
                        { label: 'Skills', value: optimizationResult.match_breakdown.skills },
                        { label: 'Summary', value: optimizationResult.match_breakdown.summary },
                      ] as { label: string; value: number }[]
                    ).map(({ label, value }) => (
                      <div key={label} className="border-2 border-black p-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-black/60 mb-1">{label}</p>
                        <div className="h-1.5 bg-[#F2F2F2] border border-black mb-1">
                          <div
                            className={`h-full ${value >= 70 ? 'bg-black' : value >= 40 ? 'bg-black/50' : 'bg-[#FF3000]'}`}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                        <p className="text-xs font-black">{value}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Keywords */}
              {optimizationResult.top_keywords && optimizationResult.top_keywords.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest">Critical Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {optimizationResult.top_keywords.map((kw) => {
                      const kwStr = typeof kw === 'string' ? kw : (kw as { name?: string })?.name ?? '';
                      const inCV =
                        optimizationResult.matching_skills.some(
                          (s) => (typeof s === 'string' ? s : (s as { name?: string })?.name ?? '').toLowerCase() === kwStr.toLowerCase()
                        ) ||
                        (content?.summary || '').toLowerCase().includes(kwStr.toLowerCase()) ||
                        (content?.experience || []).some((e) =>
                          e.description?.toLowerCase().includes(kwStr.toLowerCase())
                        );
                      return (
                        <span
                          key={kwStr}
                          className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 border-2 ${
                            inCV
                              ? 'border-black bg-black text-white'
                              : 'border-[#FF3000] text-[#FF3000]'
                          }`}
                        >
                          {inCV ? '✓ ' : '✗ '}{kwStr}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              {optimizationResult.missing_skills.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest">Missing Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {optimizationResult.missing_skills.map((skill, idx) => {
                      const skillStr = typeof skill === 'string' ? skill : (skill as { name?: string })?.name ?? '';
                      return (
                        <span
                          key={`${skillStr}-${idx}`}
                          className="border-2 border-[#FF3000] text-[#FF3000] text-xs font-black uppercase tracking-widest px-2 py-0.5"
                        >
                          {skillStr}
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-[10px] font-bold text-black/50 uppercase tracking-widest">
                    These will be added to your Skills section when you apply changes.
                  </p>
                </div>
              )}

              {/* Suggestions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    AI Suggestions ({optimizationResult.suggestions.length})
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="text-[9px] font-black uppercase tracking-widest underline"
                      onClick={() =>
                        setSelectedSuggestionIndexes(
                          optimizationResult.suggestions.map((_, i) => i)
                        )
                      }
                    >
                      Select All
                    </button>
                    <span className="text-[9px] text-black/30">|</span>
                    <button
                      className="text-[9px] font-black uppercase tracking-widest underline"
                      onClick={() => setSelectedSuggestionIndexes([])}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {optimizationResult.suggestions.map((suggestion, index) => {
                  const isSelected = selectedSuggestionIndexes.includes(index);
                  const sectionLabel =
                    suggestion.section === 'experience' && suggestion.experience_index != null
                      ? `Experience #${suggestion.experience_index + 1}`
                      : suggestion.section.charAt(0).toUpperCase() + suggestion.section.slice(1);
                  const impactColors: Record<string, string> = {
                    ATS: 'border-[#FF3000] text-[#FF3000]',
                    Readability: 'border-black text-black',
                    Relevance: 'border-black/50 text-black/50',
                  };
                  const impactLabel = suggestion.impact || 'Relevance';
                  return (
                    <div
                      key={`${suggestion.section}-${index}`}
                      className={`border-2 cursor-pointer transition-colors ${
                        isSelected ? 'border-black bg-black text-white' : 'border-black bg-[#F2F2F2] text-black'
                      }`}
                      onClick={() => toggleSuggestion(index)}
                    >
                      <div className="p-3">
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="mt-0.5 h-4 w-4 accent-black shrink-0 pointer-events-none"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                              <span
                                className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border ${
                                  isSelected ? 'border-white text-white' : 'border-black text-black'
                                }`}
                              >
                                {sectionLabel}
                              </span>
                              <span
                                className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border ${
                                  isSelected
                                    ? 'border-white/60 text-white/70'
                                    : impactColors[impactLabel]
                                }`}
                              >
                                {impactLabel}
                              </span>
                              <span
                                className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border ${
                                  suggestion.priority === 'high'
                                    ? isSelected
                                      ? 'border-white text-white'
                                      : 'border-[#FF3000] text-[#FF3000]'
                                    : isSelected
                                    ? 'border-white/60 text-white/70'
                                    : 'border-black/40 text-black/40'
                                }`}
                              >
                                {suggestion.priority}
                              </span>
                            </div>
                            <p
                              className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${
                                isSelected ? 'text-white/80' : 'text-black/60'
                              }`}
                            >
                              {suggestion.reason}
                            </p>
                            {suggestion.current && (
                              <div
                                className={`text-[10px] border-l-2 pl-2 mb-2 ${
                                  isSelected ? 'border-white/40 text-white/50' : 'border-black/30 text-black/40'
                                }`}
                              >
                                <span className="font-black uppercase">Current: </span>
                                {suggestion.current.length > 120
                                  ? suggestion.current.slice(0, 120) + '…'
                                  : suggestion.current}
                              </div>
                            )}
                            <div
                              className={`text-xs border-l-2 pl-2 ${
                                isSelected ? 'border-white text-white' : 'border-black text-black'
                              }`}
                            >
                              <span className="font-black uppercase text-[10px] block mb-0.5">Suggested:</span>
                              {suggestion.suggested.length > 200
                                ? suggestion.suggested.slice(0, 200) + '…'
                                : suggestion.suggested}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recommended Changes */}
              {optimizationResult.recommended_changes.length > 0 && (
                <div className="border-2 border-black bg-[#F2F2F2] p-3 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2">
                    Strategic Recommendations
                  </p>
                  {optimizationResult.recommended_changes.map((rec, i) => (
                    <p key={i} className="text-xs text-black/70 flex gap-2">
                      <span className="font-black text-black shrink-0">{i + 1}.</span>
                      {rec}
                    </p>
                  ))}
                </div>
              )}

              <Button
                variant="accent"
                className="w-full gap-2"
                onClick={startReviewMode}
                disabled={applyingOptimization || selectedSuggestionIndexes.length === 0}
              >
                {applyingOptimization ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Applying & saving…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Review & Apply {selectedSuggestionIndexes.length} Change{selectedSuggestionIndexes.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <Dialog open={optimizeDialogOpen} onOpenChange={setOptimizeDialogOpen}>
          <DialogContent className="sm:max-w-3xl border-4 border-black">
            <DialogHeader>
              <DialogTitle className="font-black uppercase tracking-widest">Optimize CV for a Job</DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-black/60">
                Search jobs and pick one to tailor this CV.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_auto]">
                <div className="space-y-2">
                  <Label htmlFor="optimize-query">Job title or keywords</Label>
                  <Input
                    id="optimize-query"
                    value={optimizeQuery}
                    onChange={(e) => setOptimizeQuery(e.target.value)}
                    placeholder="e.g., Frontend Developer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="optimize-location">Location (optional)</Label>
                  <Input
                    id="optimize-location"
                    value={optimizeLocation}
                    onChange={(e) => setOptimizeLocation(e.target.value)}
                    placeholder="e.g., Remote, London"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleOptimizeSearch} disabled={optimizeSearching} className="gap-2">
                    {optimizeSearching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {optimizeJobs.length === 0 && (
                  <p className="text-sm text-zinc-500">Search for a job to see results.</p>
                )}
                {optimizeJobs.map((job) => (
                  <div
                    key={job.id}
                    className={`border-2 p-4 cursor-pointer transition-colors ${
                      selectedOptimizeJob?.id === job.id
                        ? 'border-black bg-black text-white'
                        : 'border-black bg-white hover:bg-[#F2F2F2]'
                    }`}
                    onClick={() => setSelectedOptimizeJob(job)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-sm font-black uppercase tracking-widest ${selectedOptimizeJob?.id === job.id ? 'text-white' : 'text-black'}`}>{job.title}</p>
                        <p className={`text-xs font-bold uppercase tracking-widest mt-0.5 ${selectedOptimizeJob?.id === job.id ? 'text-white/70' : 'text-black/60'}`}>
                          {job.company} · {job.location}
                        </p>
                      </div>
                      <span className={`border text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 shrink-0 ${selectedOptimizeJob?.id === job.id ? 'border-white text-white' : 'border-black text-black'}`}>{job.source}</span>
                    </div>
                    <p className={`mt-2 text-xs line-clamp-2 ${selectedOptimizeJob?.id === job.id ? 'text-white/70' : 'text-black/60'}`}>
                      {job.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOptimizeDialogOpen(false)}>Cancel</Button>
              <Button
                variant="accent"
                onClick={async () => {
                  if (!selectedOptimizeJob) return;
                  setOptimizeDialogOpen(false);
                  await handleOptimizeForJob(selectedOptimizeJob);
                }}
                disabled={!selectedOptimizeJob || aiLoading}
              >
                {aiLoading ? 'Optimizing...' : 'Optimize Selected Job'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* QR Code */}
        {showQR && qrUrl && (
          <div className="mb-8 border-4 border-black bg-white">
            <div className="p-5 border-b-2 border-black flex items-center justify-between">
              <p className="text-base font-black uppercase tracking-widest">Share Your CV</p>
              <Button variant="outline" size="sm" className="border-2 border-black h-8 w-8 p-0" onClick={() => setShowQR(false)}>✕</Button>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap items-start gap-8">
                <div>
                  <img src={qrUrl} alt="QR Code" className="w-64 h-64 border-4 border-black" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 text-center mt-3">Scan to preview your CV</p>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <p className="text-base font-black uppercase tracking-widest mb-2">Share this CV</p>
                  <p className="text-xs font-bold text-black/60 mb-4">
                    Share your CV with employers or print it on your application materials.
                  </p>
                  {linkExpiresAt && !isProUser && (
                    <div className="border-2 border-black bg-[#F2F2F2] p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div className="text-xs">
                          <p className="font-black uppercase tracking-widest mb-1">
                            Link expires in {Math.ceil((new Date(linkExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                          </p>
                          <p className="text-black/60">Upgrade to Pro for permanent links that never expire</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {isProUser && (
                    <div className="border-2 border-black bg-black text-white p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p className="text-xs font-black uppercase tracking-widest">Permanent Link — Never Expires</p>
                      </div>
                    </div>
                  )}
                  <div className="border-2 border-black bg-[#F2F2F2] p-3 mb-4 text-xs font-mono break-all text-black">
                    {shareUrl || `${window.location.origin}/share/...`}
                  </div>
                  <Button onClick={handleDownloadQR} variant="accent" className="w-full gap-2">
                    <Download className="w-4 h-4" />
                    Download QR Code
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Forms or LaTeX Editor */}
          <div className="space-y-6">
            {selectedTemplate === 'academic' ? (
              // LaTeX Editor for Academic Template
              <div className="border-4 border-black bg-white">
                <div className="p-5 border-b-2 border-black">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <p className="text-base font-black uppercase tracking-widest">LaTeX Editor</p>
                    {isParsingLatex && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF3000]">Updating...</span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 mt-1">
                    Write your CV in LaTeX format. Use the sync button to update the preview.
                  </p>
                </div>
                <div className="p-5">
                  <textarea
                    value={latexCode}
                    onChange={(e) => setLatexCode(e.target.value)}
                    placeholder="Enter your LaTeX code here..."
                    className="w-full h-[600px] px-4 py-3 border-2 border-black bg-[#F2F2F2] text-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3000] resize-none"
                    spellCheck={false}
                  />
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Write LaTeX freely. Supported: \section, \textbf, \textit, \item, \href, etc.</span>
                    </div>
                    
                    {/* Auto-sync toggle card */}
                    <div className={`flex items-center gap-3 p-3 border-2 border-black transition-all ${
                      autoSync 
                        ? 'bg-black text-white' 
                        : 'bg-[#F2F2F2]'
                    }`}>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="auto-sync"
                          checked={autoSync}
                          onChange={(e) => setAutoSync(e.target.checked)}
                          className="w-4 h-4 cursor-pointer accent-black"
                        />
                      </div>
                      <label htmlFor="auto-sync" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className={`text-xs font-black uppercase tracking-widest ${autoSync ? 'text-white' : 'text-black'}`}>
                            Auto-sync
                          </span>
                          {autoSync && (
                            <span className="inline-flex items-center px-2 py-0.5 border border-white text-[9px] font-black uppercase tracking-widest text-white">
                              Active
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 ${autoSync ? 'text-white/70' : 'text-black/60'}`}>
                          {autoSync 
                            ? 'Preview updates automatically after 2s of typing'
                            : 'Use "Sync to CV" button to update preview manually'
                          }
                        </p>
                      </label>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      onClick={() => syncLatexToCV(false)}
                      disabled={isParsingLatex}
                      variant="accent"
                      className="gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {isParsingLatex ? 'Syncing...' : 'Sync to CV'}
                    </Button>
                    <Button
                      onClick={() => {
                        if (content) {
                          const generated = generateLatexFromContentHelper(content);
                          setLatexCode(generated);
                          lastParsedLatex.current = generated;
                        }
                      }}
                      variant="outline"
                      className="gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Generate from CV
                    </Button>
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(latexCode);
                        alert('LaTeX code copied to clipboard!');
                      }}
                      variant="outline"
                      className="gap-2"
                      disabled={!latexCode}
                    >
                      <Copy className="w-4 h-4" />
                      Copy LaTeX
                    </Button>
                  </div>
                  
                  {/* LaTeX Syntax Help */}
                  <details className="mt-4 text-xs">
                    <summary className="cursor-pointer text-blue-600 dark:text-blue-400 font-medium">
                      📖 LaTeX Syntax Guide & Examples
                    </summary>
                    <div className="mt-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-md space-y-2 text-zinc-700 dark:text-zinc-300">
                      <div>
                        <p className="font-semibold mb-2">Basic Formatting:</p>
                        <p><strong>Headers:</strong> <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">\section*{"{Title}"}</code></p>
                        <p><strong>Bold:</strong> <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">\textbf{"{text}"}</code></p>
                        <p><strong>Italic:</strong> <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">\textit{"{text}"}</code></p>
                        <p><strong>Link:</strong> <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">\href{"{url}"}{"{text}"}</code></p>
                        <p><strong>Line break:</strong> <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">\\</code> or <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">\\\\</code></p>
                      </div>
                      
                      <div className="pt-2 border-t border-zinc-300 dark:border-zinc-600">
                        <p className="font-semibold mb-2">Lists:</p>
                        <pre className="bg-zinc-200 dark:bg-zinc-700 px-2 py-1 rounded text-xs overflow-x-auto">
{`\\begin{itemize}
  \\item First item
  \\item Second item
\\end{itemize}`}
                        </pre>
                      </div>
                      
                      <div className="pt-2 border-t border-zinc-300 dark:border-zinc-600">
                        <p className="font-semibold mb-2">Custom Section Example:</p>
                        <pre className="bg-zinc-200 dark:bg-zinc-700 px-2 py-1 rounded text-xs overflow-x-auto">
{`\\section*{Publications}
\\textbf{Paper Title} \\hfill 2024\\\\
\\textit{Conference Name}

\\section*{Awards}
\\begin{itemize}
  \\item Best Paper Award - IEEE 2024
  \\item Research Grant - NSF 2023
\\end{itemize}`}
                        </pre>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-zinc-300 dark:border-zinc-600">
                        <p className="text-blue-600 dark:text-blue-400 font-medium">💡 Pro Tips:</p>
                        <ul className="list-disc list-inside space-y-1 mt-1">
                          <li>Write ANY LaTeX - all sections will appear in preview!</li>
                          <li>Use <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">\section*{"{}"}</code> for custom sections</li>
                          <li>Click "Sync to CV" to update preview (or enable auto-sync)</li>
                          <li>Copy LaTeX to Overleaf for compilation → PDF export</li>
                        </ul>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-zinc-300 dark:border-zinc-600">
                        <p className="text-amber-600 dark:text-amber-400 font-medium">⚠️ VS Code Users:</p>
                        <p className="mt-1">If you see "LaTeX Workshop is incompatible with vscode-pdf" error:</p>
                        <ul className="list-disc list-inside space-y-1 mt-1">
                          <li>Disable "vscode-pdf" extension, OR</li>
                          <li>Disable "LaTeX Workshop" extension</li>
                          <li>Choose one based on your needs</li>
                        </ul>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            ) : (
              // Regular Forms for Other Templates
              <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-5 h-10 border-2 border-black bg-[#F2F2F2] rounded-none p-0">
                <TabsTrigger value="personal" className="text-[9px] font-black uppercase tracking-widest rounded-none data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none">Personal</TabsTrigger>
                <TabsTrigger value="experience" className="text-[9px] font-black uppercase tracking-widest rounded-none data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none">Exp.</TabsTrigger>
                <TabsTrigger value="education" className="text-[9px] font-black uppercase tracking-widest rounded-none data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none">Edu.</TabsTrigger>
                <TabsTrigger value="skills" className="text-[9px] font-black uppercase tracking-widest rounded-none data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none">Skills</TabsTrigger>
                <TabsTrigger value="custom" className="text-[9px] font-black uppercase tracking-widest rounded-none data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none">Custom</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <div className="border-4 border-black bg-white">
                  <div className="p-5 border-b-2 border-black">
                    <p className="text-base font-black uppercase tracking-widest">Personal Information</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 mt-1">Enter your contact information and social media profiles</p>
                  </div>
                  <div className="p-5"><PersonalInfoForm /></div>
                </div>
              </TabsContent>

              <TabsContent value="experience" className="space-y-4">
                <div className="border-4 border-black bg-white">
                  <div className="p-5 border-b-2 border-black">
                    <p className="text-base font-black uppercase tracking-widest">Work Experience</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 mt-1">Add your professional work experience</p>
                  </div>
                  <div className="p-5"><ExperienceForm /></div>
                </div>
              </TabsContent>

              <TabsContent value="education" className="space-y-4">
                <div className="border-4 border-black bg-white">
                  <div className="p-5 border-b-2 border-black">
                    <p className="text-base font-black uppercase tracking-widest">Education</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 mt-1">Add your education background and certificates</p>
                  </div>
                  <div className="p-5"><EducationForm /></div>
                </div>
              </TabsContent>

              <TabsContent value="skills" className="space-y-4">
                <div className="border-4 border-black bg-white">
                  <div className="p-5 border-b-2 border-black">
                    <p className="text-base font-black uppercase tracking-widest">Skills</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 mt-1">List your technical and soft skills</p>
                  </div>
                  <div className="p-5"><SkillsForm /></div>
                </div>
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                <div className="border-4 border-black bg-white">
                  <div className="p-5 border-b-2 border-black">
                    <p className="text-base font-black uppercase tracking-widest">Custom Sections</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 mt-1">Add sections like Awards, Publications, Volunteer Work, etc.</p>
                  </div>
                  <div className="p-5"><CustomSectionForm /></div>
                </div>
              </TabsContent>
            </Tabs>
            )}
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="border-4 border-black bg-white">
              <div className="p-4 border-b-2 border-black flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Preview</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 mt-0.5">Live A4 preview</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setZoomLevel(Math.max(40, zoomLevel - 10))} disabled={zoomLevel <= 40} className="h-8 w-8 p-0 border-2 border-black">
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-[10px] font-black uppercase tracking-widest min-w-[3rem] text-center">{zoomLevel}%</span>
                  <Button size="sm" variant="outline" onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} disabled={zoomLevel >= 150} className="h-8 w-8 p-0 border-2 border-black">
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setZoomLevel(70)} className="h-8 px-2 text-[10px] border-2 border-black font-black uppercase tracking-widest">
                    Fit
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-[#F2F2F2] flex justify-center overflow-auto">
                <div
                  style={{
                    width: Math.round(794 * zoomLevel / 100) + 'px',
                    height: Math.round(cvNativeHeight * zoomLevel / 100) + 'px',
                    flexShrink: 0,
                    position: 'relative',
                  }}
                >
                  <div
                    ref={cvInnerRef}
                    style={{
                      transform: `scale(${zoomLevel / 100})`,
                      transformOrigin: 'top left',
                      width: '794px',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  >
                    {content ? (
                      selectedTemplate === 'azurill' ? (
                        <AzurillTemplate content={content} />
                      ) : selectedTemplate === 'academic' ? (
                        <AcademicTemplate 
                          content={content} 
                          latexCode={latexCode}
                          onLatexChange={setLatexCode}
                          hideLatexCode={true}
                        />
                      ) : (
                        <ModernTemplate content={content} />
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[1123px] text-center">
                        <Eye className="w-12 h-12 mb-4 text-black/30" />
                        <p className="text-xs font-bold uppercase tracking-widest text-black/40">Waiting for CV content</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>

      <VersionHistoryPanel
        open={showHistory}
        onClose={() => setShowHistory(false)}
        resumeId={resumeId}
        currentContent={content}
        onRestore={handleRestoreVersion}
        isDark={isDark}
      />
    </div>
  );
}
