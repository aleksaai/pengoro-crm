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
      }, () => {
        fetchLeadTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  const fetchLeadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('lead_id', leadId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching lead tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;
      
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
      
      setTasks(prev => [data, ...prev]);
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