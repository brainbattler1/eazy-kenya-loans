-- Add first_name and last_name to loan_applications table
ALTER TABLE public.loan_applications 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Update loan tenure to be in days instead of months, max 60 days
ALTER TABLE public.loan_applications 
RENAME COLUMN tenure_months TO tenure_days;

-- Update loan_settings to reflect day-based tenure
ALTER TABLE public.loan_settings 
RENAME COLUMN max_tenure_months TO max_tenure_days;

ALTER TABLE public.loan_settings 
RENAME COLUMN min_tenure_months TO min_tenure_days;

-- Update the default values for loan settings to be day-based
UPDATE public.loan_settings 
SET max_tenure_days = 60, 
    min_tenure_days = 7;