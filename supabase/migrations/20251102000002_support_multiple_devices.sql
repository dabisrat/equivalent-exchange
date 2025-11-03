-- Support multiple devices registered to the same pass
-- Change constraint to allow multiple rows per pass (one per device)

-- Drop the unique_user_card constraint that only allows one registration per card
ALTER TABLE public.apple_wallet_passes
  DROP CONSTRAINT IF EXISTS unique_user_card;

-- Add new constraint: allows multiple devices to register the same pass
-- Each combination of user_id + card_id + device_library_identifier must be unique
-- This allows iPhone, iPad, Mac, etc. to all register the same pass
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_card_device 
  ON public.apple_wallet_passes (user_id, card_id, device_library_identifier)
  WHERE device_library_identifier IS NOT NULL;

-- Update comment to reflect the new behavior
COMMENT ON TABLE public.apple_wallet_passes IS 
  'Tracks Apple Wallet passes and device registrations. Each user has ONE pass per card (same serial_number), but that pass can be registered on multiple devices (one row per device).';
