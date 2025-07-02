-- Add additional fields to loan_applications table for enhanced form
ALTER TABLE public.loan_applications 
ADD COLUMN IF NOT EXISTS applicant_address TEXT,
ADD COLUMN IF NOT EXISTS applicant_phone TEXT,
ADD COLUMN IF NOT EXISTS id_document_front_url TEXT,
ADD COLUMN IF NOT EXISTS id_document_back_url TEXT,
ADD COLUMN IF NOT EXISTS bank_statement_url TEXT,
ADD COLUMN IF NOT EXISTS proof_of_income_url TEXT,
ADD COLUMN IF NOT EXISTS employer_name TEXT,
ADD COLUMN IF NOT EXISTS employment_duration TEXT,
ADD COLUMN IF NOT EXISTS credit_score INTEGER,
ADD COLUMN IF NOT EXISTS existing_loans_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS marital_status TEXT,
ADD COLUMN IF NOT EXISTS dependents INTEGER DEFAULT 0;

-- Update existing records to have default values for new columns
UPDATE public.loan_applications 
SET 
  existing_loans_amount = 0,
  dependents = 0
WHERE existing_loans_amount IS NULL OR dependents IS NULL;

-- Create storage bucket for loan documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('loan-documents', 'loan-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for loan documents
CREATE POLICY "Users can upload their own loan documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'loan-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own loan documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'loan-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all loan documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'loan-documents' 
  AND is_admin(auth.uid())
);

CREATE POLICY "Users can update their own loan documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'loan-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own loan documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'loan-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);