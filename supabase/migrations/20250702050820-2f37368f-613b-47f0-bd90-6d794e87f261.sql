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

-- Create function to get analytics data (instead of view)
CREATE OR REPLACE FUNCTION public.get_admin_analytics()
RETURNS TABLE (
  total_users BIGINT,
  new_users_30_days BIGINT,
  active_users BIGINT,
  suspended_users BIGINT,
  total_applications BIGINT,
  pending_applications BIGINT,
  approved_applications BIGINT,
  rejected_applications BIGINT,
  new_applications_30_days BIGINT,
  total_approved_amount NUMERIC,
  total_tickets BIGINT,
  open_tickets BIGINT,
  total_referrals BIGINT,
  completed_referrals BIGINT
) AS $$
BEGIN
  -- Check if current user is superadmin
  IF NOT has_role(auth.uid(), 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Only superadmins can access analytics';
  END IF;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.profiles)::BIGINT as total_users,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at >= NOW() - INTERVAL '30 days')::BIGINT as new_users_30_days,
    (SELECT COUNT(*) FROM public.profiles WHERE status = 'active')::BIGINT as active_users,
    (SELECT COUNT(*) FROM public.profiles WHERE status = 'suspended')::BIGINT as suspended_users,
    (SELECT COUNT(*) FROM public.loan_applications)::BIGINT as total_applications,
    (SELECT COUNT(*) FROM public.loan_applications WHERE status = 'pending')::BIGINT as pending_applications,
    (SELECT COUNT(*) FROM public.loan_applications WHERE status = 'approved')::BIGINT as approved_applications,
    (SELECT COUNT(*) FROM public.loan_applications WHERE status = 'rejected')::BIGINT as rejected_applications,
    (SELECT COUNT(*) FROM public.loan_applications WHERE created_at >= NOW() - INTERVAL '30 days')::BIGINT as new_applications_30_days,
    (SELECT COALESCE(SUM(loan_amount), 0) FROM public.loan_applications WHERE status = 'approved')::NUMERIC as total_approved_amount,
    (SELECT COUNT(*) FROM public.tickets)::BIGINT as total_tickets,
    (SELECT COUNT(*) FROM public.tickets WHERE status != 'closed')::BIGINT as open_tickets,
    (SELECT COUNT(*) FROM public.referrals)::BIGINT as total_referrals,
    (SELECT COUNT(*) FROM public.referrals WHERE status = 'completed')::BIGINT as completed_referrals;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;