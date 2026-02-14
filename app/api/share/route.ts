import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ResumeContent, TemplateType } from '@/types';

// Create a shareable link for CV
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { resumeId, content, template = 'modern' } = await request.json();

    if (!resumeId || !content) {
      return NextResponse.json(
        { error: 'Resume ID and content are required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Check user's billing status to determine expiration
    const { data: billingData } = await supabase
      .from('user_billing')
      .select('plan_type')
      .eq('user_id', user.id)
      .single();

    const isPro = billingData?.plan_type === 'pro' || billingData?.plan_type === 'lifetime';

    // Generate unique share token
    const shareToken = crypto.randomUUID();

    // Calculate expiration date (7 days for free users, null for pro)
    const expiresAt = isPro 
      ? null 
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // Insert shared link into database
    const { data: sharedLink, error } = await supabase
      .from('shared_links')
      .insert({
        user_id: user.id,
        resume_id: resumeId,
        share_token: shareToken,
        template_type: template,
        content: content,
        expires_at: expiresAt,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating shared link:', error);
      return NextResponse.json(
        { 
          error: 'Failed to create shared link',
          details: error.message,
          hint: error.hint || 'Check if shared_links table exists in database'
        },
        { status: 500 }
      );
    }

    // Generate shareable URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/share/${shareToken}`;

    return NextResponse.json({
      success: true,
      shareUrl,
      expiresAt,
      isPro,
      shareToken,
    });
  } catch (error) {
    console.error('Error in share link creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get shared link details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Share token is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Fetch shared link
    const { data: sharedLink, error } = await supabase
      .from('shared_links')
      .select('*')
      .eq('share_token', token)
      .eq('is_active', true)
      .single();

    if (error || !sharedLink) {
      return NextResponse.json(
        { error: 'Shared link not found or expired' },
        { status: 404 }
      );
    }

    // Check if expired
    if (sharedLink.expires_at && new Date(sharedLink.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This link has expired' },
        { status: 410 }
      );
    }

    // Increment view count
    await supabase
      .from('shared_links')
      .update({ 
        view_count: (sharedLink.view_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', sharedLink.id);

    return NextResponse.json({
      success: true,
      content: sharedLink.content,
      template: sharedLink.template_type,
      expiresAt: sharedLink.expires_at,
      viewCount: sharedLink.view_count + 1,
    });
  } catch (error) {
    console.error('Error fetching shared link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
