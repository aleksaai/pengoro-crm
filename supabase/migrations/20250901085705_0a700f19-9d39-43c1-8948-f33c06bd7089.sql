-- Add detailed change tracking columns to lead_history table
ALTER TABLE public.lead_history 
ADD COLUMN changed_fields JSONB,
ADD COLUMN old_values JSONB,
ADD COLUMN new_values JSONB;