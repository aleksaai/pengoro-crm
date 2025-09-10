-- One-time migration to transfer all "New" leads to winbacks "Lost" with "Winback" label
-- Update all leads with status "New" to status "Lost"
UPDATE public.leads 
SET status = 'Lost', updated_at = now()
WHERE status = 'New';

-- Create lead_history entries for all transferred leads to mark them as abandoned with "Winback" reason
INSERT INTO public.lead_history (lead_id, action, details, created_by, created_at)
SELECT 
    id as lead_id,
    'Lead Abandoned' as action,
    'Lead marked as lost. Reason: Winback' as details,
    created_by,
    now() as created_at
FROM public.leads 
WHERE status = 'Lost' 
AND id NOT IN (
    -- Exclude leads that already have abandon history entries
    SELECT DISTINCT lead_id 
    FROM public.lead_history 
    WHERE action = 'Lead Abandoned'
);