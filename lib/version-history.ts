import type { ResumeContent } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CVVersion {
  id: string;
  resumeId: string;
  timestamp: string;         // ISO
  label: string;             // "Manual save", "Optimized for Google – Frontend Dev", etc.
  jobTitle?: string;
  company?: string;
  matchScore?: number;
  contentSnapshot: ResumeContent;
}

export interface DiffToken {
  type: 'equal' | 'add' | 'remove';
  text: string;
}

export interface SectionDiff {
  section: 'summary' | 'experience' | 'skills';
  label: string;
  tokens?: DiffToken[];   // summary / experience description
  added?: string[];       // skills added
  removed?: string[];     // skills removed
  hasChanges: boolean;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const MAX_VERSIONS = 30;

function storageKey(resumeId: string) {
  return `cv-versions-${resumeId}`;
}

export function getVersions(resumeId: string): CVVersion[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey(resumeId));
    return raw ? (JSON.parse(raw) as CVVersion[]) : [];
  } catch {
    return [];
  }
}

export function saveVersion(
  resumeId: string,
  content: ResumeContent,
  label: string,
  meta?: { jobTitle?: string; company?: string; matchScore?: number }
): CVVersion {
  const version: CVVersion = {
    id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    resumeId,
    timestamp: new Date().toISOString(),
    label,
    contentSnapshot: JSON.parse(JSON.stringify(content)) as ResumeContent,
    ...meta,
  };
  const existing = getVersions(resumeId);
  const updated = [version, ...existing].slice(0, MAX_VERSIONS);
  localStorage.setItem(storageKey(resumeId), JSON.stringify(updated));
  return version;
}

export function deleteVersion(resumeId: string, versionId: string): void {
  const existing = getVersions(resumeId);
  const updated = existing.filter((v) => v.id !== versionId);
  localStorage.setItem(storageKey(resumeId), JSON.stringify(updated));
}

export function clearVersions(resumeId: string): void {
  localStorage.removeItem(storageKey(resumeId));
}

// ─── Word-level LCS diff ──────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return (text || '').split(/\s+/).filter(Boolean);
}

/**
 * Returns word-level diff tokens between two strings.
 * Uses a simple O(m*n) LCS traceback — works well for paragraph-sized text.
 */
export function wordDiff(oldText: string, newText: string): DiffToken[] {
  const oldWords = tokenize(oldText);
  const newWords = tokenize(newText);

  if (oldWords.length === 0 && newWords.length === 0) return [];

  const m = oldWords.length;
  const n = newWords.length;

  // LCS DP — cap at 400 words per side to avoid performance issues
  const MAX = 400;
  if (m > MAX || n > MAX) {
    // Fallback: just show old as remove, new as add
    const tokens: DiffToken[] = [];
    if (oldText) tokens.push({ type: 'remove', text: oldText });
    if (newText) tokens.push({ type: 'add', text: newText });
    return tokens;
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Traceback
  type Op = { type: 'equal' | 'add' | 'remove'; text: string };
  const ops: Op[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      ops.push({ type: 'equal', text: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: 'add', text: newWords[j - 1] });
      j--;
    } else {
      ops.push({ type: 'remove', text: oldWords[i - 1] });
      i--;
    }
  }

  ops.reverse();

  // Merge consecutive same-type tokens
  const merged: DiffToken[] = [];
  for (const op of ops) {
    if (merged.length > 0 && merged[merged.length - 1].type === op.type) {
      merged[merged.length - 1].text += ' ' + op.text;
    } else {
      merged.push({ type: op.type, text: op.text });
    }
  }

  return merged;
}

// ─── Section-level diff ───────────────────────────────────────────────────────

export function diffVersions(
  oldContent: ResumeContent,
  newContent: ResumeContent
): SectionDiff[] {
  const diffs: SectionDiff[] = [];

  // Summary
  const oldSummary = oldContent.summary || '';
  const newSummary = newContent.summary || '';
  if (oldSummary !== newSummary) {
    const tokens = wordDiff(oldSummary, newSummary);
    diffs.push({ section: 'summary', label: 'Summary', tokens, hasChanges: true });
  }

  // Experience descriptions
  const maxExp = Math.max(
    oldContent.experience?.length ?? 0,
    newContent.experience?.length ?? 0
  );
  for (let idx = 0; idx < maxExp; idx++) {
    const oldExp = oldContent.experience?.[idx];
    const newExp = newContent.experience?.[idx];
    const label =
      newExp?.position || oldExp?.position
        ? `${newExp?.position || oldExp?.position} @ ${newExp?.company || oldExp?.company || ''}`
        : `Experience #${idx + 1}`;

    const oldDesc = oldExp?.description || '';
    const newDesc = newExp?.description || '';

    if (oldDesc !== newDesc) {
      const tokens = wordDiff(oldDesc, newDesc);
      diffs.push({ section: 'experience', label, tokens, hasChanges: true });
    }
  }

  // Skills — guard against malformed entries where name may be an object or undefined
  const toSkillName = (s: { name: string } | unknown): string => {
    if (!s || typeof s !== 'object') return String(s ?? '');
    const obj = s as Record<string, unknown>;
    if (typeof obj.name === 'string') return obj.name;
    if (obj.name && typeof obj.name === 'object') return String((obj.name as Record<string, unknown>).name ?? '');
    return '';
  };
  const oldSkillSet = new Set((oldContent.skills ?? []).map((s) => toSkillName(s).toLowerCase()));
  const newSkillSet = new Set((newContent.skills ?? []).map((s) => toSkillName(s).toLowerCase()));

  const addedSkills = (newContent.skills ?? [])
    .filter((s) => !oldSkillSet.has(toSkillName(s).toLowerCase()))
    .map((s) => toSkillName(s))
    .filter(Boolean);
  const removedSkills = (oldContent.skills ?? [])
    .filter((s) => !newSkillSet.has(toSkillName(s).toLowerCase()))
    .map((s) => toSkillName(s))
    .filter(Boolean);

  if (addedSkills.length > 0 || removedSkills.length > 0) {
    diffs.push({
      section: 'skills',
      label: 'Skills',
      added: addedSkills,
      removed: removedSkills,
      hasChanges: true,
    });
  }

  return diffs;
}
