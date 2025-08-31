import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Lead } from "@/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.source) {
      onAddLead(formData);
      setFormData({
        name: "",
        email: "",
        phone: "",
        source: "",
        status: "New",
        assigned_to: "",
        interested_products: []
      });
      onOpenChange(false);
    }
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
      <DialogContent className="glass-strong border-glass-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add New Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-input/50 border-glass-border"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-input/50 border-glass-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Lead Source *</Label>
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

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assigned To</Label>
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

          <div className="space-y-2">
            <Label>Products Interested In</Label>
            <div className="flex flex-wrap gap-2">
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

          <div className="flex gap-3 pt-4">
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