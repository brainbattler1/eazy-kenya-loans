-- Make johnykariuki20@gmail.com a superadmin and fix email confirmation
-- First update the email confirmation status in auth.users
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'johnykariuki20@gmail.com';

-- Update the profile to mark email as verified
UPDATE public.profiles 
SET email_verified = true, updated_at = now()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'johnykariuki20@gmail.com'
);

-- Add superadmin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::app_role
FROM auth.users 
WHERE email = 'johnykariuki20@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;