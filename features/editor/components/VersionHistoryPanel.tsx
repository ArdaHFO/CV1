'use client';

import { useEffect, useState } from 'react';
import { X, RotateCcw, GitCompare, Trash2, Clock, Briefcase, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  getVersions,
  deleteVersion,
  diffVersions,
  type CVVersion,
  type DiffToken,
  type SectionDiff,
} from '@/lib/version-history';
import type { ResumeContent } from '@/types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface VersionHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  resumeId: string;
  currentContent: ResumeContent | null;
  onRestore: (content: ResumeContent, versionLabel: string) => void;
  isDark?: boolean;
}

// ─── Helper: format date ──────────────────────────────────────────────────────

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

// ─── Diff Token Renderer ──────────────────────────────────────────────────────

function DiffTokens({ tokens }: { tokens: DiffToken[] }) {
  return (
    <span className="leading-relaxed">
      {tokens.map((t, i) => {
        if (t.type === 'equal') {
          return (
            <span key={i} className="text-black/80 text-xs">
              {t.text}{' '}
            </span>
          );
        }
        if (t.type === 'remove') {
          return (
            <span
              key={i}
              className="bg-red-100 text-red-700 line-through text-xs px-0.5 rounded-sm"
            >
              {t.text}{' '}
            </span>
          );
        }
        return (
          <span key={i} className="bg-green-100 text-green-700 font-semibold text-xs px-0.5 rounded-sm">
            {t.text}{' '}
          </span>
        );
      })}
    </span>
  );
}

// ─── Diff Section ─────────────────────────────────────────────────────────────

