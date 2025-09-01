import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Euro, Building, Calendar, FileText, Edit2, Check, X } from "lucide-react";
import { useCustomerProducts, type CustomerProduct } from "@/hooks/useCustomerProducts";
import { type Lead } from "@/hooks/useLeads";
import { toast } from "@/hooks/use-toast";

interface CustomerProductsBreakdownProps {
  customer: Lead;
  onDeleteProduct?: (productId: string) => void;
}

export function CustomerProductsBreakdown({ customer, onDeleteProduct }: CustomerProductsBreakdownProps) {
  const [open, setOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CustomerProduct>>({});
  const { 
    getProductsByCustomerId, 
    getTotalCommissionByCustomerId, 
    getTotalMonthlyContributionByCustomerId,
    updateProduct
  } = useCustomerProducts();

  const customerProducts = getProductsByCustomerId(customer.id);
  const totalCommission = getTotalCommissionByCustomerId(customer.id);
  const totalMonthly = getTotalMonthlyContributionByCustomerId(customer.id);

  const handleEditStart = (product: CustomerProduct) => {
    setEditingProductId(product.id);
    setEditForm({
      product_name: product.product_name,
      provider_company: product.provider_company,
      start_date: product.start_date,
      monthly_contribution: product.monthly_contribution,
      commission_earned: product.commission_earned,
      notes: product.notes || ''
    });
  };

  const handleEditCancel = () => {
    setEditingProductId(null);
    setEditForm({});
  };

  const handleEditSave = async () => {
    if (!editingProductId || !editForm) return;

    try {
      await updateProduct(editingProductId, editForm);
      setEditingProductId(null);
      setEditForm({});
      toast({
        title: "Product updated",
        description: "Product details have been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (customerProducts.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">No products</div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-6 text-xs">
          View {customerProducts.length} products
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            {customer.name}'s Products
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Products</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{customerProducts.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Monthly Contribution</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-primary">€{totalMonthly.toLocaleString()}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Commission</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-green-600">€{totalCommission.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead className="text-right">Monthly</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerProducts.map((product) => {
                    const isEditing = editingProductId === product.id;
                    
                    return (
                      <TableRow key={product.id}>
                        {/* Product Name */}
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editForm.product_name || ''}
                              onChange={(e) => setEditForm({...editForm, product_name: e.target.value})}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <Badge variant="secondary" className="font-medium">
                              {product.product_name}
                            </Badge>
                          )}
                        </TableCell>
                        
                        {/* Provider Company */}
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editForm.provider_company || ''}
                              onChange={(e) => setEditForm({...editForm, provider_company: e.target.value})}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{product.provider_company}</span>
                            </div>
                          )}
                        </TableCell>
                        
                        {/* Start Date */}
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="date"
                              value={editForm.start_date || ''}
                              onChange={(e) => setEditForm({...editForm, start_date: e.target.value})}
                              className="h-8 text-sm"
                            />
                          ) : (
                            product.start_date ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>{new Date(product.start_date).toLocaleDateString('de-DE')}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not set</span>
                            )
                          )}
                        </TableCell>
                        
                        {/* Monthly Contribution */}
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editForm.monthly_contribution || ''}
                              onChange={(e) => setEditForm({...editForm, monthly_contribution: parseFloat(e.target.value) || 0})}
                              className="h-8 text-sm w-24 ml-auto"
                            />
                          ) : (
                            <div className="flex items-center justify-end gap-1 font-medium">
                              <Euro className="w-4 h-4 text-muted-foreground" />
                              {product.monthly_contribution.toLocaleString()}
                            </div>
                          )}
                        </TableCell>
                        
                        {/* Commission */}
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editForm.commission_earned || ''}
                              onChange={(e) => setEditForm({...editForm, commission_earned: parseFloat(e.target.value) || 0})}
                              className="h-8 text-sm w-24 ml-auto"
                            />
                          ) : (
                            <div className="flex items-center justify-end gap-1 font-medium text-green-600">
                              <Euro className="w-4 h-4" />
                              {product.commission_earned.toLocaleString()}
                            </div>
                          )}
                        </TableCell>
                        
                        {/* Notes */}
                        <TableCell>
                          {isEditing ? (
                            <Textarea
                              value={editForm.notes || ''}
                              onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                              className="h-16 text-sm resize-none"
                              placeholder="Add notes..."
                            />
                          ) : (
                            product.notes ? (
                              <div className="flex items-center gap-2 max-w-[200px]">
                                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm truncate" title={product.notes}>
                                  {product.notes}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No notes</span>
                            )
                          )}
                        </TableCell>
                        
                        {/* Actions */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleEditSave}
                                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleEditCancel}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditStart(product)}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                {onDeleteProduct && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onDeleteProduct(product.id)}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}