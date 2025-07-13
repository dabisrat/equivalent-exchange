BEGIN;

-- Drop the old policy that allows all authenticated users to read
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON "public"."organization_members";

-- Policy: Users can read members of organizations they belong to
CREATE POLICY "read_organization_members" ON "public"."organization_members"
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Policy: Only owners can insert new members
CREATE POLICY "owners_can_insert_members" ON "public"."organization_members"
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.is_active = true
    AND om.role = 'owner'
  )
);

-- Policy: Only owners can update members
CREATE POLICY "owners_can_update_members" ON "public"."organization_members"
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.is_active = true
    AND om.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.is_active = true
    AND om.role = 'owner'
  )
);

COMMIT;
