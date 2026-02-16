'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
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
}

export function UploadCVDialog({ open, onOpenChange, userId }: UploadCVDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  const handleFileSelect = () => {
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
        throw new Error(data.error || 'Failed to upload CV');
      }

      // Save parsed content to localStorage for editor to load
      if (data.content) {
        localStorage.setItem(`resume-content-${data.resumeId}`, JSON.stringify(data.content));
      }

      setUploadStatus({
        type: 'success',
        message: 'CV uploaded and parsed successfully!',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <Sparkles className="h-8 w-8 text-violet-500" />
          </div>
          <DialogTitle className="text-2xl font-bold">Upload Your CV</DialogTitle>
          <DialogDescription className="text-base">
            Upload your existing CV and we'll use AI to extract and optimize the content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <div
            onClick={handleFileSelect}
            className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
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
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <div className="text-center">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Processing your CV...
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    AI is extracting and optimizing content
                  </p>
                </div>
              </div>
            ) : (
              <>
                <FileText className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Click to upload your CV
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  PDF or DOCX • Max 5MB
                </p>
              </>
            )}
          </div>

          {/* Status Message */}
          {uploadStatus.type !== 'idle' && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg ${
                uploadStatus.type === 'success'
                  ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
              }`}
            >
              {uploadStatus.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p
                  className={`text-sm font-medium ${
                    uploadStatus.type === 'success'
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-red-900 dark:text-red-100'
                  }`}
                >
                  {uploadStatus.message}
                </p>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              AI-Powered Features
            </h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span>Automatic content extraction from PDF/DOCX</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span>AI optimization and formatting</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span>Smart section detection (experience, education, skills)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span>Ready to edit and download instantly</span>
              </li>
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
              className="flex-1 bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
