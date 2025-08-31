-- Create storage bucket for lead transcripts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lead-transcripts', 'lead-transcripts', false);

-- Create RLS policies for transcript uploads
CREATE POLICY "Users can view their own transcripts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'lead-transcripts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own transcripts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'lead-transcripts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own transcripts" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'lead-transcripts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own transcripts" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'lead-transcripts' AND auth.uid()::text = (storage.foldername(name))[1]);