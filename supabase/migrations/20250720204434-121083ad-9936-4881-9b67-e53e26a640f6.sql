-- Add analytics and reporting views for admin loan management

-- Create a view for loan analytics
CREATE OR REPLACE VIEW public.loan_analytics AS
SELECT 
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  AVG(interest_rate) as avg_interest_rate,
  AVG(tenure_days) as avg_tenure_days,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as last_30_days,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as last_7_days
FROM public.loan_applications
GROUP BY status;

-- Create function to get detailed loan applications for admin with user info
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
  risk_score numeric
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
    -- Calculate risk score based on various factors
    CASE 
      WHEN la.monthly_income <= 0 THEN 10
      WHEN (la.amount / NULLIF(la.monthly_income, 0)) > 5 THEN 8
      WHEN (la.amount / NULLIF(la.monthly_income, 0)) > 3 THEN 6
      WHEN la.existing_loans_amount > la.monthly_income THEN 7
      WHEN la.credit_score IS NOT NULL AND la.credit_score < 600 THEN 9
      WHEN la.employment_status = 'unemployed' THEN 10
      WHEN la.employment_status = 'self_employed' THEN 5
      WHEN la.tenure_days > 60 THEN 4
      ELSE 3
    END as risk_score
  FROM public.loan_applications la
  LEFT JOIN public.get_all_users_for_admin() u ON la.user_id = u.id
  WHERE (_status IS NULL OR la.status::text = _status)
  ORDER BY la.created_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;

-- Create function to get loan statistics for dashboard
CREATE OR REPLACE FUNCTION public.get_loan_statistics()
RETURNS TABLE (
  total_applications bigint,
  pending_applications bigint,
  approved_applications bigint,
  rejected_applications bigint,
  disbursed_applications bigint,
  total_amount_requested numeric,
  total_amount_approved numeric,
  total_amount_disbursed numeric,
  avg_approval_time interval,
  approval_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can access loan statistics';
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_applications,
    COUNT(CASE WHEN status = 'pending' THEN 1 END)::bigint as pending_applications,
    COUNT(CASE WHEN status = 'approved' THEN 1 END)::bigint as approved_applications,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END)::bigint as rejected_applications,
    COUNT(CASE WHEN status = 'disbursed' THEN 1 END)::bigint as disbursed_applications,
    COALESCE(SUM(amount), 0) as total_amount_requested,
    COALESCE(SUM(CASE WHEN status IN ('approved', 'disbursed') THEN amount END), 0) as total_amount_approved,
    COALESCE(SUM(CASE WHEN status = 'disbursed' THEN amount END), 0) as total_amount_disbursed,
    AVG(reviewed_at - created_at) FILTER (WHERE reviewed_at IS NOT NULL) as avg_approval_time,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(CASE WHEN status IN ('approved', 'disbursed') THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 2)
      ELSE 0
    END as approval_rate
  FROM public.loan_applications;
END;
$$;

-- Create function for bulk loan operations
CREATE OR REPLACE FUNCTION public.bulk_update_loan_status(
  _loan_ids uuid[],
  _status loan_status,
  _rejection_reason text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
  admin_id uuid := auth.uid();
BEGIN
  -- Check if current user is admin
  IF NOT public.is_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can bulk update loan status';
  END IF;

  -- Update loans
  UPDATE public.loan_applications
  SET 
    status = _status,
    reviewed_at = NOW(),
    reviewed_by = admin_id,
    approved_at = CASE WHEN _status = 'approved' THEN NOW() ELSE approved_at END,
    approved_by = CASE WHEN _status = 'approved' THEN admin_id ELSE approved_by END,
    rejected_at = CASE WHEN _status = 'rejected' THEN NOW() ELSE rejected_at END,
    rejected_by = CASE WHEN _status = 'rejected' THEN admin_id ELSE rejected_by END,
    rejection_reason = CASE WHEN _status = 'rejected' THEN _rejection_reason ELSE rejection_reason END,
    updated_at = NOW()
  WHERE id = ANY(_loan_ids)
  AND status = 'pending'; -- Only update pending loans

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- Log admin action
  PERFORM public.log_admin_action(
    'bulk_update_loans',
    'loan_applications',
    NULL,
    jsonb_build_object(
      'loan_ids', _loan_ids,
      'new_status', _status,
      'updated_count', updated_count,
      'rejection_reason', _rejection_reason
    )
  );

  RETURN updated_count;
END;
$$;