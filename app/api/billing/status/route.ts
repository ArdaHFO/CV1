import { NextRequest, NextResponse } from 'next/server';
import { getBillingStatus } from '@/lib/database/billing';
import { getServerUserId } from '@/lib/auth/server-user';

export async function GET(request: NextRequest) {
  try {
    const userId = await getServerUserId();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const status = await getBillingStatus(userId);
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Failed to fetch billing status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch billing status' },
      { status: 500 }
    );
  }
}
