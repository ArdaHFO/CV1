-- Ensure every new auth user gets default billing rows immediately
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_billing'
  ) THEN
    CREATE TRIGGER on_auth_user_created_billing
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_billing();
  END IF;
END $$;
