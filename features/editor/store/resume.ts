import { create } from 'zustand';
import type { ResumeState, ResumeData, ResumeBasics } from '@/types';

// Mock initial state - Bu gerçek bir projede API'den gelecek
const initialResumeData: ResumeData = {
  basics: {
    name: 'John Doe',
    headline: 'Full Stack Developer',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    website: {
      url: 'https://johndoe.dev',
      label: 'johndoe.dev'
    },
    customFields: [],
    picture: ''
  },
  sections: []
};

export const useResumeStore = create<ResumeState>((set) => ({
  resume: {
    data: initialResumeData
  }
}));
