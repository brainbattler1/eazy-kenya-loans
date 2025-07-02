-- Make johnykariuki2004@gmail.com a superadmin
-- First get the user_id for this email from auth.users, then insert the role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::app_role
FROM auth.users 
WHERE email = 'johnykariuki2004@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;