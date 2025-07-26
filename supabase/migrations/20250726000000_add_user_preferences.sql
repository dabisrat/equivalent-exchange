-- Add active_organization_id to user profiles or create a user_preferences table
-- Option 1: Add to user metadata (simpler)
-- This can be stored in auth.users.user_metadata

-- Option 2: Create a dedicated table (more robust)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  active_organization_id UUID REFERENCES organization(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- RLS policies for user preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences" ON user_preferences
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own preferences" ON user_preferences
FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences" ON user_preferences
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
