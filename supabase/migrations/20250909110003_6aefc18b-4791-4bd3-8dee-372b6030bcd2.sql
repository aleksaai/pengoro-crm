-- Ensure leads auto-freeze/unfreeze when tasks change
-- 1) Create trigger function wrapper that calls the existing maintenance function
CREATE OR REPLACE FUNCTION public.after_task_write_refresh_lead_freeze()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.check_and_freeze_overdue_leads();
  -- Statement-level trigger, no row to return
  RETURN NULL;
END;
$$;

-- 2) Create a single statement-level trigger on tasks for insert/update/delete
DROP TRIGGER IF EXISTS trg_tasks_after_change_refresh_freeze ON public.tasks;
CREATE TRIGGER trg_tasks_after_change_refresh_freeze
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH STATEMENT
EXECUTE FUNCTION public.after_task_write_refresh_lead_freeze();

-- 3) Run an initial sync now so existing overdue leads get frozen immediately
SELECT public.check_and_freeze_overdue_leads();