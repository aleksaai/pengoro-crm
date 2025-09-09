import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Lead } from "@/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'created_by'>, taskData: {title: string; description?: string; due_date: string}) => void;
}

const productOptions = ["PKV", "PAV", "Investments", "Insurances", "Real Estate"];
const sourceOptions = ["Meta Ads", "Website", "Referral", "LinkedIn", "Email Campaign", "Manual"];

export function AddLeadDialog({ open, onOpenChange, onAddLead }: AddLeadDialogProps) {
  const [registeredUsers, setRegisteredUsers] = useState<Array<{id: string, full_name: string, email: string}>>([]);
  const { toast } = useToast();

  // Fetch registered users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .order('full_name');

        if (error) throw error;

        const users = data?.map(profile => ({
          id: profile.user_id,
          full_name: profile.full_name || profile.email || 'Unknown User',
          email: profile.email || ''
        })) || [];

        setRegisteredUsers(users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (open) {
      fetchUsers();
    }
  }, [open]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    source: "",
    status: "New",
    assigned_to: "",
    interested_products: [] as string[]
  });

  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    due_date: undefined as Date | undefined,
    due_time: "09:00"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.source || !taskData.title || !taskData.due_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields including task details.",
        variant: "destructive",
      });
      return;
    }

    const taskFormData = {
      title: taskData.title,
      description: taskData.description || undefined,
      due_date: format(new Date(`${format(taskData.due_date, 'yyyy-MM-dd')}T${taskData.due_time}`), 'yyyy-MM-dd HH:mm:ssXXX')
    };

    onAddLead(formData, taskFormData);
    
    // Reset forms
    setFormData({
      name: "",
      email: "",
      phone: "",
      source: "",
      status: "New",
      assigned_to: "",
      interested_products: []
    });
    setTaskData({
      title: "",
      description: "",
      due_date: undefined,
      due_time: "09:00"
    });
    onOpenChange(false);
  };

  const toggleProduct = (product: string) => {
    setFormData(prev => ({
      ...prev,
      interested_products: prev.interested_products.includes(product)
        ? prev.interested_products.filter(p => p !== product)
        : [...prev.interested_products, product]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-glass-border max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">Add New Lead</DialogTitle>
        </DialogHeader>
        <form id="add-lead-form" onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-3 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-sm">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-input/50 border-glass-border"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-input/50 border-glass-border"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-sm">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-input/50 border-glass-border"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="source" className="text-sm">Lead Source *</Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                <SelectTrigger className="bg-input/50 border-glass-border">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-glass-border">
                  {sourceOptions.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="assigned_to" className="text-sm">Assigned To</Label>
            <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
              <SelectTrigger className="bg-input/50 border-glass-border">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent className="glass-strong border-glass-border bg-background shadow-lg z-50">
                {registeredUsers.length > 0 ? (
                  registeredUsers.map(user => (
                    <SelectItem key={user.id} value={user.full_name}>{user.full_name}</SelectItem>
                  ))
                ) : (
                  <SelectItem disabled value="none">No users available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Products Interested In</Label>
            <div className="flex flex-wrap gap-1">
              {productOptions.map(product => {
                const isSelected = formData.interested_products.includes(product);
                return (
                  <Badge
                    key={product}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                    onClick={() => toggleProduct(product)}
                  >
                    {product}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="border-t pt-3 space-y-3">
            <Label className="text-sm font-medium">Initial Task (Required)</Label>
            
            <div className="space-y-1">
              <Label htmlFor="task-title" className="text-sm">Task Title *</Label>
              <Input
                id="task-title"
                value={taskData.title}
                onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                placeholder="Enter initial task title..."
                className="bg-input/50 border-glass-border"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-description" className="text-sm">Task Description</Label>
              <Textarea
                id="task-description"
                value={taskData.description}
                onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                placeholder="Enter task description... (optional)"
                className="bg-input/50 border-glass-border resize-none h-16"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">Task Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-input/50 border-glass-border",
                        !taskData.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {taskData.due_date ? format(taskData.due_date, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={taskData.due_date}
                      onSelect={(date) => setTaskData({ ...taskData, due_date: date })}
                      initialFocus
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-due-time" className="text-sm">Task Due Time *</Label>
                <Input
                  id="task-due-time"
                  type="time"
                  value={taskData.due_time}
                  onChange={(e) => setTaskData({ ...taskData, due_time: e.target.value })}
                  className="bg-input/50 border-glass-border"
                  required
                />
              </div>
            </div>
          </div>

            </div>
          </ScrollArea>
          <div className="flex gap-3 pt-3 border-t flex-shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary-hover">
              Add Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}