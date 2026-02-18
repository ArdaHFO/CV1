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
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-zinc-100"></div>
      </div>
    );
  }

  if (!cvData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
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
    <div className={`min-h-screen relative ${isDark ? 'dark' : ''} bg-white text-black`}>
      <ShaderBackground isDark={isDark} />
      <div className="relative z-10 py-8">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Share Options */}
        <div className="mb-8 border-4 border-black bg-white p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-widest">
                {cvData.content.personal_info.first_name} {cvData.content.personal_info.last_name}
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 mt-1">
                CV Preview
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleDownloadPDF} variant="accent" className="gap-2">
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
            <div className="mt-4 border-t-2 border-black pt-4 flex flex-col sm:flex-row gap-6 items-start">
              <img src={qrUrl} alt="QR Code" className="w-48 h-48 border-2 border-black" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-black/70 mb-3">
                  Scan to share this CV. Print it on your CV or cover letter.
                </p>
                <Button onClick={handleDownloadQR} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download QR
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Template selector */}
        <div className="mb-4 flex items-center gap-3 border-2 border-black bg-white px-4 py-2">
          <span className="text-xs font-black uppercase tracking-widest">Template:</span>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value as TemplateType)}
            className="text-xs font-black uppercase tracking-widest border-2 border-black bg-white text-black px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#FF3000]"
          >
            <option value="modern">Modern</option>
            <option value="azurill">Azurill</option>
            <option value="academic">Academic (LaTeX)</option>
          </select>
        </div>

        {/* CV Preview — A4 natural size */}
        <div className="border-4 border-black bg-white overflow-x-auto">
          <div className="min-w-[794px] p-0">
            {selectedTemplate === 'azurill' ? (
              <AzurillTemplate content={cvData.content} />
            ) : selectedTemplate === 'academic' ? (
              <AcademicTemplate content={cvData.content} />
            ) : (
              <ModernTemplate content={cvData.content} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 border-2 border-black bg-[#F2F2F2] p-4">
          <p className="text-[10px] font-black uppercase tracking-widest">Share link</p>
          <p className="mt-1 font-mono text-xs break-all text-black/70">{typeof window !== 'undefined' ? window.location.href : ''}</p>
        </div>
      </div>
      </div>
    </div>
  );
}
