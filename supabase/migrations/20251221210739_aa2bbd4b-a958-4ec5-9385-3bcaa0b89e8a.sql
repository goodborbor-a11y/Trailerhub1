-- =====================================================
-- FIX 1: Ratings Privacy - Protect user_id exposure
-- =====================================================

-- Drop the overly permissive "Anyone can view ratings" policy
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.ratings;

-- Create a policy for authenticated users to view all ratings (for community features)
CREATE POLICY "Authenticated users can view ratings"
ON public.ratings
FOR SELECT
TO authenticated
USING (true);

-- Create a view for public aggregate movie statistics (no user_id exposed)
CREATE OR REPLACE VIEW public.movie_rating_stats AS
SELECT 
  movie_id,
  COUNT(*)::integer AS total_ratings,
  ROUND(AVG(rating)::numeric, 1) AS avg_rating,
  COUNT(CASE WHEN rating >= 4 THEN 1 END)::integer AS positive_ratings,
  COUNT(CASE WHEN rating <= 2 THEN 1 END)::integer AS negative_ratings
FROM public.ratings
GROUP BY movie_id;

-- Grant access to the view for both anon and authenticated users
GRANT SELECT ON public.movie_rating_stats TO anon;
GRANT SELECT ON public.movie_rating_stats TO authenticated;

-- =====================================================
-- FIX 2: Login History Forge - Restrict INSERT to trigger only
-- =====================================================

-- Drop the permissive INSERT policy
DROP POLICY IF EXISTS "System can insert login history" ON public.login_history;

-- Create a restrictive policy that only allows inserts via trigger context
CREATE POLICY "Trigger can insert login history"
ON public.login_history
FOR INSERT
WITH CHECK (
  current_setting('app.trigger_context', true) = 'login_event'
);