-- Temporarily disable the trigger that's causing issues
DROP TRIGGER IF EXISTS loan_application_status_change_trigger ON public.loan_applications;

-- Create a simpler version without notifications for now
CREATE OR REPLACE FUNCTION public.handle_loan_application_status_change_simple()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Update the updated_at timestamp
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
  END IF;
  
  -- Handle status changes
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Status changed from pending to approved
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
      NEW.approved_at := now();
      NEW.approved_by := (SELECT auth.uid());
    
    -- Status changed from pending to rejected
    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
      NEW.rejected_at := now();
      NEW.rejected_by := (SELECT auth.uid());
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger with the simple version
CREATE TRIGGER loan_application_status_change_trigger
  BEFORE UPDATE ON public.loan_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_loan_application_status_change_simple();