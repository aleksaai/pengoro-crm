import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  assigned_to?: string;
  interested_products?: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  age?: number;
  net_salary?: number;
  gross_salary?: number;
  id_document_path?: string;
  id_document_back_path?: string;
  is_frozen?: boolean;
  task_priority?: number;
  earliest_due_time?: string;
  related_customer_id?: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  content: string;
  created_at: string;
  created_by?: string;
  author_name?: string;
}

export interface LeadHistoryEntry {
  id: string;
  lead_id: string;
  action: string;
  details: string;
  created_at: string;
  created_by?: string;
  user_name?: string;
  changed_fields?: Record<string, any> | null;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
}

export interface LeadTranscript {
  id: string;
  lead_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  created_at: string;
  created_by?: string;
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLeads = async () => {
    try {
      setLoading(true);
      console.log('Fetching leads using database function for task-based sorting...');
      
      // Use the new database function that returns leads sorted by task urgency
      const { data, error } = await supabase
        .rpc('get_leads_sorted_by_task_urgency');

      if (error) {
        console.error('Error fetching sorted leads:', error);
        throw error;
      }

      console.log(`Fetched ${data?.length || 0} leads with task-based sorting from database`);
      setLeads(data || []);
    } catch (error) {
      console.error('Error in fetchLeads:', error);
      toast({
        title: "Error loading leads",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userData.user?.id)
        .single();

      const { data, error } = await supabase
        .from('leads')
        .insert([{
          ...leadData,
          created_by: userData.user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Add creation history entry
      await supabase.from('lead_history').insert([{
        lead_id: data.id,
        action: 'Lead created',
        details: 'Lead was created in the system',
        created_by: userData.user?.id,
        user_name: profile?.full_name || userData.user?.email || 'Unknown User'
      }]);

      setLeads(prev => {
        const exists = prev.some(l => l.id === data.id);
        return exists ? prev.map(l => (l.id === data.id ? data : l)) : [data, ...prev];
      });
      
      toast({
        title: "Lead created",
        description: `${data.name} has been added successfully.`,
      });

      return data;
    } catch (error) {
      console.error('Error creating lead:', error);
      toast({
        title: "Error creating lead",
        description: "Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const userData = await supabase.auth.getUser();
      if (!userData.data.user) throw new Error('Not authenticated');

      // Get current lead data before updating
      const { data: currentLead, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (fetchError) throw fetchError;

      // Get user profile for history entry
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', userData.data.user.id)
        .single();

      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;

      // Track which fields changed
      const changedFields: Record<string, any> = {};
      const oldValues: Record<string, any> = {};
      const newValues: Record<string, any> = {};

      Object.keys(updates).forEach(key => {
        const oldValue = currentLead[key as keyof Lead];
        const newValue = updates[key as keyof Lead];
        
        // Compare values (handle arrays specially)
        let isChanged = false;
        if (Array.isArray(oldValue) && Array.isArray(newValue)) {
          isChanged = JSON.stringify(oldValue.sort()) !== JSON.stringify(newValue.sort());
        } else {
          isChanged = oldValue !== newValue;
        }

        if (isChanged) {
          changedFields[key] = true;
          oldValues[key] = oldValue;
          newValues[key] = newValue;
        }
      });

      // Create detailed description based on changed fields
      let detailedDescription = "Lead information was modified";
      if (Object.keys(changedFields).length > 0) {
        const fieldNames = Object.keys(changedFields).map(field => {
          const fieldMap: Record<string, string> = {
            name: "name",
            email: "email",
            phone: "phone number",
            assigned_to: "assigned agent",
            status: "status",
            interested_products: "interested products",
            source: "lead source",
            age: "age",
            net_salary: "net salary",
            gross_salary: "gross salary",
            id_document_path: "ID document (front)",
            id_document_back_path: "ID document (back)",
          };
          return fieldMap[field] || field;
        });
        
        if (fieldNames.length === 1) {
          detailedDescription = `Updated ${fieldNames[0]}`;
        } else if (fieldNames.length === 2) {
          detailedDescription = `Updated ${fieldNames[0]} and ${fieldNames[1]}`;
        } else {
          detailedDescription = `Updated ${fieldNames.length} fields: ${fieldNames.slice(0, 3).join(", ")}${fieldNames.length > 3 ? "..." : ""}`;
        }
      }

      // Add update history entry with detailed change tracking
      await supabase.from('lead_history').insert([{
        lead_id: leadId,
        action: 'Lead updated',
        details: detailedDescription,
        created_by: userData.data.user?.id,
        user_name: profile?.full_name || userData.data.user?.email || 'Unknown User',
        changed_fields: Object.keys(changedFields).length > 0 ? changedFields : null,
        old_values: Object.keys(oldValues).length > 0 ? oldValues : null,
        new_values: Object.keys(newValues).length > 0 ? newValues : null,
      }]);

      setLeads(prev => prev.map(lead => lead.id === leadId ? data : lead));
      
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Realtime sync for leads across pages (auto-updates counts on convert/move)
  useEffect(() => {
    const channel = supabase
      .channel('realtime-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        try {
          const newRow: any = (payload as any).new;
          const oldRow: any = (payload as any).old;
          switch (payload.eventType) {
            case 'INSERT':
              setLeads(prev => {
                const exists = prev.some(l => l.id === newRow.id);
                return exists ? prev.map(l => (l.id === newRow.id ? newRow : l)) : [newRow, ...prev];
              });
              break;
            case 'UPDATE':
              setLeads(prev => prev.map(l => l.id === newRow.id ? newRow : l));
              break;
            case 'DELETE':
              setLeads(prev => prev.filter(l => l.id !== oldRow.id));
              break;
          }
        } catch (e) {
          // Fallback to full refetch if anything goes wrong
          fetchLeads();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    leads,
    loading,
    createLead,
    updateLead,
    refetchLeads: fetchLeads
  };
}

export function useLeadDetails(leadId: string | null) {
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [history, setHistory] = useState<LeadHistoryEntry[]>([]);
  const [transcripts, setTranscripts] = useState<LeadTranscript[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchLeadDetails = async () => {
    if (!leadId) return;
    
    setLoading(true);
    try {
      // First, get the lead to check for related_customer_id
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('related_customer_id')
        .eq('id', leadId)
        .single();
      
      if (leadError) throw leadError;
      
      // Build list of lead IDs to fetch data for (current lead + related customer if exists)
      const leadIds = [leadId];
      if (leadData?.related_customer_id) {
        leadIds.push(leadData.related_customer_id);
      }
      
      // Also check if this lead is a customer that has related deals (reverse relationship)
      const { data: relatedDeals } = await supabase
        .from('leads')
        .select('id')
        .eq('related_customer_id', leadId);
      
      if (relatedDeals && relatedDeals.length > 0) {
        leadIds.push(...relatedDeals.map(d => d.id));
      }
      
      // Fetch notes, history, and transcripts for all related leads
      const [notesRes, historyRes, transcriptsRes] = await Promise.all([
        supabase.from('lead_notes').select('*').in('lead_id', leadIds).order('created_at', { ascending: true }),
        supabase.from('lead_history').select('*').in('lead_id', leadIds).order('created_at', { ascending: false }),
        supabase.from('lead_transcripts').select('*').in('lead_id', leadIds).order('created_at', { ascending: false })
      ]);

      if (notesRes.error) throw notesRes.error;
      if (historyRes.error) throw historyRes.error;
      if (transcriptsRes.error) throw transcriptsRes.error;

      setNotes(notesRes.data || []);
      setHistory((historyRes.data || []).map(item => ({
        ...item,
        changed_fields: item.changed_fields as Record<string, any> | null,
        old_values: item.old_values as Record<string, any> | null,
        new_values: item.new_values as Record<string, any> | null,
      })));
      setTranscripts(transcriptsRes.data || []);
    } catch (error) {
      console.error('Error fetching lead details:', error);
      toast({
        title: "Error loading lead details",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (content: string) => {
    if (!leadId) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userData.user?.id)
        .single();

      const authorName = profile?.full_name || userData.user?.email || 'Unknown User';
      
      // Get the lead to check for related_customer_id
      const { data: leadData } = await supabase
        .from('leads')
        .select('related_customer_id')
        .eq('id', leadId)
        .single();
      
      // Use a Set to collect unique lead IDs to avoid duplicates
      const leadIdsSet = new Set<string>([leadId]);
      
      // Add related customer if exists
      if (leadData?.related_customer_id) {
        leadIdsSet.add(leadData.related_customer_id);
      }
      
      // Also check if this lead is a customer with related deals
      const { data: relatedDeals } = await supabase
        .from('leads')
        .select('id')
        .eq('related_customer_id', leadId);
      
      if (relatedDeals && relatedDeals.length > 0) {
        relatedDeals.forEach(deal => leadIdsSet.add(deal.id));
      }

      // Convert Set to Array for insertion
      const leadIds = Array.from(leadIdsSet);

      // Add note for all unique related leads
      const notesToInsert = leadIds.map(id => ({
        lead_id: id,
        content,
        created_by: userData.user?.id,
        author_name: authorName
      }));
      
      const { data, error } = await supabase
        .from('lead_notes')
        .insert(notesToInsert)
        .select();

      if (error) throw error;

      // Add history entries for all unique related leads
      const historyEntries = leadIds.map(id => ({
        lead_id: id,
        action: 'Added note',
        details: content,
        created_by: userData.user?.id,
        user_name: authorName
      }));
      
      await supabase.from('lead_history').insert(historyEntries);

      fetchLeadDetails(); // Refresh to get updated notes and history
      
      toast({
        title: "Note added",
        description: leadIds.length > 1 
          ? "Your note has been saved to all related leads." 
          : "Your note has been saved.",
      });

      return data;
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error adding note",
        description: "Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const addTranscript = async (fileName: string, filePath: string, fileSize: number) => {
    if (!leadId) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userData.user?.id)
        .single();

      const { data, error } = await supabase
        .from('lead_transcripts')
        .insert([{
          lead_id: leadId,
          file_name: fileName,
          file_path: filePath,
          file_size: fileSize,
          created_by: userData.user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Add history entry
      await supabase.from('lead_history').insert([{
        lead_id: leadId,
        action: 'Uploaded transcript',
        details: `Uploaded file: ${fileName}`,
        created_by: userData.user?.id,
        user_name: profile?.full_name || userData.user?.email || 'Unknown User'
      }]);

      setTranscripts(prev => [data, ...prev]);
      fetchLeadDetails(); // Refresh to get updated history
      
      toast({
        title: "Transcript uploaded",
        description: `${fileName} has been uploaded successfully.`,
      });

      return data;
    } catch (error) {
      console.error('Error adding transcript:', error);
      toast({
        title: "Error uploading transcript",
        description: "Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTranscript = async (transcriptId: string, fileName: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userData.user?.id)
        .single();

      const { error } = await supabase
        .from('lead_transcripts')
        .delete()
        .eq('id', transcriptId);

      if (error) throw error;

      // Add history entry
      await supabase.from('lead_history').insert([{
        lead_id: leadId!,
        action: 'Deleted transcript',
        details: `Deleted file: ${fileName}`,
        created_by: userData.user?.id,
        user_name: profile?.full_name || userData.user?.email || 'Unknown User'
      }]);

      setTranscripts(prev => prev.filter(t => t.id !== transcriptId));
      fetchLeadDetails(); // Refresh to get updated history
      
      toast({
        title: "Transcript deleted",
        description: `${fileName} has been deleted.`,
      });
    } catch (error) {
      console.error('Error deleting transcript:', error);
      toast({
        title: "Error deleting transcript",
        description: "Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchLeadDetails();
    } else {
      setNotes([]);
      setHistory([]);
      setTranscripts([]);
    }
  }, [leadId]);

  return {
    notes,
    history,
    transcripts,
    loading,
    addNote,
    addTranscript,
    deleteTranscript,
    refetchDetails: fetchLeadDetails
  };
}