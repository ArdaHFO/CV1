'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ShaderBackground from '@/components/ui/shader-background';
import { Download, Clock, Eye, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernTemplate } from '@/features/editor/templates/ModernTemplate';
import { AzurillTemplate } from '@/features/editor/templates/AzurillTemplate';
import { AcademicTemplate } from '@/features/editor/templates/AcademicTemplate';
import { useAppDarkModeState } from '@/hooks/use-app-dark-mode';
import type { ResumeContent, TemplateType } from '@/types';

interface SharedLinkData {
  content: ResumeContent;
  template: TemplateType;
  expiresAt: string | null;
  viewCount: number;
}

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  
  const [data, setData] = useState<SharedLinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDark } = useAppDarkModeState();

  useEffect(() => {
    async function loadSharedCV() {
      try {
        const response = await fetch(`/api/share?token=${token}`);
        const result = await response.json();

        if (!response.ok) {
          setError(result.error || 'Failed to load CV');
          return;
        }

        setData(result);
      } catch (err) {
        console.error('Error loading shared CV:', err);
        setError('Failed to load CV');
      } finally {
        setLoading(false);
      }
    }

    loadSharedCV();
  }, [token]);

  const handleDownloadPDF = async () => {
    if (!data) return;

    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: data.content,
          template: data.template,
          fileName: `cv-${token}.pdf`,
        }),
      });

      const result = await response.json();

      if (result.html) {
        const blob = new Blob([result.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
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

  const getExpirationText = () => {
    if (!data?.expiresAt) {
      return null; // Pro user - no expiration
    }

    const expiresDate = new Date(data.expiresAt);
    const now = new Date();
    const daysLeft = Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return { text: 'This link has expired', color: 'text-red-500', icon: AlertCircle };
    } else if (daysLeft === 0) {
      return { text: 'Expires today', color: 'text-orange-500', icon: Clock };
    } else if (daysLeft === 1) {
      return { text: 'Expires in 1 day', color: 'text-orange-500', icon: Clock };
    } else {
      return { text: `Expires in ${daysLeft} days`, color: 'text-zinc-600 dark:text-zinc-400', icon: Clock };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-zinc-100"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'dark bg-zinc-950' : 'bg-zinc-50'}`}>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              {error === 'This link has expired' ? 'Link Expired' : 'CV Not Found'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              {error || "The CV you're looking for doesn't exist or has been removed."}
            </p>
            {error === 'This link has expired' && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                  💡 Want unlimited link duration?
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Upgrade to Pro for permanent CV links that never expire!
                </p>
                <Button asChild className="mt-3 w-full bg-blue-600 hover:bg-blue-700">
                  <a href="/register">Upgrade to Pro</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const expirationInfo = getExpirationText();
  const ExpirationIcon = expirationInfo?.icon;

  return (
    <div className={`min-h-screen relative ${isDark ? 'dark' : ''}`}>
      <ShaderBackground isDark={isDark} />
      <div className="relative z-10 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  {data.content.personal_info.first_name} {data.content.personal_info.last_name}
                </h1>
                <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {data.viewCount} views
                  </span>
                  {expirationInfo && ExpirationIcon && (
                    <span className={`flex items-center gap-1 ${expirationInfo.color}`}>
                      <ExpirationIcon className="w-4 h-4" />
                      {expirationInfo.text}
                    </span>
                  )}
                </div>
              </div>

              <Button onClick={handleDownloadPDF} className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>

            {/* Pro upgrade banner for free users */}
            {data.expiresAt && (
              <div className="bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-950/30 dark:to-violet-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  ⚡ This CV link expires in {Math.ceil((new Date(data.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Upgrade to Pro for permanent links that never expire, plus unlimited CV creation and AI features.
                </p>
              </div>
            )}
          </div>

          {/* CV Preview */}
          <Card>
            <CardContent className="p-8">
              <div className="mx-auto" style={{ maxWidth: '210mm' }}>
                {data.template === 'modern' && <ModernTemplate content={data.content} />}
                {data.template === 'azurill' && <AzurillTemplate content={data.content} />}
                {data.template === 'academic' && <AcademicTemplate content={data.content} />}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
