import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, User, RotateCcw } from "lucide-react";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LeadDetailsModal } from "./LeadDetailsModal";

interface LeadWithReason extends Lead {
  abandonReason?: string;
}

const winbackStages = [
  {
    id: "never-reached",
    label: "Never Reached",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    count: 0
  },
  {
    id: "future-call", 
    label: "Future Call",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    count: 0
  },
  {
    id: "lost",
    label: "Lost",
    color: "bg-red-100 text-red-800 border-red-200", 
    count: 0
  },
  {
    id: "cold-leads",
    label: "Cold Leads",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    count: 0
  }
];

function LeadCard({ lead, onViewDetails, onReactivate }: { 
  lead: LeadWithReason; 
  onViewDetails: (lead: Lead) => void;
  onReactivate: (leadId: string) => void;
}) {
  return (
    <Card className="bg-card hover:shadow-md transition-all duration-200 cursor-pointer border border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1" onClick={() => onViewDetails(lead)}>
            <h4 className="font-semibold text-foreground mb-1">{lead.name}</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              {lead.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  <span>{lead.email}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{lead.phone}</span>
                </div>
              )}
              {lead.assigned_to && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{lead.assigned_to}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {lead.abandonReason && (
          <div className="mb-3">
            <Badge variant="outline" className="text-xs">
              Reason: {lead.abandonReason}
            </Badge>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {new Date(lead.created_at).toLocaleDateString()}
          </span>
          <Button 
            size="sm" 
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onReactivate(lead.id);
            }}
            className="text-xs h-7"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reactivate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function WinbacksPipeline() {
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [registeredUsers, setRegisteredUsers] = useState<Array<{id: string, full_name: string, email: string}>>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [winbackLeads, setWinbackLeads] = useState<LeadWithReason[]>([]);
  const [loading, setLoading] = useState(true);
  const { leads, updateLead } = useLeads();
  const { toast } = useToast();

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

  // Fetch winback leads with abandon reasons
  useEffect(() => {
    const fetchWinbackLeads = async () => {
      setLoading(true);
      try {
        // Get abandoned/lost leads
        const abandonedLeads = leads.filter(lead => 
          lead.status === 'Abandoned' || lead.status === 'Lost'
        );

        // Fetch abandon reasons from lead_history
        const leadsWithReasons: LeadWithReason[] = await Promise.all(
          abandonedLeads.map(async (lead) => {
            const { data: historyData } = await supabase
              .from('lead_history')
              .select('details')
              .eq('lead_id', lead.id)
              .eq('action', 'Lead Abandoned')
              .order('created_at', { ascending: false })
              .limit(1);

            let abandonReason = 'Other Reason';
            if (historyData && historyData.length > 0) {
              const details = historyData[0].details;
              if (details?.includes('Never reached')) {
                abandonReason = 'Never reached';
              } else if (details?.includes('Future Call')) {
                abandonReason = 'Future Call';
              } else if (details?.includes('Bad Lead Quality')) {
                abandonReason = 'Bad Lead Quality';
              } else if (details?.includes('No Interest')) {
                abandonReason = 'No Interest';
              } else if (details?.includes('Chose Competitor')) {
                abandonReason = 'Chose Competitor';
              } else if (details?.includes('Reason: ')) {
                abandonReason = details.split('Reason: ')[1] || 'Other Reason';
              }
            }

            return { ...lead, abandonReason };
          })
        );

        setWinbackLeads(leadsWithReasons);
      } catch (error) {
        console.error('Error fetching winback leads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWinbackLeads();
  }, [leads]);

  // Filter leads by agent
  const filteredLeads = selectedAgent === "all" 
    ? winbackLeads 
    : winbackLeads.filter(lead => lead.assigned_to === selectedAgent);

  // Categorize leads by abandon reason
  const categorizedLeads = {
    "never-reached": filteredLeads.filter(lead => lead.abandonReason === 'Never reached'),
    "future-call": filteredLeads.filter(lead => lead.abandonReason === 'Future Call'),
    "lost": filteredLeads.filter(lead => 
      !['Never reached', 'Future Call'].includes(lead.abandonReason || '')
    ),
    "cold-leads": [] // For now, empty - can be populated based on additional criteria
  };

  // Update stage counts
  const updatedStages = winbackStages.map(stage => ({
    ...stage,
    count: categorizedLeads[stage.id as keyof typeof categorizedLeads]?.length || 0
  }));

  const totalWinbacks = filteredLeads.length;

  const handleReactivate = async (leadId: string) => {
    try {
      await updateLead(leadId, { status: "Discovery Call" });
      
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
          action: 'Lead Reactivated',
          details: 'Lead moved back to Discovery Call stage',
          created_by: userData.user?.id,
          user_name: userProfile?.full_name || 'Unknown User'
        });

      toast({
        title: "Lead Reactivated",
        description: "Lead has been moved back to Discovery Call stage",
      });
    } catch (error) {
      console.error('Error reactivating lead:', error);
      toast({
        title: "Error",
        description: "Failed to reactivate lead",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Loading winbacks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Winbacks</h1>
          <p className="text-muted-foreground">Manage abandoned and lost leads</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents ({totalWinbacks})</SelectItem>
              {registeredUsers.map((user) => {
                const userLeadCount = winbackLeads.filter(lead => lead.assigned_to === user.full_name).length;
                return (
                  <SelectItem key={user.id} value={user.full_name}>
                    {user.full_name} ({userLeadCount})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {updatedStages.map((stage) => (
          <div key={stage.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{stage.label}</h3>
              <Badge className={stage.color}>{stage.count}</Badge>
            </div>
            
            <div className="space-y-3 min-h-[400px]">
              {categorizedLeads[stage.id as keyof typeof categorizedLeads]?.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onViewDetails={setSelectedLead}
                  onReactivate={handleReactivate}
                />
              ))}
              {stage.count === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No leads in this stage
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <LeadDetailsModal
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
        onUpdateLead={updateLead}
      />
    </div>
  );
}