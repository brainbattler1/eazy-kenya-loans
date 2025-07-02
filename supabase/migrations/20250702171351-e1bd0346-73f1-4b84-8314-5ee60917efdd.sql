-- Add notification functions for admin use
CREATE OR REPLACE FUNCTION public.send_notification_to_all_users(
  _title text,
  _message text,
  _type notification_type DEFAULT 'info'::notification_type
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_id uuid := auth.uid();
BEGIN
  -- Check if current user is admin
  IF NOT has_role(admin_id, 'admin'::app_role) AND NOT has_role(admin_id, 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can send notifications to all users';
  END IF;

  -- Insert notification for all users
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT p.user_id, _title, _message, _type
  FROM public.profiles p;
  
  -- Log admin action
  INSERT INTO public.admin_audit_logs (admin_id, action, resource_type, details)
  VALUES (
    admin_id,
    'send_notification_all_users',
    'notification',
    jsonb_build_object(
      'title', _title,
      'message', _message,
      'type', _type,
      'timestamp', now()
    )
  );
END;
$$;

-- Function to send notification to all admins
CREATE OR REPLACE FUNCTION public.send_notification_to_all_admins(
  _title text,
  _message text,
  _type notification_type DEFAULT 'info'::notification_type
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_id uuid := auth.uid();
BEGIN
  -- Check if current user is admin
  IF NOT has_role(admin_id, 'admin'::app_role) AND NOT has_role(admin_id, 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can send notifications to all admins';
  END IF;

  -- Insert notification for all admin users
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT ur.user_id, _title, _message, _type
  FROM public.user_roles ur
  WHERE ur.role IN ('admin', 'superadmin');
  
  -- Log admin action
  INSERT INTO public.admin_audit_logs (admin_id, action, resource_type, details)
  VALUES (
    admin_id,
    'send_notification_all_admins',
    'notification',
    jsonb_build_object(
      'title', _title,
      'message', _message,
      'type', _type,
      'timestamp', now()
    )
  );
END;
$$;

-- Function to toggle user ban status
CREATE OR REPLACE FUNCTION public.toggle_user_ban(
  target_user_id uuid,
  ban_status boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_admin_id uuid := auth.uid();
BEGIN
  -- Check if current user is admin
  IF NOT has_role(current_admin_id, 'admin'::app_role) AND NOT has_role(current_admin_id, 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can ban/unban users';
  END IF;

  -- Prevent admin from banning themselves
  IF current_admin_id = target_user_id THEN
    RAISE EXCEPTION 'Cannot ban your own account';
  END IF;

  -- Update user ban status (we'll add this to profiles table)
  UPDATE public.profiles 
  SET banned = ban_status, updated_at = now()
  WHERE user_id = target_user_id;

  -- Send notification to the user about ban status
  INSERT INTO public.notifications (
    user_id, 
    title, 
    message, 
    type
  )
  VALUES (
    target_user_id,
    CASE WHEN ban_status THEN 'Account Suspended' ELSE 'Account Reinstated' END,
    CASE WHEN ban_status 
      THEN 'Your account has been suspended. Contact support for more information.'
      ELSE 'Your account has been reinstated. You can now access all services.'
    END,
    CASE WHEN ban_status THEN 'warning' ELSE 'success' END
  );

  -- Log admin action
  INSERT INTO public.admin_audit_logs (admin_id, action, resource_type, target_id, details)
  VALUES (
    current_admin_id,
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

-- Add banned column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned boolean DEFAULT false;