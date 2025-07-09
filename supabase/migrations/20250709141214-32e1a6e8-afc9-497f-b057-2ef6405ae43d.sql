-- Fix function parameter type to match enum
CREATE OR REPLACE FUNCTION public.send_notification_to_user(user_id uuid, notification_type notification_type, title text, message text, metadata text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  notification_id UUID;
  metadata_jsonb JSONB;
BEGIN
  -- Convert text metadata to JSONB if provided, otherwise use empty JSONB
  IF metadata IS NULL THEN
    metadata_jsonb := '{}'::jsonb;
  ELSE
    BEGIN
      metadata_jsonb := metadata::jsonb;
    EXCEPTION WHEN OTHERS THEN
      -- If conversion fails, store as a JSON string
      metadata_jsonb := jsonb_build_object('text', metadata);
    END;
  END IF;

  -- Insert the notification using the correct enum type
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    metadata,
    created_at,
    read
  ) VALUES (
    user_id,
    notification_type,
    title,
    message,
    metadata_jsonb,
    now(),
    false
  ) RETURNING id INTO notification_id;
  
  -- Return the ID of the created notification
  RETURN notification_id;
EXCEPTION
  WHEN undefined_table THEN
    -- If the notifications table doesn't exist, create it first
    CREATE TABLE IF NOT EXISTS public.notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      type notification_type NOT NULL DEFAULT 'info'::notification_type,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      read BOOLEAN DEFAULT false
    );
    
    -- Enable RLS
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    CREATE POLICY "Users can view their own notifications" 
      ON public.notifications FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own notifications" 
      ON public.notifications FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    -- Try again after creating the table
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      created_at,
      read
    ) VALUES (
      user_id,
      notification_type,
      title,
      message,
      metadata_jsonb,
      now(),
      false
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$function$;