-- Create players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  user_id TEXT,
  level INTEGER DEFAULT 1,
  coins INTEGER DEFAULT 0,
  gems INTEGER DEFAULT 0,
  playtime_hours INTEGER DEFAULT 0,
  join_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bans table
CREATE TABLE public.bans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  duration TEXT NOT NULL,
  banned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create warnings table
CREATE TABLE public.warnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  reward TEXT NOT NULL,
  uses INTEGER DEFAULT 0,
  max_uses INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for players table
CREATE POLICY "Moderators can view all players" ON public.players
FOR SELECT USING (
  public.has_role(auth.uid(), 'moderator') OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update players" ON public.players
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert players" ON public.players
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for bans table
CREATE POLICY "Moderators can view all bans" ON public.bans
FOR SELECT USING (
  public.has_role(auth.uid(), 'moderator') OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Moderators can create bans" ON public.bans
FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'moderator') OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update bans" ON public.bans
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for warnings table
CREATE POLICY "Moderators can view all warnings" ON public.warnings
FOR SELECT USING (
  public.has_role(auth.uid(), 'moderator') OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Moderators can create warnings" ON public.warnings
FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'moderator') OR 
  public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for promo_codes table
CREATE POLICY "Admins can view all promo codes" ON public.promo_codes
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create promo codes" ON public.promo_codes
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update promo codes" ON public.promo_codes
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete promo codes" ON public.promo_codes
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_players_updated_at
BEFORE UPDATE ON public.players
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically deactivate expired bans
CREATE OR REPLACE FUNCTION public.deactivate_expired_bans()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.bans
  SET is_active = false
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at < now();
END;
$$;