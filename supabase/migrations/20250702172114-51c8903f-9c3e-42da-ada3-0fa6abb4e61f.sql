-- Drop any existing objects to ensure clean setup
DROP VIEW IF EXISTS public.system_access;
DROP FUNCTION IF EXISTS public.check_maintenance_access();
DROP FUNCTION IF EXISTS public.toggle_maintenance_mode();
DROP TABLE IF EXISTS public.system_maintenance;

-- Create the maintenance table
CREATE TABLE public.system_maintenance (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    is_enabled boolean DEFAULT false,
    message text,
    enabled_by uuid REFERENCES auth.users(id),
    enabled_at timestamptz,
    updated_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- Insert initial record with a fixed UUID for easier reference
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
    now(),
    now()
);

-- Function to check if user can access system during maintenance
CREATE OR REPLACE FUNCTION public.check_maintenance_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_maintenance boolean;
BEGIN
    -- Get current maintenance status
    SELECT is_enabled INTO v_is_maintenance
    FROM public.system_maintenance
    LIMIT 1;

    -- If not in maintenance, allow access
    IF NOT COALESCE(v_is_maintenance, false) THEN
        RETURN true;
    END IF;

    -- If in maintenance, check if user is admin
    RETURN public.is_admin(auth.uid());
END;
$$;

-- Function to toggle maintenance mode (admin only)
CREATE OR REPLACE FUNCTION public.toggle_maintenance_mode(
    enable_maintenance boolean,
    maintenance_message text DEFAULT 'System is currently under maintenance. Please try again later.'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_user RECORD;
    v_current_status boolean;
BEGIN
    -- Get the current user's ID
    v_user_id := auth.uid();
    
    -- Check if user is an admin
    IF NOT public.is_admin(v_user_id) THEN
        RAISE EXCEPTION 'Unauthorized: Only administrators can toggle maintenance mode';
    END IF;

    -- Get current maintenance status
    SELECT is_enabled INTO v_current_status
    FROM public.system_maintenance
    WHERE id = '00000000-0000-0000-0000-000000000000';

    -- Only proceed if we're actually changing the status
    IF COALESCE(v_current_status, false) != enable_maintenance THEN
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

        -- If enabling maintenance mode, notify all active users
        IF enable_maintenance THEN
            FOR v_user IN 
                SELECT DISTINCT p.id 
                FROM public.profiles p 
                LEFT JOIN public.user_roles ur ON p.id = ur.user_id 
                WHERE (ur.role IS NULL OR ur.role = 'user'::app_role)
                AND p.last_sign_in_at > NOW() - INTERVAL '24 hours'
            LOOP
                -- Send notification to each non-admin user
                INSERT INTO public.notifications (
                    user_id,
                    type,
                    title,
                    message,
                    data,
                    created_at
                )
                VALUES (
                    v_user.id,
                    'system_maintenance'::notification_type,
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
            table_name,
            record_id,
            old_data,
            new_data,
            ip_address
        )
        VALUES (
            v_user_id,
            CASE WHEN enable_maintenance THEN 'enable_maintenance' ELSE 'disable_maintenance' END,
            'system_maintenance',
            '00000000-0000-0000-0000-000000000000',
            jsonb_build_object(
                'is_enabled', v_current_status,
                'message', (SELECT message FROM public.system_maintenance WHERE id = '00000000-0000-0000-0000-000000000000')
            ),
            jsonb_build_object(
                'is_enabled', enable_maintenance,
                'message', maintenance_message
            ),
            NULL
        );
    END IF;

    RETURN enable_maintenance;
END;
$$;

-- Enable RLS on system_maintenance table
ALTER TABLE public.system_maintenance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for system_maintenance table
CREATE POLICY "system_maintenance_read_policy"
ON public.system_maintenance
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "system_maintenance_admin_policy"
ON public.system_maintenance
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Add maintenance mode access policies to critical tables
DO $$ 
DECLARE
    v_table_name text;
    v_table_exists boolean;
BEGIN
    -- List of tables to protect
    FOR v_table_name IN 
        SELECT unnest(ARRAY[
            'profiles',
            'loan_applications',
            'notifications',
            'tickets',
            'ticket_messages',
            'user_roles'
        ])
    LOOP
        -- Check if table exists
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = v_table_name
        ) INTO v_table_exists;

        -- Only create policy if table exists
        IF v_table_exists THEN
            -- Drop existing maintenance policy if exists
            EXECUTE format('DROP POLICY IF EXISTS "maintenance_access_%s" ON public.%I', v_table_name, v_table_name);
            
            -- Create new maintenance policy
            EXECUTE format('
                CREATE POLICY "maintenance_access_%s" ON public.%I
                FOR ALL TO authenticated
                USING ((SELECT check_maintenance_access()))
                WITH CHECK ((SELECT check_maintenance_access()))',
                v_table_name, v_table_name
            );
        END IF;
    END LOOP;
