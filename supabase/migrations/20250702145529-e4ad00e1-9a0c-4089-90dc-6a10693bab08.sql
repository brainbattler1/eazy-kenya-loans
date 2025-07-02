-- Update email_verified status for users who have confirmed their email in Supabase auth
UPDATE public.profiles 
SET email_verified = true, updated_at = now()
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email_confirmed_at IS NOT NULL
  AND id = user_id
);