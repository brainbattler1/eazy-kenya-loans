-- Fix the toggle_maintenance_mode function to remove reference to non-existent column
CREATE OR REPLACE FUNCTION public.toggle_maintenance_mode(enable_maintenance boolean, maintenance_message text DEFAULT 'System is currently under maintenance. Please try again later.'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id uuid;
    v_user RECORD;
BEGIN
    -- Get the current user's ID
    v_user_id := auth.uid();
    
    -- Check if user is an admin
    IF NOT public.is_admin(v_user_id) THEN
        RAISE EXCEPTION 'Unauthorized: Only administrators can toggle maintenance mode';
    END IF;

    -- Update maintenance mode status
    UPDATE public.system_maintenance
    SET 
        is_enabled = enable_maintenance,
        message = maintenance_message,
        enabled_by = CASE WHEN enable_maintenance THEN v_user_id ELSE enabled_by END,
        enabled_at = CASE WHEN enable_maintenance THEN NOW() ELSE enabled_at END,
        updated_at = NOW()
    WHERE id = '00000000-0000-0000-0000-000000000000'
    RETURNING is_enabled INTO enable_maintenance;

    -- If enabling maintenance mode, notify all regular users
    IF enable_maintenance THEN
        FOR v_user IN 
            SELECT DISTINCT p.user_id 
            FROM public.profiles p 
            LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id 
            WHERE (ur.role IS NULL OR ur.role = 'user'::app_role)
        LOOP
            -- Send notification to each non-admin user
            INSERT INTO public.notifications (
                user_id,
                type,
                title,
                message,
                metadata,
                created_at
            )
            VALUES (
                v_user.user_id,
                'warning'::notification_type,
                'System Maintenance',
                maintenance_message,
                jsonb_build_object(
                    'maintenance_enabled', true,
                    'enabled_at', NOW()
                ),
                NOW()
            );
        END LOOP;
    END IF;

    -- Log the action
    INSERT INTO public.admin_audit_logs (
        admin_id,
        action,
        resource_type,
        details
    )
    VALUES (
        v_user_id,
        CASE WHEN enable_maintenance THEN 'enable_maintenance' ELSE 'disable_maintenance' END,
        'system_maintenance',
        jsonb_build_object(
            'is_enabled', enable_maintenance,
            'message', maintenance_message
        )
    );

    RETURN enable_maintenance;
END;
$$;