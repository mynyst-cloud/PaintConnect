-- =============================================
-- Create project-uploads Storage Bucket
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-uploads',
  'project-uploads',
  true,
  52428800, -- 50MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];

-- 2. Enable public read access (anyone can view uploaded photos)
DROP POLICY IF EXISTS "Public read access for project uploads" ON storage.objects;
CREATE POLICY "Public read access for project uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-uploads');

-- 3. Allow authenticated users to upload files
DROP POLICY IF EXISTS "Authenticated users can upload project photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload project photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-uploads');

-- 4. Allow users to update their own uploads
DROP POLICY IF EXISTS "Users can update their own uploads" ON storage.objects;
CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'project-uploads')
WITH CHECK (bucket_id = 'project-uploads');

-- 5. Allow users to delete their own uploads (optional)
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;
CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-uploads');

-- Verify bucket creation
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'project-uploads';

