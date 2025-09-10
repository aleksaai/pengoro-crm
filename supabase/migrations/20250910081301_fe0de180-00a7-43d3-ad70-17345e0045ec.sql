-- Delete tasks associated with test leads
DELETE FROM tasks 
WHERE lead_id IN (
  SELECT id FROM leads 
  WHERE name IN ('Test 24', 'Test 26', 'Test 27')
);

-- Delete lead history for test leads
DELETE FROM lead_history 
WHERE lead_id IN (
  SELECT id FROM leads 
  WHERE name IN ('Test 24', 'Test 26', 'Test 27')
);

-- Delete lead notes for test leads
DELETE FROM lead_notes 
WHERE lead_id IN (
  SELECT id FROM leads 
  WHERE name IN ('Test 24', 'Test 26', 'Test 27')
);

-- Delete lead transcripts for test leads
DELETE FROM lead_transcripts 
WHERE lead_id IN (
  SELECT id FROM leads 
  WHERE name IN ('Test 24', 'Test 26', 'Test 27')
);

-- Finally delete the test leads themselves
DELETE FROM leads 
WHERE name IN ('Test 24', 'Test 26', 'Test 27');