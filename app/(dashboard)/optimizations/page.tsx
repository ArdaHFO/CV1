'use client';

import { useEffect, useState } from 'react';
import ShaderBackground from '@/components/ui/shader-background';
import { useAppDarkModeState } from '@/hooks/use-app-dark-mode';
import { Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppliedChange {
  section: string;
  current: string;
  suggested: string;
  reason: string;
}

interface OptimizationRecord {
  id: string;
  timestamp: string;
  resumeId: string;
  jobTitle: string;
  company: string;
  jobLocation: string;
  matchScore: number;
  appliedChanges: AppliedChange[];
  totalSuggestions: number;
}

export default function OptimizationsPage() {
  const [history, setHistory] = useState<OptimizationRecord[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { isDark } = useAppDarkModeState();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cs-optimization-history');
      if (raw) setHistory(JSON.parse(raw) as OptimizationRecord[]);
    } catch {
      // ignore
    }
  }, []);

  const deleteRecord = (id: string) => {
    const updated = history.filter((r) => r.id !== id);
    setHistory(updated);
    localStorage.setItem('cs-optimization-history', JSON.stringify(updated));
  };

  const clearAll = () => {
    setHistory([]);
    localStorage.removeItem('cs-optimization-history');
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className={`min-h-screen relative ${isDark ? 'dark' : ''} bg-white text-black`}>
      <ShaderBackground isDark={isDark} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-[#FF3000]" />
              <h1 className="text-3xl font-black uppercase tracking-widest">Optimizations</h1>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-black/60">
              History of AI-driven CV changes applied for job postings
            </p>
          </div>
          {history.length > 0 && (
            <Button
              variant="outline"
              className="gap-2 border-2 border-black text-xs font-black uppercase tracking-widest hover:bg-[#FF3000] hover:text-white hover:border-[#FF3000]"
              onClick={clearAll}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </Button>
          )}
        </div>

        {/* Empty state */}
        {history.length === 0 && (
          <div className="border-4 border-black bg-white p-10 text-center space-y-3">
            <Sparkles className="w-10 h-10 mx-auto text-black/20" />
            <p className="text-base font-black uppercase tracking-widest text-black/40">No Optimizations Yet</p>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30">
              Open a CV in the editor, click Optimize, review and accept changes — they&apos;ll appear here.
            </p>
          </div>
        )}

        {/* Records */}
        <div className="space-y-4">
          {history.map((record) => {
            const isOpen = expanded === record.id;
            const scoreColor =
              record.matchScore >= 70
                ? 'border-black bg-black text-white'
                : record.matchScore >= 40
                ? 'border-black bg-[#F2F2F2] text-black'
                : 'border-[#FF3000] bg-[#FF3000] text-white';

            return (
              <div key={record.id} className="border-4 border-black bg-white">
                {/* Record header */}
                <div
                  className="p-4 flex items-start gap-4 cursor-pointer hover:bg-[#F2F2F2] transition-colors"
                  onClick={() => setExpanded(isOpen ? null : record.id)}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <p className="text-sm font-black uppercase tracking-widest">{record.jobTitle}</p>
                      {record.company && (
                        <span className="text-xs font-bold uppercase tracking-widest text-black/50">
                          @ {record.company}
                        </span>
                      )}
                      {record.jobLocation && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">
                          · {record.jobLocation}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-black/50">
                        {formatDate(record.timestamp)}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">
                        · CV: {record.resumeId.slice(0, 8)}…
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">
                        · {record.appliedChanges.length}/{record.totalSuggestions} changes applied
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`border-2 text-xs font-black uppercase tracking-widest px-2 py-0.5 ${scoreColor}`}>
                      {record.matchScore}%
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 border-2 border-black hover:bg-[#FF3000] hover:text-white hover:border-[#FF3000]"
                      onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    <span className="text-xs font-black text-black/40">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded changes */}
                {isOpen && record.appliedChanges.length > 0 && (
                  <div className="border-t-2 border-black divide-y-2 divide-black/10">
                    {record.appliedChanges.map((change, i) => (
                      <div key={i} className="p-4 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border-2 border-black">
                            {change.section}
                          </span>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-black/60">
                            {change.reason}
                          </p>
                        </div>

                        {change.current && (
                          <div className="border-2 border-[#FF3000] bg-[#FF3000]/5 p-2.5">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#FF3000] mb-1">Previous</p>
                            <p className="text-xs text-black leading-relaxed whitespace-pre-wrap">{change.current}</p>
                          </div>
                        )}

                        <div className="border-2 border-green-600 bg-green-50 p-2.5">
                          <p className="text-[9px] font-black uppercase tracking-widest text-green-700 mb-1">Applied</p>
                          <p className="text-xs text-black leading-relaxed whitespace-pre-wrap">{change.suggested}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isOpen && record.appliedChanges.length === 0 && (
                  <div className="border-t-2 border-black p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-black/40">No changes were accepted in this session.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