END $$;

-- Create a view to check system access
CREATE OR REPLACE VIEW public.system_access AS
SELECT 
    CASE 
        WHEN check_maintenance_access() THEN 'granted'
        ELSE 'maintenance'
    END as access_status,
    COALESCE(
        (SELECT message FROM public.system_maintenance WHERE is_enabled = true LIMIT 1),
        'System is under maintenance'
    ) as maintenance_message;

-- Grant necessary permissions
GRANT SELECT ON public.system_access TO authenticated;
GRANT SELECT ON public.system_maintenance TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_maintenance_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_maintenance_mode TO authenticated;

-- Create a function to test the maintenance mode toggle
CREATE OR REPLACE FUNCTION test_maintenance_toggle()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    v_test_admin_id uuid;
    v_test_user_id uuid;
    v_result boolean;
    v_access_status text;
BEGIN
    -- Create test admin user
    INSERT INTO auth.users (id, email) 
    VALUES (gen_random_uuid(), 'test_admin@example.com') 
    RETURNING id INTO v_test_admin_id;
    
    -- Create test regular user
    INSERT INTO auth.users (id, email) 
    VALUES (gen_random_uuid(), 'test_user@example.com')
    RETURNING id INTO v_test_user_id;

    -- Set up admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_test_admin_id, 'admin');

    -- Test 1: Enable maintenance mode as admin
    SET LOCAL ROLE authenticated;
    SET LOCAL request.jwt.claim.sub TO v_test_admin_id::text;
    
    SELECT toggle_maintenance_mode(true, 'Test maintenance mode') INTO v_result;
    IF NOT v_result THEN
        RETURN 'Test 1 Failed: Could not enable maintenance mode';
    END IF;

    -- Test 2: Verify maintenance is enabled
    SELECT access_status INTO v_access_status FROM public.system_access;
    IF v_access_status != 'maintenance' THEN
        RETURN 'Test 2 Failed: Maintenance mode not properly enabled';
    END IF;

    -- Test 3: Try to access as regular user
    SET LOCAL request.jwt.claim.sub TO v_test_user_id::text;
    IF check_maintenance_access() THEN
        RETURN 'Test 3 Failed: Regular user should not have access during maintenance';
    END IF;

    -- Test 4: Access as admin during maintenance
    SET LOCAL request.jwt.claim.sub TO v_test_admin_id::text;
    IF NOT check_maintenance_access() THEN
        RETURN 'Test 4 Failed: Admin should have access during maintenance';
    END IF;

    -- Test 5: Disable maintenance mode
    SELECT toggle_maintenance_mode(false) INTO v_result;
    IF v_result THEN
        RETURN 'Test 5 Failed: Could not disable maintenance mode';
    END IF;

    -- Clean up test data
    DELETE FROM auth.users WHERE id IN (v_test_admin_id, v_test_user_id);

    RETURN 'All tests passed successfully';
END;
$$;

-- Run the tests
SELECT test_maintenance_toggle();