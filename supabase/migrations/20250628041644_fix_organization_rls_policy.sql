-- Drop the restrictive policy that only allows users to read their own organization
DROP POLICY IF EXISTS "Users can read own organization" ON public.organization;

-- Create a policy that allows all authenticated users to read organizations (restoring original policy)
CREATE POLICY "Enable read access for all users" ON "public"."organization" FOR SELECT TO "authenticated" USING (true);
