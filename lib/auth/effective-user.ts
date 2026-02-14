import { getCurrentUser } from '@/lib/auth/auth';

export async function getEffectiveUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id || null;
}
