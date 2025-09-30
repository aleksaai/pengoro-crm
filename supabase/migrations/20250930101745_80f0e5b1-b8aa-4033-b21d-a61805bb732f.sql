-- Add related_customer_id field to leads table to link upsell deals to original customers
ALTER TABLE public.leads 
ADD COLUMN related_customer_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_leads_related_customer ON public.leads(related_customer_id);

-- Add comment to explain the field
COMMENT ON COLUMN public.leads.related_customer_id IS 'Links upsell deals to their original customer. When a customer gets a new deal, this field stores the customer lead ID to merge notes and history.';