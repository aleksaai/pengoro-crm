-- Allow users to view basic profile information of all users for lead assignment
CREATE POLICY "Users can view basic profile info for assignments" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Drop the overly restrictive policy that only allowed users to view their own profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;