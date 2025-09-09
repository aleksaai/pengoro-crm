-- Reset all test data - Delete all leads, customers and related data

-- Delete all tasks (related to leads)
DELETE FROM public.tasks;

-- Delete all lead transcripts
DELETE FROM public.lead_transcripts;

-- Delete all lead notes  
DELETE FROM public.lead_notes;

-- Delete all lead history
DELETE FROM public.lead_history;

-- Delete all customer products (customers)
DELETE FROM public.customer_products;

-- Delete all leads
DELETE FROM public.leads;