
-- Player session logs (join/leave)
CREATE TABLE public.player_session_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  roblox_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('join', 'leave')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.player_session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can view session logs"
  ON public.player_session_logs FOR SELECT
  USING (has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert session logs"
  ON public.player_session_logs FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_session_logs_roblox_id ON public.player_session_logs (roblox_id);
CREATE INDEX idx_session_logs_player_id ON public.player_session_logs (player_id);

-- Player chat logs
CREATE TABLE public.player_chat_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  roblox_id text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.player_chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can view chat logs"
  ON public.player_chat_logs FOR SELECT
  USING (has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert chat logs"
  ON public.player_chat_logs FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_chat_logs_roblox_id ON public.player_chat_logs (roblox_id);
CREATE INDEX idx_chat_logs_player_id ON public.player_chat_logs (player_id);

-- Player kill logs
CREATE TABLE public.player_kill_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  killer_roblox_id text NOT NULL,
  victim_roblox_id text NOT NULL,
  killer_username text,
  victim_username text,
  weapon text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.player_kill_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can view kill logs"
  ON public.player_kill_logs FOR SELECT
  USING (has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert kill logs"
  ON public.player_kill_logs FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_kill_logs_killer ON public.player_kill_logs (killer_roblox_id);
CREATE INDEX idx_kill_logs_victim ON public.player_kill_logs (victim_roblox_id);
