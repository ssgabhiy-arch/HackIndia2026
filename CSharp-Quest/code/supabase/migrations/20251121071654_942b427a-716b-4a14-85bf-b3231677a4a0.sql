-- Fix add_tokens_to_user to include authorization check
CREATE OR REPLACE FUNCTION public.add_tokens_to_user(p_user_id uuid, p_tokens integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Authorization check: users can only add tokens to their own account
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot add tokens to another user account';
  END IF;

  UPDATE public.user_tokens
  SET total_tokens = total_tokens + p_tokens,
      last_updated = NOW()
  WHERE user_id = p_user_id;
END;
$$;