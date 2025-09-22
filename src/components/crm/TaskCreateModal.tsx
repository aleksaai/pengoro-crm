import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useTasks, Task } from "@/hooks/useTasks";
import { supabase } from "@/integrations/supabase/client";

interface TaskCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  leadEmail?: string;
  leadPhone?: string;
  currentUserId: string;
  currentUserName: string;
  onTaskCreated?: () => void;
}

export function TaskCreateModal({
  open,
  onOpenChange,
  leadId,
  leadName,
  leadEmail,
  leadPhone,
  currentUserId,
  currentUserName,
  onTaskCreated,
}: TaskCreateModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [dueTime, setDueTime] = useState("09:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLostLead, setIsLostLead] = useState(false);
  const [checkingLeadStatus, setCheckingLeadStatus] = useState(false);
  const { createTask } = useTasks();
  const { toast } = useToast();

  // Check if lead is in Lost winback status when modal opens
  useEffect(() => {
    if (open && leadId) {
      checkLeadWinbackStatus();
    }
  }, [open, leadId]);

  const checkLeadWinbackStatus = async () => {
    setCheckingLeadStatus(true);
    try {
      // Check if lead is abandoned/lost and get latest abandon reason
      const { data: lead } = await supabase
        .from('leads')
        .select('status')
        .eq('id', leadId)
        .single();

      if (lead && (lead.status === 'Abandoned' || lead.status === 'Lost')) {
        // Get latest abandon reason from history
        const { data: latestHistory } = await supabase
          .from('lead_history')
          .select('details')
          .eq('lead_id', leadId)
          .eq('action', 'Status Changed')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latestHistory?.details) {
          const abandonReason = latestHistory.details.split(' - Reason: ')[1];
          // If abandoned for reasons other than "Never reached" or "Future Call", it's in Lost status
          const isInLostStatus = abandonReason && !['Never reached', 'Future Call'].includes(abandonReason);
          setIsLostLead(isInLostStatus);
        }
      } else {
        setIsLostLead(false);
      }
    } catch (error) {
      console.error('Error checking lead status:', error);
      setIsLostLead(false);
    } finally {
      setCheckingLeadStatus(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLostLead) {
      toast({
        title: "Cannot Create Task",
        description: "Cannot create tasks for leads in Lost status. Please reactivate the lead first.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !dueDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
        lead_id: leadId,
        lead_name: leadName,
        email_address: leadEmail || null,
        phone_number: leadPhone || null,
        title: title.trim(),
        description: description.trim() || null,
        due_date: format(new Date(`${format(dueDate, 'yyyy-MM-dd')}T${dueTime}`), 'yyyy-MM-dd HH:mm:ssXXX'),
        assigned_to: currentUserId,
        assigned_to_name: currentUserName,
        done: false,
        created_by: currentUserId,
      };

      await createTask(taskData);

      toast({
        title: "Success",
        description: "Task created successfully!",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setDueDate(undefined);
      setDueTime("09:00");
      onOpenChange(false);
      
      // Refresh lead tasks if callback provided
      onTaskCreated?.();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setDescription("");
    setDueDate(undefined);
    setDueTime("09:00");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Task for {leadName}
          </DialogTitle>
        </DialogHeader>
        
        {checkingLeadStatus ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Checking lead status...</div>
          </div>
        ) : isLostLead ? (
          <div className="space-y-4">
            <div className="p-4 border border-destructive/50 bg-destructive/5 rounded-lg">
              <p className="text-sm text-destructive font-medium">Cannot Create Task</p>
              <p className="text-sm text-muted-foreground mt-1">
                This lead is in Lost status. Tasks can only be created when reactivating a lead from the Winbacks page.
              </p>
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title..."
                required
              />
            </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description... (optional)"
              className="resize-none h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due-time">Due Time *</Label>
              <Input
                id="due-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}