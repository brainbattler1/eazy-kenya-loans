-- Update the trigger function to allow new user creation during signup
CREATE OR REPLACE FUNCTION public.prevent_banned_user_actions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Allow profile creation for new users (signup process)
  IF TG_TABLE_NAME = 'profiles' AND TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;
  
  -- Check if the current user is banned for other operations
  IF public.is_user_banned(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Your account has been suspended. Please contact support.';
  END IF;
  
  -- Check maintenance mode for non-admin users for other operations
  IF public.is_maintenance_mode_enabled() AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'System is currently under maintenance. Please try again later.';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Also update the profiles policy to allow initial profile creation
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);