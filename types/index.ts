// Database Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  title: string; // e.g., "Frontend Developer CV"
  slug: string; // URL-friendly version
  is_default: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface ResumeVersion {
  id: string;
  resume_id: string;
  version_number: number;
  template_type: TemplateType;
  is_active: boolean;
  content: ResumeContent;
  created_at: string;
  updated_at: string;
}

export type TemplateType = 
  | 'modern' 
  | 'azurill'
  | 'academic';

export interface ResumeContent {
  personal_info: PersonalInfo;
  summary?: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  languages?: Language[];
  certifications?: Certification[];
  projects?: Project[];
  publications?: Publication[]; // For academic CVs
  custom_sections?: CustomSection[];
}

export interface PersonalInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  photo_url?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location?: string;
  start_date: string;
  end_date?: string; // null means current
  is_current: boolean;
  description: string;
  achievements?: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  gpa?: string;
  honors?: string[];
}

export interface Skill {
  id: string;
  name: string;
  category: string; // e.g., "Programming", "Design", "Languages"
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface Language {
  id: string;
  name: string;
  proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credential_id?: string;
  credential_url?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url?: string;
  github_url?: string;
  technologies: string[];
  start_date?: string;
  end_date?: string;
}

export interface Publication {
  id: string;
  title: string;
  authors: string[];
  venue: string; // Journal, Conference, etc.
  year: number;
  doi?: string;
  url?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

// Job Search Types
export interface JobSearch {
  id: string;
  user_id: string;
  query: string;
  platform: 'linkedin' | 'indeed' | 'custom';
  results: JobListing[];
  created_at: string;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location?: string;
  description: string;
  requirements?: string[];
  posted_date?: string;
  url: string;
  keywords?: string[];
}

// AI Types
export interface AIOptimizationRequest {
  resume_content: ResumeContent;
  job_description: string;
  focus_areas?: ('summary' | 'experience' | 'skills')[];
}

export interface AIOptimizationResponse {
  optimized_summary?: string;
  optimized_experiences?: Experience[];
  keyword_suggestions: string[];
  missing_skills: string[];
  score: number; // Match score 0-100
  recommendations: string[];
}

export interface CoverLetterRequest {
  resume_content: ResumeContent;
  job_listing: JobListing;
  tone?: 'professional' | 'friendly' | 'formal';
}

export interface CoverLetterResponse {
  content: string;
  suggestions?: string[];
}

// PDF & Export Types
export interface PDFExportOptions {
  template: TemplateType;
  color_scheme?: string;
  include_qr?: boolean;
  paper_size?: 'A4' | 'Letter';
}

export interface LaTeXExportOptions {
  template_style: 'academic' | 'moderncv' | 'altacv';
  font_size?: number;
  color_theme?: string;
}

// State Management Types
export interface EditorState {
  currentResume: Resume | null;
  currentVersion: ResumeVersion | null;
  isDirty: boolean;
  isSaving: boolean;
  error: string | null;
}

export interface DashboardState {
  resumes: Resume[];
  loading: boolean;
  error: string | null;
}

// Job Types
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  skills: string[];
  salary_range?: string;
  employment_type: 'full-time' | 'part-time' | 'contract' | 'internship';
  posted_date: string;
  apply_url?: string;
  source: 'linkedin' | 'indeed' | 'mock' | 'workday';
}

export interface JobSearchParams {
  keywords: string;
  location?: string;
  employment_type?: string;
  experience_level?: string;
  limit?: number;
}

export interface CVOptimizationSuggestion {
  section: 'summary' | 'experience' | 'skills' | 'education';
  /** 0-based index of which experience entry to update (null for non-experience sections) */
  experience_index?: number | null;
  current?: string;
  suggested: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  impact?: 'ATS' | 'Readability' | 'Relevance';
}

export interface CVOptimizationResult {
  job_match_score: number; // 0-100
  match_breakdown?: {
    keywords: number;
    experience: number;
    skills: number;
    summary: number;
  };
  suggestions: CVOptimizationSuggestion[];
  missing_skills: string[];
  matching_skills: string[];
  recommended_changes: string[];
  job_title_detected?: string;
  top_keywords?: string[];
}

// Application Tracker Types
export type ApplicationStatus = 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Rejected';

export interface ApplicationNote {
  id: string;
  application_id: string;
  user_id: string;
  note: string;
  created_at: string;
}

export interface ApplicationInterview {
  id: string;
  application_id: string;
  user_id: string;
  stage: string;
  scheduled_at?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  job_id?: string | null;
  job_title: string;
  company: string;
  location?: string | null;
  job_url?: string | null;
  status: ApplicationStatus;
  applied_at?: string | null;
  reminder_at?: string | null;
  resume_id?: string | null;
  resume_version_id?: string | null;
  created_at: string;
  updated_at: string;
  notes?: ApplicationNote[];
  interviews?: ApplicationInterview[];
}

// Azurill Template System Types
export interface TemplateProps {
  pageIndex: number;
  pageLayout: PageLayout;
}

export interface PageLayout {
  main: string[];
  sidebar: string[];
  fullWidth: boolean;
}

export interface ResumeBasics {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: {
    url: string;
    label: string;
  };
  customFields: CustomField[];
  picture?: string;
}

export interface CustomField {
  id: string;
  icon: string;
  text: string;
  link?: string;
}

export interface ResumeSection {
  id: string;
  type: string;
  visible: boolean;
  name: string;
  items?: any[];
}

export interface ResumeData {
  basics: ResumeBasics;
  sections: ResumeSection[];
}

export interface ResumeState {
  resume: {
    data: ResumeData;
  };
}
