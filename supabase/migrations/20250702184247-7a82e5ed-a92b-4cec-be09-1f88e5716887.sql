-- First, disable maintenance mode so we can test the ban system
UPDATE public.maintenance_mode 
SET is_enabled = false, updated_at = now();

-- Fix the ban system by ensuring proper triggers are in place
-- Remove existing triggers first
DROP TRIGGER IF EXISTS prevent_banned_access_profiles ON public.profiles;
DROP TRIGGER IF EXISTS prevent_banned_access_loan_applications ON public.loan_applications;
DROP TRIGGER IF EXISTS prevent_banned_access_tickets ON public.tickets;
DROP TRIGGER IF EXISTS prevent_banned_access_ticket_messages ON public.ticket_messages;
DROP TRIGGER IF EXISTS prevent_banned_access_referrals ON public.referrals;

-- Recreate the ban prevention function with better logic
CREATE OR REPLACE FUNCTION public.prevent_banned_user_actions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Allow profile creation for new users during signup
  IF TG_TABLE_NAME = 'profiles' AND TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;
  
  -- Allow profile updates for email verification
  IF TG_TABLE_NAME = 'profiles' AND TG_OP = 'UPDATE' AND 
     (OLD.email_verified IS DISTINCT FROM NEW.email_verified) THEN
    RETURN NEW;
  END IF;
  
  -- Check if the current user is banned for other operations
  IF public.is_user_banned(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Your account has been suspended. Please contact support.';
  END IF;
  
  -- Check maintenance mode for non-admin users
  IF public.is_maintenance_mode_enabled() AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'System is currently under maintenance. Please try again later.';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate triggers on all relevant tables
CREATE TRIGGER prevent_banned_access_profiles
  BEFORE UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_banned_user_actions();

CREATE TRIGGER prevent_banned_access_loan_applications
  BEFORE INSERT OR UPDATE OR DELETE ON public.loan_applications
  FOR EACH ROW EXECUTE FUNCTION public.prevent_banned_user_actions();

CREATE TRIGGER prevent_banned_access_tickets
  BEFORE INSERT OR UPDATE OR DELETE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.prevent_banned_user_actions();

CREATE TRIGGER prevent_banned_access_ticket_messages
  BEFORE INSERT OR UPDATE OR DELETE ON public.ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.prevent_banned_user_actions();

CREATE TRIGGER prevent_banned_access_referrals
  BEFORE INSERT OR UPDATE OR DELETE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.prevent_banned_user_actions();

-- Ensure the toggle_user_ban function works correctly
CREATE OR REPLACE FUNCTION public.toggle_user_ban(target_user_id uuid, ban_status boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_admin_id uuid := auth.uid();
BEGIN
  -- Check if current user is admin
  IF NOT public.is_admin(current_admin_id) THEN
    RAISE EXCEPTION 'Only admins can ban/unban users';
  END IF;

  -- Prevent admin from banning themselves
  IF current_admin_id = target_user_id THEN
    RAISE EXCEPTION 'Cannot ban your own account';
  END IF;

  -- Update user ban status
  UPDATE public.profiles 
  SET banned = ban_status, updated_at = now()
  WHERE user_id = target_user_id;

  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
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

-- Add policy for admins to update profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'superadmin')
  );