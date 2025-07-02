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

-- Update loan application status change trigger to log admin actions
CREATE OR REPLACE FUNCTION public.notify_loan_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Create notification
    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    VALUES (
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Loan Application Approved!'
        WHEN NEW.status = 'rejected' THEN 'Loan Application Update'
        WHEN NEW.status = 'under_review' THEN 'Loan Application Under Review'
        ELSE 'Loan Application Status Update'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Congratulations! Your loan application for ' || to_char(NEW.loan_amount, 'FM999,999,999') || ' KES has been approved.'
        WHEN NEW.status = 'rejected' THEN 'Your loan application for ' || to_char(NEW.loan_amount, 'FM999,999,999') || ' KES was not approved. Please contact support for more information.'
        WHEN NEW.status = 'under_review' THEN 'Your loan application for ' || to_char(NEW.loan_amount, 'FM999,999,999') || ' KES is now under review. We will get back to you soon.'
        ELSE 'Your loan application status has been updated to ' || NEW.status
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'success'
        WHEN NEW.status = 'rejected' THEN 'error'
        ELSE 'info'
      END,
      '/dashboard'
    );

    -- Log admin action if changed by admin (not by system)
    IF auth.uid() IS NOT NULL AND has_role(auth.uid(), 'superadmin'::app_role) THEN
      INSERT INTO public.admin_audit_logs (admin_user_id, action_type, target_type, target_id, details)
      VALUES (
        auth.uid(),
        'loan_status_change',
        'loan_application',
        NEW.id,
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status,
          'loan_amount', NEW.loan_amount,
          'applicant_name', NEW.full_name
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;