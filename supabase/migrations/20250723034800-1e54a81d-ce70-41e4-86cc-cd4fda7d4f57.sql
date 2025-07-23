-- Fix the type mismatch in get_admin_loan_applications function
DROP FUNCTION IF EXISTS public.get_admin_loan_applications(_status text, _limit integer, _offset integer);

CREATE OR REPLACE FUNCTION public.get_admin_loan_applications(_status text DEFAULT NULL, _limit integer DEFAULT 50, _offset integer DEFAULT 0)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  amount numeric,
  interest_rate numeric,
  tenure_days integer,
  monthly_payment numeric,
  total_payment numeric,
  processing_fee numeric,
  purpose text,
  employment_status text,
  monthly_income numeric,
  status loan_status,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  approved_at timestamp with time zone,
  approved_by uuid,
  rejected_at timestamp with time zone,
  rejected_by uuid,
  rejection_reason text,
  first_name text,
  last_name text,
  applicant_phone text,
  applicant_address text,
  date_of_birth date,
  gender text,
  marital_status text,
  dependents integer,
  employer_name text,
  employment_duration text,
  emergency_contact_name text,
  emergency_contact_phone text,
  existing_loans_amount numeric,
  credit_score integer,
  documents_uploaded boolean,
  id_document_front_url text,
  id_document_back_url text,
  proof_of_income_url text,
  bank_statement_url text,
  user_email text,
  user_full_name text,
  user_created_at timestamp with time zone,
  risk_score numeric  -- Fixed: changed from integer to numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can access loan applications';
  END IF;

  RETURN QUERY
  SELECT 
    la.id,
    la.user_id,
    la.amount,
    la.interest_rate,
    la.tenure_days,
    la.monthly_payment,
    la.total_payment,
    la.processing_fee,
    la.purpose,
    la.employment_status,
    la.monthly_income,
    la.status,
    la.created_at,
    la.updated_at,
    la.reviewed_at,
    la.reviewed_by,
    la.approved_at,
    la.approved_by,
    la.rejected_at,
    la.rejected_by,
    la.rejection_reason,
    la.first_name,
    la.last_name,
    la.applicant_phone,
    la.applicant_address,
    la.date_of_birth,
    la.gender,
    la.marital_status,
    la.dependents,
    la.employer_name,
    la.employment_duration,
    la.emergency_contact_name,
    la.emergency_contact_phone,
    la.existing_loans_amount,
    la.credit_score,
    la.documents_uploaded,
    la.id_document_front_url,
    la.id_document_back_url,
    la.proof_of_income_url,
    la.bank_statement_url,
    u.email as user_email,
    u.full_name as user_full_name,
    u.created_at as user_created_at,
    -- Calculate risk score based on various factors (return as numeric)
    CASE 
      WHEN la.monthly_income <= 0 THEN 10.0
      WHEN (la.amount / NULLIF(la.monthly_income, 0)) > 5 THEN 8.0
      WHEN (la.amount / NULLIF(la.monthly_income, 0)) > 3 THEN 6.0
      WHEN la.existing_loans_amount > la.monthly_income THEN 7.0
      WHEN la.credit_score IS NOT NULL AND la.credit_score < 600 THEN 9.0
      WHEN la.employment_status = 'unemployed' THEN 10.0
      WHEN la.employment_status = 'self_employed' THEN 5.0
      WHEN la.tenure_days > 60 THEN 4.0
      ELSE 3.0
    END as risk_score
  FROM public.loan_applications la
  LEFT JOIN public.get_all_users_for_admin() u ON la.user_id = u.id
  WHERE (_status IS NULL OR la.status::text = _status)
  ORDER BY la.created_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;