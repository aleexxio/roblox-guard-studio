
CREATE TABLE public.vehicle_registry (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  vehicle_name text NOT NULL,
  asset text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  restricted boolean NOT NULL DEFAULT false,
  for_sale boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  allowed_user_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_registry ENABLE ROW LEVEL SECURITY;

-- Authenticated moderators/admins can view the registry
CREATE POLICY "Moderators can view vehicle registry"
  ON public.vehicle_registry FOR SELECT
  USING (has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Service role manages everything (game server writes via API key using service role)
CREATE POLICY "Service role manages vehicle registry"
  ON public.vehicle_registry FOR ALL
  USING (true)
  WITH CHECK (true);
