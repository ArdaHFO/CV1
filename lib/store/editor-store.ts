import { create } from 'zustand';
import { Resume, ResumeVersion, ResumeContent } from '@/types';

interface EditorStore {
  // State
  currentResume: Resume | null;
  currentVersion: ResumeVersion | null;
  content: ResumeContent | null;
  isDirty: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  setCurrentResume: (resume: Resume | null) => void;
  setCurrentVersion: (version: ResumeVersion | null) => void;
  setContent: (content: ResumeContent) => void;
  updateContent: (updates: Partial<ResumeContent>) => void;
  setIsDirty: (isDirty: boolean) => void;
  setIsSaving: (isSaving: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  // Initial state
  currentResume: null,
  currentVersion: null,
  content: null,
  isDirty: false,
  isSaving: false,
  error: null,

  // Actions
  setCurrentResume: (resume) => set({ currentResume: resume }),
  
  setCurrentVersion: (version) => {
    set({ 
      currentVersion: version,
      content: version?.content || null 
    });
  },
  
  setContent: (content) => set({ content, isDirty: true }),
  
  updateContent: (updates) =>
    set((state) => ({
      content: state.content ? { ...state.content, ...updates } : null,
      isDirty: true,
    })),
  
  setIsDirty: (isDirty) => set({ isDirty }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setError: (error) => set({ error }),
  
  reset: () =>
    set({
      currentResume: null,
      currentVersion: null,
      content: null,
      isDirty: false,
      isSaving: false,
      error: null,
    }),
}));
