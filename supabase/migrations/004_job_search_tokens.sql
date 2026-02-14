ALTER TABLE public.user_usage_limits
ADD COLUMN IF NOT EXISTS purchased_job_search_tokens INTEGER NOT NULL DEFAULT 0;
