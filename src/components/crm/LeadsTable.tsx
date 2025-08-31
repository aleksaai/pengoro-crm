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
import { CopyableText } from "@/components/ui/copyable-text";
import { Search, Filter, Plus } from "lucide-react";
import { AddLeadDialog } from "./AddLeadDialog";
import { LeadRowActions } from "./LeadRowActions";
import { LeadDetailsModal } from "./LeadDetailsModal";
import { useLeads, type Lead } from "@/hooks/useLeads";

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
  const { leads, loading, createLead, updateLead } = useLeads();

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm)
  );

  const handleAddLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    await createLead(leadData);
    setShowAddDialog(false);
  };

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    await updateLead(leadId, updates);
  };

  const handleConvertToDeal = (leadId: string) => {
    console.log(`Converting lead ${leadId} to deal`);
  };

  const handleAbandonLead = (leadId: string) => {
    console.log(`Abandoning lead ${leadId}`);
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
          <Button 
            onClick={() => setShowAddDialog(true)}
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
                    <CopyableText 
                      text={lead.name}
                      className="font-medium text-foreground text-sm hover:bg-transparent"
                    />
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
                    <CopyableText 
                      text={lead.email}
                      className="text-sm text-foreground hover:bg-transparent"
                    />
                    <CopyableText 
                      text={lead.phone}
                      className="text-xs text-muted-foreground hover:bg-transparent"
                    />
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

      <LeadDetailsModal
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
        onUpdateLead={handleUpdateLead}
      />
    </div>
  );
}