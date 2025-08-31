import { useState } from "react";
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
import { Search, Filter, Plus } from "lucide-react";
import { AddLeadDialog } from "./AddLeadDialog";
import { LeadRowActions } from "./LeadRowActions";
import { LeadDetailsModal } from "./LeadDetailsModal";

export interface LeadHistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  createdAt: string;
  notes?: string;
  assignedTo?: string;
  interestedProducts?: string[];
  history?: LeadHistoryEntry[];
}

const sampleLeads: Lead[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john@techsolutions.de",
    phone: "+49 123 456 789",
    source: "Meta Ads",
    status: "New",
    createdAt: "2024-01-15",
    assignedTo: "Sarah Smith",
    interestedProducts: ["PKV", "Investments"],
    history: [
      {
        id: "1",
        timestamp: "2024-01-15T10:00:00Z",
        action: "Lead created",
        details: "Lead was imported from Meta Ads campaign",
        user: "System"
      }
    ]
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah@marketingplus.com",
    phone: "+49 987 654 321",
    source: "Website",
    status: "New", 
    createdAt: "2024-01-14",
    interestedProducts: ["PAV", "Insurances"],
    history: [
      {
        id: "2",
        timestamp: "2024-01-14T14:30:00Z",
        action: "Lead created",
        details: "Lead submitted contact form on website",
        user: "System"
      }
    ]
  },
  {
    id: "3", 
    name: "Michael Brown",
    email: "m.brown@digitalcorp.eu",
    phone: "+49 555 123 456",
    source: "Meta Ads",
    status: "Contacted",
    createdAt: "2024-01-13",
    assignedTo: "Mike Johnson",
    interestedProducts: ["Real Estate", "Investments"],
    notes: "Interested in premium investment packages. Call back on Friday.",
    history: [
      {
        id: "3",
        timestamp: "2024-01-13T09:00:00Z",
        action: "Lead created",
        details: "Lead was imported from Meta Ads campaign",
        user: "System"
      },
      {
        id: "4",
        timestamp: "2024-01-13T15:30:00Z",
        action: "Status updated",
        details: "Status changed from New to Contacted",
        user: "Mike Johnson"
      }
    ]
  },
  {
    id: "4",
    name: "Emma Wilson", 
    email: "emma@startup.io",
    phone: "+49 777 888 999",
    source: "Referral",
    status: "New",
    createdAt: "2024-01-12",
    interestedProducts: ["PKV"],
    history: [
      {
        id: "5",
        timestamp: "2024-01-12T11:45:00Z",
        action: "Lead created",
        details: "Lead was referred by existing customer",
        user: "System"
      }
    ]
  }
];

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
  const [leads, setLeads] = useState<Lead[]>(sampleLeads);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddLead = (newLead: Omit<Lead, 'id' | 'createdAt'>) => {
    const historyEntry: LeadHistoryEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action: "Lead created",
      details: "New lead was added manually",
      user: "Current User"
    };
    
    const lead: Lead = {
      ...newLead,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
      status: "New",
      history: [historyEntry]
    };
    setLeads([lead, ...leads]);
  };

  const handleConvertToDeal = (leadId: string) => {
    // Remove lead from leads list (simulate conversion to deal)
    setLeads(leads.filter(lead => lead.id !== leadId));
    console.log(`Converting lead ${leadId} to deal`);
  };

  const handleAbandonLead = (leadId: string) => {
    // Remove lead from leads list
    setLeads(leads.filter(lead => lead.id !== leadId));
    console.log(`Abandoning lead ${leadId}`);
  };

  const handleUpdateStatus = (leadId: string, newStatus: string) => {
    setLeads(leads.map(lead => 
      lead.id === leadId ? { ...lead, status: newStatus } : lead
    ));
  };

  const handleUpdateLead = (leadId: string, updates: Partial<Lead>) => {
    setLeads(leads.map(lead => 
      lead.id === leadId ? { ...lead, ...updates } : lead
    ));
    // Update selectedLead if it's the same lead
    if (selectedLead?.id === leadId) {
      setSelectedLead({ ...selectedLead, ...updates });
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsModalOpen(true);
  };

  const newLeadsCount = leads.filter(lead => lead.status === "New").length;
  const contactedLeadsCount = leads.filter(lead => lead.status === "Contacted").length;

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
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="modern-button h-11 px-6 text-sm font-medium shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="glass-card">
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
          <Button variant="outline" size="sm" className="glass-subtle border-glass-border h-10 px-4">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="glass-card overflow-hidden">
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
                    {lead.interestedProducts && lead.interestedProducts.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {lead.interestedProducts.slice(0, 2).map(product => (
                          <Badge key={product} variant="outline" className="text-xs px-1 py-0">
                            {product}
                          </Badge>
                        ))}
                        {lead.interestedProducts.length > 2 && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            +{lead.interestedProducts.length - 2}
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
                    {lead.assignedTo || (
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
                    {new Date(lead.createdAt).toLocaleDateString('de-DE', { 
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
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddLead={handleAddLead}
      />

      <LeadDetailsModal
        lead={selectedLead}
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        onUpdateLead={handleUpdateLead}
      />
    </div>
  );
}