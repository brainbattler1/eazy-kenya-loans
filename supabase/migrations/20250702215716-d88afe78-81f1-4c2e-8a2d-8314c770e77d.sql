-- Drop and recreate the system_access view to ensure it works correctly
DROP VIEW IF EXISTS public.system_access;

CREATE VIEW public.system_access AS
SELECT 
  CASE 
    WHEN sm.is_enabled = true THEN 'maintenance'::text
    ELSE 'granted'::text
  END as access_status,
  sm.message as maintenance_message
FROM public.system_maintenance sm
WHERE sm.id = '00000000-0000-0000-0000-000000000000'
LIMIT 1;