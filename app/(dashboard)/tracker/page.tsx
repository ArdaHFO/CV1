'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ShaderBackground from '@/components/ui/shader-background';
import {
  CheckCircle2,
  EyeOff,
  ExternalLink,
  RotateCcw,
  Trash2,
  Briefcase,
  MapPin,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppDarkModeState } from '@/hooks/use-app-dark-mode';
import { getCurrentUser } from '@/lib/auth/auth';
import {
  getTrackedJobs,
  removeTrackedJob,
  updateTrackedJobStatus,
  type TrackedJob,
  type JobTrackerStatus,
} from '@/lib/job-tracker';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 2) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD === 1) return 'Yesterday';
  if (diffD < 7) return `${diffD} days ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const EMPLOYMENT_BADGE: Record<string, string> = {
  'full-time': 'border-black bg-black text-white',
  'part-time': 'border-black bg-white text-black',
  'contract': 'border-[#FF3000] bg-[#FF3000] text-white',
  'internship': 'border-black bg-[#F2F2F2] text-black',
};

function employmentBadge(type?: string) {
  return EMPLOYMENT_BADGE[type ?? ''] ?? 'border-black bg-[#F2F2F2] text-black';
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({
  job,
  onMoveToApplied,
  onMoveToSkipped,
  onRemove,
}: {
  job: TrackedJob;
  onMoveToApplied: () => void;
  onMoveToSkipped: () => void;
  onRemove: () => void;
}) {
  const router = useRouter();

  const isApplied = job.status === 'applied';

  return (
    <div className={`border-2 border-black bg-white p-5 space-y-3 ${!isApplied ? 'opacity-60' : ''}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black uppercase tracking-widest leading-tight truncate">
            {job.title}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-black/60 mt-1">
            <span>{job.company}</span>
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {job.location}
              </span>
            )}
            {job.salary_range && <span>{job.salary_range}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {job.employment_type && (
            <span
              className={`px-2 py-0.5 border-2 text-[10px] font-black uppercase tracking-widest ${employmentBadge(job.employment_type)}`}
            >
              {job.employment_type}
            </span>
          )}
          <span className="text-[9px] font-bold text-black/40 uppercase tracking-widest">
            {formatDate(job.trackedAt)}
          </span>
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2 pt-1 border-t border-black/10">
        {job.apply_url && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-2 border-black text-[10px] font-black uppercase tracking-widest h-8"
            onClick={() => window.open(job.apply_url, '_blank')}
          >
            <ExternalLink className="w-3 h-3" />
            Open
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-2 border-black text-[10px] font-black uppercase tracking-widest h-8"
          onClick={() => router.push(`/jobs/${job.jobId}`)}
        >
          View
        </Button>
        {isApplied ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-2 border-black text-[10px] font-black uppercase tracking-widest h-8"
            onClick={onMoveToSkipped}
          >
            <EyeOff className="w-3 h-3" />
            Move to Skipped
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-2 border-black text-[10px] font-black uppercase tracking-widest h-8"
            onClick={onMoveToApplied}
          >
            <RotateCcw className="w-3 h-3" />
            Move to Applied
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          className="border-2 border-black h-8 w-8 ml-auto text-[#FF3000] hover:border-[#FF3000] flex-shrink-0"
          onClick={onRemove}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div className="border-4 border-black bg-white py-16 flex flex-col items-center gap-4 text-center">
      <div className="border-2 border-black p-4 opacity-20">{icon}</div>
      <p className="text-xs font-black uppercase tracking-widest text-black/40">{label}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 max-w-xs">{sub}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'applied' | 'skipped';

export default function TrackerPage() {
  const router = useRouter();
  const { isDark } = useAppDarkModeState();
  const [activeTab, setActiveTab] = useState<Tab>('applied');
  const [jobs, setJobs] = useState<TrackedJob[]>([]);

  useEffect(() => {
    const bootstrap = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setJobs(getTrackedJobs());
    };
    bootstrap();
  }, [router]);

  const applied = jobs.filter((j) => j.status === 'applied');
  const skipped = jobs.filter((j) => j.status === 'skipped');

  const handleMoveToApplied = (jobId: string) => {
    updateTrackedJobStatus(jobId, 'applied');
    setJobs(getTrackedJobs());
  };

  const handleMoveToSkipped = (jobId: string) => {
    updateTrackedJobStatus(jobId, 'skipped');
    setJobs(getTrackedJobs());
  };

  const handleRemove = (jobId: string) => {
    removeTrackedJob(jobId);
    setJobs(getTrackedJobs());
  };

  const displayed = activeTab === 'applied' ? applied : skipped;

  return (
    <div className={`min-h-screen relative ${isDark ? 'dark' : ''} bg-white text-black`}>
      <ShaderBackground isDark={isDark} />
      <div className="relative z-10 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-black uppercase tracking-widest">Job Tracker</h1>
              <span className="px-3 py-1 border-2 border-black bg-[#F2F2F2] text-[10px] font-black uppercase tracking-widest">
                {applied.length} applied · {skipped.length} skipped
              </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-black/60">
              Jobs you applied to or skipped — stored locally in your browser
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-4 border-black mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('applied')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-black uppercase tracking-widest border-r-2 border-black transition-colors ${
                activeTab === 'applied'
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-[#F2F2F2]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Applied
              <span
                className={`ml-1 px-2 py-0.5 border-2 text-[9px] font-black ${
                  activeTab === 'applied'
                    ? 'border-white bg-white text-black'
                    : 'border-black bg-black text-white'
                }`}
              >
                {applied.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('skipped')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-black uppercase tracking-widest transition-colors ${
                activeTab === 'skipped'
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-[#F2F2F2]'
              }`}
            >
              <EyeOff className="w-4 h-4" />
              Skipped
              <span
                className={`ml-1 px-2 py-0.5 border-2 text-[9px] font-black ${
                  activeTab === 'skipped'
                    ? 'border-white bg-white text-black'
                    : 'border-black bg-black text-white'
                }`}
              >
                {skipped.length}
              </span>
            </button>
          </div>

          {/* List */}
          {displayed.length === 0 ? (
            activeTab === 'applied' ? (
              <EmptyState
                icon={<CheckCircle2 className="w-10 h-10" />}
                label="No applied jobs yet"
                sub='When you click "Track Application" on a job, it will appear here.'
              />
            ) : (
              <EmptyState
                icon={<EyeOff className="w-10 h-10" />}
                label="No skipped jobs"
                sub='When you click "Skip" on a job in the search results, it will appear here.'
              />
            )
          ) : (
            <div className="space-y-3">
              {displayed.map((job) => (
                <JobCard
                  key={job.jobId}
                  job={job}
                  onMoveToApplied={() => handleMoveToApplied(job.jobId)}
                  onMoveToSkipped={() => handleMoveToSkipped(job.jobId)}
                  onRemove={() => handleRemove(job.jobId)}
                />
              ))}
            </div>
          )}

          {/* Link to full Application Tracker */}
          {activeTab === 'applied' && applied.length > 0 && (
            <div className="mt-6 border-2 border-black bg-[#F2F2F2] p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest">Full Application Tracker</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/60">
                  For detailed Kanban-style tracking with notes, interviews and reminders
                </p>
              </div>
              <Button
                variant="outline"
                className="gap-2 border-2 border-black flex-shrink-0"
                onClick={() => router.push('/applications')}
              >
                <Briefcase className="w-4 h-4" />
                Open Tracker
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
