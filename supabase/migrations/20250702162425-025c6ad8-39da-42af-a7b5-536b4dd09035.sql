-- We need to handle user creation through RLS and database functions instead
-- Since we can't create triggers on auth.users, let's create a function that gets called from the client

-- Create a function to handle new user setup that can be called from the client
CREATE OR REPLACE FUNCTION public.setup_new_user(user_id uuid, full_name text DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert profile if it doesn't exist
  INSERT INTO public.profiles (user_id, full_name, email_verified, referral_code)
  VALUES (
    user_id,
    COALESCE(full_name, ''),
    true, -- Email is verified when this function is called
    generate_referral_code()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Assign default user role if it doesn't exist
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;