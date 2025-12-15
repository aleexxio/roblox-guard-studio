-- Create ban_appeals table for managing player appeals
CREATE TABLE public.ban_appeals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ban_id UUID NOT NULL REFERENCES public.bans(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  roblox_id TEXT NOT NULL,
  username TEXT NOT NULL,
  question1 TEXT NOT NULL, -- What were you banned for?
  question2 TEXT NOT NULL, -- What would you do differently next time?
  question3 TEXT NOT NULL, -- What have you learned from this experience?
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, denied
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ban_appeals ENABLE ROW LEVEL SECURITY;

-- Moderators and admins can view all appeals
CREATE POLICY "Moderators can view all appeals"
ON public.ban_appeals
FOR SELECT
USING (has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can update appeals (approve/deny)
CREATE POLICY "Admins can update appeals"
ON public.ban_appeals
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public insert for game API (service role will handle this)
CREATE POLICY "Service role can insert appeals"
ON public.ban_appeals
FOR INSERT
WITH CHECK (true);