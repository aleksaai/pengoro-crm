import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Task {
  id: string;
  lead_id: string;
  lead_name: string;
  email_address: string | null;
  phone_number: string | null;
  title: string;
  description: string | null;
  due_date: string;
  assigned_to: string;
  assigned_to_name: string | null;
  done: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
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
      
      // Add history entry for task creation if lead_id is available
      if (taskData.lead_id) {
        const { data: userData } = await supabase.auth.getUser();
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', userData.user?.id)
          .single();

        await supabase.from('lead_history').insert({
          lead_id: taskData.lead_id,
          action: 'Task Created',
          details: `New task created: "${data.title}" - Due: ${new Date(data.due_date).toLocaleDateString()}`,
          user_name: profileData?.full_name || 'Unknown User',
          created_by: userData.user?.id,
        });
      }
      
      setTasks(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

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
    refetch: fetchTasks
  };
}