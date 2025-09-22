import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/hooks/useTasks';

export function useLeadTasks(leadId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (leadId) {
      fetchLeadTasks();
    }
  }, [leadId]);

  // Realtime updates for this lead's tasks and lead status - debounced to prevent excessive calls
  useEffect(() => {
    if (!leadId) return;

    let timeoutId: NodeJS.Timeout;
    
    const debouncedFetchTasks = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fetchLeadTasks();
      }, 100); // 100ms debounce
    };

    const taskChannel = supabase
      .channel(`tasks-lead-${leadId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `lead_id=eq.${leadId}`,
      }, (payload) => {
        console.log("Real-time task update received:", payload);
        debouncedFetchTasks();
      })
      .subscribe();

    const leadChannel = supabase
      .channel(`lead-status-${leadId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'leads',
        filter: `id=eq.${leadId}`,
      }, (payload) => {
        console.log("Real-time lead update received:", payload);
        debouncedFetchTasks();
      })
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(leadChannel);
    };
  }, [leadId]);

  const fetchLeadTasks = async () => {
    console.log("fetchLeadTasks called for leadId:", leadId);
    try {
      // First check if lead exists and get its status
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('status')
        .eq('id', leadId)
        .single();

      if (leadError) throw leadError;

      // If lead is in "Lost" status, return empty tasks array
      if (lead?.status === 'Lost') {
        console.log("fetchLeadTasks - lead is in Lost status, returning empty tasks");
        setTasks([]);
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('lead_id', leadId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      console.log("fetchLeadTasks - fetched tasks:", data?.length, "tasks");
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching lead tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    console.log("useLeadTasks createTask called with:", taskData);
    try {
      // Ensure required fields and enrich payload
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error('No authenticated user');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userId)
        .maybeSingle();

      const payload = {
        ...taskData,
        // Fallbacks to guarantee NOT NULL columns
        lead_id: (taskData as any).lead_id || leadId,
        created_by: (taskData as any).created_by || userId,
        assigned_to: (taskData as any).assigned_to || userId,
        assigned_to_name:
          (taskData as any).assigned_to_name ?? profileData?.full_name ?? null,
        done: (taskData as any).done ?? false,
      } as Omit<Task, 'id' | 'created_at' | 'updated_at'>;

      const { data, error } = await supabase
        .from('tasks')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      console.log("Task inserted successfully:", data);
      
      // Add history entry for task creation
      const { data: userData } = await supabase.auth.getUser();
      const { data: profileForHistory } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userData.user?.id)
        .maybeSingle();

      await supabase.from('lead_history').insert({
        lead_id: payload.lead_id,
        action: 'Task Created',
        details: `New task created: "${data.title}" - Due: ${new Date(data.due_date).toLocaleDateString()}`,
        user_name: profileForHistory?.full_name || 'Unknown User',
        created_by: userData.user?.id,
      });
      
      console.log("Before updating local state, current tasks:", tasks.length);
      setTasks(prev => {
        const newTasks = [data, ...prev];
        console.log("Updated local state with new tasks:", newTasks.length);
        return newTasks;
      });
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const originalTask = tasks.find(task => task.id === taskId);
      
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // Add history entry for significant task updates
      if (updates.done !== undefined && originalTask) {
        const { data: userData } = await supabase.auth.getUser();
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', userData.user?.id)
          .single();

        const action = updates.done ? 'Task Completed' : 'Task Reopened';
        const details = `Task "${originalTask.title}" was ${updates.done ? 'completed' : 'reopened'}`;

        await supabase.from('lead_history').insert({
          lead_id: leadId,
          action,
          details,
          user_name: profileData?.full_name || 'Unknown User',
          created_by: userData.user?.id,
        });
      }

      setTasks(prev => prev.map(task => 
        task.id === taskId ? data : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    refetch: fetchLeadTasks
  };
}