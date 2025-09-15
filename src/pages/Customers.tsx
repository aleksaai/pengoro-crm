import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Mail, Phone, UserCheck, Filter, Plus, Trash2, Euro, MoreHorizontal, X, Repeat } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { useCustomerProducts } from "@/hooks/useCustomerProducts";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useProfiles } from "@/hooks/useProfiles";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AddCustomerProductDialog } from "@/components/crm/AddCustomerProductDialog";
import { LeadDetailsModal } from "@/components/crm/LeadDetailsModal";
import { CustomerProductsBreakdown } from "@/components/crm/CustomerProductsBreakdown";

export default function Customers() {
  const [selectedCustomer, setSelectedCustomer] = useState<Lead | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<Array<{id: string, full_name: string, email: string}>>([]);
  const [customerTimelines, setCustomerTimelines] = useState<Map<string, {createdAt: string, closedAt: string, cycleDuration: string}>>(new Map());
  const { leads, updateLead, createLead } = useLeads();
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const { profiles } = useProfiles();
  const { preferences, loading: preferencesLoading, updatePreference, getPreference } = useUserPreferences();
  const { toast } = useToast();
  const { 
    products, 
    loading: productsLoading, 
    getProductsByCustomerId, 
    getTotalCommissionByCustomerId, 
    getTotalMonthlyContributionByCustomerId,
    deleteProduct,
    refetch: refetchProducts 
  } = useCustomerProducts();

  // Get current user's profile
  const currentProfile = profiles.find(p => p.user_id === user?.id);
  
  // Initialize filters with user preferences or defaults
  const getDefaultSearchTerm = () => getPreference('customers_searchTerm', '');
  const getDefaultSelectedAgent = () => {
    const saved = getPreference('customers_selectedAgent', null);
    // If no saved preference and user is not super admin, default to their own customers
    if (saved === null && !isSuperAdmin && currentProfile?.full_name) {
      return currentProfile.full_name;
    }
    return saved || 'all';
  };
  
  const [searchTerm, setSearchTerm] = useState<string>(getDefaultSearchTerm());
  const [selectedAgent, setSelectedAgent] = useState<string>(getDefaultSelectedAgent());

  // Filter customers (leads with status "Won")
  const customers = leads.filter(lead => lead.status === "Won");

  // Update filters when preferences load
  useEffect(() => {
    if (!preferencesLoading) {
      setSearchTerm(getDefaultSearchTerm());
      setSelectedAgent(getDefaultSelectedAgent());
    }
  }, [preferencesLoading, preferences, currentProfile?.full_name, isSuperAdmin]);

  // Save filter preferences when they change
  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    updatePreference('customers_searchTerm', value);
  };

  const handleSelectedAgentChange = (value: string) => {
    setSelectedAgent(value);
    updatePreference('customers_selectedAgent', value);
  };

  // Fetch customer timeline data
  useEffect(() => {
    const fetchCustomerTimelines = async () => {
      if (customers.length === 0) return;

      const timelineMap = new Map();

      for (const customer of customers) {
        try {
          // Get the history entry where the lead was marked as "Won"
          const { data: winHistory } = await supabase
            .from('lead_history')
            .select('created_at, new_values')
            .eq('lead_id', customer.id)
            .or('action.eq.Lead updated,action.eq.Lead status changed')
            .order('created_at', { ascending: true });

          // Find when the status changed to "Won"
          let closedAt = customer.updated_at; // fallback to updated_at if we can't find exact history
          
          if (winHistory) {
            const wonEntry = winHistory.find(entry => {
              if (entry.new_values && typeof entry.new_values === 'object') {
                const newValues = entry.new_values as Record<string, any>;
                return newValues.status === 'Won';
              }
              return false;
            });
            
            if (wonEntry) {
              closedAt = wonEntry.created_at;
            }
          }

          const createdDate = new Date(customer.created_at);
          const closedDate = new Date(closedAt);
          const diffTime = Math.abs(closedDate.getTime() - createdDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          let cycleDuration: string;
          if (diffDays === 0) {
            cycleDuration = "Same day";
          } else if (diffDays === 1) {
            cycleDuration = "1 day";
          } else if (diffDays < 7) {
            cycleDuration = `${diffDays} days`;
          } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            const remainingDays = diffDays % 7;
            if (weeks === 1 && remainingDays === 0) {
              cycleDuration = "1 week";
            } else if (remainingDays === 0) {
              cycleDuration = `${weeks} weeks`;
            } else {
              cycleDuration = `${weeks}w ${remainingDays}d`;
            }
          } else {
            const months = Math.floor(diffDays / 30);
            const remainingDays = diffDays % 30;
            if (months === 1 && remainingDays === 0) {
              cycleDuration = "1 month";
            } else if (remainingDays === 0) {
              cycleDuration = `${months} months`;
            } else {
              cycleDuration = `${months}m ${Math.floor(remainingDays / 7)}w`;
            }
          }

          timelineMap.set(customer.id, {
            createdAt: customer.created_at,
            closedAt: closedAt,
            cycleDuration: cycleDuration
          });

        } catch (error) {
          console.error(`Error fetching timeline for customer ${customer.id}:`, error);
        }
      }

      setCustomerTimelines(timelineMap);
    };

    fetchCustomerTimelines();
  }, [customers]);

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

  const handleNewDeal = async (customer: Lead) => {
    try {
      // Create a new lead with the customer's details for the sales pipeline
      const newLeadData = {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        source: "Existing Customer - New Deal",
        status: "Discovery Call Booked" as const,
        assigned_to: customer.assigned_to,
        interested_products: customer.interested_products,
        age: customer.age,
        net_salary: customer.net_salary,
        gross_salary: customer.gross_salary
      };

      await createLead(newLeadData);
      
      // Add specific history entry for existing customer upsell
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userData.user?.id)
        .single();

      // Find the newly created lead to get its ID
      const { data: newLead } = await supabase
        .from('leads')
        .select('id')
        .eq('email', customer.email)
        .eq('status', 'Discovery Call Booked')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (newLead) {
        await supabase.from('lead_history').insert({
          lead_id: newLead.id,
          action: 'Upsell Creation',
          details: 'Lead is an existing customer and is an upsale creation',
          user_name: profile?.full_name || userData.user?.email || 'Unknown User',
          created_by: userData.user?.id,
        });
      }
      
      toast({
        title: "Success",
        description: "New deal created in sales pipeline",
      });
      
    } catch (error) {
      console.error('Error creating new deal:', error);
      toast({
        title: "Error",
        description: "Failed to create new deal",
        variant: "destructive",
      });
    }
  };

  const handleStorno = async (customer: Lead) => {
    try {
      await updateLead(customer.id, { status: "Lost" });
      
      // Log the storno action in history with proper abandon reason
      await supabase.from('lead_history').insert({
        lead_id: customer.id,
        action: 'Lead Abandoned',
        details: 'Reason: Customer Storno - Customer cancelled after conversion',
        old_values: { status: 'Won' },
        new_values: { status: 'Lost' }
      });
      
      console.log('Customer cancelled successfully');
    } catch (error) {
      console.error('Error cancelling customer:', error);
    }
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
              onChange={(e) => handleSearchTermChange(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={selectedAgent} onValueChange={handleSelectedAgentChange}>
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
              <TableHead className="font-semibold">Created</TableHead>
              <TableHead className="font-semibold">Closed</TableHead>
              <TableHead className="font-semibold">Cycle</TableHead>
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
                const timeline = customerTimelines.get(customer.id);
                
                return (
                  <TableRow 
                    key={customer.id} 
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell>
                      <div className="font-medium">{customer.name}</div>
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
                      <CustomerProductsBreakdown 
                        customer={customer}
                        onDeleteProduct={handleDeleteProduct}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {timeline ? new Date(timeline.createdAt).toLocaleDateString('de-DE') : new Date(customer.created_at).toLocaleDateString('de-DE')}
                      </div>
                      <div className="text-xs text-muted-foreground">Lead created</div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {timeline ? new Date(timeline.closedAt).toLocaleDateString('de-DE') : new Date(customer.updated_at).toLocaleDateString('de-DE')}
                      </div>
                      <div className="text-xs text-muted-foreground">Converted</div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm font-medium text-primary">
                        {timeline?.cycleDuration || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground">Sales cycle</div>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border z-50">
                          <AddCustomerProductDialog 
                            customer={customer} 
                            onProductAdded={() => refetchProducts()}
                            trigger={
                              <DropdownMenuItem 
                                className="cursor-pointer"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Product
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuItem 
                            onClick={() => handleNewDeal(customer)}
                            className="cursor-pointer"
                          >
                            <Repeat className="mr-2 h-4 w-4" />
                            New Deal
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleCustomerClick(customer)}
                            className="cursor-pointer"
                          >
                            View Customer
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStorno(customer)}
                            className="cursor-pointer text-destructive"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Storno
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12">
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