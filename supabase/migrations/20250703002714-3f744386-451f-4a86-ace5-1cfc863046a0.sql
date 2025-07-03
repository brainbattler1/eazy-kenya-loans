-- Update referrals table to support email invitations without referred_id initially
ALTER TABLE public.referrals 
ALTER COLUMN referred_id DROP NOT NULL;

-- Add referral_code column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referral_code') THEN
        ALTER TABLE public.profiles ADD COLUMN referral_code TEXT UNIQUE;
    END IF;
END $$;

-- Update existing profiles to have referral codes if they don't have one
UPDATE public.profiles 
SET referral_code = generate_referral_code() 
WHERE referral_code IS NULL;

-- Create trigger to add referral code for new profiles if it doesn't exist
CREATE OR REPLACE FUNCTION add_referral_code_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS set_referral_code_on_profile_insert ON public.profiles;
CREATE TRIGGER set_referral_code_on_profile_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION add_referral_code_to_profile();

-- Create function to handle referral tracking when user completes verification
CREATE OR REPLACE FUNCTION handle_referral_tracking()
RETURNS TRIGGER AS $$
DECLARE
  ref_code TEXT;
  referrer_user_id UUID;
BEGIN
  -- Only proceed if email was just confirmed
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    -- Check if there's a pending referral for this user
    SELECT referral_code INTO ref_code 
    FROM public.referrals 
    WHERE email = NEW.email AND referred_id IS NULL 
    LIMIT 1;
    
    IF ref_code IS NOT NULL THEN
      -- Find the referrer
      SELECT user_id INTO referrer_user_id 
      FROM public.profiles 
      WHERE referral_code = ref_code;
      
      IF referrer_user_id IS NOT NULL THEN
        -- Update the referral record with the new user's ID
        UPDATE public.referrals 
        SET referred_id = NEW.id,
            status = 'completed',
            completed_at = NOW()
        WHERE referral_code = ref_code AND email = NEW.email;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users for referral tracking
DROP TRIGGER IF EXISTS handle_referral_on_confirmation ON auth.users;
CREATE TRIGGER handle_referral_on_confirmation
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_referral_tracking();