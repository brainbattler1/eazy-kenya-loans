-- Create maintenance mode table for admin control
CREATE TABLE IF NOT EXISTS public.maintenance_mode (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean NOT NULL DEFAULT false,
  message text DEFAULT 'We are currently performing maintenance. Please check back shortly.',
  enabled_by uuid REFERENCES auth.users(id),
  enabled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on maintenance_mode table
ALTER TABLE public.maintenance_mode ENABLE ROW LEVEL SECURITY;

-- Policy for everyone to read maintenance status
CREATE POLICY "Everyone can view maintenance status" 
ON public.maintenance_mode 
FOR SELECT 
USING (true);

-- Policy for admins to manage maintenance mode
CREATE POLICY "Admins can manage maintenance mode" 
ON public.maintenance_mode 
FOR ALL 
USING (is_admin(auth.uid()));

-- Insert initial maintenance mode record
INSERT INTO public.maintenance_mode (is_enabled, message) 
VALUES (false, 'We are currently performing maintenance. Please check back shortly.')
ON CONFLICT DO NOTHING;

-- Create function to toggle maintenance mode
CREATE OR REPLACE FUNCTION public.toggle_maintenance_mode(
  enable_maintenance boolean,
  maintenance_message text DEFAULT 'We are currently performing maintenance. Please check back shortly.'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_id uuid := auth.uid();
BEGIN
  -- Check if current user is admin
  IF NOT has_role(admin_id, 'admin'::app_role) AND NOT has_role(admin_id, 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can toggle maintenance mode';
  END IF;

  -- Update maintenance mode status
  UPDATE public.maintenance_mode 
  SET 
    is_enabled = enable_maintenance,
    message = maintenance_message,
    enabled_by = CASE WHEN enable_maintenance THEN admin_id ELSE enabled_by END,
    enabled_at = CASE WHEN enable_maintenance THEN now() ELSE enabled_at END,
    updated_at = now();

  -- Send notification to all users about maintenance
  IF enable_maintenance THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    SELECT p.user_id, 'Maintenance Mode Enabled', maintenance_message, 'warning'
    FROM public.profiles p;
  ELSE
    INSERT INTO public.notifications (user_id, title, message, type)
    SELECT p.user_id, 'Maintenance Complete', 'The system is now back online. Thank you for your patience.', 'success'
    FROM public.profiles p;
  END IF;

  -- Log admin action
  INSERT INTO public.admin_audit_logs (admin_id, action, resource_type, details)
  VALUES (
    admin_id,
    CASE WHEN enable_maintenance THEN 'enable_maintenance' ELSE 'disable_maintenance' END,
    'system',
    jsonb_build_object(
      'maintenance_enabled', enable_maintenance,
      'message', maintenance_message,
      'timestamp', now()
    )
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to toggle maintenance mode: %', SQLERRM;
END;
$$;

-- Add trigger to automatically update updated_at timestamp
CREATE TRIGGER update_maintenance_mode_updated_at
  BEFORE UPDATE ON public.maintenance_mode
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();