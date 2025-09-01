import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone, User, RotateCcw, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LeadDetailsModal } from "./LeadDetailsModal";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface LeadWithReason extends Lead {
  abandonReason?: string;
}

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

const winbackStages = [
  { id: "never-reached", title: "Never Reached", color: "bg-info", count: 0 },
  { id: "future-call", title: "Future Call", color: "bg-accent", count: 0 },
  { id: "lost", title: "Lost", color: "bg-destructive", count: 0 },
  { id: "cold-leads", title: "Cold Leads", color: "bg-muted", count: 0 }
];

interface WinbackCardProps {
  lead: LeadWithReason;
  onClick: (lead: Lead) => void;
  onReactivate: (leadId: string) => void;
}

function WinbackCard({ lead, onClick, onReactivate }: WinbackCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="glass-card p-4 cursor-pointer hover:bg-glass/50 transition-all duration-200 border border-glass-border/30"
      onClick={() => onClick(lead)}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground text-sm truncate">{lead.name}</h4>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              {lead.email && (
                <>
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{lead.email}</span>
                </>
              )}
            </div>
            {lead.phone && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Phone className="w-3 h-3" />
                <span>{lead.phone}</span>
              </div>
            )}
            {lead.assigned_to && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                <span className="truncate">{lead.assigned_to}</span>
              </div>
            )}
          </div>
        </div>

        {lead.abandonReason && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              {lead.abandonReason}
            </Badge>
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            {lead.source && (
              <Badge variant="outline" className={`text-xs px-2 py-0.5 ${getSourceBadgeClass(lead.source)}`}>
                {lead.source}
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onReactivate(lead.id);
            }}
            className="text-xs h-6 px-2"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reactivate
          </Button>
        </div>
      </div>
    </div>
  );
}

interface WinbackStageProps {
  stage: typeof winbackStages[0];
  leads: LeadWithReason[];
  onLeadClick: (lead: Lead) => void;
  onReactivate: (leadId: string) => void;
}

