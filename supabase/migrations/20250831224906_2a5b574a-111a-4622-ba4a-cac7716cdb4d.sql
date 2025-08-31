-- Create leads table
CREATE TABLE public.leads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    source TEXT,
    status TEXT NOT NULL DEFAULT 'New',
    assigned_to TEXT,
    interested_products TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create lead_notes table  
CREATE TABLE public.lead_notes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    author_name TEXT
);

-- Create lead_history table
CREATE TABLE public.lead_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    user_name TEXT
);

-- Create lead_transcripts table
CREATE TABLE public.lead_transcripts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_transcripts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - Allow all authenticated users to see and modify all leads
CREATE POLICY "All users can view leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "All users can insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "All users can update leads" ON public.leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "All users can delete leads" ON public.leads FOR DELETE TO authenticated USING (true);

CREATE POLICY "All users can view lead notes" ON public.lead_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "All users can insert lead notes" ON public.lead_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "All users can update lead notes" ON public.lead_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "All users can delete lead notes" ON public.lead_notes FOR DELETE TO authenticated USING (true);

CREATE POLICY "All users can view lead history" ON public.lead_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "All users can insert lead history" ON public.lead_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "All users can update lead history" ON public.lead_history FOR UPDATE TO authenticated USING (true);
CREATE POLICY "All users can delete lead history" ON public.lead_history FOR DELETE TO authenticated USING (true);

CREATE POLICY "All users can view lead transcripts" ON public.lead_transcripts FOR SELECT TO authenticated USING (true);
CREATE POLICY "All users can insert lead transcripts" ON public.lead_transcripts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "All users can update lead transcripts" ON public.lead_transcripts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "All users can delete lead transcripts" ON public.lead_transcripts FOR DELETE TO authenticated USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
CREATE INDEX idx_lead_notes_lead_id ON public.lead_notes(lead_id);
CREATE INDEX idx_lead_history_lead_id ON public.lead_history(lead_id);
CREATE INDEX idx_lead_transcripts_lead_id ON public.lead_transcripts(lead_id);