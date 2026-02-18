'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

interface UploadCVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onBuyImportTokens?: () => void;
}

export function UploadCVDialog({ open, onOpenChange, userId, onBuyImportTokens }: UploadCVDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });
  const [importRemaining, setImportRemaining] = useState<number | 'unlimited' | null>(null);
  const [loadingQuota, setLoadingQuota] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoadingQuota(true);
    fetch('/api/billing/status')
      .then((r) => r.json())
      .then((payload) => {
        const remaining = payload?.status?.remaining?.cvImports ?? 0;
        setImportRemaining(remaining);
      })
      .catch(() => setImportRemaining(0))
      .finally(() => setLoadingQuota(false));
  }, [open]);

  const isBlocked = !loadingQuota && importRemaining !== 'unlimited' && (importRemaining as number) <= 0;

  const handleFileSelect = () => {
    if (isBlocked) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!validTypes.includes(file.type)) {
      setUploadStatus({
        type: 'error',
        message: 'Invalid file type. Please upload a PDF or DOCX file.',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus({
        type: 'error',
        message: 'File too large. Maximum size is 5MB.',
      });
      return;
    }

    setUploading(true);
    setUploadStatus({ type: 'idle', message: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fetch('/api/cv/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.code === 'import_limit_reached') {
          setImportRemaining(0);
          throw new Error('You have no remaining CV imports. Buy an import pack to continue.');
        }
        throw new Error(data.error || 'Failed to upload CV');
      }

      // Save parsed content to localStorage for editor to load
      if (data.content) {
        localStorage.setItem(`resume-content-${data.resumeId}`, JSON.stringify(data.content));
      }

      setUploadStatus({
        type: 'success',
        message: data.message || 'CV uploaded successfully! Please review and edit your information.',
      });

      // Wait a moment then redirect to editor
      setTimeout(() => {
        router.push(`/editor/${data.resumeId}`);
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to upload CV',
      });
    } finally {
      setUploading(false);
    }
  };

  const quotaLabel = loadingQuota
    ? '...'
    : importRemaining === 'unlimited'
    ? 'Unlimited'
    : `${importRemaining} remaining`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-4 border-black rounded-none bg-white p-0">
        <div className="p-6">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center border-2 border-black bg-white">
                <Upload className="h-6 w-6 text-black" />
              </div>
              <Sparkles className="h-8 w-8 text-[#FF3000]" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-widest">Upload Your CV</DialogTitle>
            <DialogDescription className="text-base uppercase tracking-widest">
              Upload your existing CV and we&apos;ll use AI to extract and optimize the content
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Quota badge */}
            <div className="flex items-center gap-2 border-2 border-black bg-[#F2F2F2] px-3 py-2">
              {isBlocked ? (
                <Lock className="h-4 w-4 text-[#FF3000] flex-shrink-0" />
              ) : (
                <CheckCircle className="h-4 w-4 text-black flex-shrink-0" />
              )}
              <p className="text-[10px] font-black uppercase tracking-widest">
                CV Imports: <span className={isBlocked ? 'text-[#FF3000]' : 'text-black'}>{quotaLabel}</span>
              </p>
            </div>

            {/* Blocked state */}
            {isBlocked ? (
              <div className="border-2 border-black bg-white p-6 text-center space-y-4">
                <Lock className="h-10 w-10 text-[#FF3000] mx-auto" />
                <p className="text-sm font-black uppercase tracking-widest">Import Limit Reached</p>
                <p className="text-xs font-bold uppercase tracking-widest text-black/70">
                  Your free plan includes 1 CV import. Buy an import pack to continue.
                </p>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => { onOpenChange(false); router.push('/dashboard?openUpgrade=cv-import'); }}
                    className="border-2 border-black bg-white p-3 text-left hover:bg-[#F2F2F2] transition-colors"
                  >
                    <p className="text-xs font-black uppercase tracking-widest">1 Import</p>
                    <p className="text-xl font-black uppercase mt-1">$9.99</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/70 mt-1">One-time</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => { onOpenChange(false); router.push('/dashboard?openUpgrade=cv-import'); }}
                    className="border-2 border-black bg-black text-white p-3 text-left"
                  >
                    <p className="text-xs font-black uppercase tracking-widest">10 Imports</p>
                    <p className="text-xl font-black uppercase mt-1">$14.99</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mt-1">Best value</p>
                  </button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="w-full border-2 border-black"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                {/* Upload Area */}
                <div
                  onClick={handleFileSelect}
                  className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-black bg-white cursor-pointer transition-colors hover:bg-[#F2F2F2]"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading}
                  />

                  {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-12 w-12 animate-spin text-black" />
                      <div className="text-center">
                        <p className="text-xs font-black uppercase tracking-widest">
                          Processing your CV...
                        </p>
                        <p className="text-xs font-bold uppercase tracking-widest text-black/60 mt-1">
                          This may take a moment
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <FileText className="h-12 w-12 text-black/40 mb-3" />
                      <p className="text-sm font-black uppercase tracking-widest mb-1">
                        Click to upload your CV
                      </p>
                      <p className="text-xs font-bold uppercase tracking-widest text-black/60">
                        PDF or DOCX • Max 5MB
                      </p>
                    </>
                  )}
                </div>

                {/* Status Message */}
                {uploadStatus.type !== 'idle' && (
                  <div className={`flex items-start gap-3 p-4 border-2 border-black ${uploadStatus.type === 'success' ? 'bg-[#F2F2F2]' : 'bg-white'}`}>
                    {uploadStatus.type === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-[#FF3000] flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-[#FF3000] flex-shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm font-medium text-black">{uploadStatus.message}</p>
                  </div>
                )}

                {/* Features */}
                <div className="border-2 border-black bg-[#F2F2F2] p-4">
                  <h4 className="text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#FF3000]" />
                    Import Your CV
                  </h4>
                  <ul className="space-y-2 text-xs font-bold uppercase tracking-widest text-black/70">
                    {[
                      'Upload PDF or DOCX files (max 5MB)',
                      'Creates a new CV with editable template',
                      'Fill in your information in the editor',
                      'Download and share when ready',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-[#FF3000] flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1"
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleFileSelect}
                    className="flex-1"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Select File
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
