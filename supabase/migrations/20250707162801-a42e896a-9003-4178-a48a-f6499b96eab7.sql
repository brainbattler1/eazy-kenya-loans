-- Check current RLS policies on loan_applications table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'loan_applications';

-- Add missing admin update policy if needed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'loan_applications' 
        AND policyname = 'Admins can update all applications'
        AND cmd = 'UPDATE'
    ) THEN
        CREATE POLICY "Admins can update all applications"
        ON public.loan_applications FOR UPDATE
        USING (is_admin(auth.uid()));
    END IF;
END $$;

-- Also ensure admins have proper SELECT access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'loan_applications' 
        AND policyname = 'Admins can view all applications'
        AND cmd = 'SELECT'
    ) THEN
        CREATE POLICY "Admins can view all applications"
        ON public.loan_applications FOR SELECT
        USING (is_admin(auth.uid()));
    END IF;
END $$;