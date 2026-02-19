
-- Create a table to store player vehicle ownership
CREATE TABLE public.player_vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  roblox_id text NOT NULL,
  vehicle_name text NOT NULL,
  granted_by uuid NULL,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(roblox_id, vehicle_name)
);

-- Enable RLS
ALTER TABLE public.player_vehicles ENABLE ROW LEVEL SECURITY;

-- Admins can view all vehicles
CREATE POLICY "Admins can view player vehicles"
ON public.player_vehicles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert vehicles
CREATE POLICY "Admins can grant vehicles"
ON public.player_vehicles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete vehicles
CREATE POLICY "Admins can revoke vehicles"
ON public.player_vehicles FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role full access (for game-api)
CREATE POLICY "Service role manages vehicles"
ON public.player_vehicles FOR ALL
USING (true)
WITH CHECK (true);
