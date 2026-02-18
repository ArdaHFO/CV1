import { NextRequest, NextResponse } from 'next/server';
import { addJobSearchTokens, addCvImportTokens, markCheckoutSuccess } from '@/lib/database/billing';
import { getServerUserId } from '@/lib/auth/server-user';

export async function POST(request: NextRequest) {
  try {
    const userId = await getServerUserId();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      purchaseType?: 'plan' | 'token-pack' | 'cv-import-pack';
      planId?: 'pro-monthly' | 'pro-yearly';
      tokenPackId?: 'job-search-5' | 'job-search-10';
      cvImportPackId?: 'cv-import-1' | 'cv-import-10';
    };

    const purchaseType = body.purchaseType ?? 'plan';

    if (purchaseType === 'plan') {
      if (!body.planId) {
        return NextResponse.json(
          { success: false, error: 'planId is required' },
          { status: 400 }
        );
      }

      await markCheckoutSuccess(userId, body.planId);
      return NextResponse.json({ success: true });
    }

    if (purchaseType === 'cv-import-pack') {
      if (!body.cvImportPackId) {
        return NextResponse.json(
          { success: false, error: 'cvImportPackId is required' },
          { status: 400 }
        );
      }
      await addCvImportTokens(userId, body.cvImportPackId);
      return NextResponse.json({ success: true });
    }

    // token-pack
    if (!body.tokenPackId) {
      return NextResponse.json(
        { success: false, error: 'tokenPackId is required' },
        { status: 400 }
      );
    }

    await addJobSearchTokens(userId, body.tokenPackId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process checkout success:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process checkout success' },
      { status: 500 }
    );
  }
}