function WinbackStage({ stage, leads, onLeadClick, onReactivate }: WinbackStageProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div ref={setNodeRef} className="bg-glass/20 rounded-xl border border-glass-border/30 p-4 min-h-[600px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">{stage.title}</h3>
        <Badge className={`${stage.color} text-white`}>{leads.length}</Badge>
      </div>

      <div className="flex-1 space-y-3">
        <SortableContext items={leads.map(lead => lead.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <WinbackCard
              key={lead.id}
              lead={lead}
              onClick={onLeadClick}
              onReactivate={onReactivate}
            />
          ))}
        </SortableContext>
        
        {leads.length === 0 && (
          <div className={`glass-card p-6 text-center border-2 border-dashed border-glass-border/30 transition-colors duration-200 ${isOver ? 'border-accent bg-accent/5' : ''}`}>
            <p className="text-muted-foreground text-sm">
              {isOver ? 'Drop lead here' : 'No leads in this stage'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function WinbacksPipeline() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [registeredUsers, setRegisteredUsers] = useState<Array<{id: string, full_name: string, email: string}>>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [winbackLeads, setWinbackLeads] = useState<LeadWithReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { leads, updateLead } = useLeads();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

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
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        });
      }
    };

    fetchUsers();
  }, [toast]);

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
              .in('action', ['Lead Abandoned', 'Abandon Reason Updated'])
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
              } else if (details?.includes('Reason changed to: ')) {
                abandonReason = details.split('Reason changed to: ')[1] || 'Other Reason';
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

  // Get unique agents from registered users only
  const uniqueAgents = registeredUsers.map(user => user.full_name).filter(Boolean);

  // Filter leads by search term and selected agent
  const filteredLeads = winbackLeads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm) ||
      lead.abandonReason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAgent = selectedAgent === "all" || lead.assigned_to === selectedAgent;
    
    return matchesSearch && matchesAgent;
  });

  // Categorize leads by abandon reason
  const categorizedLeads = {
    "never-reached": filteredLeads.filter(lead => lead.abandonReason === 'Never reached'),
    "future-call": filteredLeads.filter(lead => lead.abandonReason === 'Future Call'),
    "lost": filteredLeads.filter(lead => 
      !['Never reached', 'Future Call'].includes(lead.abandonReason || '')
    ),
    "cold-leads": [] // For now, empty - can be populated based on additional criteria
  };

  // Group leads by stage with counts
  const stagesWithLeads = winbackStages.map(stage => ({
    ...stage,
    leads: categorizedLeads[stage.id as keyof typeof categorizedLeads] || [],
    count: (categorizedLeads[stage.id as keyof typeof categorizedLeads] || []).length
  }));

  const totalWinbacks = filteredLeads.length;

  const handleReactivate = async (leadId: string) => {
    try {
      await updateLead(leadId, { status: "Discovery Call Booked" });
      
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

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeLead = winbackLeads.find(lead => lead.id === activeId);
    if (!activeLead) return;

    // Handle moving between winback stages or reactivating
    let newStage = activeLead.abandonReason;
    
    const targetStage = winbackStages.find(stage => stage.id === overId);
    if (targetStage) {
      // Convert stage id back to abandon reason
      switch (targetStage.id) {
        case "never-reached":
          newStage = "Never reached";
          break;
        case "future-call":
          newStage = "Future Call";
          break;
        case "lost":
          newStage = "Other Reason";
          break;
        case "cold-leads":
          newStage = "Cold Lead";
          break;
      }

      // Update the abandon reason in lead history if it changed
      if (newStage !== activeLead.abandonReason) {
        updateAbandonReason(activeId, newStage);
      }
    }

    setActiveId(null);
  };

  const updateAbandonReason = async (leadId: string, newReason: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userData.user?.id)
        .single();

      // Add new history entry with updated reason
      await supabase
        .from('lead_history')
        .insert({
          lead_id: leadId,
          action: 'Abandon Reason Updated',
          details: `Reason changed to: ${newReason}`,
          created_by: userData.user?.id,
          user_name: userProfile?.full_name || 'Unknown User'
        });

      // Force refresh of winback leads to show the change immediately
      const refreshedLeads = leads.filter(lead => 
        lead.status === 'Abandoned' || lead.status === 'Lost'
      );

      const leadsWithUpdatedReasons: LeadWithReason[] = await Promise.all(
        refreshedLeads.map(async (lead) => {
          // For the lead we just updated, use the new reason
          if (lead.id === leadId) {
            return { ...lead, abandonReason: newReason };
          }

          // For other leads, fetch their reason from history
          const { data: historyData } = await supabase
            .from('lead_history')
            .select('details')
            .eq('lead_id', lead.id)
            .in('action', ['Lead Abandoned', 'Abandon Reason Updated'])
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
            } else if (details?.includes('Reason changed to: ')) {
              abandonReason = details.split('Reason changed to: ')[1] || 'Other Reason';
            }
          }

          return { ...lead, abandonReason };
        })
      );

      setWinbackLeads(leadsWithUpdatedReasons);

      toast({
        title: "Lead Moved",
        description: `Lead moved to ${newReason} stage`,
      });
    } catch (error) {
      console.error('Error updating abandon reason:', error);
      toast({
        title: "Error",
        description: "Failed to move lead",
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Winbacks</h1>
          <p className="text-muted-foreground">Manage abandoned and lost leads for potential reactivation</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search winbacks..."
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
              <SelectItem value="all">All Agents ({totalWinbacks})</SelectItem>
              {uniqueAgents.map((agent) => {
                const agentLeadCount = winbackLeads.filter(lead => lead.assigned_to === agent).length;
                return (
                  <SelectItem key={agent} value={agent}>
                    {agent} ({agentLeadCount})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Pipeline Stages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stagesWithLeads.map((stage) => (
            <WinbackStage
              key={stage.id}
              stage={stage}
              leads={stage.leads}
              onLeadClick={handleLeadClick}
              onReactivate={handleReactivate}
            />
          ))}
        </div>

        <DragOverlay>
          {activeId ? (
            <WinbackCard
              lead={winbackLeads.find(lead => lead.id === activeId)!}
              onClick={() => {}}
              onReactivate={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <LeadDetailsModal 
        lead={selectedLead} 
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
        onUpdateLead={updateLead}
        pipelineType="winbacks"
      />
    </div>
  );
}