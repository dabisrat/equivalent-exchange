-- Ensure one Apple Wallet pass per card per user
-- This prevents duplicate pass generation for the same card

-- Add unique constraint to prevent duplicates
ALTER TABLE public.apple_wallet_passes
  ADD CONSTRAINT unique_user_card 
  UNIQUE (user_id, card_id);

-- Update comment to reflect this constraint
COMMENT ON TABLE public.apple_wallet_passes IS 
  'Tracks Apple Wallet pass registrations. Each user can have ONE pass per card. Multiple devices can register the same pass.';
