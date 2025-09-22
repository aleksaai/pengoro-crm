import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to normalize dates for consistent comparison (removes timezone issues)
export function normalizeDate(date: string | Date): Date {
  if (typeof date === 'string') {
    // Try to extract YYYY-MM-DD first to avoid timezone shifts
    const m = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const y = parseInt(m[1], 10);
      const mo = parseInt(m[2], 10) - 1;
      const d = parseInt(m[3], 10);
      return new Date(y, mo, d); // Local midnight
    }
  }
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Get task urgency level based on due date (removes timezone sensitivity)
export function getTaskUrgencyLevel(dueDate: string | Date, isCompleted: boolean = false): string {
  if (isCompleted) return 'completed';
  
  const today = normalizeDate(new Date());
  const taskDate = normalizeDate(dueDate);
  const diffDays = Math.round((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Debug: uncomment if you need to trace a specific task
  // console.log('[Urgency] dueDate=', dueDate, 'taskDate=', taskDate.toISOString(), 'today=', today.toISOString(), 'diffDays=', diffDays);
  
  if (diffDays < 0) return 'overdue';      // Red
  if (diffDays === 0) return 'today';      // Orange  
  if (diffDays === 1) return 'tomorrow';   // Yellow
  if (diffDays <= 7) return 'week';        // Green
  return 'future';                         // Blue
}

// Calculate task sorting priority for leads (lower number = higher priority)
export function getTaskSortingPriority(tasks: any[]): { priority: number; dueTime: number } {
  if (!tasks || tasks.length === 0) {
    return { priority: 6, dueTime: Date.now() + (365 * 24 * 60 * 60 * 1000) }; // No tasks - lowest priority, far future time
  }

  // Find the earliest pending task
  const pendingTasks = tasks.filter(task => !task.done);
  if (pendingTasks.length === 0) {
    return { priority: 5, dueTime: Date.now() + (30 * 24 * 60 * 60 * 1000) }; // All tasks completed, future time
  }

  // Sort by due date to get the earliest task
  const earliestTask = pendingTasks.sort((a, b) => 
    new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  )[0];

  const dueDate = new Date(earliestTask.due_date);
  const dueTime = dueDate.getTime();
  const now = Date.now();
  
  // Check if overdue by actual time (not just day) - matches LeadCard logic
  if (dueTime < now) {
    return { priority: 1, dueTime }; // Overdue - RED - highest priority
  }

  // Use the same day calculation logic as LeadCard component for consistency
  const dueDay = new Date(dueDate);
  dueDay.setHours(0, 0, 0, 0);
  
  const todayDate = new Date(now);
  todayDate.setHours(0, 0, 0, 0);
  
  const daysDifference = Math.floor((dueDay.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

  let priority = 6; // Default to lowest priority
  
  if (daysDifference === 0) {
    priority = 2; // Due today - ORANGE
  } else if (daysDifference === 1) {
    priority = 3; // Due tomorrow - YELLOW
  } else if (daysDifference <= 7) {
    priority = 4; // Due within a week - GREEN
  } else {
    priority = 5; // Due in future - BLUE
  }

  return { 
    priority, 
    dueTime 
  };
}
