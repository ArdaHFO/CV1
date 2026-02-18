-- Add purchased_cv_import_tokens to user_usage_limits
-- Free users get 1 free import (tracked by freemium_cv_imports).
-- Additional imports can be bought as one-time token packs.

ALTER TABLE user_usage_limits
  ADD COLUMN IF NOT EXISTS freemium_cv_imports       integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchased_cv_import_tokens integer NOT NULL DEFAULT 0;
