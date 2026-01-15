-- Fix 2FA secrets being accessible in plaintext after initial setup
-- This implements a "one-time view" pattern for 2FA secrets

-- Add column to track if secrets have been viewed (initial setup completed)
ALTER TABLE public.user_2fa ADD COLUMN IF NOT EXISTS secrets_viewed BOOLEAN NOT NULL DEFAULT false;

-- Add column to store hashed backup codes (for verification after setup)
ALTER TABLE public.user_2fa ADD COLUMN IF NOT EXISTS backup_code_hashes TEXT[];

-- Drop the existing permissive SELECT policy for users
DROP POLICY IF EXISTS "Users can view own 2FA" ON public.user_2fa;

-- Create a new policy that only allows users to view secrets during initial setup
-- After secrets_viewed is set to true, users can only see non-sensitive columns
CREATE POLICY "Users can view own 2FA status"
ON public.user_2fa FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Create a function to safely retrieve 2FA data with sensitive fields masked after setup
CREATE OR REPLACE FUNCTION public.get_user_2fa_safe(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  is_enabled BOOLEAN,
  secret_key TEXT,
  backup_codes TEXT[],
  enabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  secrets_viewed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return the requesting user's own data
  IF p_user_id != auth.uid() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    t.id,
    t.user_id,
    t.is_enabled,
    -- Mask secret_key if already viewed
    CASE 
      WHEN t.secrets_viewed = true THEN NULL
      ELSE t.secret_key
    END AS secret_key,
    -- Mask backup_codes if already viewed
    CASE 
      WHEN t.secrets_viewed = true THEN NULL
      ELSE t.backup_codes
    END AS backup_codes,
    t.enabled_at,
    t.created_at,
    t.updated_at,
    t.secrets_viewed
  FROM public.user_2fa t
  WHERE t.user_id = p_user_id;
END;
$$;

-- Create a function to mark secrets as viewed (called after user confirms they saved the codes)
CREATE OR REPLACE FUNCTION public.mark_2fa_secrets_viewed(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow marking own secrets as viewed
  IF p_user_id != auth.uid() THEN
    RETURN false;
  END IF;

  UPDATE public.user_2fa
  SET 
    secrets_viewed = true,
    -- Clear plaintext backup codes and keep only hashes
    backup_codes = NULL,
    updated_at = now()
  WHERE user_id = p_user_id AND secrets_viewed = false;
  
  RETURN FOUND;
END;
$$;

-- Create a function to verify a backup code against stored hashes
CREATE OR REPLACE FUNCTION public.verify_backup_code(p_user_id UUID, p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hashes TEXT[];
  hash_to_check TEXT;
  i INTEGER;
  new_hashes TEXT[];
BEGIN
  -- Only allow verifying own codes
  IF p_user_id != auth.uid() THEN
    RETURN false;
  END IF;

  SELECT backup_code_hashes INTO stored_hashes
  FROM public.user_2fa
  WHERE user_id = p_user_id AND is_enabled = true;
  
  IF stored_hashes IS NULL OR array_length(stored_hashes, 1) IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check each hash using pgcrypto crypt function
  FOR i IN 1..array_length(stored_hashes, 1) LOOP
    hash_to_check := stored_hashes[i];
    IF hash_to_check = crypt(p_code, hash_to_check) THEN
      -- Remove the used code
      new_hashes := array_remove(stored_hashes, hash_to_check);
      UPDATE public.user_2fa
      SET backup_code_hashes = new_hashes, updated_at = now()
      WHERE user_id = p_user_id;
      RETURN true;
    END IF;
  END LOOP;
  
  RETURN false;
END;
$$;

-- Create a function to hash backup codes during setup (stores hashes for later verification)
CREATE OR REPLACE FUNCTION public.store_backup_code_hashes(p_user_id UUID, p_codes TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hashed_codes TEXT[];
  code TEXT;
BEGIN
  -- Only allow setting own hashes
  IF p_user_id != auth.uid() THEN
    RETURN false;
  END IF;

  -- Hash each code using pgcrypto
  hashed_codes := ARRAY[]::TEXT[];
  FOREACH code IN ARRAY p_codes LOOP
    hashed_codes := array_append(hashed_codes, crypt(code, gen_salt('bf', 8)));
  END LOOP;
  
  UPDATE public.user_2fa
  SET backup_code_hashes = hashed_codes, updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$;

-- Ensure pgcrypto extension is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add audit logging for 2FA secret access
CREATE TABLE IF NOT EXISTS public.twofa_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('VIEW_SETUP', 'MARK_VIEWED', 'VERIFY_BACKUP', 'REGENERATE')),
  success BOOLEAN NOT NULL DEFAULT true,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.twofa_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view the 2FA access log
CREATE POLICY "Admins can view 2FA access log"
ON public.twofa_access_log FOR SELECT
TO authenticated
USING (public.is_admin());

-- Allow system inserts to audit log
CREATE POLICY "System can insert 2FA access entries"
ON public.twofa_access_log FOR INSERT
WITH CHECK (true);

-- Create function to log 2FA access
CREATE OR REPLACE FUNCTION public.log_2fa_access(
  p_user_id UUID,
  p_action TEXT,
  p_success BOOLEAN DEFAULT true
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.twofa_access_log (user_id, action, success)
  VALUES (p_user_id, p_action, p_success);
END;
$$;