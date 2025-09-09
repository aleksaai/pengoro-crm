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

  // Realtime updates for this lead's tasks
  useEffect(() => {
    if (!leadId) return;

    const channel = supabase
      .channel(`tasks-lead-${leadId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `lead_id=eq.${leadId}`,
      }, (payload) => {
        console.log("Real-time update received:", payload);
        fetchLeadTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  const fetchLeadTasks = async () => {
    console.log("fetchLeadTasks called for leadId:", leadId);
    try {
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
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;
      console.log("Task inserted successfully:", data);
      
      // Add history entry for task creation
      const { data: userData } = await supabase.auth.getUser();
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userData.user?.id)
        .single();

      await supabase.from('lead_history').insert({
        lead_id: leadId,
        action: 'Task Created',
        details: `New task created: "${data.title}" - Due: ${new Date(data.due_date).toLocaleDateString()}`,
        user_name: profileData?.full_name || 'Unknown User',
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