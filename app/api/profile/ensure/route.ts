import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: 'Supabase is not configured.' },
      { status: 500 }
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized.' },
      { status: 401 }
    );
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      {
        success: false,
        message: 'Server is missing SUPABASE_SERVICE_ROLE_KEY (profiles bootstrap cannot run).',
      },
      { status: 500 }
    );
  }

  const email =
    user.email ?? `user-${user.id}@placeholder.local`;
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    null;
  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ||
    (user.user_metadata?.picture as string | undefined) ||
    null;

  const { error: upsertError } = await (supabaseAdmin as any)
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (upsertError) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to ensure profile row.',
        error: upsertError,
      },
      { status: 500 }
    );
  }

  // No body needed; keep it simple.
  void request;
  return NextResponse.json({ success: true });
}
