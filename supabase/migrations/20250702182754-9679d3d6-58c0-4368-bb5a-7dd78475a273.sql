-- Create function to check if user is banned
CREATE OR REPLACE FUNCTION public.is_user_banned(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT banned FROM public.profiles WHERE user_id = _user_id),
    false
  );
$$;

-- Create function to check if maintenance mode is enabled
CREATE OR REPLACE FUNCTION public.is_maintenance_mode_enabled()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_enabled FROM public.maintenance_mode LIMIT 1),
    false
  );
$$;

-- Create function to check if user can access system (not banned, not in maintenance unless admin)
CREATE OR REPLACE FUNCTION public.can_user_access_system(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN _user_id IS NULL THEN false
      WHEN public.is_user_banned(_user_id) THEN false
      WHEN public.is_maintenance_mode_enabled() AND NOT public.is_admin(_user_id) THEN false
      ELSE true
    END;
$$;

-- Update all existing policies to include access control checks
-- Profiles table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id 
  AND public.can_user_access_system(auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND public.can_user_access_system(auth.uid())
);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND public.can_user_access_system(auth.uid())
);

-- Loan applications policies
DROP POLICY IF EXISTS "Users can view their own applications" ON public.loan_applications;
CREATE POLICY "Users can view their own applications" 
ON public.loan_applications 
FOR SELECT 
USING (
  (auth.uid() = user_id AND public.can_user_access_system(auth.uid()))
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Users can create their own applications" ON public.loan_applications;
CREATE POLICY "Users can create their own applications" 
ON public.loan_applications 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND public.can_user_access_system(auth.uid())
);

DROP POLICY IF EXISTS "Users can update their pending applications" ON public.loan_applications;
CREATE POLICY "Users can update their pending applications" 
ON public.loan_applications 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND status = 'pending'::loan_status 
  AND public.can_user_access_system(auth.uid())
);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (
  ((auth.uid() = user_id OR user_id IS NULL) AND public.can_user_access_system(auth.uid()))
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND public.can_user_access_system(auth.uid())
);

-- Tickets policies
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
CREATE POLICY "Users can view their own tickets" 
ON public.tickets 
FOR SELECT 
USING (
  (auth.uid() = user_id AND public.can_user_access_system(auth.uid()))
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
CREATE POLICY "Users can create tickets" 
ON public.tickets 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND public.can_user_access_system(auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own tickets" ON public.tickets;
CREATE POLICY "Users can update their own tickets" 
ON public.tickets 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND public.can_user_access_system(auth.uid())
);

-- Ticket messages policies
DROP POLICY IF EXISTS "Users can view messages for their tickets" ON public.ticket_messages;
CREATE POLICY "Users can view messages for their tickets" 
ON public.ticket_messages 
FOR SELECT 
USING (
  ((EXISTS (SELECT 1 FROM tickets WHERE tickets.id = ticket_messages.ticket_id AND tickets.user_id = auth.uid()) 
    AND public.can_user_access_system(auth.uid()))
  OR public.is_admin(auth.uid()))
);

DROP POLICY IF EXISTS "Users can create messages for their tickets" ON public.ticket_messages;
CREATE POLICY "Users can create messages for their tickets" 
ON public.ticket_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (SELECT 1 FROM tickets WHERE tickets.id = ticket_messages.ticket_id AND tickets.user_id = auth.uid())
  AND public.can_user_access_system(auth.uid())
);

-- Referrals policies
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
CREATE POLICY "Users can view their own referrals" 
ON public.referrals 
FOR SELECT 
USING (
  ((auth.uid() = referrer_id OR auth.uid() = referred_id) AND public.can_user_access_system(auth.uid()))
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;
CREATE POLICY "Users can create referrals" 
ON public.referrals 
FOR INSERT 
WITH CHECK (
  auth.uid() = referrer_id 
  AND public.can_user_access_system(auth.uid())
);

-- User roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (
  (auth.uid() = user_id AND public.can_user_access_system(auth.uid()))
  OR public.is_admin(auth.uid())
);

-- Create a function to prevent banned users from performing any actions
CREATE OR REPLACE FUNCTION public.prevent_banned_user_actions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user is banned
  IF public.is_user_banned(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Your account has been suspended. Please contact support.';
  END IF;
  
  -- Check maintenance mode for non-admin users
  IF public.is_maintenance_mode_enabled() AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'System is currently under maintenance. Please try again later.';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply the ban prevention trigger to all user tables
DROP TRIGGER IF EXISTS prevent_banned_access_profiles ON public.profiles;
CREATE TRIGGER prevent_banned_access_profiles
  BEFORE INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_banned_user_actions();

DROP TRIGGER IF EXISTS prevent_banned_access_loan_applications ON public.loan_applications;
CREATE TRIGGER prevent_banned_access_loan_applications
  BEFORE INSERT OR UPDATE OR DELETE ON public.loan_applications
  FOR EACH ROW EXECUTE FUNCTION public.prevent_banned_user_actions();

DROP TRIGGER IF EXISTS prevent_banned_access_tickets ON public.tickets;
CREATE TRIGGER prevent_banned_access_tickets
  BEFORE INSERT OR UPDATE OR DELETE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.prevent_banned_user_actions();

DROP TRIGGER IF EXISTS prevent_banned_access_ticket_messages ON public.ticket_messages;
CREATE TRIGGER prevent_banned_access_ticket_messages
  BEFORE INSERT OR UPDATE OR DELETE ON public.ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.prevent_banned_user_actions();

DROP TRIGGER IF EXISTS prevent_banned_access_referrals ON public.referrals;
CREATE TRIGGER prevent_banned_access_referrals
  BEFORE INSERT OR UPDATE OR DELETE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.prevent_banned_user_actions();