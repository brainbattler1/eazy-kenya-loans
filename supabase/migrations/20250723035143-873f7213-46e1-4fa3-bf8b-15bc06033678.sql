-- Fix the handle_loan_application_status_change trigger function
CREATE OR REPLACE FUNCTION public.handle_loan_application_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  metadata_json JSONB;
BEGIN
  -- Update the updated_at timestamp
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
  END IF;
  
  -- Handle status changes and send notifications
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Status changed from pending to approved
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
      NEW.approved_at := now();
      NEW.approved_by := (SELECT auth.uid());
      
      -- Build metadata JSON
      metadata_json := jsonb_build_object(
        'loan_id', NEW.id::text, 
        'amount', NEW.amount::text
      );
      
      -- Send notification to the loan applicant (with error handling)
      BEGIN
        PERFORM public.send_notification_to_user(
          NEW.user_id,
          'Loan Application Approved',
          'Your loan application has been approved.',
          'success'::notification_type,
          '/dashboard',
          metadata_json
        );
      EXCEPTION WHEN OTHERS THEN
        -- Log error but continue processing
        RAISE NOTICE 'Error sending notification: %', SQLERRM;
      END;
    
    -- Status changed from pending to rejected
    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
      NEW.rejected_at := now();
      NEW.rejected_by := (SELECT auth.uid());
      
      -- Build metadata JSON
      metadata_json := jsonb_build_object('loan_id', NEW.id::text);
      
      -- Send notification to the loan applicant (with error handling)
      BEGIN
        PERFORM public.send_notification_to_user(
          NEW.user_id,
          'Loan Application Rejected',
          COALESCE(NEW.rejection_reason, 'Your loan application has been rejected.'),
          'error'::notification_type,
          '/dashboard',
          metadata_json
        );
      EXCEPTION WHEN OTHERS THEN
        -- Log error but continue processing
        RAISE NOTICE 'Error sending notification: %', SQLERRM;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS loan_application_status_change_trigger ON public.loan_applications;
CREATE TRIGGER loan_application_status_change_trigger
  BEFORE UPDATE ON public.loan_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_loan_application_status_change();