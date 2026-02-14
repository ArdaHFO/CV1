import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getServerUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user.id;
}
