-- Application tracker: applications, notes, interviews
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  job_id TEXT,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  job_url TEXT,
  status TEXT NOT NULL DEFAULT 'Applied',
  applied_at DATE,
  reminder_at TIMESTAMP WITH TIME ZONE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  resume_version_id UUID REFERENCES public.resume_versions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.application_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.application_interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stage TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own applications"
  ON public.applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
  ON public.applications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications"
  ON public.applications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own application notes"
  ON public.application_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own application notes"
  ON public.application_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own application notes"
  ON public.application_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own application notes"
  ON public.application_notes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own application interviews"
  ON public.application_interviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own application interviews"
  ON public.application_interviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own application interviews"
  ON public.application_interviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own application interviews"
  ON public.application_interviews FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_application_notes_application_id ON public.application_notes(application_id);
CREATE INDEX IF NOT EXISTS idx_application_interviews_application_id ON public.application_interviews(application_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_applications_updated_at'
  ) THEN
    CREATE TRIGGER update_applications_updated_at
      BEFORE UPDATE ON public.applications
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
