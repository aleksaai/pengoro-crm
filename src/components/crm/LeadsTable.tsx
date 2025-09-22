import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Filter, Plus, Upload, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddLeadDialog } from "./AddLeadDialog";
import { MassUploadDialog } from "./MassUploadDialog";
import { LeadRowActions } from "./LeadRowActions";
import { LeadDetailsModal } from "./LeadDetailsModal";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { useTasks } from "@/hooks/useTasks";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getTaskSortingPriority } from "@/lib/utils";

export interface LeadHistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
}

export { type Lead };

const getSourceBadgeClass = (source: string) => {
  switch (source) {
    case "Meta Ads": return "source-meta";
    case "Website": return "source-website";
    case "Referral": return "source-referral";
    case "LinkedIn": return "source-referral";
    case "Email Campaign": return "source-website";
    default: return "source-manual";
  }
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "New": return "status-new";
    case "Contacted": return "status-contacted";
    case "Qualified": return "status-qualified";
    default: return "status-new";
  }
};

export function LeadsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showMassUpload, setShowMassUpload] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [registeredUsers, setRegisteredUsers] = useState<Array<{id: string, full_name: string, email: string}>>([]);
  const { leads, loading, createLead, updateLead } = useLeads();
  const { toast } = useToast();
  const { tasks: allTasks } = useTasks();

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
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        });
      }
    };

    fetchUsers();
  }, [toast]);

  // Get unique agents from registered users only
  const uniqueAgents = registeredUsers.map(user => user.full_name).filter(Boolean);

  // Filter leads by search term and selected agent, then sort by task urgency
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    
    const matchesAgent = selectedAgent === "all" || lead.assigned_to === selectedAgent;
    
    return matchesSearch && matchesAgent;
  }).sort((a, b) => {
    const aTasksForLead = allTasks.filter(task => task.lead_id === a.id);
    const bTasksForLead = allTasks.filter(task => task.lead_id === b.id);
    
    const aPriority = getTaskSortingPriority(aTasksForLead);
    const bPriority = getTaskSortingPriority(bTasksForLead);
    
    // First sort by priority (lower number = higher priority)
    if (aPriority.priority !== bPriority.priority) {
      return aPriority.priority - bPriority.priority;
    }
    
    // If same priority, sort by due time (earlier time first)
    return aPriority.dueTime - bPriority.dueTime;
  });

  const totalLeads = leads.length;

  const handleAddLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'created_by'>, taskData: {title: string; description?: string; due_date: string}) => {
    try {
      // First create the lead
      const newLead = await createLead(leadData);
      
      if (newLead) {
        // Then create the initial task for the lead
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        
        if (user) {
          const taskPayload = {
            lead_id: newLead.id,
            lead_name: leadData.name,
            email_address: leadData.email || null,
            phone_number: leadData.phone || null,
            title: taskData.title,
            description: taskData.description || null,
            due_date: taskData.due_date,
            assigned_to: user.id,
            assigned_to_name: registeredUsers.find(u => u.id === user.id)?.full_name || user.email || "Unknown User",
            done: false,
            created_by: user.id,
          };

          await supabase.from('tasks').insert(taskPayload);
          
          // Add history entry for task creation
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', user.id)
            .single();

          await supabase.from('lead_history').insert({
            lead_id: selectedLead.id,
            action: 'Task Created',
            details: `New task created: "${taskPayload.title}" - Due: ${new Date(taskPayload.due_date).toLocaleDateString()}`,
            user_name: profileData?.full_name || 'Unknown User',
            created_by: user.id,
          });
        }
      }
      
      setShowAddDialog(false);
      toast({
        title: "Success",
        description: "Lead and initial task created successfully!",
      });
    } catch (error) {
      console.error('Error creating lead and task:', error);
      toast({
        title: "Error",
        description: "Failed to create lead and task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMassUpload = async (leads: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'created_by'>[]) => {
    for (const leadData of leads) {
      await createLead(leadData);
    }
    setShowMassUpload(false);
  };

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    await updateLead(leadId, updates);
  };

  const handleConvertToDeal = (leadId: string) => {
    console.log(`Converting lead ${leadId} to deal`);
  };

  const handleAbandonLead = async (leadId: string, reason: string) => {
    try {
      await updateLead(leadId, { status: "Abandoned" });
      
      // Add history entry for abandonment reason
      const { data: userData } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userData.user?.id)
        .single();

      await supabase
        .from('lead_history')
        .insert({
          lead_id: leadId,
          action: 'Lead Abandoned',
          details: `Reason: ${reason}`,
          created_by: userData.user?.id,
          user_name: userProfile?.full_name || 'Unknown User'
        });

      toast({
        title: "Lead Abandoned",
        description: `Lead has been abandoned. Reason: ${reason}`,
      });
    } catch (error) {
      console.error('Error abandoning lead:', error);
      toast({
        title: "Error",
        description: "Failed to abandon lead",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    await updateLead(leadId, { status: newStatus });
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const newLeadsCount = leads.filter(lead => lead.status === "New").length;
  const contactedLeadsCount = leads.filter(lead => lead.status === "Contacted").length;

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
              Leads Pipeline
            </h1>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-info"></div>
                <span className="text-sm text-muted-foreground">New: <span className="font-medium text-foreground">{newLeadsCount}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning"></div>
                <span className="text-sm text-muted-foreground">Contacted: <span className="font-medium text-foreground">{contactedLeadsCount}</span></span>
              </div>
              <div className="h-4 w-px bg-border/60"></div>
              <p className="text-sm text-muted-foreground">
                Total: <span className="font-semibold text-primary">{leads.length}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="modern-button h-11 px-6 text-sm font-medium shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
            <Button 
              onClick={() => setShowMassUpload(true)}
              variant="outline"
              className="glass-subtle border-glass-border h-11 px-6 text-sm font-medium"
            >
              <Upload className="w-4 h-4 mr-2" />
              Mass Upload
            </Button>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="glass-card overflow-hidden">
        {/* Search and Filter Header */}
        <div className="p-4 border-b border-glass-border/40">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search leads by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="modern-input pl-10 h-10 text-sm"
                />
              </div>
              
              {/* Agent Filter Dropdown */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="w-48 h-10 bg-background border-border">
                    <SelectValue placeholder="Filter by agent" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border shadow-lg z-50">
                    <SelectItem value="all">All Agents ({totalLeads})</SelectItem>
                    {uniqueAgents.map(agent => {
                      const agentLeads = leads.filter(lead => lead.assigned_to === agent).length;
                      return (
                        <SelectItem key={agent} value={agent}>
                          {agent} ({agentLeads})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-glass-border/40 hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-4">
                Lead Info
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contact
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Assigned To
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Source
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Date Added
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead, index) => (
              <TableRow 
                key={lead.id} 
                className="border-glass-border/30 hover:bg-glass/30 transition-colors cursor-pointer"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => handleLeadClick(lead)}
              >
                <TableCell className="py-4">
                  <div className="space-y-1">
                    <div className="font-medium text-foreground text-sm">{lead.name}</div>
                    {lead.interested_products && lead.interested_products.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {lead.interested_products.slice(0, 2).map(product => (
                          <Badge key={product} variant="outline" className="text-xs px-1 py-0">
                            {product}
                          </Badge>
                        ))}
                        {lead.interested_products.length > 2 && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            +{lead.interested_products.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="space-y-1">
                    <div className="text-sm text-foreground">{lead.email}</div>
                    <div className="text-xs text-muted-foreground">{lead.phone}</div>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="text-sm text-foreground">
                    {lead.assigned_to || (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <Badge className={`${getSourceBadgeClass(lead.source)} px-2 py-1 text-xs font-medium rounded-md`}>
                    {lead.source}
                  </Badge>
                </TableCell>
                <TableCell className="py-4">
                  <Badge className={`${getStatusBadgeClass(lead.status)} px-2 py-1 text-xs font-medium rounded-md`}>
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell className="py-4">
                  <div className="text-sm text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString('de-DE', { 
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </div>
                </TableCell>
                <TableCell className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <LeadRowActions
                    lead={lead}
                    onConvertToDeal={handleConvertToDeal}
                    onAbandonLead={handleAbandonLead}
                    onUpdateStatus={handleUpdateStatus}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No leads found matching your search.</p>
          </div>
        )}
      </div>

      <AddLeadDialog 
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAddLead={handleAddLead}
      />

      <MassUploadDialog
        open={showMassUpload}
        onOpenChange={setShowMassUpload}
        onUploadLeads={handleMassUpload}
      />

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