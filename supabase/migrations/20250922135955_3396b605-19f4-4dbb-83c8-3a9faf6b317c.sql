-- Add foreign key constraint between tasks and leads tables
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;

-- Add index on lead_id for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON public.tasks(lead_id);

-- Add index on due_date and done status for task queries
CREATE INDEX IF NOT EXISTS idx_tasks_due_date_done ON public.tasks(due_date, done);

-- Add index on assigned_to for filtering tasks by user
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);