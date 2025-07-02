-- Add first_name and last_name to loan_applications table
ALTER TABLE public.loan_applications 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Update loan tenure to be in days instead of months, max 60 days
ALTER TABLE public.loan_applications 
RENAME COLUMN tenure_months TO tenure_days;

-- Update loan_settings to reflect day-based tenure
ALTER TABLE public.loan_settings 
RENAME COLUMN max_tenure_months TO max_tenure_days,
RENAME COLUMN min_tenure_months TO min_tenure_days;

-- Update the default values for loan settings to be day-based
UPDATE public.loan_settings 
SET max_tenure_days = 60, 
    min_tenure_days = 7;

-- Add proper relationship between profiles and user_roles tables
-- First, let's ensure we have a proper foreign key relationship
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;