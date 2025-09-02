-- Create tasks table for lead task management
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  lead_name TEXT NOT NULL,
  email_address TEXT,
  phone_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  assigned_to UUID NOT NULL,
  assigned_to_name TEXT,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for task access
CREATE POLICY "All users can view tasks" 
ON public.tasks 
FOR SELECT 
USING (true);

CREATE POLICY "All users can create tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "All users can update tasks" 
ON public.tasks 
FOR UPDATE 
USING (true);

CREATE POLICY "All users can delete tasks" 
ON public.tasks 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();