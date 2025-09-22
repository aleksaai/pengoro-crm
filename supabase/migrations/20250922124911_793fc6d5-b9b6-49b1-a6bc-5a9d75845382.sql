-- Create a function to get leads sorted by task urgency within each stage
CREATE OR REPLACE FUNCTION public.get_leads_sorted_by_task_urgency()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  name text,
  email text,
  phone text,
  source text,
  status text,
  assigned_to text,
  interested_products text[],
  created_by uuid,
  age integer,
  net_salary numeric,
  gross_salary numeric,
  is_frozen boolean,
  id_document_path text,
  id_document_back_path text,
  task_priority integer,
  earliest_due_time timestamptz
)
LANGUAGE sql
STABLE
AS $$
  WITH lead_task_priorities AS (
    SELECT 
      l.id as lead_id,
      l.*,
      CASE 
        -- No pending tasks
        WHEN COUNT(CASE WHEN t.done = false THEN 1 END) = 0 THEN 999
        -- Has pending tasks
        ELSE
          CASE 
            -- Overdue by actual time (not just day)
            WHEN MIN(CASE WHEN t.done = false THEN t.due_date END) < NOW() THEN 1
            -- Due today (same day as current date)
            WHEN DATE(MIN(CASE WHEN t.done = false THEN t.due_date END)) = CURRENT_DATE THEN 2
            -- Due tomorrow
            WHEN DATE(MIN(CASE WHEN t.done = false THEN t.due_date END)) = CURRENT_DATE + INTERVAL '1 day' THEN 3
            -- Due within 7 days
            WHEN DATE(MIN(CASE WHEN t.done = false THEN t.due_date END)) <= CURRENT_DATE + INTERVAL '7 days' THEN 4
            -- Due in future (more than 7 days)
            ELSE 5
          END
      END as task_priority,
      -- Get the earliest pending task due time for secondary sorting
      MIN(CASE WHEN t.done = false THEN t.due_date END) as earliest_due_time
    FROM public.leads l
    LEFT JOIN public.tasks t ON l.id = t.lead_id
    GROUP BY l.id, l.created_at, l.updated_at, l.name, l.email, l.phone, l.source, l.status, 
             l.assigned_to, l.interested_products, l.created_by, l.age, l.net_salary, 
             l.gross_salary, l.is_frozen, l.id_document_path, l.id_document_back_path
  )
  SELECT 
    ltp.id,
    ltp.created_at,
    ltp.updated_at,
    ltp.name,
    ltp.email,
    ltp.phone,
    ltp.source,
    ltp.status,
    ltp.assigned_to,
    ltp.interested_products,
    ltp.created_by,
    ltp.age,
    ltp.net_salary,
    ltp.gross_salary,
    ltp.is_frozen,
    ltp.id_document_path,
    ltp.id_document_back_path,
    ltp.task_priority,
    ltp.earliest_due_time
  FROM lead_task_priorities ltp
  ORDER BY 
    ltp.status,  -- Group by status first
    ltp.task_priority ASC,  -- Then by task priority (lower = more urgent)
    ltp.earliest_due_time ASC NULLS LAST,  -- Then by due time (earlier first)
    ltp.name ASC;  -- Finally by name for consistent ordering
$$;