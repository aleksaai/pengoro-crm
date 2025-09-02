import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Check, ChevronsUpDown } from "lucide-react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// Task interface is now imported from useTasks hook


export function TaskManagement() {
  const { tasks, loading: tasksLoading, createTask, updateTask } = useTasks();
  const { leads, loading: leadsLoading } = useLeads();
  const { profiles, loading: profilesLoading } = useProfiles();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<string>("");
  const [leadSearchOpen, setLeadSearchOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    dueDate: "",
    assignedTo: ""
  });

  const selectedLeadData = leads.find(lead => lead.id === selectedLead);

  const handleAddTask = async () => {
    if (!selectedLead || !newTask.dueDate) {
      toast({
        title: "Missing Information",
        description: "Please select a lead and set a due date.",
        variant: "destructive"
      });
      return;
    }

    const leadData = leads.find(lead => lead.id === selectedLead);
    if (!leadData) {
      toast({
        title: "Invalid Lead",
        description: "Selected lead not found in database.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createTask({
        lead_id: selectedLead,
        lead_name: leadData.name,
        email_address: leadData.email,
        phone_number: leadData.phone || "",
        due_date: newTask.dueDate,
        assigned_to: newTask.assignedTo,
        done: false
      });

      setSelectedLead("");
      setNewTask({
        dueDate: "",
        assignedTo: ""
      });
      setIsDialogOpen(false);
      
      toast({
        title: "Task Created",
        description: "Task has been successfully created."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task.",
        variant: "destructive"
      });
    }
  };

  const toggleTaskDone = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await updateTask(taskId, { done: !task.done });
    }
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
                <Label>Lead *</Label>
                <Popover open={leadSearchOpen} onOpenChange={setLeadSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={leadSearchOpen}
                      className="w-full justify-between"
                    >
                      {selectedLeadData ? selectedLeadData.name : "Select lead..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search leads..." />
                      <CommandList>
                        <CommandEmpty>No leads found.</CommandEmpty>
                        <CommandGroup>
                          {leads.map((lead) => (
                            <CommandItem
                              key={lead.id}
                              value={lead.id}
                              onSelect={(currentValue) => {
                                setSelectedLead(currentValue === selectedLead ? "" : currentValue);
                                setLeadSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedLead === lead.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{lead.name}</span>
                                <span className="text-sm text-muted-foreground">{lead.email}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedLeadData && (
                <div className="space-y-2">
                  <Label>Selected Lead Details</Label>
                  <div className="rounded-md border p-2 text-sm">
                    <div><strong>Email:</strong> {selectedLeadData.email}</div>
                    <div><strong>Phone:</strong> {selectedLeadData.phone || "Not provided"}</div>
                  </div>
                </div>
              )}

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
                  <Label>Assigned To</Label>
                  <Select
                    value={newTask.assignedTo}
                    onValueChange={(value) => setNewTask({ ...newTask, assignedTo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.full_name || profile.email}>
                          {profile.full_name || profile.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    {task.lead_name}
                  </TableCell>
                  <TableCell className={task.done ? "line-through" : ""}>
                    {task.email_address}
                  </TableCell>
                  <TableCell className={task.done ? "line-through" : ""}>
                    {task.phone_number}
                  </TableCell>
                  <TableCell className={task.done ? "line-through" : ""}>
                    {new Date(task.due_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className={task.done ? "line-through" : ""}>
                    {task.assigned_to}
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