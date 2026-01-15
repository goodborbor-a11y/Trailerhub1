-- Fix the Security Definer View warning by recreating the view with SECURITY INVOKER
DROP VIEW IF EXISTS public.movie_rating_stats;

CREATE VIEW public.movie_rating_stats
WITH (security_invoker = true) AS
SELECT 
  movie_id,
  COUNT(*)::integer AS total_ratings,
  ROUND(AVG(rating)::numeric, 1) AS avg_rating,
  COUNT(CASE WHEN rating >= 4 THEN 1 END)::integer AS positive_ratings,
  COUNT(CASE WHEN rating <= 2 THEN 1 END)::integer AS negative_ratings
FROM public.ratings
GROUP BY movie_id;

-- Re-grant access
GRANT SELECT ON public.movie_rating_stats TO anon;
GRANT SELECT ON public.movie_rating_stats TO authenticated;