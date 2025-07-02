-- Make johnykariuki@gmail.com a superadmin
-- First check if user exists and add superadmin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::app_role
FROM auth.users 
WHERE email = 'johnykariuki@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.users.id AND role = 'superadmin'
);