-- Allow admins to view newsletter signups
CREATE POLICY "Admins can view newsletter signups"
ON public.newsletter_signups
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Allow admins to delete reviews (for moderation)
CREATE POLICY "Admins can delete any rating"
ON public.ratings
FOR DELETE
TO authenticated
USING (public.is_admin());