import { supabaseAdmin } from '@/lib/supabase/client';

export type PlanTier = 'freemium' | 'pro';
export type TokenPackId = 'job-search-5' | 'job-search-10';

type SubscriptionRow = {
  user_id: string;
  status: 'active' | 'inactive';
  plan_tier: PlanTier;
  plan_id: string | null;
  plan_name: string | null;
  amount: string | null;
  paid_at: string | null;
  expires_at: string | null;
  payment_method: string | null;
};

type UsageRow = {
  user_id: string;
  freemium_job_searches: number;
  pro_job_searches: number;
  freemium_cv_creations: number;
  freemium_cv_optimizations: number;
  purchased_job_search_tokens: number;
  purchased_optimization_tokens: number;
};

export type BillingStatus = {
  planTier: PlanTier;
  subscription: {
    status: 'active' | 'inactive';
    planId: string | null;
    planName: string | null;
    amount: string | null;
    paidAt: string | null;
    expiresAt: string | null;
    paymentMethod: string | null;
  };
  usage: {
    freemiumJobSearches: number;
    proJobSearches: number;
    freemiumCvCreations: number;
    freemiumCvOptimizations: number;
    purchasedJobSearchTokens: number;
    purchasedOptimizationTokens: number;
  };
  remaining: {
    jobSearches: number;
    includedJobSearches: number;
    tokenJobSearches: number;
    cvCreations: number | 'unlimited';
    cvOptimizations: number | 'unlimited';
  };
};

function requireAdminClient() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not configured');
  }
  return supabaseAdmin;
}

function isSubscriptionActive(row: SubscriptionRow | null): boolean {
  if (!row || row.status !== 'active' || !row.expires_at) return false;
  return new Date(row.expires_at).getTime() > Date.now();
}

function mapPlanTier(subscription: SubscriptionRow | null): PlanTier {
  return isSubscriptionActive(subscription) && subscription?.plan_tier === 'pro'
    ? 'pro'
    : 'freemium';
}

async function ensureUsageRow(userId: string): Promise<UsageRow> {
  const admin = requireAdminClient();

  const { data: existing, error: existingError } = await (admin as any)
    .from('user_usage_limits')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) return existing as UsageRow;

  const initialUsage: UsageRow = {
    user_id: userId,
    freemium_job_searches: 0,
    pro_job_searches: 0,
    freemium_cv_creations: 0,
    freemium_cv_optimizations: 0,
    purchased_job_search_tokens: 0,
    purchased_optimization_tokens: 0,
  };

  const { data: inserted, error: insertError } = await (admin as any)
    .from('user_usage_limits')
    .upsert(initialUsage, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted as UsageRow;
}

async function getSubscription(userId: string): Promise<SubscriptionRow | null> {
  const admin = requireAdminClient();

  const { data, error } = await (admin as any)
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data as SubscriptionRow | null) || null;
}

function getJobSearchQuota(planTier: PlanTier): number {
  return planTier === 'pro' ? 10 : 1;
}

export async function getBillingStatus(userId: string): Promise<BillingStatus> {
  const [subscription, usage] = await Promise.all([
    getSubscription(userId),
    ensureUsageRow(userId),
  ]);

  const planTier = mapPlanTier(subscription);
  const consumedSearches = planTier === 'pro' ? usage.pro_job_searches : usage.freemium_job_searches;
  const remainingIncludedSearches = Math.max(0, getJobSearchQuota(planTier) - consumedSearches);
  const remainingTokenSearches = Math.max(0, usage.purchased_job_search_tokens ?? 0);
  const remainingJobSearches = remainingIncludedSearches + remainingTokenSearches;

  const cvRemaining = planTier === 'pro'
    ? 'unlimited'
    : Math.max(0, 1 - usage.freemium_cv_creations);

  const optimizationRemaining = planTier === 'pro'
    ? 'unlimited'
    : Math.max(0, 1 - (usage.freemium_cv_optimizations ?? 0));

  console.log(`[GET_BILLING_STATUS] userId=${userId}, planTier=${planTier}, freemium_cv_creations=${usage.freemium_cv_creations}, cvRemaining=${cvRemaining}`);

  return {
    planTier,
    subscription: {
      status: isSubscriptionActive(subscription) ? 'active' : 'inactive',
      planId: subscription?.plan_id || null,
      planName: subscription?.plan_name || null,
      amount: subscription?.amount || null,
      paidAt: subscription?.paid_at || null,
      expiresAt: subscription?.expires_at || null,
      paymentMethod: subscription?.payment_method || null,
    },
    usage: {
      freemiumJobSearches: usage.freemium_job_searches,
      proJobSearches: usage.pro_job_searches,
      freemiumCvCreations: usage.freemium_cv_creations,
      freemiumCvOptimizations: usage.freemium_cv_optimizations ?? 0,
      purchasedJobSearchTokens: usage.purchased_job_search_tokens ?? 0,
      purchasedOptimizationTokens: usage.purchased_optimization_tokens ?? 0,
    },
    remaining: {
      jobSearches: remainingJobSearches,
      includedJobSearches: remainingIncludedSearches,
      tokenJobSearches: remainingTokenSearches,
      cvCreations: cvRemaining,
      cvOptimizations: optimizationRemaining,
    },
  };
}

