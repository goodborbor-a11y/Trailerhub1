-- Fix movie_rating_stats view to be accessible by using security_definer
-- This bypasses RLS on the base ratings table but only exposes aggregated data
-- (movie_id, counts, average) - no user_id is exposed

DROP VIEW IF EXISTS public.movie_rating_stats;

CREATE VIEW public.movie_rating_stats
WITH (security_invoker = false) AS
SELECT 
  movie_id,
  COUNT(*)::integer AS total_ratings,
  ROUND(AVG(rating)::numeric, 1) AS avg_rating,
  COUNT(CASE WHEN rating >= 4 THEN 1 END)::integer AS positive_ratings,
  COUNT(CASE WHEN rating <= 2 THEN 1 END)::integer AS negative_ratings
FROM public.ratings
GROUP BY movie_id;

-- Grant SELECT access to both anon and authenticated roles
GRANT SELECT ON public.movie_rating_stats TO anon, authenticated;