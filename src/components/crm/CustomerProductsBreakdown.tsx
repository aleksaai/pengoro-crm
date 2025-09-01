import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Euro, Building, Calendar, FileText } from "lucide-react";
import { useCustomerProducts, type CustomerProduct } from "@/hooks/useCustomerProducts";
import { type Lead } from "@/hooks/useLeads";

interface CustomerProductsBreakdownProps {
  customer: Lead;
  onDeleteProduct?: (productId: string) => void;
}

export function CustomerProductsBreakdown({ customer, onDeleteProduct }: CustomerProductsBreakdownProps) {
  const [open, setOpen] = useState(false);
  const { 
    getProductsByCustomerId, 
    getTotalCommissionByCustomerId, 
    getTotalMonthlyContributionByCustomerId 
  } = useCustomerProducts();

  const customerProducts = getProductsByCustomerId(customer.id);
  const totalCommission = getTotalCommissionByCustomerId(customer.id);
  const totalMonthly = getTotalMonthlyContributionByCustomerId(customer.id);

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
                  {customerProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Badge variant="secondary" className="font-medium">
                          {product.product_name}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{product.provider_company}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {product.start_date ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{new Date(product.start_date).toLocaleDateString('de-DE')}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not set</span>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 font-medium">
                          <Euro className="w-4 h-4 text-muted-foreground" />
                          {product.monthly_contribution.toLocaleString()}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 font-medium text-green-600">
                          <Euro className="w-4 h-4" />
                          {product.commission_earned.toLocaleString()}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {product.notes ? (
                          <div className="flex items-center gap-2 max-w-[200px]">
                            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate" title={product.notes}>
                              {product.notes}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No notes</span>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-center">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}