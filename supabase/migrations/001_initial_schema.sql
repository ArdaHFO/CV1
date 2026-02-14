-- Create custom types
CREATE TYPE template_type AS ENUM ('modern', 'academic', 'minimalist', 'designer', 'photo', 'latex');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  username TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Resumes table
CREATE TABLE public.resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resumes"
  ON public.resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resumes"
  ON public.resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes"
  ON public.resumes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes"
  ON public.resumes FOR DELETE
  USING (auth.uid() = user_id);

-- Public access for viewing shared CVs
CREATE POLICY "Anyone can view public resumes"
  ON public.resumes FOR SELECT
  USING (true);

-- Resume versions table
CREATE TABLE public.resume_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  template_type template_type NOT NULL DEFAULT 'modern',
  is_active BOOLEAN DEFAULT true,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(resume_id, version_number)
);

ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resume versions"
  ON public.resume_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes
      WHERE resumes.id = resume_versions.resume_id
      AND resumes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own resume versions"
  ON public.resume_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resumes
      WHERE resumes.id = resume_versions.resume_id
      AND resumes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own resume versions"
  ON public.resume_versions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes
      WHERE resumes.id = resume_versions.resume_id
      AND resumes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own resume versions"
  ON public.resume_versions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes
      WHERE resumes.id = resume_versions.resume_id
      AND resumes.user_id = auth.uid()
    )
  );

-- Job searches table
CREATE TABLE public.job_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  platform TEXT NOT NULL,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.job_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own job searches"
  ON public.job_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job searches"
  ON public.job_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job searches"
  ON public.job_searches FOR DELETE
  USING (auth.uid() = user_id);

-- AI optimization history table
CREATE TABLE public.ai_optimizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  resume_version_id UUID REFERENCES public.resume_versions(id) ON DELETE CASCADE,
  optimization_type TEXT NOT NULL, -- 'cv_optimize', 'cover_letter', 'section_improve'
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ai_optimizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI optimizations"
  ON public.ai_optimizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI optimizations"
  ON public.ai_optimizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX idx_resumes_slug ON public.resumes(slug);
CREATE INDEX idx_resume_versions_resume_id ON public.resume_versions(resume_id);
CREATE INDEX idx_job_searches_user_id ON public.job_searches(user_id);
CREATE INDEX idx_ai_optimizations_user_id ON public.ai_optimizations(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resume_versions_updated_at BEFORE UPDATE ON public.resume_versions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'username'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_resume_views(resume_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.resumes
  SET view_count = view_count + 1
  WHERE id = resume_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
