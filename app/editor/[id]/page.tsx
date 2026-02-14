'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ShaderBackground from '@/components/ui/shader-background';
import { Save, Eye, ArrowLeft, Sparkles, Download, Share2, QrCode, Copy, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { ModernTemplate } from '@/features/editor/templates/ModernTemplate';
import { AzurillTemplate } from '@/features/editor/templates/AzurillTemplate';
import { AcademicTemplate, generateLatexFromContent as generateLatexFromContentHelper } from '@/features/editor/templates/AcademicTemplate';
import { parseLatexToContent } from '@/features/editor/templates/latexParser';
import { useAppDarkModeState } from '@/hooks/use-app-dark-mode';
import type { ResumeContent, TemplateType } from '@/types';

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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ type: string; content: string } | null>(null);
  const [jobDescriptionForOptimization, setJobDescriptionForOptimization] = useState('');
  const { isDark } = useAppDarkModeState();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('modern');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [latexCode, setLatexCode] = useState<string>('');
  const [isParsingLatex, setIsParsingLatex] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const lastParsedLatex = useRef<string>('');

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
          initialContent = JSON.parse(storedContent) as ResumeContent;
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

    setIsDirty(false);
    // TODO: Show success toast
    alert('CV kaydedildi!');

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
      alert('PDF indirme başarısız oldu');
    }
  };

  const handleGenerateQR = async () => {
    if (!showQR && content) {
      // Encode CV data to base64 (using btoa for browser compatibility)
      const cvDataString = JSON.stringify(content);
      const encodedData = btoa(unescape(encodeURIComponent(cvDataString)));
      
      // Generate QR code with embedded CV data and template
      const previewUrl = `${window.location.origin}/preview/demo/${resumeId}?data=${encodeURIComponent(encodedData)}&template=${selectedTemplate}`;
      const qrImageUrl = `/api/qr?url=${encodeURIComponent(previewUrl)}&size=400`;
      setQrUrl(qrImageUrl);
    }
    setShowQR(!showQR);
  };

  const handleCopyLink = () => {
    if (!content) return;
    
    // Encode CV data to base64 (using btoa for browser compatibility)
    const cvDataString = JSON.stringify(content);
    const encodedData = btoa(unescape(encodeURIComponent(cvDataString)));
    
    // Create shareable link with embedded CV data and template
    const previewUrl = `${window.location.origin}/preview/demo/${resumeId}?data=${encodeURIComponent(encodedData)}&template=${selectedTemplate}`;
    navigator.clipboard.writeText(previewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAIOptimize = async () => {
    if (!content || !jobDescriptionForOptimization.trim()) {
      alert('Please enter a job description');
      return;
    }

    setAiLoading(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'optimize',
          resumeContent: content,
          jobDescription: jobDescriptionForOptimization,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAiResult({
          type: 'optimize',
          content: data.result,
        });
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('AI Optimization error:', error);
      alert('Failed to optimize resume');
    } finally {
      setAiLoading(false);
    }
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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-zinc-100"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative ${isDark ? 'dark' : ''}`}>
      <ShaderBackground isDark={isDark} />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => router.push('/dashboard')} 
                size="sm"
                className="gap-2 bg-zinc-700 hover:bg-zinc-800 text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Edit CV
                </h1>
                {isDirty && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">Unsaved changes</p>
                )}
              </div>
              
              {/* Template Selector */}
              <div className="flex items-center gap-2 ml-4">
                <label htmlFor="template-select" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Template:
                </label>
                <select
                  id="template-select"
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value as TemplateType)}
                  className="px-3 py-1.5 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="modern">Modern</option>
                  <option value="azurill">Azurill</option>
                  <option value="academic">Academic (LaTeX)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                className="gap-2 bg-zinc-700 hover:bg-zinc-800 text-white" 
                onClick={handleAIExtractKeywords}
                disabled={aiLoading}
              >
                <Sparkles className="w-4 h-4" />
                Extract Keywords
              </Button>
              <Button 
                size="sm" 
                className="gap-2 bg-zinc-700 hover:bg-zinc-800 text-white" 
                onClick={() => setAiResult({ type: 'optimize', content: '' })}
              >
                <Sparkles className="w-4 h-4" />
                Optimize for Job
              </Button>
              <Button size="sm" className="gap-2 bg-zinc-700 hover:bg-zinc-800 text-white" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              <Button size="sm" className="gap-2 bg-zinc-700 hover:bg-zinc-800 text-white" onClick={handleCopyLink}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy Link'}
              </Button>
              <Button size="sm" className="gap-2 bg-zinc-700 hover:bg-zinc-800 text-white" onClick={handleGenerateQR}>
                <QrCode className="w-4 h-4" />
                QR Code
              </Button>
              <Button onClick={handleSave} disabled={!isDirty || isSaving} size="sm" className="gap-2">
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
        {aiResult && (
          <Card className="mb-8 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                AI Assistant
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAiResult(null)}
                className="ml-auto"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiResult.type === 'optimize' ? (
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4">
                    Optimize your CV for a job description:
                  </p>
                  <textarea
                    value={jobDescriptionForOptimization}
                    onChange={(e) => setJobDescriptionForOptimization(e.target.value)}
                    placeholder="Paste the job description here..."
                    className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 min-h-24 mb-4"
                  />
                  <Button 
                    onClick={handleAIOptimize} 
                    disabled={aiLoading}
                    className="w-full gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {aiLoading ? 'Optimizing...' : 'Optimize Resume'}
                  </Button>
                </div>
              ) : aiResult.type === 'keywords' ? (
                <div className="space-y-4">
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
                            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Extracted Keywords:</h4>
                            <div className="flex flex-wrap gap-2">
                              {allKeywords.map((keyword, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded-full text-sm font-medium"
                                >
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                          {parsed.summary && (
                            <div className="bg-zinc-100 dark:bg-zinc-700 p-3 rounded-lg">
                              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                <span className="font-semibold">Summary: </span>
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
                            className="w-full gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Copy Keywords
                          </Button>
                        </>
                      );
                    } catch (e) {
                      return (
                        <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                            {aiResult.content}
                          </p>
                        </div>
                      );
                    }
                  })()}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                      {aiResult.content}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(aiResult.content);
                      alert('Copied to clipboard!');
                    }}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Result
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* QR Code Dialog */}
        {showQR && qrUrl && (
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Share Your CV</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQR(false)}
                className="ml-auto"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-8">
                <div>
                  <img src={qrUrl} alt="QR Code" className="w-64 h-64 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg" />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-4">
                    Scan to preview your CV
                  </p>
                </div>
                <div className="max-w-sm">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Share this CV</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    Use this QR code to share your CV with employers or print it on your application materials.
                  </p>
                  <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded mb-4 text-xs font-mono break-all text-zinc-700 dark:text-zinc-300">
                    {`${window.location.origin}/preview/demo/${resumeId}`}
                  </div>
                  <Button className="w-full gap-2">
                    <Download className="w-4 h-4" />
                    Download QR Code
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Forms or LaTeX Editor */}
          <div className="space-y-6">
            {selectedTemplate === 'academic' ? (
              // LaTeX Editor for Academic Template
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    LaTeX Editor
                    {isParsingLatex && (
                      <span className="ml-2 text-xs text-blue-600 font-normal">Updating CV...</span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Write your CV in LaTeX format. Use the sync button to update the preview.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={latexCode}
                    onChange={(e) => setLatexCode(e.target.value)}
                    placeholder="Enter your LaTeX code here..."
                    className="w-full h-[600px] px-4 py-3 rounded-md border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
                    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      autoSync 
                        ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' 
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                    }`}>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="auto-sync"
                          checked={autoSync}
                          onChange={(e) => setAutoSync(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-white border-zinc-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                        />
                      </div>
                      <label htmlFor="auto-sync" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            Auto-sync
                          </span>
                          {autoSync && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
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
                      className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
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
                </CardContent>
              </Card>
            ) : (
              // Regular Forms for Other Templates
              <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Enter your contact information and social media profiles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PersonalInfoForm />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="experience" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Work Experience</CardTitle>
                    <CardDescription>
                      Add your professional work experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ExperienceForm />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="education" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Education</CardTitle>
                    <CardDescription>
                      Add your education background and certificates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EducationForm />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="skills" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                    <CardDescription>
                      List your technical and soft skills
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SkillsForm />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            )}
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>Live preview of your CV</CardDescription>
                </div>
                
                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                    disabled={zoomLevel <= 50}
                    className="h-8 w-8 p-0"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 min-w-[3rem] text-center">
                    {zoomLevel}%
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
                    disabled={zoomLevel >= 150}
                    className="h-8 w-8 p-0"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setZoomLevel(100)}
                    className="h-8 px-2 text-xs"
                  >
                    Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-auto max-h-[800px]">
                  <div 
                    style={{ 
                      transform: `scale(${zoomLevel / 100})`,
                      transformOrigin: 'top center',
                      transition: 'transform 0.2s ease'
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
                      <div className="text-center text-zinc-500 py-32">
                        <Eye className="w-12 h-12 mx-auto mb-4" />
                        <p>Waiting for CV content to load...</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
