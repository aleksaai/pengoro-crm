import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Mail, Phone, UserCheck, Filter, Euro, TrendingUp, Package, Plus, Trash2, Edit } from "lucide-react";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { useCustomerProducts } from "@/hooks/useCustomerProducts";
import { supabase } from "@/integrations/supabase/client";
import { AddCustomerProductDialog } from "@/components/crm/AddCustomerProductDialog";

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

  const getTotalCommissionEarned = () => {
    return customers.reduce((total, customer) => {
      return total + getTotalCommissionByCustomerId(customer.id);
    }, 0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-green-600" />
            Customers
          </h1>
          <p className="text-muted-foreground mt-1">
            All successfully converted leads and customers
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents ({filteredCustomers.length})</SelectItem>
                {uniqueAgents.map((agent) => {
                  const agentCustomerCount = customers.filter(customer => customer.assigned_to === agent).length;
                  return (
                    <SelectItem key={agent} value={agent}>
                      {agent} ({agentCustomerCount})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{filteredCustomers.length}</div>
            <p className="text-xs text-muted-foreground">Currently filtered</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">€{getTotalCommissionEarned().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{products.length}</div>
            <p className="text-xs text-muted-foreground">Total sold products</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Agent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {uniqueAgents.length > 0 ? Math.round((customers.length / uniqueAgents.length) * 10) / 10 : 0}
            </div>
            <p className="text-xs text-muted-foreground">Customers per agent</p>
          </CardContent>
        </Card>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => {
            const customerProducts = getProductsByCustomerId(customer.id);
            const totalCommission = getTotalCommissionByCustomerId(customer.id);
            const totalMonthly = getTotalMonthlyContributionByCustomerId(customer.id);
            
            return (
              <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{customer.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <UserCheck className="w-3 h-3 mr-1" />
                      Customer
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="font-medium">{customer.assigned_to}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Financial Summary */}
                  <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">€{totalCommission.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Commission Earned</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">€{totalMonthly.toLocaleString()}/mo</div>
                      <div className="text-xs text-muted-foreground">Monthly Contribution</div>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Products ({customerProducts.length})</h4>
                      <AddCustomerProductDialog 
                        customer={customer} 
                        onProductAdded={() => refetchProducts()} 
                      />
                    </div>
                    
                    {customerProducts.length > 0 ? (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {customerProducts.map((product) => (
                          <div key={product.id} className="flex items-center justify-between p-2 border rounded-md">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {product.product_name}
                                </Badge>
                                <span className="text-xs text-muted-foreground truncate">
                                  {product.provider_company}
                                </span>
                              </div>
                              <div className="flex gap-4 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  €{product.monthly_contribution}/mo
                                </span>
                                <span className="text-xs text-green-600 font-medium">
                                  €{product.commission_earned} comm.
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProduct(product.id);
                              }}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        No products added yet
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleCustomerClick(customer)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <UserCheck className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <div className="text-lg font-medium text-muted-foreground">
              {searchTerm || selectedAgent !== "all" 
                ? "No customers found matching your filters" 
                : "No customers yet"}
            </div>
            {(!searchTerm && selectedAgent === "all") && (
              <div className="text-sm text-muted-foreground mt-1">
                Start converting leads in your sales pipeline!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}