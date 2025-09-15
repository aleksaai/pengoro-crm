import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, CheckCircle, Calendar, User, AlertTriangle, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useLeads } from "@/hooks/useLeads";
import { useProfiles } from "@/hooks/useProfiles";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { TaskCreateModal } from "./TaskCreateModal";
import { TaskCompletionModal } from "./TaskCompletionModal";
import { getTaskUrgencyLevel } from "@/lib/utils";

// Task interface is now imported from useTasks hook


export function TaskManagement() {
  const navigate = useNavigate();
  const { tasks, loading: tasksLoading, createTask, updateTask } = useTasks();
  const { leads } = useLeads();
  const { profiles } = useProfiles();
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const { toast } = useToast();
  const { preferences, loading: preferencesLoading, updatePreference, getPreference } = useUserPreferences();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  // Get current user's profile
  const currentProfile = profiles.find(p => p.user_id === user?.id);
  
  // Initialize filters with user preferences or defaults
  const getDefaultStatusFilter = () => getPreference('tasks_statusFilter', 'all');
  const getDefaultAssignedToFilter = () => {
    const saved = getPreference('tasks_assignedToFilter', null);
    // If no saved preference and user is not super admin, default to their own tasks
    if (saved === null && !isSuperAdmin && currentProfile?.full_name) {
      return currentProfile.full_name;
    }
    return saved || 'all';
  };
  
  const [statusFilter, setStatusFilter] = useState<string>(getDefaultStatusFilter());
  const [assignedToFilter, setAssignedToFilter] = useState<string>(getDefaultAssignedToFilter());
  
  // Update filters when preferences load
  useEffect(() => {
    if (!preferencesLoading) {
      setStatusFilter(getDefaultStatusFilter());
      setAssignedToFilter(getDefaultAssignedToFilter());
    }
  }, [preferencesLoading, preferences, currentProfile?.full_name, isSuperAdmin]);

  // Save filter preferences when they change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    updatePreference('tasks_statusFilter', value);
  };

  const handleAssignedToFilterChange = (value: string) => {
    setAssignedToFilter(value);
    updatePreference('tasks_assignedToFilter', value);
  };

  // Utility functions for task styling and urgency
  const getTaskUrgencyColor = (task: any) => {
    const urgencyLevel = getTaskUrgencyLevel(task.due_date, task.done);
    
    switch (urgencyLevel) {
      case 'completed': return "secondary";
      case 'overdue': return "destructive";
      case 'today': return "outline";
      case 'tomorrow': return "default";
      case 'week': return "default";
      case 'future': return "default";
      default: return "default";
    }
  };

  const getTaskUrgencyIcon = (task: any) => {
    const urgencyLevel = getTaskUrgencyLevel(task.due_date, task.done);
    
    switch (urgencyLevel) {
      case 'completed': return CheckCircle;
      case 'overdue': return AlertTriangle;
      case 'today': return Clock;
      case 'tomorrow': return Clock;
      case 'week': return Calendar;
      case 'future': return Calendar;
      default: return Calendar;
    }
  };

  const getTaskIconColor = (task: any) => {
    const urgencyLevel = getTaskUrgencyLevel(task.due_date, task.done);
    
    switch (urgencyLevel) {
      case 'completed': return "text-muted-foreground";
      case 'overdue': return "text-destructive";
      case 'today': return "text-orange-500";
      case 'tomorrow': return "text-yellow-500";
      case 'week': return "text-green-500";
      case 'future': return "text-blue-500";
      default: return "text-muted-foreground";
    }
  };

  const handleMarkAsDone = async (task: any) => {
    const lead = leads.find(l => l.id === task.lead_id);
    if (lead?.is_frozen && !isSuperAdmin) {
      toast({
        title: "Action Restricted",
        description: "This lead is frozen due to overdue tasks. Only super admins can modify frozen leads.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if this is the only active task for the lead
    const leadActiveTasks = tasks.filter(t => t.lead_id === task.lead_id && !t.done);
    if (leadActiveTasks.length === 1 && leadActiveTasks[0].id === task.id) {
      toast({
        title: "Cannot Complete Task",
        description: "This is the only active task for this lead. Use 'Complete & Add Next' to create a follow-up task.",
        variant: "destructive"
      });
      return;
    }
    
    if (task.done) {
      // Reopen task
      await updateTask(task.id, { done: false });
    } else {
      // Complete task
      await updateTask(task.id, { done: true });
    }
  };

  const handleCompleteTask = async (taskId: string, newTaskData: any) => {
    try {
      // Mark current task as done
      await updateTask(taskId, { done: true });
      
      // Create new task
      await createTask(newTaskData);
      
      setShowCompletionModal(false);
      setSelectedTask(null);
      
      toast({
        title: "Task Completed",
        description: "Task marked as complete and new task created successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete task and create new one.",
        variant: "destructive"
      });
    }
  };

  const handleTaskCreated = () => {
    setShowCreateModal(false);
    toast({
      title: "Success",
      description: "Task created successfully"
    });
  };

  const handleTaskClick = (task: any) => {
    if (task.lead_id) {
      navigate(`/leads/${task.lead_id}?tab=tasks`, {
        state: { from: 'tasks' }
      });
    }
  };

  // Filter tasks based on status and assigned person
  const filteredTasks = tasks.filter(task => {
    // Status filter
    if (statusFilter === "pending" && task.done) return false;
    if (statusFilter === "completed" && !task.done) return false;
    if (statusFilter === "overdue") {
      const dueDate = new Date(task.due_date);
      const today = new Date();
      if (task.done || dueDate >= today) return false;
    }
    
    // Assigned to filter
    if (assignedToFilter !== "all" && task.assigned_to_name !== assignedToFilter) {
      return false;
    }
    
    return true;
  });

  // Sort tasks by due date (overdue first, then by date)
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1; // Completed tasks last
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  // Get unique assigned users for filter dropdown
  const uniqueAssignedUsers = Array.from(new Set(
    tasks.map(task => task.assigned_to_name).filter(name => name)
  )).sort();

  const pendingTasks = tasks.filter(t => !t.done);
  const completedTasks = tasks.filter(t => t.done);
  const overdueTasks = tasks.filter(t => {
    if (t.done) return false;
    const dueDate = new Date(t.due_date);
    const today = new Date();
    return dueDate < today;
  });

  return (
    <div className="space-y-6">
      {/* Header with stats and actions */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Task Management</h1>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span>{pendingTasks.length} pending</span>
          <span>{completedTasks.length} completed</span>
          {overdueTasks.length > 0 && (
            <span className="text-destructive font-medium">{overdueTasks.length} overdue</span>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Assigned to:</span>
              <Select value={assignedToFilter} onValueChange={handleAssignedToFilterChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {uniqueAssignedUsers.map((userName) => (
                    <SelectItem key={userName} value={userName}>
                      {userName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="space-y-3">
        {sortedTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No tasks found matching your filters.</p>
            </CardContent>
          </Card>
        ) : (
          sortedTasks.map((task) => {
            const UrgencyIcon = getTaskUrgencyIcon(task);
            const urgencyColor = getTaskUrgencyColor(task);
            const lead = leads.find(l => l.id === task.lead_id);
            
            return (
              <Card 
                key={task.id}
                 className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  urgencyColor === "destructive" && "border-destructive/50 bg-destructive/5",
                  urgencyColor === "outline" && "border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20",
                  task.done && "opacity-60 bg-muted/30"
                )}
                onClick={() => handleTaskClick(task)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <UrgencyIcon className={cn(
                          "w-4 h-4",
                          getTaskIconColor(task)
                        )} />
                        <h3 className={cn(
                          "font-semibold",
                          task.done && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </h3>
                        <Badge variant={urgencyColor}>
                          {task.done ? "Completed" : 
                           urgencyColor === "destructive" ? "Overdue" :
                           urgencyColor === "outline" ? "Due Today" : "Upcoming"}
                        </Badge>
                      </div>
                      
                      {task.description && (
                        <p className={cn(
                          "text-sm text-muted-foreground",
                          task.done && "line-through"
                        )}>
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>Lead: {task.lead_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                        {task.assigned_to_name && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>Assigned: {task.assigned_to_name}</span>
                          </div>
                        )}
                        {lead?.is_frozen && (
                          <Badge variant="destructive" className="text-xs">
                            Lead Frozen
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!task.done ? (
                        <>
                          {(() => {
                            const leadActiveTasks = tasks.filter(t => t.lead_id === task.lead_id && !t.done);
                            const isOnlyActiveTask = leadActiveTasks.length === 1 && leadActiveTasks[0].id === task.id;
                            
                            return (
                              <>
                                         <Button
                                           variant="outline"
                                           size="sm"
                                           onClick={(e) => {
                                             e.stopPropagation();
                                             handleMarkAsDone(task);
                                           }}
                                           disabled={lead?.is_frozen && !isSuperAdmin || isOnlyActiveTask}
                                           title={isOnlyActiveTask ? "Cannot mark as done - this is the only active task for this lead" : ""}
                                         >
                                           Mark Done
                                         </Button>
                                         <Button
                                           variant="default"
                                           size="sm"
                                           onClick={(e) => {
                                             e.stopPropagation();
                                             setSelectedTask(task);
                                             setShowCompletionModal(true);
                                           }}
                                           disabled={lead?.is_frozen && !isSuperAdmin}
                                         >
                                           {isOnlyActiveTask ? "Complete & Add Next" : "Complete & Add Next"}
                                         </Button>
                              </>
                            );
                          })()}
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsDone(task);
                          }}
                          disabled={lead?.is_frozen && !isSuperAdmin}
                        >
                          Reopen Task
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modals */}
      <TaskCreateModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        leadId=""
        leadName=""
        leadEmail=""
        leadPhone=""
        currentUserId={user?.id || ""}
        currentUserName={currentProfile?.full_name || ""}
        onTaskCreated={handleTaskCreated}
      />

      {selectedTask && (
        <TaskCompletionModal
          open={showCompletionModal}
          onOpenChange={setShowCompletionModal}
          currentTask={selectedTask}
          onCompleteTask={handleCompleteTask}
        />
      )}
    </div>
  );
}