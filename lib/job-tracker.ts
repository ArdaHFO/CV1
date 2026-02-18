import type { Job } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type JobTrackerStatus = 'applied' | 'skipped';

export interface TrackedJob {
  jobId: string;
  title: string;
  company: string;
  location?: string;
  employment_type?: string;
  salary_range?: string;
  posted_date?: string;
  apply_url?: string;
  status: JobTrackerStatus;
  trackedAt: string; // ISO
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'job-tracker';

export function getTrackedJobs(): TrackedJob[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TrackedJob[]) : [];
  } catch {
    return [];
  }
}

export function getJobStatus(jobId: string): JobTrackerStatus | null {
  const jobs = getTrackedJobs();
  return jobs.find((j) => j.jobId === jobId)?.status ?? null;
}

export function trackJob(job: Job, status: JobTrackerStatus): void {
  const existing = getTrackedJobs().filter((j) => j.jobId !== job.id);
  const entry: TrackedJob = {
    jobId: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    employment_type: job.employment_type,
    salary_range: job.salary_range,
    posted_date: job.posted_date,
    apply_url: job.apply_url,
    status,
    trackedAt: new Date().toISOString(),
  };
  // Keep newest first, cap at 200
  localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...existing].slice(0, 200)));
}

export function removeTrackedJob(jobId: string): void {
  const existing = getTrackedJobs().filter((j) => j.jobId !== jobId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function updateTrackedJobStatus(jobId: string, status: JobTrackerStatus): void {
  const existing = getTrackedJobs();
  const updated = existing.map((j) =>
    j.jobId === jobId ? { ...j, status, trackedAt: new Date().toISOString() } : j
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
