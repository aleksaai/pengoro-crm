import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, Upload, Mail, ArrowRight } from "lucide-react";
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
  arrayMove,
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
              <Mail className="w-3 h-3" />
              <span className="truncate">{lead.email}</span>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={(e) => { e.stopPropagation(); onConvert(lead); }}
            aria-label="Convert lead to deal"
            title="Convert to Discovery Call"
          >
            Convert
          </Button>
        </div>

        <Badge className={`${getSourceBadgeClass(lead.source)} text-[10px] px-2 py-0.5 rounded-md w-fit`}>
          {lead.source}
        </Badge>
      </div>
    </div>
  );
}

interface DropZoneProps {
  stage: typeof leadStages[0];
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
}

function DropZone({ stage, leads, onLeadClick, onConvert }: DropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col h-full min-h-[600px] transition-colors duration-200 ${isOver ? 'bg-accent/10' : ''}`}
    >
      {/* Column Header */}
      <div className="glass-card p-4 mb-4 border-l-4" style={{ borderLeftColor: `hsl(var(--${stage.color.replace('bg-', '')}))` }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">{stage.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {leads.length}
          </Badge>
        </div>
      </div>

      {/* Lead Cards */}
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
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeLead = activeId ? leads.find(lead => lead.id === activeId) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
              Leads Pipeline
            </h1>
            <div className="flex items-center gap-6 flex-wrap">
              {stagesWithLeads.slice(0, 4).map((stage, index) => (
                <div key={stage.id} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                  <span className="text-sm text-muted-foreground">
                    {stage.title}: <span className="font-medium text-foreground">{stage.count}</span>
                  </span>
                </div>
              ))}
              <div className="h-4 w-px bg-border/60"></div>
              <p className="text-sm text-muted-foreground">
                Total: <span className="font-semibold text-primary">{totalLeads}</span>
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

      {/* Search and Filter */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search leads by name, email, or phone..."
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
                  const agentLeads = leadsInBoard.filter(lead => lead.assigned_to === agent).length;
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

      {/* Pipeline Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-5 gap-4 min-h-[600px]">
          {stagesWithLeads.map((stage) => (
            <SortableContext key={stage.id} items={[stage.id]} strategy={verticalListSortingStrategy}>
              <div
                id={stage.id}
                className="flex flex-col"
              >
                <DropZone
                  stage={stage}
                  leads={stage.leads}
                  onLeadClick={handleLeadClick}
                  onConvert={handleConvertToDeal}
                />
              </div>
            </SortableContext>
          ))}
        </div>

        <DragOverlay>
          {activeLead ? (
            <div className="glass-card p-4 border border-glass-border/30 rotate-2 shadow-xl">
              <div className="space-y-3">
                <h4 className="font-medium text-foreground text-sm">{activeLead.name}</h4>
                <div className="text-xs text-muted-foreground">{activeLead.email}</div>
                <Badge className={`${getSourceBadgeClass(activeLead.source)} text-xs px-2 py-0.5 rounded-md`}>
                  {activeLead.source}
                </Badge>
              </div>
            </div>
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