-- Fix storage policies for lead-transcripts bucket to allow proper access

-- Drop the restrictive policy that only allows users to view their own transcripts
DROP POLICY IF EXISTS "Users can view their own transcripts" ON storage.objects;

-- Drop the duplicate update and delete policies that are also restrictive
DROP POLICY IF EXISTS "Users can update their own transcripts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own transcripts" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own transcripts" ON storage.objects;

-- Ensure the general policies for lead transcripts are in place
-- These allow all authenticated users to access lead transcripts (since it's a team CRM system)

-- Policy for viewing lead transcripts (allow all authenticated users)
CREATE POLICY IF NOT EXISTS "All authenticated users can view lead transcripts" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'lead-transcripts');

-- Policy for uploading lead transcripts (allow all authenticated users)
CREATE POLICY IF NOT EXISTS "All authenticated users can upload lead transcripts" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'lead-transcripts');

-- Policy for updating lead transcripts (allow all authenticated users)
CREATE POLICY IF NOT EXISTS "All authenticated users can update lead transcripts" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'lead-transcripts');

-- Policy for deleting lead transcripts (allow all authenticated users)
CREATE POLICY IF NOT EXISTS "All authenticated users can delete lead transcripts" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'lead-transcripts');