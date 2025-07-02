-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  national_id TEXT UNIQUE,
  phone_number TEXT,
  monthly_income DECIMAL(15,2),
  employment_status TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('user', 'support_agent', 'superadmin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create loan applications table
CREATE TABLE public.loan_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  national_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  monthly_income DECIMAL(15,2) NOT NULL,
  loan_amount DECIMAL(15,2) NOT NULL,
  loan_duration INTEGER NOT NULL,
  employment_status TEXT NOT NULL,
  loan_purpose TEXT,
  national_id_front_url TEXT,
  national_id_back_url TEXT,
  proof_of_income_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
  terms_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tickets table
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket messages table
CREATE TABLE public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loan settings table for superadmin
CREATE TABLE public.loan_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interest_rate DECIMAL(5,2) DEFAULT 15.00,
  max_loan_amount DECIMAL(15,2) DEFAULT 500000.00,
  min_loan_amount DECIMAL(15,2) DEFAULT 5000.00,
  max_duration_months INTEGER DEFAULT 24,
  min_duration_months INTEGER DEFAULT 1,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default loan settings
INSERT INTO public.loan_settings (interest_rate, max_loan_amount, min_loan_amount, max_duration_months, min_duration_months)
VALUES (15.00, 500000.00, 5000.00, 24, 1);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_settings ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Superadmins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'superadmin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'superadmin'));

-- RLS Policies for loan_applications
CREATE POLICY "Users can view their own loan applications"
  ON public.loan_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loan applications"
  ON public.loan_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending applications"
  ON public.loan_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Superadmins can view all loan applications"
  ON public.loan_applications FOR SELECT
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can update all loan applications"
  ON public.loan_applications FOR UPDATE
  USING (public.has_role(auth.uid(), 'superadmin'));

-- RLS Policies for tickets
CREATE POLICY "Users can view their own tickets"
  ON public.tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Support agents can view all tickets"
  ON public.tickets FOR SELECT
  USING (public.has_role(auth.uid(), 'support_agent') OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Support agents can update tickets"
  ON public.tickets FOR UPDATE
  USING (public.has_role(auth.uid(), 'support_agent') OR public.has_role(auth.uid(), 'superadmin'));

-- RLS Policies for ticket_messages
CREATE POLICY "Users can view messages for their tickets"
  ON public.ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets 
      WHERE id = ticket_id AND user_id = auth.uid()
    )
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

CREATE POLICY "Support agents can view all ticket messages"
  ON public.ticket_messages FOR SELECT
  USING (public.has_role(auth.uid(), 'support_agent') OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Support agents can create ticket messages"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'support_agent') OR public.has_role(auth.uid(), 'superadmin'));

-- RLS Policies for loan_settings
CREATE POLICY "Everyone can view loan settings"
  ON public.loan_settings FOR SELECT
  USING (true);

CREATE POLICY "Only superadmins can modify loan settings"
  ON public.loan_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'superadmin'));

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('loan-documents', 'loan-documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-attachments', 'ticket-attachments', false);

-- Storage policies for loan documents
CREATE POLICY "Users can upload their own loan documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'loan-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own loan documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'loan-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Superadmins can view all loan documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'loan-documents' AND public.has_role(auth.uid(), 'superadmin'));

-- Storage policies for ticket attachments
CREATE POLICY "Users can upload ticket attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ticket-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own ticket attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ticket-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Support agents can view all ticket attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ticket-attachments' AND (public.has_role(auth.uid(), 'support_agent') OR public.has_role(auth.uid(), 'superadmin')));

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_applications_updated_at
  BEFORE UPDATE ON public.loan_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_settings_updated_at
  BEFORE UPDATE ON public.loan_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();