-- Update organization RLS policies to implement proper access control
-- Date: 2025-07-22

BEGIN;

-- Drop existing policies to recreate them with proper restrictions
DROP POLICY IF EXISTS "Enable read access for all users" ON public.organization;
DROP POLICY IF EXISTS "Public subdomain access" ON public.organization;
DROP POLICY IF EXISTS "Organization owners full access" ON public.organization;
DROP POLICY IF EXISTS "Authenticated users can read organizations" ON public.organization;
DROP POLICY IF EXISTS "Users can create own organization" ON public.organization;
DROP POLICY IF EXISTS "Users can update own organization" ON public.organization;
DROP POLICY IF EXISTS "Prevent organization deletion" ON public.organization;

-- Policy 1: Allow authenticated users to read organizations they belong to
CREATE POLICY "authenticated_users_read_organizations" ON public.organization
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT organization_id
            FROM organization_members om
            WHERE om.user_id = auth.uid()
            AND om.is_active = true
        )
    );

-- Policy 3: Restrict organization creation to system level only
CREATE POLICY "system_only_can_insert_organizations" ON public.organization
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Only allow system/service role to create organizations
        -- App will handle organization creation with proper member assignment
        false
    );

-- Policy 4: Only owners and admins can update organizations
CREATE POLICY "owners_admins_can_update_organizations" ON public.organization
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organization.id
            AND om.user_id = auth.uid()
            AND om.is_active = true
            AND om.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organization.id
            AND om.user_id = auth.uid()
            AND om.is_active = true
            AND om.role IN ('owner', 'admin')
        )
    );

-- Policy 5: Keep delete prevention as requested
CREATE POLICY "prevent_organization_deletion" ON public.organization
    FOR DELETE 
    USING (false);

COMMIT;
