-- Fix storage policies for lead-transcripts bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload lead transcripts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view lead transcripts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete lead transcripts" ON storage.objects;

-- Create proper RLS policies for lead-transcripts bucket
CREATE POLICY "Users can upload lead transcripts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'lead-transcripts' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view lead transcripts" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'lead-transcripts' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete lead transcripts" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'lead-transcripts' 
  AND auth.uid() IS NOT NULL
);