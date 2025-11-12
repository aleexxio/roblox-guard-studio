-- First, update any null user_id values with a placeholder or delete them
UPDATE public.players 
SET user_id = 'UNKNOWN_' || id::text 
WHERE user_id IS NULL;

-- Now make user_id non-nullable
ALTER TABLE public.players 
  ALTER COLUMN user_id SET NOT NULL;

-- Rename user_id to roblox_id for clarity
ALTER TABLE public.players 
  RENAME COLUMN user_id TO roblox_id;

-- Add unique constraint on roblox_id
ALTER TABLE public.players 
  ADD CONSTRAINT players_roblox_id_unique UNIQUE (roblox_id);

-- Create index for faster lookups
CREATE INDEX idx_players_roblox_id ON public.players(roblox_id);

-- Update RLS policies to allow moderators to insert players
DROP POLICY IF EXISTS "Admins can insert players" ON public.players;
DROP POLICY IF EXISTS "Admins can update players" ON public.players;

CREATE POLICY "Moderators can insert players" 
ON public.players 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Moderators can update players" 
ON public.players 
FOR UPDATE 
USING (has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));