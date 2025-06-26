-- Drop existing policy that allows all authenticated users to read all organizations
DROP POLICY IF EXISTS "Enable read access for all users" ON public.organization;

-- Enable Row Level Security on organization table
ALTER TABLE public.organization ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read organizations where they are the email owner
CREATE POLICY "Users can read own organization" ON public.organization
    FOR SELECT 
    USING (auth.jwt() ->> 'email' = email);

-- Policy: Users can only insert organizations with their own email
CREATE POLICY "Users can create own organization" ON public.organization
    FOR INSERT 
    WITH CHECK (auth.jwt() ->> 'email' = email);

-- Policy: Users can only update their own organization
CREATE POLICY "Users can update own organization" ON public.organization
    FOR UPDATE 
    USING (auth.jwt() ->> 'email' = email)
    WITH CHECK (auth.jwt() ->> 'email' = email);

-- Policy: Prevent organization deletion (security measure)
CREATE POLICY "Prevent organization deletion" ON public.organization
    FOR DELETE 
    USING (false);
