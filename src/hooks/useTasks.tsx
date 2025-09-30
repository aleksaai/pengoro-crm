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

export function useTasks(statusFilter: string = 'pending', dueDateFilter: string = 'today-tomorrow') {
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
  }, [statusFilter, dueDateFilter]);

  const fetchTasks = async () => {
    console.log('Fetching tasks with filters:', { statusFilter, dueDateFilter });
    try {
      // Build the query with filters
      let query = supabase
        .from('tasks')
        .select(`
          *,
          leads!inner(status)
        `);
      
      // Apply status filter
      if (statusFilter === 'pending') {
        query = query.eq('done', false);
      } else if (statusFilter === 'completed') {
        query = query.eq('done', true);
      } else if (statusFilter === 'overdue') {
        query = query.eq('done', false).lt('due_date', new Date().toISOString());
      }
      
      // Apply due date filter
      if (dueDateFilter !== 'all') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (dueDateFilter === 'today') {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          query = query.gte('due_date', today.toISOString()).lt('due_date', tomorrow.toISOString());
        } else if (dueDateFilter === 'today-tomorrow') {
          const dayAfterTomorrow = new Date(today);
          dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
          query = query.gte('due_date', today.toISOString()).lt('due_date', dayAfterTomorrow.toISOString());
        } else if (dueDateFilter === 'next-7-days') {
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 8);
          query = query.gte('due_date', today.toISOString()).lt('due_date', nextWeek.toISOString());
        }
      }
      
      const { data: allTasks, error } = await query.order('due_date', { ascending: true });

      if (error) throw error;

      // Filter out tasks from Lost leads, except those with "Future Call" abandon reason
      const filteredTasks = [];
      
      for (const task of allTasks || []) {
        if (task.leads.status !== 'Lost') {
          filteredTasks.push(task);
        } else {
          // For Lost leads, check if they have "Future Call" abandon reason
          try {
            const { data: historyData } = await supabase
              .from('lead_history')
              .select('details')
              .eq('lead_id', task.lead_id)
              .in('action', ['Lead Abandoned', 'Abandon Reason Updated'])
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (historyData?.details) {
              const abandonReason = historyData.details.includes('Reason: ') 
                ? historyData.details.split('Reason: ')[1]
                : historyData.details.includes('Reason changed to: ')
                  ? historyData.details.split('Reason changed to: ')[1]
                  : null;
              
              // Include tasks for Lost leads with "Future Call" abandon reason
              if (abandonReason === 'Future Call') {
                filteredTasks.push(task);
              }
            }
          } catch (historyError) {
            console.log('No abandon reason found for Lost lead, skipping task');
          }
        }
      }

      console.log(`Fetched ${filteredTasks.length} tasks (including Future Call winbacks)`);
      setTasks(filteredTasks);
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

  const deleteTask = async (taskId: string) => {
    console.log('Deleting task:', taskId);
    try {
      // Get the task details before deletion
      const taskToDelete = tasks.find(task => task.id === taskId);
      if (!taskToDelete) {
        throw new Error('Task not found');
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Supabase error deleting task:', error);
        throw error;
      }

      console.log('Task deleted successfully:', taskId);
      
      // Add history entry for task deletion
      if (taskToDelete.lead_id) {
        console.log('Adding task deletion to lead history');
        const { data: userData } = await supabase.auth.getUser();
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', userData.user?.id)
          .single();

        await supabase.from('lead_history').insert({
          lead_id: taskToDelete.lead_id,
          action: 'Task Deleted',
          details: `Task "${taskToDelete.title}" (due: ${new Date(taskToDelete.due_date).toLocaleDateString()}) has been deleted`,
          user_name: profileData?.full_name || 'Unknown User',
          created_by: userData.user?.id,
        });
        console.log('Lead history entry added for task deletion');
      }
      
      // Update local state immediately for responsiveness
      setTasks(prev => prev.filter(task => task.id !== taskId));
      console.log('Local task state updated');
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks
  };
}