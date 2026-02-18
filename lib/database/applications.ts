import { supabase } from '@/lib/supabase/client';
import type { Application, ApplicationInterview, ApplicationNote } from '@/types';

type ApplicationCreateInput = Omit<Application, 'id' | 'created_at' | 'updated_at' | 'notes' | 'interviews'>;
type ApplicationUpdateInput = Partial<Omit<Application, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'notes' | 'interviews'>>;

export async function getApplications(userId: string): Promise<Application[]> {
  if (!supabase) return [];

  const { data, error } = await (supabase as any)
    .from('applications')
    .select('*, application_notes(*), application_interviews(*)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications:', error);
    return [];
  }

  return (data as Application[]).map((item) => {
    const raw = item as any;
    return {
      ...item,
      notes: raw.application_notes || [],
      interviews: raw.application_interviews || [],
    };
  });
}

export async function createApplication(payload: ApplicationCreateInput): Promise<Application | null> {
  if (!supabase) return null;

  const { data, error } = await (supabase as any)
    .from('applications')
    .insert(payload)
    .select('*, application_notes(*), application_interviews(*)')
    .single();

  if (error) {
    console.error('Error creating application:', error);
    return null;
  }

  const raw = data as any;
  return {
    ...(data as Application),
    notes: raw.application_notes || [],
    interviews: raw.application_interviews || [],
  };
}

export async function updateApplication(
  applicationId: string,
  updates: ApplicationUpdateInput
): Promise<Application | null> {
  if (!supabase) return null;

  const { data, error } = await (supabase as any)
    .from('applications')
    .update(updates)
    .eq('id', applicationId)
    .select('*, application_notes(*), application_interviews(*)')
    .single();

  if (error) {
    console.error('Error updating application:', error);
    return null;
  }

  const raw = data as any;
  return {
    ...(data as Application),
    notes: raw.application_notes || [],
    interviews: raw.application_interviews || [],
  };
}

export async function deleteApplication(applicationId: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await (supabase as any)
    .from('applications')
    .delete()
    .eq('id', applicationId);

  if (error) {
    console.error('Error deleting application:', error);
    return false;
  }

  return true;
}

export async function addApplicationNote(
  applicationId: string,
  userId: string,
  note: string
): Promise<ApplicationNote | null> {
  if (!supabase) return null;

  const { data, error } = await (supabase as any)
    .from('application_notes')
    .insert({ application_id: applicationId, user_id: userId, note })
    .select('*')
    .single();

  if (error) {
    console.error('Error adding application note:', error);
    return null;
  }

  return data as ApplicationNote;
}

export async function addApplicationInterview(
  applicationId: string,
  userId: string,
  stage: string,
  scheduledAt?: string | null,
  notes?: string | null
): Promise<ApplicationInterview | null> {
  if (!supabase) return null;

  const { data, error } = await (supabase as any)
    .from('application_interviews')
    .insert({
      application_id: applicationId,
      user_id: userId,
      stage,
      scheduled_at: scheduledAt ?? null,
      notes: notes ?? null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error adding application interview:', error);
    return null;
  }

  return data as ApplicationInterview;
}
