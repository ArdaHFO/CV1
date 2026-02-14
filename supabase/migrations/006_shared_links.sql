-- Shared CV Links Table
-- For tracking time-limited shareable CV links
-- Free users: 7 days expiration
-- Pro users: No expiration

CREATE TABLE public.shared_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  template_type template_type NOT NULL DEFAULT 'modern',
  content JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;

-- Users can view their own shared links
CREATE POLICY "Users can view their own shared links"
  ON public.shared_links FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own shared links
CREATE POLICY "Users can create their own shared links"
  ON public.shared_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own shared links
CREATE POLICY "Users can update their own shared links"
  ON public.shared_links FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own shared links
CREATE POLICY "Users can delete their own shared links"
  ON public.shared_links FOR DELETE
  USING (auth.uid() = user_id);

-- Anyone can view active, non-expired shared links
CREATE POLICY "Anyone can view active shared links"
  ON public.shared_links FOR SELECT
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- Index for fast lookups by token
CREATE INDEX idx_shared_links_token ON public.shared_links(share_token);

-- Index for expiration queries
CREATE INDEX idx_shared_links_expires_at ON public.shared_links(expires_at) WHERE expires_at IS NOT NULL;

-- Auto-increment view count function
CREATE OR REPLACE FUNCTION increment_shared_link_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.shared_links
  SET view_count = view_count + 1,
      updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: View count increment would be handled via API instead of trigger for better control
