-- Create storage bucket for card images
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-images', 'card-images', true);

-- Allow authenticated users to upload their own card images
CREATE POLICY "Users can upload card images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'card-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to view their own card images
CREATE POLICY "Users can view their own card images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'card-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own card images
CREATE POLICY "Users can delete their own card images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'card-images' AND auth.uid()::text = (storage.foldername(name))[1]);