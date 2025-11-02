-- Create table for tracking Apple Wallet pass registrations
-- This table stores device registrations for push notification updates

CREATE TABLE IF NOT EXISTS public.apple_wallet_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.reward_card(id) ON DELETE CASCADE,
  serial_number text UNIQUE NOT NULL,
  authentication_token text NOT NULL,
  device_library_identifier text,
  push_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure a card can only be registered once per device
  UNIQUE(card_id, device_library_identifier)
);

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_apple_wallet_passes_user_id 
  ON public.apple_wallet_passes(user_id);

CREATE INDEX IF NOT EXISTS idx_apple_wallet_passes_card_id 
  ON public.apple_wallet_passes(card_id);

CREATE INDEX IF NOT EXISTS idx_apple_wallet_passes_serial_number 
  ON public.apple_wallet_passes(serial_number);

CREATE INDEX IF NOT EXISTS idx_apple_wallet_passes_device_id 
  ON public.apple_wallet_passes(device_library_identifier) 
  WHERE device_library_identifier IS NOT NULL;

-- Enable RLS
ALTER TABLE public.apple_wallet_passes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see and manage their own passes

CREATE POLICY "Users can view their own Apple Wallet passes"
  ON public.apple_wallet_passes
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own Apple Wallet passes"
  ON public.apple_wallet_passes
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own Apple Wallet passes"
  ON public.apple_wallet_passes
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own Apple Wallet passes"
  ON public.apple_wallet_passes
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Add comment for documentation
COMMENT ON TABLE public.apple_wallet_passes IS 
  'Tracks Apple Wallet pass registrations and device associations for push notification updates';
