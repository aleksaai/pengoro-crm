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
