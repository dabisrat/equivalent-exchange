BEGIN;

-- Drop old stamp policies
DROP POLICY IF EXISTS "allow authorized users to add to the stamp table" ON "public"."stamp";
DROP POLICY IF EXISTS "update stamps table for authenticated and authorized user" ON "public"."stamp";

-- Create new role-based policies for INSERT
CREATE POLICY "organization_members_can_insert_stamps" ON "public"."stamp" 
AS PERMISSIVE FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_members om
    JOIN reward_card rc ON rc.organization_id = om.organization_id
    WHERE om.user_id = auth.uid()
    AND om.is_active = true
    AND om.role IN ('owner', 'admin', 'member')
    AND rc.id = stamp.reward_card_id
  )
);

-- Create new role-based policies for UPDATE
CREATE POLICY "organization_members_can_update_stamps" ON "public"."stamp"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members om
    JOIN reward_card rc ON rc.organization_id = om.organization_id
    WHERE om.user_id = auth.uid()
    AND om.is_active = true
    AND om.role IN ('owner', 'admin', 'member')
    AND rc.id = stamp.reward_card_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_members om
    JOIN reward_card rc ON rc.organization_id = om.organization_id
    WHERE om.user_id = auth.uid()
    AND om.is_active = true
    AND om.role IN ('owner', 'admin', 'member')
    AND rc.id = stamp.reward_card_id
  )
);

COMMIT;
