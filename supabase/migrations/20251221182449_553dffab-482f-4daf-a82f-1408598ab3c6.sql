-- Create a function to auto-assign admin role for specific email
CREATE OR REPLACE FUNCTION public.assign_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the new user's email is the admin email
  IF NEW.email = 'bossmanuel1964@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to run after user signup
CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_on_signup();

-- Also add a policy to allow the first admin insert via trigger (bootstrap)
CREATE POLICY "System can insert admin role via trigger"
ON public.user_roles
FOR INSERT
WITH CHECK (true);

-- Drop the old restrictive insert policy for admins and replace with proper one
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

-- Admins can manage other user roles (not their own bootstrapped one)
CREATE POLICY "Admins can insert other roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());