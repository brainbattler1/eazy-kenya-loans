-- Rebuild complete backend infrastructure

-- Create enum types
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'superadmin');
CREATE TYPE public.loan_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'disbursed', 'completed');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.notification_type AS ENUM ('info', 'success', 'warning', 'error');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Loan settings table
CREATE TABLE public.loan_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  min_amount DECIMAL(15,2) NOT NULL DEFAULT 1000,
  max_amount DECIMAL(15,2) NOT NULL DEFAULT 100000,
  min_interest_rate DECIMAL(5,2) NOT NULL DEFAULT 8.5,
  max_interest_rate DECIMAL(5,2) NOT NULL DEFAULT 25.0,
  min_tenure_months INTEGER NOT NULL DEFAULT 6,
  max_tenure_months INTEGER NOT NULL DEFAULT 60,
  processing_fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 2.5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Loan applications table
CREATE TABLE public.loan_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  tenure_months INTEGER NOT NULL,
  monthly_payment DECIMAL(15,2) NOT NULL,
  total_payment DECIMAL(15,2) NOT NULL,
  processing_fee DECIMAL(15,2) NOT NULL DEFAULT 0,
  purpose TEXT NOT NULL,
  employment_status TEXT NOT NULL,
  monthly_income DECIMAL(15,2) NOT NULL,
  status loan_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  documents_uploaded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL UNIQUE,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reward_amount DECIMAL(10,2) DEFAULT 0,
  reward_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Support tickets table
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  category TEXT NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  resolution TEXT,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Ticket messages table
CREATE TABLE public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Admin audit logs table
CREATE TABLE public.admin_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role IN ('admin', 'superadmin')
  );
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin(auth.uid()));

-- RLS Policies for loan_settings
CREATE POLICY "Everyone can view loan settings"
  ON public.loan_settings FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage loan settings"
  ON public.loan_settings FOR ALL
  USING (public.is_admin(auth.uid()));

-- RLS Policies for loan_applications
CREATE POLICY "Users can view their own applications"
  ON public.loan_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
  ON public.loan_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending applications"
  ON public.loan_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all applications"
  ON public.loan_applications FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all applications"
  ON public.loan_applications FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications"
  ON public.notifications FOR ALL
  USING (public.is_admin(auth.uid()));

-- RLS Policies for referrals
CREATE POLICY "Users can view their own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all referrals"
  ON public.referrals FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update referrals"
  ON public.referrals FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for tickets
CREATE POLICY "Users can view their own tickets"
  ON public.tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets"
  ON public.tickets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets"
  ON public.tickets FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all tickets"
  ON public.tickets FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for ticket_messages
CREATE POLICY "Users can view messages for their tickets"
  ON public.ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets 
      WHERE id = ticket_id AND user_id = auth.uid()
    ) OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users can create messages for their tickets"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.tickets 
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all ticket messages"
  ON public.ticket_messages FOR ALL
  USING (public.is_admin(auth.uid()));

-- RLS Policies for admin_audit_logs
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create audit logs"
  ON public.admin_audit_logs FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('loan-documents', 'loan-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']),
  ('ticket-attachments', 'ticket-attachments', false, 5242880, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'text/plain']),
  ('profiles', 'profiles', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']);

-- Storage policies for loan documents
CREATE POLICY "Users can upload their own loan documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'loan-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own loan documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'loan-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all loan documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'loan-documents' AND public.is_admin(auth.uid()));

-- Storage policies for ticket attachments
CREATE POLICY "Users can upload ticket attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ticket-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own ticket attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ticket-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Support agents can view all ticket attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ticket-attachments' AND public.is_admin(auth.uid()));

-- Storage policies for profiles
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profiles');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Utility functions
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE SQL
AS $$
  SELECT upper(substring(md5(random()::text) from 1 for 8));
$$;

-- Function to assign admin role
CREATE OR REPLACE FUNCTION public.assign_admin_role(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (_user_id, 'admin', auth.uid())
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Function to send notifications
CREATE OR REPLACE FUNCTION public.send_notification_to_user(
  _user_id UUID,
  _title TEXT,
  _message TEXT,
  _type notification_type DEFAULT 'info',
  _action_url TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, action_url, metadata)
  VALUES (_user_id, _title, _message, _type, _action_url, _metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action TEXT,
  _resource_type TEXT,
  _resource_id UUID DEFAULT NULL,
  _details JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.admin_audit_logs (admin_id, action, resource_type, resource_id, details)
  VALUES (auth.uid(), _action, _resource_type, _resource_id, _details);
END;
$$;

-- Triggers for automatic notifications
CREATE OR REPLACE FUNCTION public.notify_loan_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.send_notification_to_user(
      NEW.user_id,
      'Loan Application Status Update',
      'Your loan application status has been updated to: ' || NEW.status,
      CASE 
        WHEN NEW.status = 'approved' THEN 'success'
        WHEN NEW.status = 'rejected' THEN 'error'
        ELSE 'info'
      END,
      '/loans/' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER loan_status_change_notification
  AFTER UPDATE ON public.loan_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_loan_status_change();

-- Insert default loan settings
INSERT INTO public.loan_settings (
  min_amount, max_amount, min_interest_rate, max_interest_rate,
  min_tenure_months, max_tenure_months, processing_fee_percentage
) VALUES (
  1000, 100000, 8.5, 25.0, 6, 60, 2.5
);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_loan_settings_updated_at
  BEFORE UPDATE ON public.loan_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_applications_updated_at
  BEFORE UPDATE ON public.loan_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();