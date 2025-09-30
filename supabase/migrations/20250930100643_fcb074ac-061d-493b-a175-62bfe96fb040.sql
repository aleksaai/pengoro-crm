-- Update all leads with status "New lead" to "New" for consistency
UPDATE public.leads 
SET status = 'New', updated_at = NOW()
WHERE status = 'New lead';