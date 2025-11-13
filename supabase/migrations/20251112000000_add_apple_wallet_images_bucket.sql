-- Migration: Add apple wallet images storage bucket for Apple Wallet caching
-- This migration sets up storage bucket and policies for cached Apple Wallet pass images

-- 1. Create storage bucket for apple wallet images if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'apple-wallet-images',
  'apple-wallet-images',
  false, -- Not public, only accessible via authenticated users and service role
  1048576, -- 1MB limit (processed images are small)
  ARRAY['image/png', 'application/json'] -- PNG for images, JSON for metadata
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage.objects RLS is enabled by default in Supabase

-- 3. Create policy for service role and authenticated users to manage apple wallet images
-- Service role has full access, authenticated users can read cached images
CREATE POLICY "Service role can manage apple wallet images" ON storage.objects
FOR ALL USING (
  bucket_id = 'apple-wallet-images'
  AND auth.role() = 'service_role'
);

-- 4. Create policy for authenticated users to view apple wallet images
CREATE POLICY "Authenticated users can view apple wallet images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'apple-wallet-images'
  AND auth.role() = 'authenticated'
);