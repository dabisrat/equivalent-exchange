BEGIN;

-- Step 1: Rename table
ALTER TABLE public.stamper RENAME TO organization_members;

-- Step 2: Add role and status columns
ALTER TABLE public.organization_members 
ADD COLUMN role varchar(20) NOT NULL DEFAULT 'member' 
  CHECK (role IN ('owner', 'admin', 'member')),
ADD COLUMN is_active boolean NOT NULL DEFAULT true,
ADD COLUMN invited_at timestamp DEFAULT now(),
ADD COLUMN invited_by uuid REFERENCES auth.users(id),
ADD COLUMN last_active_at timestamp;

-- Step 3: Update any existing records (defensive programming)
UPDATE public.organization_members 
SET invited_at = created_at
WHERE invited_at IS NULL;

-- Step 4: Add helpful indexes for performance
CREATE INDEX idx_organization_members_active 
ON public.organization_members(organization_id, is_active) 
WHERE is_active = true;

CREATE INDEX idx_organization_members_role 
ON public.organization_members(organization_id, role);

COMMIT;
