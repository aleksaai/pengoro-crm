-- Clean up existing tasks for leads in "Lost" winback status
-- This is a one-time cleanup for the new rule

DO $$
DECLARE
    lead_rec RECORD;
    abandon_reason TEXT;
BEGIN
    -- Loop through all abandoned/lost leads
    FOR lead_rec IN 
        SELECT DISTINCT l.id, l.name, l.status
        FROM leads l
        WHERE l.status IN ('Abandoned', 'Lost')
    LOOP
        -- Get the latest abandon reason for this lead
        SELECT lh.details INTO abandon_reason
        FROM lead_history lh
        WHERE lh.lead_id = lead_rec.id
        AND lh.action IN ('Lead Abandoned', 'Abandon Reason Updated')
        ORDER BY lh.created_at DESC
        LIMIT 1;
        
        -- Extract the reason from the details
        IF abandon_reason IS NOT NULL THEN
            IF abandon_reason LIKE '%Reason: %' THEN
                abandon_reason := SPLIT_PART(abandon_reason, 'Reason: ', 2);
            ELSIF abandon_reason LIKE '%Reason changed to: %' THEN
                abandon_reason := SPLIT_PART(abandon_reason, 'Reason changed to: ', 2);
            END IF;
            
            -- If the reason is NOT "Never reached" or "Future Call", delete all tasks
            IF abandon_reason IS NOT NULL AND abandon_reason NOT IN ('Never reached', 'Future Call') THEN
                -- Delete all tasks for this lead
                DELETE FROM tasks WHERE lead_id = lead_rec.id;
                
                -- Log the cleanup
                INSERT INTO lead_history (
                    lead_id,
                    action,
                    details,
                    created_by,
                    user_name
                ) VALUES (
                    lead_rec.id,
                    'Tasks Cleaned Up',
                    'All existing tasks deleted - Lead in Lost winback status (' || abandon_reason || ')',
                    (SELECT id FROM auth.users LIMIT 1), -- Use any system user
                    'System Cleanup'
                );
                
                RAISE NOTICE 'Cleaned up tasks for lead: % (reason: %)', lead_rec.name, abandon_reason;
            END IF;
        END IF;
    END LOOP;
END $$;