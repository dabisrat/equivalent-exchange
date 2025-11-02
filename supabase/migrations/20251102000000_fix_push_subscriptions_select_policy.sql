-- Add policy to allow organization admins/owners to read all subscriptions
-- in their organization for sending push notifications

CREATE POLICY "organization_admins_can_select_subscriptions" ON public.push_subscriptions
FOR SELECT TO authenticated
USING (
  (SELECT auth.uid()) IS NOT NULL 
  AND 
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id = push_subscriptions.organization_id
      AND om.is_active = true
      AND om.role IN ('owner', 'admin')
  )
);