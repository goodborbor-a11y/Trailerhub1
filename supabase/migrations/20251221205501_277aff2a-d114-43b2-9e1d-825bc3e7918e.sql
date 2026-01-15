-- Fix 1: Create admin_bootstrap_emails table for configurable admin assignment
CREATE TABLE IF NOT EXISTS public.admin_bootstrap_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ
);

-- Enable RLS on the new table
ALTER TABLE public.admin_bootstrap_emails ENABLE ROW LEVEL SECURITY;

-- Only admins can manage bootstrap emails
CREATE POLICY "Admins can view bootstrap emails"
ON public.admin_bootstrap_emails
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert bootstrap emails"
ON public.admin_bootstrap_emails
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update bootstrap emails"
ON public.admin_bootstrap_emails
FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete bootstrap emails"
ON public.admin_bootstrap_emails
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Insert existing admin email into bootstrap table (one-time migration)
INSERT INTO public.admin_bootstrap_emails (email, used, used_at)
VALUES ('bossmanuel1964@gmail.com', TRUE, NOW())
ON CONFLICT (email) DO NOTHING;

-- Fix 2: Drop the overly permissive "System can insert admin role via trigger" policy
DROP POLICY IF EXISTS "System can insert admin role via trigger" ON public.user_roles;

-- Fix 3: Replace with a more specific trigger-based approach using session context
CREATE OR REPLACE FUNCTION public.assign_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bootstrap_record RECORD;
BEGIN
  -- Check if the new user's email is in the bootstrap emails table
  SELECT * INTO bootstrap_record
  FROM public.admin_bootstrap_emails
  WHERE email = NEW.email
    AND (expires_at IS NULL OR expires_at > NOW())
    AND used = FALSE;
  
  IF FOUND THEN
    -- Set session variable to allow the insert
    PERFORM set_config('app.trigger_context', 'admin_bootstrap', true);
    
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Mark the bootstrap email as used
    UPDATE public.admin_bootstrap_emails
    SET used = TRUE, used_at = NOW()
    WHERE email = NEW.email;
    
    -- Clear the session variable
    PERFORM set_config('app.trigger_context', '', true);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create a new restrictive policy that only allows inserts during trigger context
CREATE POLICY "Trigger can insert admin role during bootstrap"
ON public.user_roles
FOR INSERT
WITH CHECK (
  current_setting('app.trigger_context', true) = 'admin_bootstrap'
  OR public.is_admin()
);

-- Drop the redundant "Admins can insert other roles" policy since it's now covered
DROP POLICY IF EXISTS "Admins can insert other roles" ON public.user_roles;

-- Create role change audit table
CREATE TABLE IF NOT EXISTS public.user_role_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  performed_by UUID,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details JSONB
);

-- Enable RLS on audit table
ALTER TABLE public.user_role_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view the audit log
CREATE POLICY "Admins can view role audit"
ON public.user_role_audit
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Allow system inserts to audit log
CREATE POLICY "System can insert audit entries"
ON public.user_role_audit
FOR INSERT
WITH CHECK (true);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_role_audit (user_id, role, action, performed_by, details)
    VALUES (NEW.user_id, NEW.role::text, 'INSERT', auth.uid(), jsonb_build_object('source', COALESCE(current_setting('app.trigger_context', true), 'manual')));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.user_role_audit (user_id, role, action, performed_by, details)
    VALUES (NEW.user_id, NEW.role::text, 'UPDATE', auth.uid(), jsonb_build_object('old_role', OLD.role::text, 'new_role', NEW.role::text));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.user_role_audit (user_id, role, action, performed_by, details)
    VALUES (OLD.user_id, OLD.role::text, 'DELETE', auth.uid(), NULL);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create the audit trigger
DROP TRIGGER IF EXISTS user_roles_audit_trigger ON public.user_roles;
CREATE TRIGGER user_roles_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.audit_role_changes();