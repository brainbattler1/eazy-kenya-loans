-- Clean up storage objects first, then drop everything auth-related

-- Delete all storage objects first
DELETE FROM storage.objects WHERE bucket_id IN ('loan-documents', 'ticket-attachments', 'profiles');

-- Drop storage policies
DROP POLICY IF EXISTS "Users can upload their own loan documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own loan documents" ON storage.objects;
DROP POLICY IF EXISTS "Superadmins can view all loan documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload ticket attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own ticket attachments" ON storage.objects;
DROP POLICY IF EXISTS "Support agents can view all ticket attachments" ON storage.objects;

-- Drop storage buckets
DELETE FROM storage.buckets WHERE id IN ('loan-documents', 'ticket-attachments', 'profiles');

-- Drop all tables in dependency order
DROP TABLE IF EXISTS public.admin_audit_logs CASCADE;
DROP TABLE IF EXISTS public.ticket_messages CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.loan_applications CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.loan_settings CASCADE;

-- Drop all custom functions
DROP FUNCTION IF EXISTS public.setup_new_user(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.generate_referral_code() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.add_referral_code_to_profile() CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_analytics() CASCADE;
DROP FUNCTION IF EXISTS public.toggle_user_status(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.log_admin_action(text, text, uuid, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.notify_loan_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.notify_ticket_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.send_notification_to_all_users(text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.send_notification_to_users(uuid[], text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.send_notification_to_admins(text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.delete_user_account(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.assign_admin_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.remove_admin_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_all_users() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Drop enum types
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Drop any remaining triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now create a simple profiles table for basic authentication
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

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
  
  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();