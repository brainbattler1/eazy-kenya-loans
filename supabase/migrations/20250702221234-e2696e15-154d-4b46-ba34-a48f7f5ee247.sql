-- Ensure maintenance mode record exists with proper defaults
INSERT INTO public.system_maintenance (
  id,
  is_enabled,
  message,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  false,
  'System is currently under maintenance. Please try again later.',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW()
WHERE system_maintenance.id = '00000000-0000-0000-0000-000000000000';