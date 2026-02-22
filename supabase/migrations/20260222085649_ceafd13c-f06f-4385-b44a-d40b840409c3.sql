
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS police_xp integer DEFAULT 0;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS sheriff_xp integer DEFAULT 0;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS state_police_xp integer DEFAULT 0;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS dot_xp integer DEFAULT 0;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS fire_xp integer DEFAULT 0;
