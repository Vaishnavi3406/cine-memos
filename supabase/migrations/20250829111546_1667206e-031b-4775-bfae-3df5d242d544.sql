-- Create storage bucket for transcripts
INSERT INTO storage.buckets (id, name, public) VALUES ('transcripts', 'transcripts', false);

-- Create storage policies for transcript uploads
CREATE POLICY "Users can upload their own transcripts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'transcripts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own transcripts" ON storage.objects
  FOR SELECT USING (bucket_id = 'transcripts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Service role can access all transcripts" ON storage.objects
  FOR ALL USING (bucket_id = 'transcripts');