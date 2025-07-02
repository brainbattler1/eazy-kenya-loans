-- Fix the is_maintenance_mode_enabled function to use the correct table
CREATE OR REPLACE FUNCTION public.is_maintenance_mode_enabled()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_enabled FROM public.system_maintenance LIMIT 1),
    false
  );
$$;