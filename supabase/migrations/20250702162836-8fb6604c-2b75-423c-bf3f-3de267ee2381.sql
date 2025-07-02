-- Fix the ambiguous column reference in setup_new_user function
CREATE OR REPLACE FUNCTION public.setup_new_user(p_user_id uuid, p_full_name text DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert profile if it doesn't exist
  INSERT INTO public.profiles (user_id, full_name, email_verified, referral_code)
  VALUES (
    p_user_id,
    COALESCE(p_full_name, ''),
    true, -- Email is verified when this function is called
    generate_referral_code()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Assign default user role if it doesn't exist
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;