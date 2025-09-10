import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to normalize dates for consistent comparison (removes timezone issues)
export function normalizeDate(date: string | Date): Date {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Get task urgency level based on due date (removes timezone sensitivity)
export function getTaskUrgencyLevel(dueDate: string | Date, isCompleted: boolean = false): string {
  if (isCompleted) return 'completed';
  
  const today = normalizeDate(new Date());
  const taskDate = normalizeDate(dueDate);
  const diffDays = Math.floor((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'overdue';      // Red
  if (diffDays === 0) return 'today';      // Orange  
  if (diffDays === 1) return 'tomorrow';   // Yellow
  if (diffDays <= 7) return 'week';        // Green
  return 'future';                         // Blue
}
