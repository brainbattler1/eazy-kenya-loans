-- First, let's check if there are any existing users and create a superadmin role for the first user
-- This will help you access the admin panel

-- Get the first user from auth.users and assign superadmin role
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  'superadmin'::app_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id AND ur.role = 'superadmin'
WHERE ur.user_id IS NULL  -- Only add if they don't already have superadmin
LIMIT 1;

-- Also ensure they have a profile
INSERT INTO public.profiles (user_id, full_name, email_verified)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data ->> 'full_name', u.email),
  true
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
LIMIT 1;