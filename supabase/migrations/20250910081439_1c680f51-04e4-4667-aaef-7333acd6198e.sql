-- Robust cleanup for test leads 26 and 27 (case/whitespace tolerant)
WITH target_leads AS (
  SELECT id FROM leads
  WHERE lower(trim(name)) IN ('test 26','test 27')
     OR lower(name) LIKE 'test 26%'
     OR lower(name) LIKE 'test 27%'
)
-- Delete child rows first to avoid FK issues (if any exist later)
DELETE FROM tasks WHERE lead_id IN (SELECT id FROM target_leads);
DELETE FROM lead_history WHERE lead_id IN (SELECT id FROM target_leads);
DELETE FROM lead_notes WHERE lead_id IN (SELECT id FROM target_leads);
DELETE FROM lead_transcripts WHERE lead_id IN (SELECT id FROM target_leads);
-- Finally delete leads
DELETE FROM leads WHERE id IN (SELECT id FROM target_leads);