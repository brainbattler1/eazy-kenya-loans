-- Create a function to get all users including auth data for admins
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE (
  id uuid,
  email text,
  email_confirmed_at timestamptz,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  phone text,
  full_name text,
  banned boolean,
  avatar_url text,
  role app_role,
  email_verified boolean
)
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can access user data';
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,
    au.email_confirmed_at,
    au.created_at,
    au.last_sign_in_at,
    au.phone::text,
    COALESCE(p.full_name, au.raw_user_meta_data->>'full_name', 'No name')::text as full_name,
    COALESCE(p.banned, false) as banned,
    p.avatar_url,
    COALESCE(ur.role, 'user'::app_role) as role,
    COALESCE(p.email_verified, au.email_confirmed_at IS NOT NULL) as email_verified
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.user_id
  LEFT JOIN public.user_roles ur ON au.id = ur.user_id
  ORDER BY au.created_at DESC;
END;
$$;

-- Make proof of income and bank statement optional in loan applications
ALTER TABLE public.loan_applications 
ALTER COLUMN proof_of_income_url DROP NOT NULL;

ALTER TABLE public.loan_applications 
ALTER COLUMN bank_statement_url DROP NOT NULL;

-- Update the loan application form to reflect these fields are optional
COMMENT ON COLUMN public.loan_applications.proof_of_income_url IS 'Optional: Proof of income document URL';
COMMENT ON COLUMN public.loan_applications.bank_statement_url IS 'Optional: Bank statement document URL';