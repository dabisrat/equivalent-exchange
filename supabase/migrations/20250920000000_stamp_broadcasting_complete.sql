-- Migration: Complete stamp broadcasting setup
-- This sets up realtime broadcasting for stamps with card-level grouping

-- 1. RLS policy for authenticated users to receive broadcasts
DROP POLICY IF EXISTS "authenticated_can_receive_broadcasts" ON "realtime"."messages";

CREATE POLICY "authenticated_can_receive_broadcasts"
ON "realtime"."messages"
FOR SELECT
TO authenticated
USING (true);

-- 2. Enable realtime on the stamp table
ALTER TABLE public.stamp REPLICA IDENTITY FULL;

-- Add table to publication only if not already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'stamp' 
        AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.stamp;
    END IF;
END $$;

-- 3. Custom trigger function for stamps that broadcasts to card-specific topics
CREATE OR REPLACE FUNCTION public.broadcast_stamp_changes()
RETURNS trigger
SECURITY DEFINER 
SET search_path = ''
AS $$
DECLARE
    card_id text;
BEGIN
    -- Extract card ID from the record
    IF TG_OP = 'DELETE' THEN
        card_id := OLD.reward_card_id::text;
    ELSE
        card_id := NEW.reward_card_id::text;
    END IF;
    
    -- Card-specific broadcast using table name (card:card_id:stamp)
    PERFORM realtime.broadcast_changes(
        'card:' || card_id || ':stamp',   -- topic
        TG_OP,                            -- event  
        TG_OP,                            -- operation
        TG_TABLE_NAME,                    -- table
        TG_TABLE_SCHEMA,                  -- schema
        NEW,                              -- new record
        OLD                               -- old record
    );
    
    RETURN COALESCE(NEW, OLD);
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log any errors but don't fail the original operation
        RAISE WARNING 'Broadcast failed: %', SQLERRM;
        RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. Create the stamp trigger
DROP TRIGGER IF EXISTS broadcast_stamp_changes_trigger ON public.stamp;

CREATE TRIGGER broadcast_stamp_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE 
    ON public.stamp
    FOR EACH ROW
    EXECUTE FUNCTION public.broadcast_stamp_changes();