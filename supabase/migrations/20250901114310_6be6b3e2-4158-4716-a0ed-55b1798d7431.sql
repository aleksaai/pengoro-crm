-- Add back page column for ID documents
ALTER TABLE public.leads 
ADD COLUMN id_document_back_path TEXT DEFAULT NULL;