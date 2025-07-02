-- Find user by email and assign admin role
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Find the user by email from auth.users
    SELECT id INTO target_user_id
    FROM auth.users 
    WHERE email = 'johnykariuki2004@gmail.com';
    
    -- Check if user exists
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User with email johnykariuki2004@gmail.com not found';
    ELSE
        -- Assign admin role using the existing function
        PERFORM public.assign_admin_role(target_user_id);
        RAISE NOTICE 'Successfully assigned admin role to user: %', target_user_id;
    END IF;
END $$;