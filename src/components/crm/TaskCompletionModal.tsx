import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/hooks/useTasks";

interface TaskCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTask: Task;
  onCompleteTask: (taskId: string, newTaskData: {
    title: string;
    description?: string;
    due_date: string;
    lead_id: string;
    lead_name: string;
    email_address: string | null;
    phone_number: string | null;
    assigned_to: string;
    assigned_to_name: string | null;
  }) => Promise<void>;
}

export function TaskCompletionModal({
  open,
  onOpenChange,
  currentTask,
  onCompleteTask,
}: TaskCompletionModalProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTaskTitle.trim() || !newTaskDueDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields for the new task.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const newTaskData = {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        due_date: format(newTaskDueDate, 'yyyy-MM-dd'),
        lead_id: currentTask.lead_id,
        lead_name: currentTask.lead_name,
        email_address: currentTask.email_address,
        phone_number: currentTask.phone_number,
        assigned_to: currentTask.assigned_to,
        assigned_to_name: currentTask.assigned_to_name,
      };

      await onCompleteTask(currentTask.id, newTaskData);

      toast({
        title: "Success",
        description: "Task completed and new task created!",
      });

      // Reset form
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskDueDate(undefined);
      onOpenChange(false);
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskDueDate(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Complete Task & Create New Task
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-3 bg-muted/30 rounded-lg border-l-4 border-primary">
            <p className="text-sm text-muted-foreground mb-1">Completing task:</p>
            <p className="font-medium">{currentTask.title}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-task-title">New Task Title *</Label>
              <Input
                id="new-task-title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter next task title..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-task-description">New Task Description</Label>
              <Textarea
                id="new-task-description"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Enter next task description... (optional)"
                className="resize-none h-20"
              />
            </div>

            <div className="space-y-2">
              <Label>New Task Due Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newTaskDueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTaskDueDate ? format(newTaskDueDate, "PPP") : "Select due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newTaskDueDate}
                    onSelect={setNewTaskDueDate}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Completing..." : "Complete & Create New Task"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}