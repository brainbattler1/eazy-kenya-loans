-- Add user status management to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_by UUID;

-- Create audit logs table for admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit logs
CREATE POLICY "Superadmins can view all audit logs" 
ON public.admin_audit_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmins can create audit logs" 
ON public.admin_audit_logs 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Create analytics view for dashboard stats
CREATE OR REPLACE VIEW public.admin_analytics AS
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30_days,
  (SELECT COUNT(*) FROM public.profiles WHERE status = 'active') as active_users,
  (SELECT COUNT(*) FROM public.profiles WHERE status = 'suspended') as suspended_users,
  (SELECT COUNT(*) FROM public.loan_applications) as total_applications,
  (SELECT COUNT(*) FROM public.loan_applications WHERE status = 'pending') as pending_applications,
  (SELECT COUNT(*) FROM public.loan_applications WHERE status = 'approved') as approved_applications,
  (SELECT COUNT(*) FROM public.loan_applications WHERE status = 'rejected') as rejected_applications,
  (SELECT COUNT(*) FROM public.loan_applications WHERE created_at >= NOW() - INTERVAL '30 days') as new_applications_30_days,
  (SELECT SUM(loan_amount) FROM public.loan_applications WHERE status = 'approved') as total_approved_amount,
  (SELECT COUNT(*) FROM public.tickets) as total_tickets,
  (SELECT COUNT(*) FROM public.tickets WHERE status != 'closed') as open_tickets,
  (SELECT COUNT(*) FROM public.referrals) as total_referrals,
  (SELECT COUNT(*) FROM public.referrals WHERE status = 'completed') as completed_referrals;

-- Grant access to analytics view for superadmins
CREATE POLICY "Superadmins can view analytics" 
ON public.admin_analytics 
FOR SELECT 
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Create function to suspend/unsuspend users
CREATE OR REPLACE FUNCTION public.toggle_user_status(target_user_id UUID, new_status TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  current_admin_id UUID := auth.uid();
BEGIN
  -- Check if current user is superadmin
  IF NOT has_role(current_admin_id, 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Only superadmins can manage user status';
  END IF;

  -- Update user status
  UPDATE public.profiles 
  SET 
    status = new_status,
    suspended_at = CASE WHEN new_status = 'suspended' THEN NOW() ELSE NULL END,
    suspended_by = CASE WHEN new_status = 'suspended' THEN current_admin_id ELSE NULL END,
    updated_at = NOW()
  WHERE user_id = target_user_id;

  -- Log the action
  INSERT INTO public.admin_audit_logs (admin_user_id, action_type, target_type, target_id, details)
  VALUES (
    current_admin_id,
    'user_status_change',
    'profile',
    target_user_id,
    jsonb_build_object('new_status', new_status, 'timestamp', NOW())
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  action_type TEXT,
  target_type TEXT,
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
DECLARE
  current_admin_id UUID := auth.uid();
BEGIN
  -- Check if current user is superadmin
  IF NOT has_role(current_admin_id, 'superadmin'::app_role) THEN
    RETURN FALSE;
  END IF;

  -- Insert audit log
  INSERT INTO public.admin_audit_logs (admin_user_id, action_type, target_type, target_id, details)
  VALUES (current_admin_id, action_type, target_type, target_id, details);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;