-- Migration: Add card background image storage support
-- This migration sets up storage bucket and policies for card background images

-- 1. Create storage bucket for card backgrounds if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'card-backgrounds',
  'card-backgrounds',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage.objects RLS is enabled by default in Supabase

-- 3. Create policy for authenticated users to upload card background images
-- Users can only upload to their organization's folder
CREATE POLICY "Users can upload card backgrounds" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'card-backgrounds'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'organizations'
  AND (storage.foldername(name))[2] IN (
    SELECT om.organization_id::text
    FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

-- 4. Create policy for authenticated users to view card background images
CREATE POLICY "Users can view card backgrounds" ON storage.objects
FOR SELECT USING (
  bucket_id = 'card-backgrounds'
  AND auth.role() = 'authenticated'
);

-- 5. Create policy for users to update their organization's card backgrounds
CREATE POLICY "Users can update card backgrounds" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'card-backgrounds'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'organizations'
  AND (storage.foldername(name))[2] IN (
    SELECT om.organization_id::text
    FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

-- 6. Create policy for users to delete their organization's card backgrounds
CREATE POLICY "Users can delete card backgrounds" ON storage.objects
FOR DELETE USING (
  bucket_id = 'card-backgrounds'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'organizations'
  AND (storage.foldername(name))[2] IN (
    SELECT om.organization_id::text
    FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);