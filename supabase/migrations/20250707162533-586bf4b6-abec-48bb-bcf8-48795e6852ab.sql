-- Fix the toggle_user_ban function to handle missing profiles
CREATE OR REPLACE FUNCTION public.toggle_user_ban(target_user_id uuid, ban_status boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_admin_id uuid := auth.uid();
  profile_exists boolean;
BEGIN
  -- Check if current user is admin
  IF NOT public.is_admin(current_admin_id) THEN
    RAISE EXCEPTION 'Only admins can ban/unban users';
  END IF;

  -- Prevent admin from banning themselves
  IF current_admin_id = target_user_id THEN
    RAISE EXCEPTION 'Cannot ban your own account';
  END IF;

  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = target_user_id) INTO profile_exists;
  
  -- Create profile if it doesn't exist
  IF NOT profile_exists THEN
    INSERT INTO public.profiles (user_id, full_name, banned, created_at, updated_at)
    VALUES (target_user_id, 'No name', ban_status, now(), now());
  ELSE
    -- Update existing profile
    UPDATE public.profiles 
    SET banned = ban_status, updated_at = now()
    WHERE user_id = target_user_id;
  END IF;

  -- Send notification to the user about ban status
  PERFORM public.send_notification_to_user(
    target_user_id,
    CASE WHEN ban_status THEN 'Account Suspended' ELSE 'Account Reinstated' END,
    CASE WHEN ban_status 
      THEN 'Your account has been suspended. Contact support for more information.'
      ELSE 'Your account has been reinstated. You can now access all services.'
    END,
    CASE WHEN ban_status THEN 'warning'::notification_type ELSE 'success'::notification_type END
  );

  -- Log admin action
  PERFORM public.log_admin_action(
    CASE WHEN ban_status THEN 'ban_user' ELSE 'unban_user' END,
    'user',
    target_user_id,
    jsonb_build_object(
      'ban_status', ban_status,
      'timestamp', now()
    )
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to update user ban status: %', SQLERRM;
END;
$$;