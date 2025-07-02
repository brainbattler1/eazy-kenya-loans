-- Enhance notifications table to support admin-sent notifications
ALTER TABLE public.notifications 
ADD COLUMN sender_id uuid REFERENCES auth.users(id),
ADD COLUMN sender_type text DEFAULT 'system' CHECK (sender_type IN ('system', 'admin')),
ADD COLUMN recipient_type text DEFAULT 'user' CHECK (recipient_type IN ('user', 'admin', 'all')),
ADD COLUMN priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- Create indexes for better performance
CREATE INDEX idx_notifications_sender_id ON public.notifications(sender_id);
CREATE INDEX idx_notifications_sender_type ON public.notifications(sender_type);
CREATE INDEX idx_notifications_recipient_type ON public.notifications(recipient_type);
CREATE INDEX idx_notifications_priority ON public.notifications(priority);

-- Update RLS policies for admin notifications
CREATE POLICY "Admins can create notifications for users" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) AND 
  sender_id = auth.uid() AND 
  sender_type = 'admin'
);

CREATE POLICY "Admins can view all notifications" 
ON public.notifications 
FOR SELECT 
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Function to send notification to all users
CREATE OR REPLACE FUNCTION public.send_notification_to_all_users(
  p_title text,
  p_message text,
  p_type text DEFAULT 'info',
  p_priority text DEFAULT 'normal',
  p_action_url text DEFAULT null
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_id uuid := auth.uid();
  user_record record;
BEGIN
  -- Check if current user is superadmin
  IF NOT has_role(admin_id, 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Only superadmins can send notifications to all users';
  END IF;

  -- Insert notification for each user
  FOR user_record IN 
    SELECT p.user_id 
    FROM public.profiles p 
    WHERE p.status = 'active'
  LOOP
    INSERT INTO public.notifications (
      user_id, 
      title, 
      message, 
      type, 
      priority,
      action_url,
      sender_id,
      sender_type,
      recipient_type
    )
    VALUES (
      user_record.user_id,
      p_title,
      p_message,
      p_type,
      p_priority,
      p_action_url,
      admin_id,
      'admin',
      'all'
    );
  END LOOP;

  -- Log admin action
  INSERT INTO public.admin_audit_logs (admin_user_id, action_type, target_type, target_id, details)
  VALUES (
    admin_id,
    'broadcast_notification',
    'notification',
    gen_random_uuid(),
    jsonb_build_object(
      'title', p_title,
      'message', p_message,
      'type', p_type,
      'priority', p_priority
    )
  );

  RETURN TRUE;
END;
$$;

-- Function to send notification to specific users
CREATE OR REPLACE FUNCTION public.send_notification_to_users(
  p_user_ids uuid[],
  p_title text,
  p_message text,
  p_type text DEFAULT 'info',
  p_priority text DEFAULT 'normal',
  p_action_url text DEFAULT null
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_id uuid := auth.uid();
  user_id uuid;
BEGIN
  -- Check if current user is superadmin
  IF NOT has_role(admin_id, 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Only superadmins can send notifications to users';
  END IF;

  -- Insert notification for each specified user
  FOREACH user_id IN ARRAY p_user_ids
  LOOP
    INSERT INTO public.notifications (
      user_id, 
      title, 
      message, 
      type, 
      priority,
      action_url,
      sender_id,
      sender_type,
      recipient_type
    )
    VALUES (
      user_id,
      p_title,
      p_message,
      p_type,
      p_priority,
      p_action_url,
      admin_id,
      'admin',
      'user'
    );
  END LOOP;

  -- Log admin action
  INSERT INTO public.admin_audit_logs (admin_user_id, action_type, target_type, target_id, details)
  VALUES (
    admin_id,
    'send_notification',
    'notification',
    gen_random_uuid(),
    jsonb_build_object(
      'title', p_title,
      'message', p_message,
      'type', p_type,
      'priority', p_priority,
      'user_count', array_length(p_user_ids, 1)
    )
  );

  RETURN TRUE;
END;
$$;

-- Function to send notification to all admins
CREATE OR REPLACE FUNCTION public.send_notification_to_admins(
  p_title text,
  p_message text,
  p_type text DEFAULT 'info',
  p_priority text DEFAULT 'normal',
  p_action_url text DEFAULT null
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_id uuid := auth.uid();
  admin_record record;
BEGIN
  -- Check if current user is superadmin
  IF NOT has_role(admin_id, 'superadmin'::app_role) THEN
    RAISE EXCEPTION 'Only superadmins can send notifications to admins';
  END IF;

  -- Insert notification for each admin user
  FOR admin_record IN 
    SELECT ur.user_id 
    FROM public.user_roles ur 
    WHERE ur.role = 'superadmin'::app_role
  LOOP
    INSERT INTO public.notifications (
      user_id, 
      title, 
      message, 
      type, 
      priority,
      action_url,
      sender_id,
      sender_type,
      recipient_type
    )
    VALUES (
      admin_record.user_id,
      p_title,
      p_message,
      p_type,
      p_priority,
      p_action_url,
      admin_id,
      'admin',
      'admin'
    );
  END LOOP;

  -- Log admin action
  INSERT INTO public.admin_audit_logs (admin_user_id, action_type, target_type, target_id, details)
  VALUES (
    admin_id,
    'notify_admins',
    'notification',
    gen_random_uuid(),
    jsonb_build_object(
      'title', p_title,
      'message', p_message,
      'type', p_type,
      'priority', p_priority
    )
  );

  RETURN TRUE;
END;
$$;