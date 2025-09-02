import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Task {
  id: string;
  leadName: string;
  emailAddress: string;
  phoneNumber: string;
  dueDate: string;
  assignedTo: string;
  done: boolean;
}

const sampleTasks: Task[] = [
  {
    id: "1",
    leadName: "John Smith",
    emailAddress: "john.smith@techsolutions.com",
    phoneNumber: "+1 (555) 123-4567",
    dueDate: "2024-01-16",
    assignedTo: "Sarah Johnson",
    done: false
  },
  {
    id: "2",
    leadName: "Michael Brown",
    emailAddress: "m.brown@digitalcorp.com",
    phoneNumber: "+1 (555) 234-5678",
    dueDate: "2024-01-17",
    assignedTo: "David Wilson",
    done: false
  },
  {
    id: "3",
    leadName: "Emma Wilson",
    emailAddress: "emma.wilson@startupinc.com",
    phoneNumber: "+1 (555) 345-6789",
    dueDate: "2024-01-15",
    assignedTo: "Sarah Johnson",
    done: true
  },
  {
    id: "4",
    leadName: "Robert Davis",
    emailAddress: "robert.davis@enterprise.com",
    phoneNumber: "+1 (555) 456-7890",
    dueDate: "2024-01-18",
    assignedTo: "David Wilson",
    done: false
  }
];


export function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    leadName: "",
    emailAddress: "",
    phoneNumber: "",
    dueDate: "",
    assignedTo: ""
  });

  const handleAddTask = () => {
    if (newTask.leadName && newTask.emailAddress && newTask.dueDate) {
      const task: Task = {
        ...newTask,
        id: Date.now().toString(),
        done: false
      };
      setTasks([task, ...tasks]);
      setNewTask({
        leadName: "",
        emailAddress: "",
        phoneNumber: "",
        dueDate: "",
        assignedTo: ""
      });
      setIsDialogOpen(false);
    }
  };

  const toggleTaskDone = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, done: !task.done } : task
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Tasks</h1>
          <p className="text-muted-foreground">
            {tasks.filter(t => t.done).length}/{tasks.length} tasks completed
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lead-name">Lead Name *</Label>
                <Input
                  id="lead-name"
                  value={newTask.leadName}
                  onChange={(e) => setNewTask({ ...newTask, leadName: e.target.value })}
                  placeholder="Enter lead name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newTask.emailAddress}
                  onChange={(e) => setNewTask({ ...newTask, emailAddress: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={newTask.phoneNumber}
                  onChange={(e) => setNewTask({ ...newTask, phoneNumber: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date *</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assigned-to">Assigned To</Label>
                  <Input
                    id="assigned-to"
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                    placeholder="Assign to agent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleAddTask} className="flex-1">
                  Add Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead Name</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="w-[100px]">Done</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id} className={task.done ? "opacity-60" : ""}>
                  <TableCell className={`font-medium ${task.done ? "line-through" : ""}`}>
                    {task.leadName}
                  </TableCell>
                  <TableCell className={task.done ? "line-through" : ""}>
                    {task.emailAddress}
                  </TableCell>
                  <TableCell className={task.done ? "line-through" : ""}>
                    {task.phoneNumber}
                  </TableCell>
                  <TableCell className={task.done ? "line-through" : ""}>
                    {new Date(task.dueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className={task.done ? "line-through" : ""}>
                    {task.assignedTo}
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={task.done}
                      onCheckedChange={() => toggleTaskDone(task.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}