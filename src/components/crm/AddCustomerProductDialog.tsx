import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useCustomerProducts } from "@/hooks/useCustomerProducts";
import { Lead } from "@/hooks/useLeads";

interface AddCustomerProductDialogProps {
  customer: Lead;
  onProductAdded?: () => void;
}

const PRODUCT_OPTIONS = [
  "PKV", "PAV", "Investments", "BU", "Life Insurance", "Property Insurance", "Health Insurance"
];

const PROVIDER_OPTIONS = [
  "Allianz", "AXA", "Munich Re", "Generali", "Zurich", "HDI", "R+V", "DEVK", "Other"
];

export function AddCustomerProductDialog({ customer, onProductAdded }: AddCustomerProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_name: "",
    provider_company: "",
    monthly_contribution: "",
    commission_earned: "",
    start_date: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const { addProduct } = useCustomerProducts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_name || !formData.provider_company) return;

    setLoading(true);
    try {
      await addProduct({
        customer_id: customer.id,
        product_name: formData.product_name,
        provider_company: formData.provider_company,
        monthly_contribution: parseFloat(formData.monthly_contribution) || 0,
        commission_earned: parseFloat(formData.commission_earned) || 0,
        start_date: formData.start_date || null,
        notes: formData.notes || null,
      });

      setFormData({
        product_name: "",
        provider_company: "",
        monthly_contribution: "",
        commission_earned: "",
        start_date: "",
        notes: "",
      });
      setOpen(false);
      onProductAdded?.();
    } catch (error) {
      console.error('Error adding product:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Product for {customer.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product_name">Product Name *</Label>
            <Select
              value={formData.product_name}
              onValueChange={(value) => setFormData(prev => ({ ...prev, product_name: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_OPTIONS.map(product => (
                  <SelectItem key={product} value={product}>{product}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider_company">Provider Company *</Label>
            <Select
              value={formData.provider_company}
              onValueChange={(value) => setFormData(prev => ({ ...prev, provider_company: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map(provider => (
                  <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly_contribution">Monthly Contribution (€)</Label>
              <Input
                id="monthly_contribution"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.monthly_contribution}
                onChange={(e) => setFormData(prev => ({ ...prev, monthly_contribution: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission_earned">Commission Earned (€)</Label>
              <Input
                id="commission_earned"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.commission_earned}
                onChange={(e) => setFormData(prev => ({ ...prev, commission_earned: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.product_name || !formData.provider_company}>
              {loading ? "Adding..." : "Add Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}