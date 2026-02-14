import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Resume } from '@/types';

interface DashboardStore {
  resumes: Resume[];
  loading: boolean;
  error: string | null;
  selectedResume: Resume | null;

  setResumes: (resumes: Resume[]) => void;
  addResume: (resume: Resume) => void;
  updateResume: (id: string, updates: Partial<Resume>) => void;
  deleteResume: (id: string) => void;
  setDefaultResume: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedResume: (resume: Resume | null) => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      resumes: [],
      loading: false,
      error: null,
      selectedResume: null,

      setResumes: (resumes) => set({ resumes }),
      
      addResume: (resume) =>
        set((state) => ({ resumes: [resume, ...state.resumes] })),
      
      updateResume: (id, updates) =>
        set((state) => ({
          resumes: state.resumes.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),
      
      deleteResume: (id) =>
        set((state) => ({
          resumes: state.resumes.filter((r) => r.id !== id),
        })),
      
      setDefaultResume: (id) =>
        set((state) => ({
          resumes: state.resumes.map((r) => ({
            ...r,
            is_default: r.id === id,
          })),
        })),
      
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setSelectedResume: (selectedResume) => set({ selectedResume }),
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({ resumes: state.resumes }),
    }
  )
);
