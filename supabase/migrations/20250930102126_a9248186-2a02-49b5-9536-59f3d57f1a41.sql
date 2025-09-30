-- Fix existing New Deals that should be linked to customers
-- Link all New Deals to their corresponding customers based on email match
UPDATE public.leads l
SET related_customer_id = c.id
FROM public.leads c
WHERE l.source = 'Existing Customer - New Deal'
  AND l.status IN ('Discovery Call Booked', 'Second Meeting Booked', 'Follow-Up Scheduled', 'Closing Call Scheduled', 'Stuck')
  AND c.status = 'Won'
  AND l.email = c.email
  AND (l.related_customer_id IS NULL OR l.related_customer_id != c.id);