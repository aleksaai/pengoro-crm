import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, Upload, Mail, Phone, User, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddLeadDialog } from "./AddLeadDialog";
import { MassUploadDialog } from "./MassUploadDialog";
import { LeadDetailsModal } from "./LeadDetailsModal";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AbandonLeadDialog } from "./AbandonLeadDialog";
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

const leadStages = [
  { id: "New", title: "New Leads", color: "bg-info", count: 0 },
  { id: "Not Reached", title: "Not Reached", color: "bg-muted", count: 0 },
  { id: "Webinar Confirmed", title: "Webinar Confirmed", color: "bg-success", count: 0 },
  { id: "Call-Back", title: "Call-Back Scheduled", color: "bg-accent", count: 0 },
  { id: "Abandoned", title: "Abandoned", color: "bg-destructive", count: 0 },
];

interface LeadCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
}

function LeadCard({ lead, onClick, onConvert }: LeadCardProps) {
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

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            {lead.source && (
              <Badge variant="outline" className={`text-xs px-2 py-0.5 ${getSourceBadgeClass(lead.source)}`}>
                {lead.source}
              </Badge>
            )}
          </div>
          {lead.status !== "Abandoned" && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onConvert(lead);
              }}
              className="text-xs h-6 px-2"
            >
              <ArrowRight className="w-3 h-3 mr-1" />
              Convert
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface LeadStageProps {
  stage: typeof leadStages[0] & { leads: Lead[]; count: number };
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
}

function LeadStage({ stage, leads, onLeadClick, onConvert }: LeadStageProps) {
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
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={onLeadClick}
              onConvert={onConvert}
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

export function LeadsPipeline() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showMassUpload, setShowMassUpload] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [registeredUsers, setRegisteredUsers] = useState<Array<{id: string, full_name: string, email: string}>>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);
  const [pendingAbandonLead, setPendingAbandonLead] = useState<Lead | null>(null);
  const { leads, loading, createLead, updateLead } = useLeads();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

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

  // Filter leads by search term and selected agent
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm);
    
    const matchesAgent = selectedAgent === "all" || lead.assigned_to === selectedAgent;
    
    return matchesSearch && matchesAgent;
  });

  // Group leads by stage and compute totals only for lead board statuses
  const leadStageIds = new Set(leadStages.map(s => s.id));
  const leadsInBoard = leads.filter(l => leadStageIds.has(l.status));
  const stagesWithLeads = leadStages.map(stage => ({
    ...stage,
    leads: filteredLeads.filter(lead => lead.status === stage.id),
    count: filteredLeads.filter(lead => lead.status === stage.id).length
  }));

  const totalLeads = leadsInBoard.length;

  const handleAddLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    await createLead(leadData);
    setShowAddDialog(false);
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

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleConvertToDeal = async (lead: Lead) => {
    try {
      await updateLead(lead.id, { status: "Discovery Call Booked" });
      toast({ title: "Converted", description: `${lead.name} moved to Discovery Call` });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to convert lead", variant: "destructive" });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeLead = leads.find(lead => lead.id === activeId);
    if (!activeLead) return;

    // Determine target status (stage or another lead's status)
    let newStatus = activeLead.status;

    const targetStage = leadStages.find(stage => stage.id === overId);
    if (targetStage) {
      newStatus = targetStage.id;
    } else {
      const targetLead = leads.find(lead => lead.id === overId);
      if (targetLead) {
        newStatus = targetLead.status;
      }
    }

    // If dropped to Abandoned, open reason modal instead of immediate update
    if (newStatus === "Abandoned" && newStatus !== activeLead.status) {
      setPendingAbandonLead(activeLead);
      setShowAbandonDialog(true);
      setActiveId(null);
      return;
    }

    if (newStatus !== activeLead.status) {
      handleUpdateLead(activeId, { status: newStatus });
      toast({
        title: "Lead Updated",
        description: `Lead moved to ${newStatus}`,
      });
    }

    setActiveId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground">Manage your lead pipeline and convert prospects to deals</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search leads..."
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
              <SelectItem value="all">All Agents ({totalLeads})</SelectItem>
              {uniqueAgents.map((agent) => {
                const agentLeadCount = leadsInBoard.filter(lead => lead.assigned_to === agent).length;
                return (
                  <SelectItem key={agent} value={agent}>
                    {agent} ({agentLeadCount})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Button 
            onClick={() => setShowAddDialog(true)}
            className="h-10 px-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
          <Button 
            onClick={() => setShowMassUpload(true)}
            variant="outline"
            className="h-10 px-4"
          >
            <Upload className="w-4 h-4 mr-2" />
            Mass Upload
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Pipeline Stages */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {stagesWithLeads.map((stage) => (
            <LeadStage
              key={stage.id}
              stage={stage}
              leads={stage.leads}
              onLeadClick={handleLeadClick}
              onConvert={handleConvertToDeal}
            />
          ))}
        </div>

        <DragOverlay>
          {activeId ? (
            <LeadCard
              lead={leads.find(lead => lead.id === activeId)!}
              onClick={() => {}}
              onConvert={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

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

      <AbandonLeadDialog
        open={showAbandonDialog}
        onOpenChange={(open) => { if (!open) { setShowAbandonDialog(false); setPendingAbandonLead(null); } else { setShowAbandonDialog(true); } }}
        leadName={pendingAbandonLead?.name || ""}
        onConfirm={async (reason) => {
          try {
            if (!pendingAbandonLead) return;
            await updateLead(pendingAbandonLead.id, { status: "Abandoned" });

            const { data: userData } = await supabase.auth.getUser();
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', userData.user?.id)
              .single();

            await supabase
              .from('lead_history')
              .insert({
                lead_id: pendingAbandonLead.id,
                action: 'Lead Abandoned',
                details: `Reason: ${reason}`,
                created_by: userData.user?.id,
                user_name: userProfile?.full_name || 'Unknown User'
              });

            toast({ title: 'Lead Abandoned', description: `Reason: ${reason}` });
          } catch (e) {
            console.error(e);
            toast({ title: 'Error', description: 'Failed to abandon lead', variant: 'destructive' });
          } finally {
            setShowAbandonDialog(false);
            setPendingAbandonLead(null);
          }
        }}
      />
    </div>
  );
}