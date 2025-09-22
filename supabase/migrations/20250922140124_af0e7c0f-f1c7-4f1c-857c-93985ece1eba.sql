-- First, identify and remove orphaned tasks that reference non-existent leads
DELETE FROM public.tasks 
WHERE lead_id NOT IN (SELECT id FROM public.leads);

-- Now add the foreign key constraint between tasks and leads tables
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON public.tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date_done ON public.tasks(due_date, done);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);