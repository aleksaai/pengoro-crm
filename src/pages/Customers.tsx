import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Mail, Phone, UserCheck, Filter, Plus, Trash2, Euro } from "lucide-react";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { useCustomerProducts } from "@/hooks/useCustomerProducts";
import { supabase } from "@/integrations/supabase/client";
import { AddCustomerProductDialog } from "@/components/crm/AddCustomerProductDialog";
import { LeadDetailsModal } from "@/components/crm/LeadDetailsModal";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Lead | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<Array<{id: string, full_name: string, email: string}>>([]);
  const { leads, updateLead } = useLeads();
  const { 
    products, 
    loading: productsLoading, 
    getProductsByCustomerId, 
    getTotalCommissionByCustomerId, 
    getTotalMonthlyContributionByCustomerId,
    deleteProduct,
    refetch: refetchProducts 
  } = useCustomerProducts();

  // Fetch registered users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .order('full_name');
        
        if (error) throw error;
        
        const users = (data || []).map(user => ({
          id: user.user_id,
          full_name: user.full_name || user.email || 'Unknown User',
          email: user.email || ''
        }));
        
        setRegisteredUsers(users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  // Get unique agents from registered users
  const uniqueAgents = registeredUsers.map(user => user.full_name).filter(Boolean);

  // Filter customers (leads with status "Won")
  const customers = leads.filter(lead => lead.status === "Won");

  // Apply search and agent filters
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.interested_products?.some(product => 
        product.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesAgent = selectedAgent === "all" || customer.assigned_to === selectedAgent;
    
    return matchesSearch && matchesAgent;
  });

  const handleCustomerClick = (customer: Lead) => {
    setSelectedCustomer(customer);
  };

  const handleDeleteProduct = async (productId: string) => {
    await deleteProduct(productId);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">
            {filteredCustomers.length} customers found
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {uniqueAgents.map((agent) => (
                <SelectItem key={agent} value={agent}>
                  {agent}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="border rounded-lg overflow-hidden bg-background">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Customer</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Agent</TableHead>
              <TableHead className="font-semibold">Products</TableHead>
              <TableHead className="font-semibold text-right">Monthly</TableHead>
              <TableHead className="font-semibold text-right">Commission</TableHead>
              <TableHead className="font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => {
                const customerProducts = getProductsByCustomerId(customer.id);
                const totalCommission = getTotalCommissionByCustomerId(customer.id);
                const totalMonthly = getTotalMonthlyContributionByCustomerId(customer.id);
                
                return (
                  <TableRow 
                    key={customer.id} 
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{customer.name}</div>
                        <Badge variant="secondary" className="text-xs">
                          Customer
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <span className="text-sm font-medium">{customer.assigned_to}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1 max-w-[250px]">
                        {customerProducts.length > 0 ? (
                          <>
                            {customerProducts.slice(0, 2).map((product) => (
                              <div key={product.id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                                    {product.product_name}
                                  </Badge>
                                  <span className="text-muted-foreground truncate">
                                    {product.provider_company}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-2 h-2" />
                                </Button>
                              </div>
                            ))}
                            {customerProducts.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{customerProducts.length - 2} more
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-xs text-muted-foreground">No products</div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="font-medium">€{totalMonthly.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">per month</div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="font-medium text-green-600">€{totalCommission.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">earned</div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <AddCustomerProductDialog 
                          customer={customer} 
                          onProductAdded={() => refetchProducts()} 
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCustomerClick(customer)}
                          className="h-8 px-2"
                        >
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <UserCheck className="w-12 h-12 text-muted-foreground/50" />
                    <div className="text-muted-foreground">
                      {searchTerm || selectedAgent !== "all" 
                        ? "No customers found matching your filters" 
                        : "No customers yet"}
                    </div>
                    {(!searchTerm && selectedAgent === "all") && (
                      <div className="text-sm text-muted-foreground">
                        Start converting leads in your sales pipeline!
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <LeadDetailsModal 
          lead={selectedCustomer} 
          open={!!selectedCustomer}
          onOpenChange={(open) => !open && setSelectedCustomer(null)}
          onUpdateLead={async (leadId: string, updates: Partial<Lead>) => {
            await updateLead(leadId, updates);
          }}
          pipelineType="leads"
        />
      )}
    </div>
  );
}