function DiffSection({ diff }: { diff: SectionDiff }) {
  return (
    <div className="border-2 border-black bg-white">
      <div className="flex items-center gap-2 px-4 py-2 border-b-2 border-black bg-[#F2F2F2]">
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            diff.section === 'summary'
              ? 'bg-blue-500'
              : diff.section === 'experience'
              ? 'bg-orange-500'
              : 'bg-purple-500'
          }`}
        />
        <span className="text-[10px] font-black uppercase tracking-widest">{diff.label}</span>
      </div>
      <div className="p-4">
        {diff.tokens && <DiffTokens tokens={diff.tokens} />}
        {diff.section === 'skills' && (
          <div className="space-y-2">
            {diff.removed && diff.removed.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {diff.removed.map((s, idx) => {
                  const label = typeof s === 'string' ? s : (s as { name?: string })?.name ?? '';
                  return (
                  <span
                    key={`${label}-${idx}`}
                    className="bg-red-100 text-red-700 line-through text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border border-red-300 rounded-sm"
                  >
                    {label}
                  </span>
                  );
                })}
              </div>
            )}
            {diff.added && diff.added.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {diff.added.map((s, idx) => {
                  const label = typeof s === 'string' ? s : (s as { name?: string })?.name ?? '';
                  return (
                  <span
                    key={`${label}-${idx}`}
                    className="bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border border-green-300 rounded-sm"
                  >
                    + {label}
                  </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function DiffLegend() {
  return (
    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 bg-red-100 border border-red-300 rounded-sm flex-shrink-0" />
        Removed
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 bg-green-100 border border-green-300 rounded-sm flex-shrink-0" />
        Added
      </span>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function VersionHistoryPanel({
  open,
  onClose,
  resumeId,
  currentContent,
  onRestore,
  isDark = false,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<CVVersion[]>([]);
  const [compareTarget, setCompareTarget] = useState<CVVersion | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<CVVersion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CVVersion | null>(null);

  // Load versions from localStorage whenever panel opens
  useEffect(() => {
    if (open && resumeId) {
      setVersions(getVersions(resumeId));
    }
  }, [open, resumeId]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteVersion(resumeId, deleteTarget.id);
    setVersions((prev) => prev.filter((v) => v.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleRestore = () => {
    if (!restoreTarget) return;
    onRestore(restoreTarget.contentSnapshot, restoreTarget.label);
    setRestoreTarget(null);
    onClose();
  };

  // Compute diffs for the compare modal
  const diffs: SectionDiff[] =
    compareTarget && currentContent
      ? diffVersions(compareTarget.contentSnapshot, currentContent)
      : [];

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col border-l-4 border-black shadow-2xl ${
          isDark ? 'bg-[#111] text-white' : 'bg-white text-black'
        }`}
        style={{ animation: 'slideInRight 0.2s ease-out' }}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b-4 border-black flex-shrink-0 ${
            isDark ? 'bg-[#1a1a1a]' : 'bg-[#F2F2F2]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <div>
              <p className="text-sm font-black uppercase tracking-widest leading-none">
                Version History
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 mt-0.5">
                {versions.length} snapshot{versions.length !== 1 ? 's' : ''} saved
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="border-2 border-black h-8 w-8 flex-shrink-0"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
              <div className="border-2 border-black p-4 mb-4 opacity-30">
                <Clock className="w-10 h-10" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-black/40">
                No versions yet
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 mt-2">
                Versions are saved automatically when you save or accept AI optimizations.
              </p>
            </div>
          ) : (
            <div className="divide-y-2 divide-black">
              {versions.map((v, idx) => (
                <div
                  key={v.id}
                  className={`p-4 space-y-3 ${
                    idx === 0 ? (isDark ? 'bg-white/5' : 'bg-[#FFFDE6]') : ''
                  }`}
                >
                  {/* Version meta row */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 border-2 border-black flex items-center justify-center text-[10px] font-black ${
                        idx === 0 ? 'bg-black text-white' : isDark ? 'bg-[#1a1a1a] text-white' : 'bg-[#F2F2F2] text-black'
                      }`}
                    >
                      v{versions.length - idx}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black uppercase tracking-widest leading-tight truncate">
                        {v.label}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 mt-0.5">
                        {formatDate(v.timestamp)}
                      </p>
                      {v.jobTitle && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Briefcase className="w-3 h-3 text-black/40 flex-shrink-0" />
                          <span className="text-[10px] font-bold text-black/60 truncate">
                            {v.jobTitle}
                            {v.company ? ` @ ${v.company}` : ''}
                          </span>
                          {v.matchScore != null && (
                            <span
                              className={`ml-1 flex-shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 border ${
                                v.matchScore >= 70
                                  ? 'border-green-600 bg-green-50 text-green-700'
                                  : v.matchScore >= 50
                                  ? 'border-yellow-600 bg-yellow-50 text-yellow-700'
                                  : 'border-red-500 bg-red-50 text-red-600'
                              }`}
                            >
                              {v.matchScore}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {idx === 0 && (
                      <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-widest border-2 border-black bg-black text-white px-2 py-0.5 self-start">
                        Latest
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pl-11">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 border-2 border-black text-[10px] font-black uppercase tracking-widest h-8"
                      onClick={() => setCompareTarget(v)}
                      disabled={!currentContent}
                    >
                      <GitCompare className="w-3 h-3" />
                      Compare
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 border-2 border-black text-[10px] font-black uppercase tracking-widest h-8"
                      onClick={() => setRestoreTarget(v)}
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-2 border-black h-8 w-8 flex-shrink-0 text-red-600 hover:text-red-700 hover:border-red-600"
                      onClick={() => setDeleteTarget(v)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Compare modal ── */}
      <Dialog open={!!compareTarget} onOpenChange={(o) => !o && setCompareTarget(null)}>
        <DialogContent className="max-w-2xl border-4 border-black max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
              <GitCompare className="w-5 h-5" />
              Compare Versions
            </DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-black/50">
              Version{' '}
              {compareTarget
                ? versions.length - versions.findIndex((v) => v.id === compareTarget.id)
                : ''}{' '}
              ({compareTarget ? new Date(compareTarget.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
              ) vs Current
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-2 min-h-0">
            {/* Legend */}
            <div className="flex items-center justify-between px-1">
              <DiffLegend />
              <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">
                {diffs.length === 0 ? 'No changes' : `${diffs.length} change${diffs.length !== 1 ? 's' : ''} found`}
              </span>
            </div>

            {diffs.length === 0 ? (
              <div className="border-2 border-black py-10 flex flex-col items-center gap-3">
                <div className="text-3xl">✓</div>
                <p className="text-xs font-black uppercase tracking-widest text-black/40">
                  No differences found
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 text-center max-w-xs">
                  This version&apos;s content is identical to your current CV.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {diffs.map((diff, i) => (
                  <DiffSection key={i} diff={diff} />
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 gap-2 pt-2">
            <Button
              variant="outline"
              className="border-2 border-black"
              onClick={() => setCompareTarget(null)}
            >
              Close
            </Button>
            <Button
              className="gap-2 border-2 border-black"
              style={{ backgroundColor: '#1a1a1a', color: 'white' }}
              onClick={() => {
                if (compareTarget) {
                  setRestoreTarget(compareTarget);
                  setCompareTarget(null);
                }
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Restore This Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Restore confirm ── */}
      <Dialog open={!!restoreTarget} onOpenChange={(o) => !o && setRestoreTarget(null)}>
        <DialogContent className="max-w-sm border-4 border-black">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-[#FF3000]" />
              Restore Version?
            </DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-black/60 mt-2">
              This will replace your current CV with the snapshot from{' '}
              <strong>
                {restoreTarget ? formatDate(restoreTarget.timestamp) : ''}
              </strong>
              .{' '}
              <span className="text-[#FF3000]">
                Your current content will be saved as a new version first.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="border-2 border-black"
              onClick={() => setRestoreTarget(null)}
            >
              Cancel
            </Button>
            <Button
              className="gap-2 border-2"
              style={{ backgroundColor: '#FF3000', color: 'white', borderColor: '#FF3000' }}
              onClick={handleRestore}
            >
              <RotateCcw className="w-4 h-4" />
              Yes, Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm border-4 border-black">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-[#FF3000]" />
              Delete Version?
            </DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-black/60 mt-2">
              Version from{' '}
              <strong>
                {deleteTarget ? formatDate(deleteTarget.timestamp) : ''}
              </strong>{' '}
              will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="border-2 border-black"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              className="gap-2 border-2"
              style={{ backgroundColor: '#FF3000', color: 'white', borderColor: '#FF3000' }}
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slide-in animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
