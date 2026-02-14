import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerUserId } from '@/lib/auth/server-user';

const PLAN_CONFIG = {
  'pro-monthly': {
    name: 'CSpark Pro Monthly',
    amount: 999,
    intervalLabel: 'month',
  },
  'pro-yearly': {
    name: 'CSpark Pro Yearly',
    amount: 7999,
    intervalLabel: 'year',
  },
} as const;

const TOKEN_PACK_CONFIG = {
  'job-search-5': {
    name: 'CSpark Job Search Tokens (5)',
    amount: 499,
    tokenCount: 5,
  },
  'job-search-10': {
    name: 'CSpark Job Search Tokens (10)',
    amount: 999,
    tokenCount: 10,
  },
} as const;

type PlanId = keyof typeof PLAN_CONFIG;
type TokenPackId = keyof typeof TOKEN_PACK_CONFIG;
type PurchaseType = 'plan' | 'token-pack';

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
    };

    const purchaseType: PurchaseType = body.purchaseType === 'token-pack' ? 'token-pack' : 'plan';

    const planId = body.planId;
    const tokenPackId = body.tokenPackId;

    if (purchaseType === 'plan' && (!planId || !(planId in PLAN_CONFIG))) {
      return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 400 });
    }

    if (purchaseType === 'token-pack' && (!tokenPackId || !(tokenPackId in TOKEN_PACK_CONFIG))) {
      return NextResponse.json({ error: 'Invalid token pack selected.' }, { status: 400 });
    }

    const selectedPlan = purchaseType === 'plan' ? PLAN_CONFIG[planId as PlanId] : null;
    const selectedTokenPack = purchaseType === 'token-pack' ? TOKEN_PACK_CONFIG[tokenPackId as TokenPackId] : null;

    const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const successUrl = purchaseType === 'plan'
      ? `${origin}/dashboard?checkout=success&checkoutType=plan&plan=${planId}`
      : `${origin}/dashboard?checkout=success&checkoutType=token-pack&tokenPack=${tokenPackId}`;
    const cancelUrl = `${origin}/dashboard?checkout=cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: purchaseType === 'plan' ? selectedPlan!.amount : selectedTokenPack!.amount,
            product_data: {
              name: purchaseType === 'plan' ? selectedPlan!.name : selectedTokenPack!.name,
              description:
                purchaseType === 'plan'
                  ? `CSpark premium access billed per ${selectedPlan!.intervalLabel}.`
                  : `${selectedTokenPack!.tokenCount} additional job-search tokens for CSpark.`,
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        purchaseType,
        planId: purchaseType === 'plan' ? planId : '',
        tokenPackId: purchaseType === 'token-pack' ? tokenPackId : '',
        userId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Failed to create Stripe Checkout session:', error);
    return NextResponse.json({ error: 'Could not create checkout session.' }, { status: 500 });
  }
}
