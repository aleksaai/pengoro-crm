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

    // Set up real-time subscription for tasks with debouncing
    console.log('Setting up real-time subscription for global tasks');
    let timeoutId: NodeJS.Timeout;
    
    const debouncedFetchTasks = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('Debounced fetch tasks triggered');
        fetchTasks();
      }, 1000); // 1000ms debounce for global tasks to reduce API calls
    };
    
    const channel = supabase
      .channel('global-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Global tasks real-time update:', payload);
          debouncedFetchTasks();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up global tasks subscription');
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTasks = async () => {
    console.log('Fetching all tasks...');
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          leads!inner(status)
        `)
        .neq('leads.status', 'Lost')
        .order('due_date', { ascending: true });

      if (error) throw error;
      console.log(`Fetched ${data?.length || 0} tasks (excluding Lost leads)`);
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    console.log('Creating new task:', taskData);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating task:', error);
        throw error;
      }
      
      console.log('Task created successfully:', data);
      
      // Add history entry for task creation if lead_id is available
      if (taskData.lead_id) {
        console.log('Adding task creation to lead history');
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
        console.log('Lead history entry added');
      }
      
      // Update local state immediately for responsiveness
      setTasks(prev => [data, ...prev]);
      console.log('Local task state updated');
      
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    console.log('Updating task:', { taskId, updates });
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating task:', error);
        throw error;
      }

      console.log('Task updated successfully:', data);
      
      // Update local state immediately for responsiveness
      setTasks(prev => prev.map(task => 
        task.id === taskId ? data : task
      ));
      
      console.log('Local task state updated');
      return data;
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