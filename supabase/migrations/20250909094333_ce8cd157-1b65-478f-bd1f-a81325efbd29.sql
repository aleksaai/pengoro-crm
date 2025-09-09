-- Create enum for account types
CREATE TYPE public.account_type AS ENUM ('super_admin', 'admin', 'user');

-- Add account_type column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN account_type account_type DEFAULT 'user';

-- Set specific users to their roles
UPDATE public.profiles 
SET account_type = 'super_admin' 
WHERE email = 'aleksa@pengoro.com';

UPDATE public.profiles 
SET account_type = 'admin' 
WHERE email = 'jonas@pengoro.com';

-- Add frozen status to leads table
ALTER TABLE public.leads 
ADD COLUMN is_frozen boolean DEFAULT false;

-- Create a function to check if a lead should be frozen based on overdue tasks
CREATE OR REPLACE FUNCTION public.check_and_freeze_overdue_leads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Freeze leads that have overdue tasks
  UPDATE public.leads 
  SET is_frozen = true
  WHERE id IN (
    SELECT DISTINCT lead_id 
    FROM public.tasks 
    WHERE done = false 
    AND due_date < NOW()
  );
  
  -- Unfreeze leads that no longer have overdue tasks
  UPDATE public.leads 
  SET is_frozen = false
  WHERE id NOT IN (
    SELECT DISTINCT lead_id 
    FROM public.tasks 
    WHERE done = false 
    AND due_date < NOW()
  );
END;
$$;

-- Create a function to check user permissions for lead editing
CREATE OR REPLACE FUNCTION public.can_edit_lead(lead_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_account_type account_type;
  lead_frozen boolean;
BEGIN
  -- Get user's account type
  SELECT account_type INTO user_account_type
  FROM public.profiles
  WHERE user_id = user_uuid;
  
  -- Get lead's frozen status
  SELECT is_frozen INTO lead_frozen
  FROM public.leads
  WHERE id = lead_uuid;
  
  -- Super admins can edit everything
  IF user_account_type = 'super_admin' THEN
    RETURN true;
  END IF;
  
  -- Admins cannot edit frozen leads
  IF user_account_type = 'admin' AND lead_frozen = true THEN
    RETURN false;
  END IF;
  
  -- Default allow for non-frozen leads
  RETURN true;
END;
$$;