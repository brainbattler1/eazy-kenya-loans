-- Fix the trigger function to use correct notification_type enum values
CREATE OR REPLACE FUNCTION public.handle_loan_application_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
          'success'::notification_type,  -- Use correct enum value
          'Loan Application Approved',
          'Your loan application has been approved.',
          metadata_json::text
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
          'error'::notification_type,  -- Use correct enum value
          'Loan Application Rejected',
          COALESCE(NEW.rejection_reason, 'Your loan application has been rejected.'),
          metadata_json::text
        );
      EXCEPTION WHEN OTHERS THEN
        -- Log error but continue processing
        RAISE NOTICE 'Error sending notification: %', SQLERRM;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;