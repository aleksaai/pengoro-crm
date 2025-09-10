-- Cleanup test leads 26 and 27 (case/whitespace tolerant)
DELETE FROM tasks WHERE lead_id IN (
  SELECT id FROM leads
  WHERE lower(trim(name)) IN ('test 26','test 27')
     OR lower(name) LIKE 'test 26%'
     OR lower(name) LIKE 'test 27%'
);

DELETE FROM lead_history WHERE lead_id IN (
  SELECT id FROM leads
  WHERE lower(trim(name)) IN ('test 26','test 27')
     OR lower(name) LIKE 'test 26%'
     OR lower(name) LIKE 'test 27%'
);

DELETE FROM lead_notes WHERE lead_id IN (
  SELECT id FROM leads
  WHERE lower(trim(name)) IN ('test 26','test 27')
     OR lower(name) LIKE 'test 26%'
     OR lower(name) LIKE 'test 27%'
);

DELETE FROM lead_transcripts WHERE lead_id IN (
  SELECT id FROM leads
  WHERE lower(trim(name)) IN ('test 26','test 27')
     OR lower(name) LIKE 'test 26%'
     OR lower(name) LIKE 'test 27%'
);

DELETE FROM leads 
WHERE lower(trim(name)) IN ('test 26','test 27')
   OR lower(name) LIKE 'test 26%'
   OR lower(name) LIKE 'test 27%';