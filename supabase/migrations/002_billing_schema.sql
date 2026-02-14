CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'inactive',
  plan_tier TEXT NOT NULL DEFAULT 'freemium',
  plan_id TEXT,
  plan_name TEXT,
  amount TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_usage_limits (
  user_id TEXT PRIMARY KEY,
  freemium_job_searches INTEGER NOT NULL DEFAULT 0,
  pro_job_searches INTEGER NOT NULL DEFAULT 0,
  freemium_cv_creations INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage_limits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_subscriptions'
      AND policyname = 'Users can view their own subscriptions'
  ) THEN
    CREATE POLICY "Users can view their own subscriptions"
      ON public.user_subscriptions FOR SELECT
      USING (auth.uid()::text = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_usage_limits'
      AND policyname = 'Users can view their own usage'
  ) THEN
    CREATE POLICY "Users can view their own usage"
      ON public.user_usage_limits FOR SELECT
      USING (auth.uid()::text = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_subscriptions_updated_at'
  ) THEN
    CREATE TRIGGER update_user_subscriptions_updated_at
      BEFORE UPDATE ON public.user_subscriptions
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_usage_limits_updated_at'
  ) THEN
    CREATE TRIGGER update_user_usage_limits_updated_at
      BEFORE UPDATE ON public.user_usage_limits
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
