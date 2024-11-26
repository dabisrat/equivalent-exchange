ALTER TABLE
    public.stamp
ADD
    COLUMN new_stamper_id UUID;

-- Step 2: Populate the new column with valid uuid values
-- You will need to define how to generate or assign these UUIDs
-- For example, if you have a mapping or can generate new UUIDs:
UPDATE
    public.stamp
SET
    new_stamper_id = gen_random_uuid ();

-- or another method to assign UUIDs
-- Step 3: Drop the old bigint column
ALTER TABLE
    public.stamp DROP COLUMN stamper_id;

-- Step 4: Rename the new column to stamper_id
ALTER TABLE
    public.stamp RENAME COLUMN new_stamper_id TO stamper_id;