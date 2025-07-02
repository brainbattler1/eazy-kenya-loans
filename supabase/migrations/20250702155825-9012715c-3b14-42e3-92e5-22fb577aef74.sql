-- Function to delete a user account completely
CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_admin_id uuid := auth.uid();
BEGIN
  -- Check if current user is superadmin
  IF NOT has_role(current_admin_id, 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Only superadmins can delete user accounts';
  END IF;

  -- Prevent admin from deleting their own account
  IF current_admin_id = target_user_id THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  -- Delete user data in correct order to avoid foreign key conflicts
  -- Delete notifications
  DELETE FROM public.notifications WHERE user_id = target_user_id;
  
  -- Delete ticket messages
  DELETE FROM public.ticket_messages WHERE user_id = target_user_id;
  
  -- Delete tickets
  DELETE FROM public.tickets WHERE user_id = target_user_id;
  
  -- Delete referrals (both as referrer and referred)
  DELETE FROM public.referrals WHERE referrer_id = target_user_id OR referred_id = target_user_id;
  
  -- Delete loan applications
  DELETE FROM public.loan_applications WHERE user_id = target_user_id;
  
  -- Delete user roles
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  
  -- Delete profile
  DELETE FROM public.profiles WHERE user_id = target_user_id;
  
  -- Delete from auth.users (this will cascade to related auth tables)
  DELETE FROM auth.users WHERE id = target_user_id;

  -- Log admin action
  INSERT INTO public.admin_audit_logs (admin_user_id, action_type, target_type, target_id, details)
  VALUES (
    current_admin_id,
    'delete_user_account',
    'user',
    target_user_id,
    jsonb_build_object(
      'action', 'complete_account_deletion',
      'timestamp', now()
    )
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to delete user account: %', SQLERRM;
END;
$$;

-- Function to assign admin role to a user
CREATE OR REPLACE FUNCTION public.assign_admin_role(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_admin_id uuid := auth.uid();
  existing_role app_role;
BEGIN
  -- Check if current user is superadmin
  IF NOT has_role(current_admin_id, 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Only superadmins can assign admin roles';
  END IF;

  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = target_user_id) THEN
    RAISE EXCEPTION 'User does not exist';
  END IF;

  -- Check current role
  SELECT role INTO existing_role 
  FROM public.user_roles 
  WHERE user_id = target_user_id 
  LIMIT 1;

  -- If user already has superadmin role, do nothing
  IF existing_role = 'superadmin'::app_role THEN
    RETURN TRUE;
  END IF;

  -- Update or insert superadmin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'superadmin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Remove other roles if they exist
  DELETE FROM public.user_roles 
  WHERE user_id = target_user_id 
  AND role != 'superadmin'::app_role;

  -- Send notification to the user about role assignment
  INSERT INTO public.notifications (
    user_id, 
    title, 
    message, 
    type, 
    priority,
    sender_id,
    sender_type,
    recipient_type
  )
  VALUES (
    target_user_id,
    'Admin Role Assigned',
    'You have been granted administrator privileges. You now have access to the admin panel.',
    'success',
    'high',
    current_admin_id,
    'admin',
    'user'
  );

  -- Log admin action
  INSERT INTO public.admin_audit_logs (admin_user_id, action_type, target_type, target_id, details)
  VALUES (
    current_admin_id,
    'assign_admin_role',
    'user',
    target_user_id,
    jsonb_build_object(
      'new_role', 'superadmin',
      'previous_role', existing_role,
      'timestamp', now()
    )
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to assign admin role: %', SQLERRM;
END;
$$;

-- Function to remove admin role from a user
CREATE OR REPLACE FUNCTION public.remove_admin_role(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_admin_id uuid := auth.uid();
BEGIN
  -- Check if current user is superadmin
  IF NOT has_role(current_admin_id, 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Only superadmins can remove admin roles';
  END IF;

  -- Prevent admin from removing their own admin role
  IF current_admin_id = target_user_id THEN
    RAISE EXCEPTION 'Cannot remove your own admin role';
  END IF;

  -- Remove superadmin role and assign user role
  DELETE FROM public.user_roles WHERE user_id = target_user_id AND role = 'superadmin'::app_role;
  
  -- Ensure user has the default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Send notification to the user about role removal
  INSERT INTO public.notifications (
    user_id, 
    title, 
    message, 
    type, 
    priority,
    sender_id,
    sender_type,
    recipient_type
  )
  VALUES (
    target_user_id,
    'Admin Role Removed',
    'Your administrator privileges have been revoked. You no longer have access to the admin panel.',
    'warning',
    'normal',
    current_admin_id,
    'admin',
    'user'
  );

  -- Log admin action
  INSERT INTO public.admin_audit_logs (admin_user_id, action_type, target_type, target_id, details)
  VALUES (
    current_admin_id,
    'remove_admin_role',
    'user',
    target_user_id,
    jsonb_build_object(
      'new_role', 'user',
      'previous_role', 'superadmin',
      'timestamp', now()
    )
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to remove admin role: %', SQLERRM;
END;
$$;