DROP POLICY IF EXISTS "organization_admins_can_delete_subscriptions" ON public.push_subscriptions;

CREATE POLICY "organization_admins_can_delete_subscriptions" ON public.push_subscriptions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = public.push_subscriptions.organization_id
        AND om.user_id = (SELECT auth.uid())
        AND om.is_active = TRUE
        AND om.role IN ('owner', 'admin')
    )
  );