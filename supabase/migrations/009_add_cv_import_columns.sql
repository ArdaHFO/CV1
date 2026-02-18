-- Add CV import tracking columns that were missing from previous migrations
-- Safe to run on existing data

ALTER TABLE public.user_usage_limits
  ADD COLUMN IF NOT EXISTS freemium_cv_imports        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchased_cv_import_tokens INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.user_usage_limits.freemium_cv_imports        IS 'Number of free CV imports used (free tier gets 1)';
COMMENT ON COLUMN public.user_usage_limits.purchased_cv_import_tokens IS 'Additional CV import credits purchased via one-time payment';
