-- Update tasks table to store datetime instead of just date
ALTER TABLE tasks ALTER COLUMN due_date TYPE timestamp with time zone USING due_date::timestamp with time zone;