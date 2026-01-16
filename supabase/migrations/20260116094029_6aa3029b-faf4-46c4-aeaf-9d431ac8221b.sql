-- Change playtime_hours from integer to numeric to support fractional hours
ALTER TABLE public.players 
ALTER COLUMN playtime_hours TYPE numeric USING playtime_hours::numeric;