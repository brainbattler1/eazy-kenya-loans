-- Drop all auth-related tables, functions, triggers, and policies
-- This will completely reset the authentication system

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

-- Drop storage buckets
DELETE FROM storage.buckets WHERE id IN ('loan-documents', 'ticket-attachments', 'profiles');

-- Drop storage policies
DROP POLICY IF EXISTS "Users can upload their own loan documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own loan documents" ON storage.objects;
DROP POLICY IF EXISTS "Superadmins can view all loan documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload ticket attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own ticket attachments" ON storage.objects;
DROP POLICY IF EXISTS "Support agents can view all ticket attachments" ON storage.objects;

-- Drop any remaining triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_loan_applications_updated_at ON public.loan_applications;
DROP TRIGGER IF EXISTS update_tickets_updated_at ON public.tickets;
DROP TRIGGER IF EXISTS update_loan_settings_updated_at ON public.loan_settings;