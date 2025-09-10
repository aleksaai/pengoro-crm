import { supabase } from '@/integrations/supabase/client';

export async function deleteLeadCompletely(leadId: string) {
  try {
    // Delete in order to maintain referential integrity
    
    // 1. Delete all tasks related to this lead
    const { error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('lead_id', leadId);
    
    if (tasksError) throw tasksError;
    
    // 2. Delete all lead notes
    const { error: notesError } = await supabase
      .from('lead_notes')
      .delete()
      .eq('lead_id', leadId);
    
    if (notesError) throw notesError;
    
    // 3. Delete all lead history
    const { error: historyError } = await supabase
      .from('lead_history')
      .delete()
      .eq('lead_id', leadId);
    
    if (historyError) throw historyError;
    
    // 4. Delete all lead transcripts
    const { error: transcriptsError } = await supabase
      .from('lead_transcripts')
      .delete()
      .eq('lead_id', leadId);
    
    if (transcriptsError) throw transcriptsError;
    
    // 5. Delete any customer products (if customer_id matches lead_id)
    const { error: productsError } = await supabase
      .from('customer_products')
      .delete()
      .eq('customer_id', leadId);
    
    if (productsError) throw productsError;
    
    // 6. Finally, delete the lead itself
    const { error: leadError } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);
    
    if (leadError) throw leadError;
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting lead completely:', error);
    return { success: false, error };
  }
}