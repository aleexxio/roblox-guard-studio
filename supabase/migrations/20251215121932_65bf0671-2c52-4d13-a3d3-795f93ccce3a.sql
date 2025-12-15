-- Add appealable_at column to bans table (14 days after ban by default)
ALTER TABLE public.bans 
ADD COLUMN appealable_at TIMESTAMP WITH TIME ZONE;