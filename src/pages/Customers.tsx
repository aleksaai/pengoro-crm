import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Mail, Phone, Calendar, Tag, UserCheck, Filter } from "lucide-react";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";
import { LeadDetailsModal } from "@/components/crm/LeadDetailsModal";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<Array<{id: string, full_name: string, email: string}>>([]);
  const { leads, updateLead } = useLeads();

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
    setSelectedLead(customer);
  };

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    await updateLead(leadId, updates);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{filteredCustomers.length}</div>
          <div className="text-sm text-muted-foreground">Total Customers</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{customers.length}</div>
          <div className="text-sm text-muted-foreground">All Time Customers</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-primary">
            {uniqueAgents.length > 0 ? Math.round((customers.length / uniqueAgents.length) * 10) / 10 : 0}
          </div>
          <div className="text-sm text-muted-foreground">Avg per Agent</div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="glass-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-glass-border/30">
                <TableHead className="font-semibold">Customer</TableHead>
                <TableHead className="font-semibold">Contact</TableHead>
                <TableHead className="font-semibold">Assigned To</TableHead>
                <TableHead className="font-semibold">Products</TableHead>
                <TableHead className="font-semibold">Converted Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <TableRow 
                    key={customer.id} 
                    className="border-glass-border/20 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => handleCustomerClick(customer)}
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{customer.name}</div>
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Customer
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate max-w-48">{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                      <div className="flex flex-wrap gap-1">
                        {customer.interested_products?.slice(0, 3).map(product => (
                          <Badge key={product} variant="outline" className="text-xs">
                            <Tag className="w-2 h-2 mr-1" />
                            {product}
                          </Badge>
                        ))}
                        {customer.interested_products && customer.interested_products.length > 3 && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            +{customer.interested_products.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(customer.updated_at).toLocaleDateString('de-DE')}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
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
      </div>

      {/* Customer Details Modal */}
      <LeadDetailsModal 
        lead={selectedLead} 
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
        onUpdateLead={handleUpdateLead}
        pipelineType="leads"
      />
    </div>
  );
}