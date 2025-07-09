-- Drop all versions of the conflicting function
DROP FUNCTION IF EXISTS public.send_notification_to_user(uuid, text, text, text, text);
DROP FUNCTION IF EXISTS public.send_notification_to_user(uuid, text, text, text, jsonb);
DROP FUNCTION IF EXISTS public.send_notification_to_user(uuid, notification_type, text, text, text);

-- Create the correct function with proper parameter types
CREATE OR REPLACE FUNCTION public.send_notification_to_user(_user_id uuid, _title text, _message text, _type notification_type DEFAULT 'info'::notification_type, _action_url text DEFAULT NULL::text, _metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, action_url, metadata)
  VALUES (_user_id, _title, _message, _type, _action_url, _metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$function$;

-- Update the trigger function to use the correct function signature
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
$function$;