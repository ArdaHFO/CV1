import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get('code') ?? '').trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ valid: false, error: 'No code provided.' }, { status: 400 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ valid: false, error: 'Stripe not configured.' }, { status: 500 });
  }

  try {
    const stripe = new Stripe(secretKey);

    const result = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
    });

    const promo = result.data[0] as (Stripe.PromotionCode & { coupon?: Stripe.Coupon }) | undefined;

    if (!promo) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired promo code.' });
    }

    const coupon = promo.coupon;
    const percentOff = coupon?.percent_off ?? null;
    const amountOff = coupon?.amount_off ?? null;

    const label =
      percentOff != null
        ? `${percentOff}% off`
        : amountOff != null
        ? `$${(amountOff / 100).toFixed(2)} off`
        : 'Discount applied';

    return NextResponse.json({
      valid: true,
      promoId: promo.id,
      percentOff,
      amountOff,
      label,
    });
  } catch (error) {
    console.error('[validate-promo] error:', error);
    return NextResponse.json({ valid: false, error: 'Could not validate promo code.' }, { status: 500 });
  }
}
