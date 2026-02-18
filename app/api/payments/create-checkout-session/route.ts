import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerUserId } from '@/lib/auth/server-user';

const PLAN_CONFIG = {
  'pro-monthly': {
    name: 'CSpark Pro Monthly',
    amount: 1999,
    intervalLabel: 'month',
  },
  'pro-yearly': {
    name: 'CSpark Pro Yearly',
    amount: 19999,
    intervalLabel: 'year',
  },
} as const;

const TOKEN_PACK_CONFIG = {
  'job-search-5': {
    name: 'CSpark Job Search Tokens (5)',
    amount: 999,
    tokenCount: 5,
  },
  'job-search-10': {
    name: 'CSpark Job Search Tokens (10)',
    amount: 1499,
    tokenCount: 10,
  },
} as const;

const CV_IMPORT_PACK_CONFIG = {
  'cv-import-5': {
    name: 'CSpark CV Import Pack (5)',
    amount: 999,
    importCount: 5,
  },
  'cv-import-10': {
    name: 'CSpark CV Import Pack (10)',
    amount: 1499,
    importCount: 10,
  },
} as const;

const AI_OPTIMIZE_PACK_CONFIG = {
  'ai-optimize-5': {
    name: 'CSpark AI Optimize Credits (5)',
    amount: 999,
    optimizeCount: 5,
  },
  'ai-optimize-10': {
    name: 'CSpark AI Optimize Credits (10)',
    amount: 1499,
    optimizeCount: 10,
  },
} as const;

type PlanId = keyof typeof PLAN_CONFIG;
type TokenPackId = keyof typeof TOKEN_PACK_CONFIG;
type CvImportPackId = keyof typeof CV_IMPORT_PACK_CONFIG;
type AiOptimizePackId = keyof typeof AI_OPTIMIZE_PACK_CONFIG;
type PurchaseType = 'plan' | 'token-pack' | 'cv-import-pack' | 'ai-optimize-pack';

export async function POST(request: Request) {
  try {
    const userId = await getServerUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        {
          error: 'Stripe is not fully configured. Add STRIPE_SECRET_KEY to .env.local.',
          code: 'stripe_not_configured',
        },
        { status: 500 }
      );
    }

    const stripe = new Stripe(secretKey);

    const body = (await request.json()) as {
      purchaseType?: PurchaseType;
      planId?: PlanId;
      tokenPackId?: TokenPackId;
      cvImportPackId?: CvImportPackId;
      aiOptimizePackId?: AiOptimizePackId;
    };

    const purchaseType: PurchaseType =
      body.purchaseType === 'token-pack'
        ? 'token-pack'
        : body.purchaseType === 'cv-import-pack'
        ? 'cv-import-pack'
        : body.purchaseType === 'ai-optimize-pack'
        ? 'ai-optimize-pack'
        : 'plan';

    const planId = body.planId;
    const tokenPackId = body.tokenPackId;
    const cvImportPackId = body.cvImportPackId;
    const aiOptimizePackId = body.aiOptimizePackId;

    if (purchaseType === 'plan' && (!planId || !(planId in PLAN_CONFIG))) {
      return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 400 });
    }

    if (purchaseType === 'token-pack' && (!tokenPackId || !(tokenPackId in TOKEN_PACK_CONFIG))) {
      return NextResponse.json({ error: 'Invalid token pack selected.' }, { status: 400 });
    }

    if (purchaseType === 'cv-import-pack' && (!cvImportPackId || !(cvImportPackId in CV_IMPORT_PACK_CONFIG))) {
      return NextResponse.json({ error: 'Invalid CV import pack selected.' }, { status: 400 });
    }

    if (purchaseType === 'ai-optimize-pack' && (!aiOptimizePackId || !(aiOptimizePackId in AI_OPTIMIZE_PACK_CONFIG))) {
      return NextResponse.json({ error: 'Invalid AI optimize pack selected.' }, { status: 400 });
    }

    const selectedPlan = purchaseType === 'plan' ? PLAN_CONFIG[planId as PlanId] : null;
    const selectedTokenPack = purchaseType === 'token-pack' ? TOKEN_PACK_CONFIG[tokenPackId as TokenPackId] : null;
    const selectedCvImportPack = purchaseType === 'cv-import-pack' ? CV_IMPORT_PACK_CONFIG[cvImportPackId as CvImportPackId] : null;
    const selectedAiOptimizePack = purchaseType === 'ai-optimize-pack' ? AI_OPTIMIZE_PACK_CONFIG[aiOptimizePackId as AiOptimizePackId] : null;

    const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const successUrl =
      purchaseType === 'plan'
        ? `${origin}/dashboard?checkout=success&checkoutType=plan&plan=${planId}`
        : purchaseType === 'cv-import-pack'
        ? `${origin}/dashboard?checkout=success&checkoutType=cv-import-pack&cvImportPack=${cvImportPackId}`
        : purchaseType === 'ai-optimize-pack'
        ? `${origin}/dashboard?checkout=success&checkoutType=ai-optimize-pack&aiOptimizePack=${aiOptimizePackId}`
        : `${origin}/dashboard?checkout=success&checkoutType=token-pack&tokenPack=${tokenPackId}`;
    const cancelUrl = `${origin}/dashboard?checkout=cancelled`;

    const getProductName = () => {
      if (purchaseType === 'plan') return selectedPlan!.name;
      if (purchaseType === 'cv-import-pack') return selectedCvImportPack!.name;
      if (purchaseType === 'ai-optimize-pack') return selectedAiOptimizePack!.name;
      return selectedTokenPack!.name;
    };
    const getAmount = () => {
      if (purchaseType === 'plan') return selectedPlan!.amount;
      if (purchaseType === 'cv-import-pack') return selectedCvImportPack!.amount;
      if (purchaseType === 'ai-optimize-pack') return selectedAiOptimizePack!.amount;
      return selectedTokenPack!.amount;
    };
    const getDescription = () => {
      if (purchaseType === 'plan') return `CSpark premium access billed per ${selectedPlan!.intervalLabel}.`;
      if (purchaseType === 'cv-import-pack') return `${selectedCvImportPack!.importCount} CV import credit(s) for CSpark.`;
      if (purchaseType === 'ai-optimize-pack') return `${selectedAiOptimizePack!.optimizeCount} AI optimize credit(s) for CSpark.`;
      return `${selectedTokenPack!.tokenCount} additional job-search tokens for CSpark.`;
    };

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: getAmount(),
            product_data: {
              name: getProductName(),
              description: getDescription(),
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        purchaseType,
        planId: purchaseType === 'plan' ? (planId ?? '') : '',
        tokenPackId: purchaseType === 'token-pack' ? (tokenPackId ?? '') : '',
        cvImportPackId: purchaseType === 'cv-import-pack' ? (cvImportPackId ?? '') : '',
        aiOptimizePackId: purchaseType === 'ai-optimize-pack' ? (aiOptimizePackId ?? '') : '',
        userId,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Failed to create Stripe Checkout session:', error);
    return NextResponse.json({ error: 'Could not create checkout session.' }, { status: 500 });
  }
}
