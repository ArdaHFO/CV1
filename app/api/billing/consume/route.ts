import { NextRequest, NextResponse } from 'next/server';
import { consumeUsage } from '@/lib/database/billing';
import { getServerUserId } from '@/lib/auth/server-user';

export async function POST(request: NextRequest) {
  try {
    const userId = await getServerUserId();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      action?: 'job-search' | 'cv-creation' | 'cv-optimization';
    };

    if (!body.action) {
      return NextResponse.json(
        { success: false, error: 'action is required' },
        { status: 400 }
      );
    }

    const result = await consumeUsage(userId, body.action);

    return NextResponse.json({
      success: true,
      allowed: result.allowed,
      message: result.message,
      status: result.status,
    });
  } catch (error) {
    console.error('Failed to consume billing usage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to consume billing usage' },
      { status: 500 }
    );
  }
}
