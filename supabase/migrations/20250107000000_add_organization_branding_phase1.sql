-- Phase 1: Add core branding columns to organization table
-- Adding subdomain support and basic branding features

-- Add new columns for organization branding
ALTER TABLE public.organization 
ADD COLUMN subdomain varchar(50),
ADD COLUMN primary_color varchar(7) DEFAULT '#3b82f6',
ADD COLUMN secondary_color varchar(7) DEFAULT '#64748b', 
ADD COLUMN logo_url text,
ADD COLUMN is_active boolean DEFAULT true;

-- Add constraints for data validation
ALTER TABLE public.organization 
ADD CONSTRAINT organization_subdomain_format 
  CHECK (subdomain IS NULL OR (
    subdomain ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' 
    AND length(subdomain) >= 3 
    AND length(subdomain) <= 50
    AND subdomain NOT IN ('www', 'api', 'admin', 'dashboard', 'app', 'mail', 'ftp', 'blog', 'dev', 'test', 'staging', 'prod', 'production')
  ));

ALTER TABLE public.organization 
ADD CONSTRAINT organization_primary_color_format 
  CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$');

ALTER TABLE public.organization 
ADD CONSTRAINT organization_secondary_color_format 
  CHECK (secondary_color ~ '^#[0-9A-Fa-f]{6}$');

ALTER TABLE public.organization 
ADD CONSTRAINT organization_name_length
  CHECK (length(organization_name) <= 100);

-- Add unique constraint for subdomain
ALTER TABLE public.organization 
ADD CONSTRAINT organization_subdomain_unique UNIQUE (subdomain);

-- Create indexes for performance
CREATE UNIQUE INDEX idx_organization_subdomain ON public.organization(subdomain) 
WHERE subdomain IS NOT NULL;

CREATE INDEX idx_organization_active ON public.organization(is_active) 
WHERE is_active = true;

CREATE INDEX idx_organization_email_active ON public.organization(email, is_active);

-- Update Row Level Security policies
-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Enable read access for all users" ON public.organization;
DROP POLICY IF EXISTS "Users can read own organization" ON public.organization;

-- Policy for public subdomain access (needed for equivalent-exchange app to load organization data)
CREATE POLICY "Public subdomain access" ON public.organization
    FOR SELECT 
    USING (subdomain IS NOT NULL AND is_active = true);

-- Policy for organization owners to manage their org (includes creating, reading, updating)
CREATE POLICY "Organization owners full access" ON public.organization
    FOR ALL
    USING (auth.jwt() ->> 'email' = email)
    WITH CHECK (auth.jwt() ->> 'email' = email);

-- Policy for authenticated users to read organizations (for dashboard functionality)
CREATE POLICY "Authenticated users can read organizations" ON public.organization
    FOR SELECT TO authenticated
    USING (true);
