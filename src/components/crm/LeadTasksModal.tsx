import { useState } from "react";
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
import { TaskCreateModal } from "./TaskCreateModal";
import { TaskCompletionModal } from "./TaskCompletionModal";
import type { Lead } from "@/hooks/useLeads";
import type { Task } from "@/hooks/useTasks";

interface LeadTasksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

export function LeadTasksModal({ open, onOpenChange, lead }: LeadTasksModalProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const { tasks, loading, updateTask, createTask, refetch } = useLeadTasks(lead.id);
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin } = usePermissions();
  const { toast } = useToast();

  // Check if current user can edit this frozen lead
  const canEditFrozenLead = lead.is_frozen ? isSuperAdmin : true;
  const isEditingRestricted = lead.is_frozen && !isSuperAdmin;
  const showMeetingRequest = lead.is_frozen && isAdmin && !isSuperAdmin;

  const pendingTasks = tasks.filter(task => !task.done);
  const completedTasks = tasks.filter(task => task.done);

  const getTaskUrgencyColor = (task: Task) => {
    const dueDate = new Date(task.due_date);
    
    if (isPast(dueDate) && !task.done) {
      return "bg-destructive/10 border-destructive text-destructive";
    }
    
    if (isToday(dueDate) && !task.done) {
      return "bg-warning/10 border-warning text-warning";
    }
    
    if (task.done) {
      return "bg-success/10 border-success text-success";
    }
    
    return "bg-muted/50 border-border text-foreground";
  };

  const getTaskUrgencyIcon = (task: Task) => {
    const dueDate = new Date(task.due_date);
    
    if (isPast(dueDate) && !task.done) {
      return <Clock className="w-4 h-4 text-destructive" />;
    }
    
    if (isToday(dueDate) && !task.done) {
      return <Clock className="w-4 h-4 text-warning" />;
    }
    
    if (task.done) {
      return <CheckCircle className="w-4 h-4 text-success" />;
    }
    
    return <Calendar className="w-4 h-4 text-muted-foreground" />;
  };

  const handleMarkAsDone = async (task: Task) => {
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
    try {
      // Mark current task as done
      await updateTask(taskId, { done: true });
      
      // Create new task
      await createTask(newTaskData);
      
      toast({
        title: "Success",
        description: "Task completed and new task created!",
      });
      
      refetch();
      setShowCompletionModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again.",
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
                  disabled={isEditingRestricted}
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
              </div>
              
              {isEditingRestricted && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 space-y-3">
                  <p className="text-sm text-warning">
                    ⚠️ This lead is frozen due to overdue tasks. Only Super Admins can manage tasks for frozen leads.
                  </p>
                  
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
                              {task.assigned_to_name && (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {task.assigned_to_name}
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
                                disabled={isEditingRestricted}
                              >
                                Mark Done
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleCompleteWithNewTask(task)}
                                disabled={isEditingRestricted}
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