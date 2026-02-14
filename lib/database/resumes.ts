import { supabase } from '../supabase/client';
import type { Resume, ResumeVersion, ResumeContent } from '@/types';

// Get all resumes for the current user
export async function getUserResumes(userId: string): Promise<Resume[]> {
  if (!supabase) return [];

  const { data, error } = await (supabase as any)
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching resumes:', error);
    return [];
  }

  return data || [];
}

// Create a new resume
export async function createResume(
  userId: string,
  title: string,
  slug: string
): Promise<Resume | null> {
  if (!supabase) return null;

  const { data, error } = await (supabase as any)
    .from('resumes')
    .insert({
      user_id: userId,
      title,
      slug,
      is_default: false,
      view_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating resume:', error);
    return null;
  }

  return data;
}

// Update resume
export async function updateResume(
  resumeId: string,
  updates: Partial<Resume>
): Promise<Resume | null> {
  if (!supabase) return null;

  const { data, error } = await (supabase as any)
    .from('resumes')
    .update(updates)
    .eq('id', resumeId)
    .select()
    .single();

  if (error) {
    console.error('Error updating resume:', error);
    return null;
  }

  return data;
}

// Delete resume
export async function deleteResume(resumeId: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await (supabase as any).from('resumes').delete().eq('id', resumeId);

  if (error) {
    console.error('Error deleting resume:', error);
    return false;
  }

  return true;
}

// Get resume versions
export async function getResumeVersions(resumeId: string): Promise<ResumeVersion[]> {
  if (!supabase) return [];

  const { data, error } = await (supabase as any)
    .from('resume_versions')
    .select('*')
    .eq('resume_id', resumeId)
    .order('version_number', { ascending: false });

  if (error) {
    console.error('Error fetching resume versions:', error);
    return [];
  }

  return data || [];
}

// Create resume version
export async function createResumeVersion(
  resumeId: string,
  content: ResumeContent,
  templateType: string = 'modern'
): Promise<ResumeVersion | null> {
  if (!supabase) return null;

  // Get the latest version number
  const { data: versions } = await (supabase as any)
    .from('resume_versions')
    .select('version_number')
    .eq('resume_id', resumeId)
    .order('version_number', { ascending: false })
    .limit(1);

  const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

  const { data, error } = await (supabase as any)
    .from('resume_versions')
    .insert({
      resume_id: resumeId,
      version_number: nextVersion,
      template_type: templateType,
      is_active: true,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating resume version:', error);
    return null;
  }

  return data;
}

// Update resume version
export async function updateResumeVersion(
  versionId: string,
  content: ResumeContent
): Promise<ResumeVersion | null> {
  if (!supabase) return null;

  const { data, error } = await (supabase as any)
    .from('resume_versions')
    .update({ content })
    .eq('id', versionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating resume version:', error);
    return null;
  }

  return data;
}

// Get active resume version
export async function getActiveResumeVersion(resumeId: string): Promise<ResumeVersion | null> {
  if (!supabase) return null;

  const { data, error } = await (supabase as any)
    .from('resume_versions')
    .select('*')
    .eq('resume_id', resumeId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching active resume version:', error);
    return null;
  }

  return data;
}

// Increment resume view count
export async function incrementResumeViews(resumeId: string): Promise<void> {
  if (!supabase) return;

  await (supabase as any).rpc('increment_resume_views', {
    resume_id_param: resumeId,
  });
}
