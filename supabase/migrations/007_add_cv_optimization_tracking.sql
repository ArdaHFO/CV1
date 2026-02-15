-- Add CV optimization tracking for freemium tier
ALTER TABLE public.user_usage_limits 
ADD COLUMN IF NOT EXISTS freemium_cv_optimizations INTEGER NOT NULL DEFAULT 0;

-- Add column for purchased optimization tokens if needed in the future
ALTER TABLE public.user_usage_limits 
ADD COLUMN IF NOT EXISTS purchased_optimization_tokens INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.user_usage_limits.freemium_cv_optimizations IS 'Number of CV optimizations used by freemium users (limit: 1)';
COMMENT ON COLUMN public.user_usage_limits.purchased_optimization_tokens IS 'Additional optimization tokens purchased by users';
