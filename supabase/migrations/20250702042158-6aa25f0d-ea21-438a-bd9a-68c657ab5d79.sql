-- Create a function for superadmins to get all users data
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  email_confirmed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    u.id,
    u.email,
    u.created_at,
    u.email_confirmed_at
  FROM auth.users u
  WHERE public.has_role(auth.uid(), 'superadmin');
$$;

-- Create notifications table for better notification management
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('success', 'warning', 'info', 'error')),
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications for users"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add warning and info color tokens to our design system
-- These are already handled in the CSS, this is just for documentation

-- Function to create notification when loan status changes
CREATE OR REPLACE FUNCTION public.notify_loan_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
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
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for loan status notifications
CREATE TRIGGER loan_status_notification
  AFTER UPDATE ON public.loan_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_loan_status_change();

-- Function to create notification when ticket status changes
CREATE OR REPLACE FUNCTION public.notify_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    VALUES (
      NEW.user_id,
      'Support Ticket Updated',
      'Your support ticket "' || NEW.title || '" status has been changed to ' || NEW.status || '.',
      CASE 
        WHEN NEW.status = 'closed' THEN 'success'
        ELSE 'info'
      END,
      '/dashboard'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ticket status notifications
CREATE TRIGGER ticket_status_notification
  AFTER UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ticket_status_change();