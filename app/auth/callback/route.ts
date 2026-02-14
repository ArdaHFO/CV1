import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

function resolveSafeNextPath(nextParam: string | null): string {
  if (!nextParam || !nextParam.startsWith('/')) {
    return '/dashboard';
  }

  if (nextParam.startsWith('//')) {
    return '/dashboard';
  }

  return nextParam;
}

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const redirectPath = resolveSafeNextPath(request.nextUrl.searchParams.get('next'));
  const code = request.nextUrl.searchParams.get('code');

  if (!supabaseUrl || !supabaseAnonKey) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'supabase_not_configured');
    return NextResponse.redirect(loginUrl);
  }

  let response = NextResponse.redirect(new URL(redirectPath, request.url));

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  if (!code) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'oauth_exchange_failed');
    loginUrl.searchParams.set('reason', error.message);
    return NextResponse.redirect(loginUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && supabaseAdmin) {
    const provider = user.app_metadata?.provider as string | undefined;
    const identities = (user.identities || []) as Array<{ provider?: string }>;
    const isGoogleOnlyIdentity =
      provider === 'google' &&
      identities.length === 1 &&
      identities[0]?.provider === 'google';

    if (isGoogleOnlyIdentity) {
      const { data: existingProfile } = await (supabaseAdmin as any)
        .from('profiles')
        .select('id, created_at')
        .eq('id', user.id)
        .maybeSingle();

      const now = Date.now();
      const userCreatedAtMs = Date.parse(user.created_at || '');
      const profileCreatedAtMs = existingProfile?.created_at
        ? Date.parse(existingProfile.created_at)
        : Number.NaN;
      const isRecentUser =
        Number.isFinite(userCreatedAtMs) && now - userCreatedAtMs < 10 * 60 * 1000;
      const isRecentProfile =
        Number.isFinite(profileCreatedAtMs) && now - profileCreatedAtMs < 10 * 60 * 1000;

      if (!existingProfile || isRecentUser || isRecentProfile) {
        await supabase.auth.signOut();
        await (supabaseAdmin as any).auth.admin.deleteUser(user.id);

        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', 'membership_required');
        loginUrl.searchParams.set(
          'reason',
          'Please register first before using Google sign-in.'
        );
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  if (user && supabaseAdmin) {
    const fullName =
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      null;
    const avatarUrl =
      (user.user_metadata?.avatar_url as string | undefined) ||
      (user.user_metadata?.picture as string | undefined) ||
      null;

    await (supabaseAdmin as any)
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email,
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
  }

  return response;
}
