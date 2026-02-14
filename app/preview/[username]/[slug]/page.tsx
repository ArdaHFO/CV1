'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import ShaderBackground from '@/components/ui/shader-background';
import { Download, Share2, Copy, Check, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernTemplate } from '@/features/editor/templates/ModernTemplate';
import { AzurillTemplate } from '@/features/editor/templates/AzurillTemplate';
import { AcademicTemplate } from '@/features/editor/templates/AcademicTemplate';
import { useAppDarkModeState } from '@/hooks/use-app-dark-mode';
import type { ResumeContent, TemplateType } from '@/types';

interface CVData {
  id: string;
  slug: string;
  title: string;
  content: ResumeContent;
  view_count: number;
}

export default function PreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const username = params.username as string;
  const encodedData = searchParams.get('data');
  const templateParam = searchParams.get('template') as TemplateType | null;
  
  const [cvData, setCVData] = useState<CVData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [showQR, setShowQR] = useState(false);
  const { isDark } = useAppDarkModeState();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>(templateParam || 'modern');

  useEffect(() => {
    async function loadCV() {
      try {
        if (encodedData) {
          // Decode CV data from URL parameter using atob
          const decodedString = decodeURIComponent(atob(encodedData));
          const content = JSON.parse(decodedString) as ResumeContent;
          
          const cvData: CVData = {
            id: 'cv-' + slug,
            slug,
            title: `CV - ${slug}`,
            content,
            view_count: 0,
          };
          
          setCVData(cvData);
        } else {
          // Fallback to mock data if no encoded data provided
          const mockCV: CVData = {
            id: 'cv-' + slug,
            slug,
            title: 'CV - ' + slug,
            content: {
              personal_info: {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: '+1 555 123 4567',
                location: 'New York, USA',
                website: 'https://johndoe.com',
                linkedin: 'linkedin.com/in/johndoe',
                github: 'github.com/johndoe',
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
            },
            view_count: 0,
          };

          setCVData(mockCV);
        }
      } catch (error) {
        console.error('Error loading CV:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCV();
  }, [slug, username]);

  // Reset QR code when template changes
  useEffect(() => {
    if (qrUrl) {
      setQrUrl('');
      setShowQR(false);
    }
  }, [selectedTemplate]);

  const handleDownloadPDF = async () => {
    if (!cvData) return;

    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: cvData.content,
          template: selectedTemplate,
          fileName: `${cvData.slug}.pdf`,
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
      alert('Failed to generate PDF');
    }
  };

  const handleGenerateQR = async () => {
    if (!qrUrl) {
      // Get current URL including template parameter
      const url = new URL(window.location.href);
      url.searchParams.set('template', selectedTemplate);
      const currentUrl = url.toString();
      const qrImageUrl = `/api/qr?url=${encodeURIComponent(currentUrl)}&size=400`;
      setQrUrl(qrImageUrl);
    }
    setShowQR(!showQR);
  };

  const handleCopyLink = () => {
    // Include template parameter in copied link
    const url = new URL(window.location.href);
    url.searchParams.set('template', selectedTemplate);
    const link = url.toString();
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrUrl) return;
    
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `${cvData?.slug}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-zinc-100"></div>
      </div>
    );
  }

  if (!cvData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>CV Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-600 dark:text-zinc-400">
              The CV you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative ${isDark ? 'dark' : ''}`}>
      <ShaderBackground isDark={isDark} />
      <div className="relative z-10 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Share Options */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                {cvData.content.personal_info.first_name} {cvData.content.personal_info.last_name}
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                CV View • {cvData.view_count} views total
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleDownloadPDF} className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              
              <Button variant="outline" onClick={handleCopyLink} className="gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy Link'}
              </Button>

              <Button variant="outline" onClick={handleGenerateQR} className="gap-2">
                <QrCode className="w-4 h-4" />
                QR Code
              </Button>
            </div>
          </div>

          {/* QR Code Section */}
          {showQR && qrUrl && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>QR Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <img src={qrUrl} alt="QR Code" className="w-64 h-64 border border-zinc-200 rounded-lg" />
                  </div>
                  <div className="ml-8">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                      Scan this QR code to share this CV. You can save it and print it on your CV or cover letter.
                    </p>
                    <Button onClick={handleDownloadQR} variant="outline" className="gap-2">
                      <Download className="w-4 h-4" />
                      Download QR Code
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* CV Preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Preview</CardTitle>
            <div className="flex items-center gap-2">
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
          </CardHeader>
          <CardContent>
            <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-auto max-h-[900px] p-8">
              {selectedTemplate === 'azurill' ? (
                <AzurillTemplate content={cvData.content} />
              ) : selectedTemplate === 'academic' ? (
                <AcademicTemplate content={cvData.content} />
              ) : (
                <ModernTemplate content={cvData.content} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer with Share Info */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Share this CV</h3>
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
            Share the link or QR code below to let others view your CV:
          </p>
          <div className="bg-white dark:bg-zinc-800 p-3 rounded border border-blue-200 dark:border-zinc-700 font-mono text-xs break-all text-zinc-600 dark:text-zinc-400">
            {window.location.href}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
