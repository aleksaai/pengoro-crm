-- Add gross_salary column to leads table
ALTER TABLE public.leads 
ADD COLUMN gross_salary NUMERIC DEFAULT NULL;