-- Fix profiles table to require authentication for SELECT access
-- This prevents anonymous scraping while allowing authenticated users to see profiles

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Admins should also be able to view profiles (already authenticated, but explicit)
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (is_admin());