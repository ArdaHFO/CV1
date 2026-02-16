-- Make auth user bootstrap resilient so signup never fails with
-- "Database error saving new user" due to profile trigger issues.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  candidate_username TEXT;
BEGIN
  candidate_username := NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), '');

  IF candidate_username IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.username = candidate_username
      AND p.id <> NEW.id
  ) THEN
    candidate_username := NULL;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, CONCAT('user-', NEW.id::text, '@placeholder.local')),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    candidate_username
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never block auth user creation because of profile bootstrap problems.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_user_billing()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, status, plan_tier)
  VALUES (NEW.id::text, 'inactive', 'freemium')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_usage_limits (user_id)
  VALUES (NEW.id::text)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never block auth user creation because of billing bootstrap problems.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Re-create the billing trigger to ensure updated function definition is used
DROP TRIGGER IF EXISTS on_auth_user_created_billing ON auth.users;

CREATE TRIGGER on_auth_user_created_billing
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_billing();