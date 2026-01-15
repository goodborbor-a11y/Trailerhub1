-- Create helper function to check if user is suspended
CREATE OR REPLACE FUNCTION public.is_user_suspended()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_suspended FROM public.profiles WHERE id = auth.uid()),
    false
  )
$$;

-- Update ratings policies to prevent suspended users from modifying data
DROP POLICY IF EXISTS "Users can insert own ratings" ON public.ratings;
CREATE POLICY "Users can insert own ratings" 
ON public.ratings FOR INSERT 
WITH CHECK (auth.uid() = user_id AND NOT is_user_suspended());

DROP POLICY IF EXISTS "Users can update own ratings" ON public.ratings;
CREATE POLICY "Users can update own ratings" 
ON public.ratings FOR UPDATE 
USING (auth.uid() = user_id AND NOT is_user_suspended());

DROP POLICY IF EXISTS "Users can delete own ratings" ON public.ratings;
CREATE POLICY "Users can delete own ratings" 
ON public.ratings FOR DELETE 
USING (auth.uid() = user_id AND NOT is_user_suspended());

-- Update watchlist policies to prevent suspended users from modifying data
DROP POLICY IF EXISTS "Users can insert to watchlist" ON public.watchlist;
CREATE POLICY "Users can insert to watchlist" 
ON public.watchlist FOR INSERT 
WITH CHECK (auth.uid() = user_id AND NOT is_user_suspended());

DROP POLICY IF EXISTS "Users can update own watchlist" ON public.watchlist;
CREATE POLICY "Users can update own watchlist" 
ON public.watchlist FOR UPDATE 
USING (auth.uid() = user_id AND NOT is_user_suspended());

DROP POLICY IF EXISTS "Users can delete from watchlist" ON public.watchlist;
CREATE POLICY "Users can delete from watchlist" 
ON public.watchlist FOR DELETE 
USING (auth.uid() = user_id AND NOT is_user_suspended());

-- Update profiles policy to prevent suspended users from updating (except admins can still update)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id AND (NOT is_user_suspended() OR is_admin()));