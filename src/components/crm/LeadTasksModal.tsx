import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Clock, Plus, CheckCircle, Calendar, User } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { useLeadTasks } from "@/hooks/useLeadTasks";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { useProfiles } from "@/hooks/useProfiles";
import { TaskCreateModal } from "./TaskCreateModal";
import { TaskCompletionModal } from "./TaskCompletionModal";
import { supabase } from "@/integrations/supabase/client";
import type { Lead } from "@/hooks/useLeads";
import type { Task } from "@/hooks/useTasks";
import { getTaskUrgencyLevel } from "@/lib/utils";

interface LeadTasksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

export function LeadTasksModal({ open, onOpenChange, lead }: LeadTasksModalProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLostWinback, setIsLostWinback] = useState(false);
  
  const { tasks, loading, updateTask, createTask, refetch } = useLeadTasks(lead.id);
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin } = usePermissions();
  const { toast } = useToast();
  const { profiles } = useProfiles();

  // Check if lead is in Lost winback status
  const checkWinbackStatus = async () => {
    if (lead.status === 'Abandoned' || lead.status === 'Lost') {
      try {
        const { data: latestHistory } = await supabase
          .from('lead_history')
          .select('details')
          .eq('lead_id', lead.id)
          .in('action', ['Lead Abandoned', 'Abandon Reason Updated'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latestHistory?.details) {
          const abandonReason = latestHistory.details.includes('Reason: ') 
            ? latestHistory.details.split('Reason: ')[1]
            : latestHistory.details.includes('Reason changed to: ')
              ? latestHistory.details.split('Reason changed to: ')[1]
              : null;
          
          // If abandoned for reasons other than "Never reached" or "Future Call", it's in Lost status
          const isInLostStatus = abandonReason && !['Never reached', 'Future Call'].includes(abandonReason);
          setIsLostWinback(isInLostStatus);
        }
      } catch (error) {
        console.error('Error checking winback status:', error);
      }
    }
  };

  // Check winback status when modal opens
  React.useEffect(() => {
    if (open) {
      checkWinbackStatus();
    }
  }, [open, lead.id]);

  // Check if current user can edit this frozen lead
  const canEditFrozenLead = lead.is_frozen ? isSuperAdmin : true;
  const isEditingRestricted = lead.is_frozen && !isSuperAdmin;
  const showMeetingRequest = lead.is_frozen && isAdmin && !isSuperAdmin;

  const pendingTasks = tasks.filter(task => !task.done);
  const completedTasks = tasks.filter(task => task.done);

  const getTaskUrgencyColor = (task: Task) => {
    const urgencyLevel = getTaskUrgencyLevel(task.due_date, task.done);
    
    switch (urgencyLevel) {
      case 'completed': return "bg-success/10 border-success text-success";
      case 'overdue': return "bg-destructive/10 border-destructive text-destructive";
      case 'today': return "bg-orange-500/10 border-orange-500 text-orange-500";
      case 'tomorrow': return "bg-yellow-500/10 border-yellow-500 text-yellow-500";
      case 'week': return "bg-green-500/10 border-green-500 text-green-500";
      case 'future': return "bg-blue-500/10 border-blue-500 text-blue-500";
      default: return "bg-muted/50 border-border text-foreground";
    }
  };

  const getTaskUrgencyIcon = (task: Task) => {
    const urgencyLevel = getTaskUrgencyLevel(task.due_date, task.done);
    
    switch (urgencyLevel) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'overdue': return <Clock className="w-4 h-4 text-destructive" />;
      case 'today': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'tomorrow': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'week': return <Calendar className="w-4 h-4 text-green-500" />;
      case 'future': return <Calendar className="w-4 h-4 text-blue-500" />;
      default: return <Calendar className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleMarkAsDone = async (task: Task) => {
    if (isLostWinback) {
      toast({
        title: "Cannot Complete Task", 
        description: "Cannot modify tasks for leads in Lost winback status. Please reactivate the lead first.",
        variant: "destructive",
      });
      return;
    }
    if (isEditingRestricted) {
      toast({
        title: "Access Restricted",
        description: "This lead is frozen due to overdue tasks. Only Super Admins can edit frozen leads.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateTask(task.id, { done: true });
      toast({
        title: "Success",
        description: "Task marked as completed!",
      });
      refetch();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteWithNewTask = (task: Task) => {
    if (isLostWinback) {
      toast({
        title: "Cannot Complete Task", 
        description: "Cannot modify tasks for leads in Lost winback status. Please reactivate the lead first.",
        variant: "destructive",
      });
      return;
    }
    if (isEditingRestricted) {
      toast({
        title: "Access Restricted",
        description: "This lead is frozen due to overdue tasks. Only Super Admins can edit frozen leads.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedTask(task);
    setShowCompletionModal(true);
  };

  const handleCompleteTask = async (taskId: string, newTaskData: any) => {
    console.log("LeadTasksModal: Starting handleCompleteTask:", { taskId, newTaskData });
    
    try {
      // First, mark current task as done
      console.log("LeadTasksModal: Marking task as done...");
      const updatedTask = await updateTask(taskId, { done: true });
      console.log("LeadTasksModal: Task marked as done successfully:", updatedTask);
      
      // Then create new task
      console.log("LeadTasksModal: Creating new task...");
      const newTask = await createTask(newTaskData);
      console.log("LeadTasksModal: New task created successfully:", newTask);
      
      toast({
        title: "Success",
        description: "Task completed and new task created!",
      });
      
      // Explicitly refetch the lead tasks to ensure UI consistency
      console.log("LeadTasksModal: Calling refetch...");
      await refetch();
      console.log("LeadTasksModal: Refetch completed");
      
      // Close modal
      setShowCompletionModal(false);
      setSelectedTask(null);
      
      console.log("LeadTasksModal: Complete & Add Next operation finished successfully");
    } catch (error) {
      console.error('LeadTasksModal: Error in handleCompleteTask:', error);
      
      // If new task creation failed but task was marked as done, try to revert
      try {
        console.log('LeadTasksModal: Attempting to revert task completion due to error...');
        await updateTask(taskId, { done: false });
        console.log('LeadTasksModal: Task completion reverted');
      } catch (revertError) {
        console.error('LeadTasksModal: Failed to revert task completion:', revertError);
      }
      
      toast({
        title: "Error",
        description: "Failed to complete task and create new one. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTaskCreated = () => {
    setShowCreateModal(false);
    refetch();
  };

  const handleRequestMeeting = () => {
    window.open('https://cal.com/aleksa-ai/kritikgesprach?overlayCalendar=true', '_blank');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Tasks for {lead.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Pending Tasks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Pending Tasks</h3>
                <Button
                  onClick={() => {
                    if (isLostWinback) {
                      toast({
                        title: "Cannot Create Task",
                        description: "Cannot create tasks for leads in Lost winback status. Please reactivate the lead first.",
                        variant: "destructive",
                      });
                      return;
                    }
                    if (isEditingRestricted) {
                      toast({
                        title: "Access Restricted",
                        description: "This lead is frozen due to overdue tasks. Only Super Admins can edit frozen leads.",
                        variant: "destructive",
                      });
                      return;
                    }
                    setShowCreateModal(true);
                  }}
                  size="sm"
                  className="gap-2"
                  disabled={isEditingRestricted || isLostWinback}
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
              </div>
              
              {(isEditingRestricted || isLostWinback) && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 space-y-3">
                  {isLostWinback ? (
                    <p className="text-sm text-warning">
                      ⚠️ This lead is in Lost winback status. Tasks can only be created when reactivating from the Winbacks page.
                    </p>
                  ) : (
                    <p className="text-sm text-warning">
                      ⚠️ This lead is frozen due to overdue tasks. Only Super Admins can manage tasks for frozen leads.
                    </p>
                  )}
                  
                  {showMeetingRequest && (
                    <Button
                      onClick={handleRequestMeeting}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Request Explanation Review Meeting
                    </Button>
                  )}
                </div>
              )}
              
              {loading ? (
                <p className="text-muted-foreground">Loading tasks...</p>
              ) : pendingTasks.length === 0 ? (
                <p className="text-muted-foreground">No pending tasks</p>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {pendingTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-4 rounded-lg border ${getTaskUrgencyColor(task)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              {getTaskUrgencyIcon(task)}
                              <h4 className="font-medium">{task.title}</h4>
                            </div>
                            
                            {task.description && (
                              <p className="text-sm text-muted-foreground">
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Due: {format(new Date(task.due_date), "PPP p")}
                              </div>
                              {lead.assigned_to && (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  Assigned: {profiles.find(p => p.user_id === lead.assigned_to)?.full_name || lead.assigned_to}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {pendingTasks.length > 1 ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsDone(task)}
                                disabled={isEditingRestricted || isLostWinback}
                              >
                                Mark Done
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleCompleteWithNewTask(task)}
                                disabled={isEditingRestricted || isLostWinback}
                              >
                                Complete & Add Next Task
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Completed Tasks</h3>
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {completedTasks.slice(0, 5).map((task) => (
                        <div
                          key={task.id}
                          className="p-3 rounded-lg bg-success/10 border border-success/20"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-success" />
                              <span className="font-medium text-sm">{task.title}</span>
                              <Badge variant="outline" className="text-xs">
                                Completed
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(task.updated_at), "PPP p")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Task Modal */}
      <TaskCreateModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        leadId={lead.id}
        leadName={lead.name}
        leadEmail={lead.email}
        leadPhone={lead.phone}
        currentUserId={user?.id || ""}
        currentUserName={user?.user_metadata?.full_name || user?.email || "Unknown"}
        onTaskCreated={handleTaskCreated}
      />

      {/* Task Completion Modal */}
      {selectedTask && (
        <TaskCompletionModal
          open={showCompletionModal}
          onOpenChange={setShowCompletionModal}
          currentTask={selectedTask}
          onCompleteTask={handleCompleteTask}
        />
      )}
    </>
  );
}