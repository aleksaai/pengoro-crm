import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { AddLeadDialog } from "./AddLeadDialog";

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  value: string;
  createdAt: string;
}

const sampleLeads: Lead[] = [
  {
    id: "1",
    name: "John Smith",
    company: "Tech Solutions GmbH",
    email: "john@techsolutions.de",
    phone: "+49 123 456 789",
    source: "Meta Ads",
    status: "New",
    value: "€5,200",
    createdAt: "2024-01-15"
  },
  {
    id: "2",
    name: "Sarah Johnson",
    company: "Marketing Plus",
    email: "sarah@marketingplus.com",
    phone: "+49 987 654 321",
    source: "Website",
    status: "Contacted",
    value: "€3,400",
    createdAt: "2024-01-14"
  },
  {
    id: "3",
    name: "Michael Brown",
    company: "Digital Corp",
    email: "m.brown@digitalcorp.eu",
    phone: "+49 555 123 456",
    source: "Meta Ads",
    status: "Qualified",
    value: "€8,900",
    createdAt: "2024-01-13"
  },
  {
    id: "4",
    name: "Emma Wilson",
    company: "StartUp Inc",
    email: "emma@startup.io",
    phone: "+49 777 888 999",
    source: "Referral",
    status: "Proposal",
    value: "€12,100",
    createdAt: "2024-01-12"
  }
];

const getSourceBadgeClass = (source: string) => {
  switch (source) {
    case "Meta Ads": return "source-meta";
    case "Website": return "source-website";
    case "Referral": return "source-referral";
    default: return "source-manual";
  }
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "New": return "status-new";
    case "Contacted": return "status-contacted";
    case "Qualified": return "status-qualified";
    case "Proposal": return "status-proposal";
    case "Won": return "status-won";
    case "Lost": return "status-lost";
    default: return "status-new";
  }
};

export function LeadsManagement() {
  const [leads, setLeads] = useState<Lead[]>(sampleLeads);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddLead = (newLead: Omit<Lead, 'id' | 'createdAt'>) => {
    const lead: Lead = {
      ...newLead,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0]
    };
    setLeads([lead, ...leads]);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="glass-card modern-card">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
              Leads Management
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-base text-muted-foreground">
                Total Leads: <span className="font-semibold text-primary text-lg">{leads.length}</span>
              </p>
              <div className="h-4 w-px bg-border/60"></div>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="modern-button h-12 px-6 text-base font-medium shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Lead
          </Button>
        </div>
      </div>

      <Card className="glass-card modern-card border-0 overflow-hidden">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-6">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search leads by name, company, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="modern-input pl-12 h-12 text-base rounded-xl"
              />
            </div>
            <Button variant="outline" size="lg" className="glass-subtle border-glass-border h-12 px-6">
              <Filter className="w-5 h-5 mr-2" />
              Advanced Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredLeads.map((lead, index) => (
            <div 
              key={lead.id} 
              className="group p-6 rounded-xl bg-gradient-to-r from-glass/40 to-glass-accent/40 border border-glass-border/60 hover:border-primary/30 transition-all duration-300 hover:shadow-lg backdrop-blur-sm"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                      {lead.name}
                    </h3>
                    <div className="flex items-center gap-3">
                      <Badge className={`${getStatusBadgeClass(lead.status)} px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 hover:scale-105`}>
                        {lead.status}
                      </Badge>
                      <Badge className={`${getSourceBadgeClass(lead.source)} px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 hover:scale-105`}>
                        {lead.source}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Company</span>
                      <span className="text-sm font-medium text-foreground">{lead.company}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Email</span>
                      <span className="text-sm text-foreground">{lead.email}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Phone</span>
                      <span className="text-sm text-foreground">{lead.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2 ml-6">
                  <div className="font-display font-bold text-2xl text-primary group-hover:text-primary-deep transition-colors">
                    {lead.value}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    {new Date(lead.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <AddLeadDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddLead={handleAddLead}
      />
    </div>
  );
}