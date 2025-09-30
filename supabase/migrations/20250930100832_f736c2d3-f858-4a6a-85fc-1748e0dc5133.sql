-- Delete duplicate leads, keeping only the oldest one per email address
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) as rn
  FROM public.leads
  WHERE status = 'New'
)
DELETE FROM public.leads
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);