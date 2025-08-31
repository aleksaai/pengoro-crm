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
    <div className="space-y-6">
      <div className="glass-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Leads Management</h1>
            <p className="text-muted-foreground">
              Total Leads: <span className="font-semibold text-primary">{leads.length}</span>
            </p>
          </div>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      <Card className="glass-card border-0">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input/50 border-glass-border"
              />
            </div>
            <Button variant="outline" size="sm" className="border-glass-border">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="p-4 rounded-lg bg-muted/20 border border-glass-border hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-semibold text-foreground">{lead.name}</h3>
                      <Badge className={`${getStatusBadgeClass(lead.status)} px-2 py-1 text-xs font-medium rounded-md border`}>
                        {lead.status}
                      </Badge>
                      <Badge className={`${getSourceBadgeClass(lead.source)} px-2 py-1 text-xs font-medium rounded-md border`}>
                        {lead.source}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <span>{lead.company}</span>
                      <span>{lead.email}</span>
                      <span>{lead.phone}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary text-lg">{lead.value}</div>
                    <div className="text-xs text-muted-foreground">{lead.createdAt}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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