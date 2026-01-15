-- Create movie_categories table for category management
CREATE TABLE public.movie_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.movie_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for movie_categories
CREATE POLICY "Anyone can view categories"
ON public.movie_categories FOR SELECT
USING (true);

CREATE POLICY "Admins can insert categories"
ON public.movie_categories FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update categories"
ON public.movie_categories FOR UPDATE
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can delete categories"
ON public.movie_categories FOR DELETE
TO authenticated
USING (is_admin());

-- Create login_history table
CREATE TABLE public.login_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT true,
  location TEXT
);

-- Enable RLS
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for login_history
CREATE POLICY "Admins can view all login history"
ON public.login_history FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Users can view own login history"
ON public.login_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert login history"
ON public.login_history FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add suspension fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id);

-- Create user_2fa table for two-factor auth settings
CREATE TABLE public.user_2fa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  secret_key TEXT,
  backup_codes TEXT[],
  enabled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_2fa
CREATE POLICY "Admins can view 2FA status"
ON public.user_2fa FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Users can view own 2FA"
ON public.user_2fa FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2FA"
ON public.user_2fa FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own 2FA"
ON public.user_2fa FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create low_rating_alerts table
CREATE TABLE public.low_rating_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  avg_rating NUMERIC(3,2) NOT NULL,
  total_ratings INTEGER NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'low_rating',
  is_acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.low_rating_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for low_rating_alerts
CREATE POLICY "Admins can view all alerts"
ON public.low_rating_alerts FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update alerts"
ON public.low_rating_alerts FOR UPDATE
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can delete alerts"
ON public.low_rating_alerts FOR DELETE
TO authenticated
USING (is_admin());

-- Insert function to auto-create alerts for low ratings
CREATE OR REPLACE FUNCTION public.check_low_rating_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating_value NUMERIC(3,2);
  total_ratings_count INTEGER;
  movie_uuid UUID;
BEGIN
  -- Try to cast movie_id to UUID, skip if invalid
  BEGIN
    movie_uuid := NEW.movie_id::UUID;
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
  END;
  
  -- Calculate average rating for the movie
  SELECT AVG(rating)::NUMERIC(3,2), COUNT(*)
  INTO avg_rating_value, total_ratings_count
  FROM public.ratings
  WHERE movie_id = NEW.movie_id;
  
  -- If average rating is below 2.5 and there are at least 3 ratings, create an alert
  IF avg_rating_value < 2.5 AND total_ratings_count >= 3 THEN
    INSERT INTO public.low_rating_alerts (movie_id, avg_rating, total_ratings)
    VALUES (movie_uuid, avg_rating_value, total_ratings_count)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for low rating alerts
CREATE TRIGGER check_rating_alert
AFTER INSERT OR UPDATE ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION public.check_low_rating_alert();

-- Add trigger for updated_at on movie_categories
CREATE TRIGGER update_movie_categories_updated_at
BEFORE UPDATE ON public.movie_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on user_2fa
CREATE TRIGGER update_user_2fa_updated_at
BEFORE UPDATE ON public.user_2fa
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.movie_categories (name, slug, description) VALUES
('Hollywood', 'hollywood', 'American cinema productions'),
('Nollywood', 'nollywood', 'Nigerian film industry'),
('Bollywood', 'bollywood', 'Indian Hindi-language cinema'),
('Korean', 'korean', 'South Korean cinema'),
('Anime', 'anime', 'Japanese animated productions'),
('Chinese', 'chinese', 'Chinese cinema productions'),
('European', 'european', 'European film productions'),
('Thrillers', 'thrillers', 'Thriller genre films'),
('TV Series', 'tv-series', 'Television series and shows')
ON CONFLICT (slug) DO NOTHING;