-- Create table for group bans
CREATE TABLE public.group_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL UNIQUE,
  group_name text,
  reason text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE public.group_bans ENABLE ROW LEVEL SECURITY;

-- Only admins can manage group bans
CREATE POLICY "Admins can view all group bans"
ON public.group_bans
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create group bans"
ON public.group_bans
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update group bans"
ON public.group_bans
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete group bans"
ON public.group_bans
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));