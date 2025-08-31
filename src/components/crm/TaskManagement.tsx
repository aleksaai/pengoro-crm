import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar, User, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  status: "To Do" | "In Progress" | "Completed";
  assignedTo: string;
  dueDate: string;
  relatedLead?: string;
}

const sampleTasks: Task[] = [
  {
    id: "1",
    title: "Follow up with Tech Solutions GmbH",
    description: "Send proposal and schedule demo call",
    priority: "High",
    status: "To Do",
    assignedTo: "You",
    dueDate: "2024-01-16",
    relatedLead: "John Smith"
  },
  {
    id: "2",
    title: "Prepare presentation for Digital Corp",
    description: "Create custom demo showcasing their use case",
    priority: "Medium",
    status: "In Progress",
    assignedTo: "You",
    dueDate: "2024-01-17",
    relatedLead: "Michael Brown"
  },
  {
    id: "3",
    title: "Contract review with StartUp Inc",
    description: "Review terms and conditions before final approval",
    priority: "High",
    status: "To Do",
    assignedTo: "You",
    dueDate: "2024-01-15",
    relatedLead: "Emma Wilson"
  }
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High": return "bg-red-100 text-red-800 border-red-200";
    case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Low": return "bg-green-100 text-green-800 border-green-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Completed": return "bg-green-100 text-green-800 border-green-200";
    case "In Progress": return "bg-blue-100 text-blue-800 border-blue-200";
    case "To Do": return "bg-gray-100 text-gray-800 border-gray-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Medium" as Task["priority"],
    assignedTo: "You",
    dueDate: "",
    relatedLead: ""
  });

  const handleAddTask = () => {
    if (newTask.title && newTask.dueDate) {
      const task: Task = {
        ...newTask,
        id: Date.now().toString(),
        status: "To Do"
      };
      setTasks([task, ...tasks]);
      setNewTask({
        title: "",
        description: "",
        priority: "Medium",
        assignedTo: "You",
        dueDate: "",
        relatedLead: ""
      });
      setIsDialogOpen(false);
    }
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const statusOrder = ["To Do", "In Progress", "Completed"];
        const currentIndex = statusOrder.indexOf(task.status);
        const nextIndex = (currentIndex + 1) % statusOrder.length;
        return { ...task, status: statusOrder[nextIndex] as Task["status"] };
      }
      return task;
    }));
  };

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "Completed").length,
    inProgress: tasks.filter(t => t.status === "In Progress").length,
    toDo: tasks.filter(t => t.status === "To Do").length
  };

  return (
    <div className="space-y-6">
      <div className="glass-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Task Management</h1>
            <p className="text-muted-foreground">
              {taskStats.completed}/{taskStats.total} tasks completed
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong border-glass-border">
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="task-title">Task Title *</Label>
                  <Input
                    id="task-title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="bg-input/50 border-glass-border"
                    placeholder="Enter task title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-description">Description</Label>
                  <Textarea
                    id="task-description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="bg-input/50 border-glass-border"
                    placeholder="Task description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-priority">Priority</Label>
                    <Select value={newTask.priority} onValueChange={(value: Task["priority"]) => setNewTask({ ...newTask, priority: value })}>
                      <SelectTrigger className="bg-input/50 border-glass-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-strong border-glass-border">
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="task-due">Due Date *</Label>
                    <Input
                      id="task-due"
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      className="bg-input/50 border-glass-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-lead">Related Lead</Label>
                  <Input
                    id="task-lead"
                    value={newTask.relatedLead}
                    onChange={(e) => setNewTask({ ...newTask, relatedLead: e.target.value })}
                    className="bg-input/50 border-glass-border"
                    placeholder="Optional: Lead name"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleAddTask} className="flex-1 bg-primary hover:bg-primary-hover">
                    Add Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-0">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-foreground">{taskStats.total}</div>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-0">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-0">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-0">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-600">{taskStats.toDo}</div>
            <p className="text-xs text-muted-foreground">To Do</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card className="glass-card border-0">
        <CardContent className="p-6">
          <div className="space-y-4">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className="p-4 rounded-lg bg-muted/20 border border-glass-border hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => toggleTaskStatus(task.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`font-medium ${task.status === 'Completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </h3>
                      <Badge className={`${getStatusColor(task.status)} px-2 py-1 text-xs rounded-md border`}>
                        {task.status}
                      </Badge>
                      <Badge className={`${getPriorityColor(task.priority)} px-2 py-1 text-xs rounded-md border`}>
                        {task.priority}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {task.assignedTo}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {task.dueDate}
                      </div>
                      {task.relatedLead && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {task.relatedLead}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}