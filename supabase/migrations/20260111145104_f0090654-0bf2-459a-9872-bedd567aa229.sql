-- Drop old columns and add new ones for game data
ALTER TABLE public.players 
DROP COLUMN IF EXISTS coins,
DROP COLUMN IF EXISTS level,
DROP COLUMN IF EXISTS gems;

-- Add new columns matching the actual game data
ALTER TABLE public.players
ADD COLUMN money integer DEFAULT 0,
ADD COLUMN xp integer DEFAULT 0,
ADD COLUMN dev_products jsonb DEFAULT '[]'::jsonb,
ADD COLUMN gamepasses jsonb DEFAULT '[]'::jsonb;