-- Enable real-time for analytics tables
ALTER TABLE public.customer_products REPLICA IDENTITY FULL;
ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER TABLE public.lead_history REPLICA IDENTITY FULL;
ALTER TABLE public.lead_notes REPLICA IDENTITY FULL;

-- Add tables to the supabase_realtime publication for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_notes;