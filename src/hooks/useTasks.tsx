import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Task {
  id: string;
  lead_id: string;
  lead_name: string;
  email_address: string;
  phone_number: string;
  due_date: string;
  assigned_to: string;
  done: boolean;
  created_at: string;
  updated_at: string;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      // For now, we'll use sample data until we create the tasks table
      // This is a placeholder implementation
      const sampleTasks: Task[] = [
        {
          id: "1",
          lead_id: "sample-id-1",
          lead_name: "John Smith",
          email_address: "john.smith@techsolutions.com",
          phone_number: "+1 (555) 123-4567",
          due_date: "2024-01-16",
          assigned_to: "Sarah Johnson",
          done: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setTasks(sampleTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Placeholder implementation
      const newTask: Task = {
        ...taskData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, ...updates, updated_at: new Date().toISOString() }
          : task
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