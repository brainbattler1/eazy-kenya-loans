-- Drop the unique constraints properly
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_national_id_key;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_referral_code_key;

-- Create partial unique indexes that handle NULLs properly  
CREATE UNIQUE INDEX profiles_national_id_unique 
ON public.profiles (national_id) 
WHERE national_id IS NOT NULL;

CREATE UNIQUE INDEX profiles_referral_code_unique 
ON public.profiles (referral_code) 
WHERE referral_code IS NOT NULL;

-- Recreate the trigger function and trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email_verified, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    generate_referral_code()
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();