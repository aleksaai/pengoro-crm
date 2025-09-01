-- Add new fields to leads table
ALTER TABLE public.leads 
ADD COLUMN age integer,
ADD COLUMN net_salary numeric,
ADD COLUMN id_document_path text;

-- Create storage bucket for ID documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lead-documents', 'lead-documents', false);

-- Create storage policies for ID documents
CREATE POLICY "Authenticated users can upload ID documents" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'lead-documents');

CREATE POLICY "Authenticated users can view ID documents" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'lead-documents');

CREATE POLICY "Authenticated users can update ID documents" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'lead-documents');

CREATE POLICY "Authenticated users can delete ID documents" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'lead-documents');