export async function markCheckoutSuccess(userId: string, planId: 'pro-monthly' | 'pro-yearly') {
  const admin = requireAdminClient();
  await ensureUsageRow(userId);

  const plan = planId === 'pro-yearly'
    ? { planName: 'Pro Yearly', amount: '$79.99', durationDays: 365 }
    : { planName: 'Pro Monthly', amount: '$19.99', durationDays: 30 };

  const paidAt = new Date();
  const expiresAt = new Date(paidAt);
  expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

  const payload = {
    user_id: userId,
    status: 'active',
    plan_tier: 'pro',
    plan_id: planId,
    plan_name: plan.planName,
    amount: plan.amount,
    paid_at: paidAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    payment_method: 'Stripe Checkout',
  };

  const { error } = await (admin as any)
    .from('user_subscriptions')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) throw error;
}

export async function addJobSearchTokens(userId: string, tokenPackId: TokenPackId) {
  const admin = requireAdminClient();
  const usage = await ensureUsageRow(userId);

  const packTokens = tokenPackId === 'job-search-10' ? 10 : 5;
  const updatedTokens = (usage.purchased_job_search_tokens ?? 0) + packTokens;

  const { error } = await (admin as any)
    .from('user_usage_limits')
    .update({ purchased_job_search_tokens: updatedTokens })
    .eq('user_id', userId);

  if (error) throw error;
}

export async function consumeUsage(
  userId: string,
  action: 'job-search' | 'cv-creation' | 'cv-optimization'
): Promise<{ allowed: boolean; message: string; status: BillingStatus }> {
  const admin = requireAdminClient();
  const status = await getBillingStatus(userId);

  if (action === 'job-search') {
    if (status.remaining.includedJobSearches > 0) {
      const updates = status.planTier === 'pro'
        ? { pro_job_searches: status.usage.proJobSearches + 1 }
        : { freemium_job_searches: status.usage.freemiumJobSearches + 1 };

      const { error } = await (admin as any)
        .from('user_usage_limits')
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;

      return {
        allowed: true,
        message: 'Job search quota consumed.',
        status: await getBillingStatus(userId),
      };
    }

    if (status.remaining.tokenJobSearches > 0) {
      const { error } = await (admin as any)
        .from('user_usage_limits')
        .update({
          purchased_job_search_tokens: status.usage.purchasedJobSearchTokens - 1,
        })
        .eq('user_id', userId);

      if (error) throw error;

      return {
        allowed: true,
        message: '1 purchased job-search token consumed.',
        status: await getBillingStatus(userId),
      };
    }

    if (status.remaining.jobSearches <= 0) {
      return {
        allowed: false,
        message:
          status.planTier === 'pro'
            ? 'You reached your Pro quota (10 searches). Buy token packs to continue.'
            : 'Freemium allows only 1 job search. Upgrade or buy token packs to continue.',
        status,
      };
    }
  }

  if (action === 'cv-creation') {
    console.log(`[CONSUME_CV] userId=${userId}, planTier=${status.planTier}, remaining=${status.remaining.cvCreations}`);
    
    if (status.planTier === 'pro') {
      return {
        allowed: true,
        message: 'Pro plan has unlimited CV creations.',
        status,
      };
    }

    if (status.remaining.cvCreations === 0) {
      console.log(`[CONSUME_CV_BLOCKED] userId=${userId}, no remaining CV creations`);
      return {
        allowed: false,
        message: 'Freemium allows only 1 CV creation.',
        status,
      };
    }

    const { error } = await (admin as any)
      .from('user_usage_limits')
      .update({ freemium_cv_creations: status.usage.freemiumCvCreations + 1 })
      .eq('user_id', userId);

    if (error) throw error;

    console.log(`[CONSUME_CV_SUCCESS] userId=${userId}, updated from ${status.usage.freemiumCvCreations} to ${status.usage.freemiumCvCreations + 1}`);

    return {
      allowed: true,
      message: 'CV creation quota consumed.',
      status: await getBillingStatus(userId),
    };
  }

  if (action === 'cv-optimization') {
    console.log(`[CONSUME_OPTIMIZATION] userId=${userId}, planTier=${status.planTier}, remaining=${status.remaining.cvOptimizations}`);
    
    if (status.planTier === 'pro') {
      return {
        allowed: true,
        message: 'Pro plan has unlimited CV optimizations.',
        status,
      };
    }

    if (status.remaining.cvOptimizations === 0) {
      console.log(`[CONSUME_OPTIMIZATION_BLOCKED] userId=${userId}, no remaining optimizations`);
      return {
        allowed: false,
        message: 'Freemium allows only 1 CV optimization. Upgrade to Pro for unlimited optimizations.',
        status,
      };
    }

    const { error } = await (admin as any)
      .from('user_usage_limits')
      .update({ freemium_cv_optimizations: status.usage.freemiumCvOptimizations + 1 })
      .eq('user_id', userId);

    if (error) throw error;

    console.log(`[CONSUME_OPTIMIZATION_SUCCESS] userId=${userId}, updated from ${status.usage.freemiumCvOptimizations} to ${status.usage.freemiumCvOptimizations + 1}`);

    return {
      allowed: true,
      message: 'CV optimization quota consumed.',
      status: await getBillingStatus(userId),
    };
  }

  return {
    allowed: false,
    message: 'Invalid action.',
    status,
  };
}
