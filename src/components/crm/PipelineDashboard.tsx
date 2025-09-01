import { Badge } from "@/components/ui/badge";
import { User, Calendar, GripVertical, Clock, Filter, X } from "lucide-react";
import { useState, useEffect } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LeadDetailsModal } from "./LeadDetailsModal";
import { AbandonLeadDialog } from "./AbandonLeadDialog";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const dealStages = [
  { 
    id: "discovery",
    name: "Discovery Call", 
    color: "bg-blue-50 border-blue-200",
    deals: []
  },
  { 
    id: "second-meeting",
    name: "Second Meeting",
    color: "bg-purple-50 border-purple-200",
    deals: []
  },
  { 
    id: "follow-up",
    name: "Follow-Up",
    color: "bg-orange-50 border-orange-200",
    deals: []
  },
  { 
    id: "closing",
    name: "Closing Call",
    color: "bg-green-50 border-green-200",
    deals: []
  },
  { 
    id: "stuck",
    name: "Stuck",
    color: "bg-red-50 border-red-200",
    deals: []
  }
];

interface DealCardProps {
  deal: Lead;
  onDealClick: (deal: Lead) => void;
  onLostClick: (deal: Lead) => void;
  isDragOverlay?: boolean;
}

function DealCard({ deal, onDealClick, onLostClick, isDragOverlay = false }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger click if we're dragging
    if (isDragging) return;
    e.stopPropagation();
    onDealClick(deal);
  };

  const handleLostClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLostClick(deal);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative group bg-white border border-border rounded-lg shadow-sm transition-all duration-200
        ${isDragging ? 'opacity-50 rotate-3 shadow-lg' : 'hover:shadow-md hover:-translate-y-0.5'}
        ${isDragOverlay ? 'shadow-xl border-primary/50' : ''}
      `}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </div>

      {/* Card Content */}
      <div className="p-3 cursor-pointer" onClick={handleClick}>
        <div className="space-y-2">
          {/* Company Name */}
          <h4 className="font-medium text-foreground text-sm leading-tight pr-6">
            {deal.name}
          </h4>
          
          {/* Assigned User */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{deal.assigned_to}</span>
          </div>

          {/* Products */}
          {deal.interested_products && deal.interested_products.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {deal.interested_products.slice(0, 2).map(product => (
                <Badge key={product} variant="outline" className="text-xs px-1.5 py-0.5 h-auto">
                  {product}
                </Badge>
              ))}
              {deal.interested_products.length > 2 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-auto text-muted-foreground">
                  +{deal.interested_products.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>{new Date(deal.created_at).toLocaleDateString('de-DE')}</span>
            </div>
            
            {/* Lost Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLostClick}
              className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 mr-1" />
              Lost
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DropZoneProps {
  stage: { id: string; name: string; color: string; deals: Lead[] };
  children: React.ReactNode;
  isOver?: boolean;
}

function DropZone({ stage, children, isOver = false }: DropZoneProps) {
  const { setNodeRef } = useDroppable({ id: stage.id });

  return (
    <div 
      ref={setNodeRef} 
      className={`
        flex flex-col h-full min-h-96 rounded-xl border-2 transition-all duration-200
        ${isOver ? 'border-primary bg-primary/5 shadow-md' : `border-dashed ${stage.color}`}
      `}
    >
      {children}
    </div>
  );
}

export function PipelineDashboard() {
  const [stages, setStages] = useState(dealStages);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeDeal, setActiveDeal] = useState<Lead | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [registeredUsers, setRegisteredUsers] = useState<Array<{id: string, full_name: string, email: string}>>([]);
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [pendingLostLead, setPendingLostLead] = useState<Lead | null>(null);
  const { updateLead, leads } = useLeads();
  const { toast } = useToast();

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

  // Map stage id to status string (used before render)
  const getStatusFromStage = (stageId: string): string => {
    const stageMap: Record<string, string> = {
      discovery: "Discovery Call Booked",
      "second-meeting": "Second Meeting Booked",
      "follow-up": "Follow-Up Scheduled",
      closing: "Closing Call Scheduled",
      stuck: "Stuck",
    };
    return stageMap[stageId] || "New";
  };

  // Filter stages based on selected agent and show only real leads from DB
  const filteredStages = stages.map(stage => {
    const stageStatus = getStatusFromStage(stage.id);
    const dbDeals = leads
      .filter(l => l.status === stageStatus)
      .filter(l => selectedAgent === "all" || l.assigned_to === selectedAgent);

    return { ...stage, deals: dbDeals };
  });

  const totalDeals = filteredStages.reduce((acc, stage) => acc + stage.deals.length, 0);

  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { 
        distance: 8 
      } 
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const deal = filteredStages.flatMap(stage => stage.deals).find(d => d.id === active.id);
    setActiveDeal(deal || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);
    setDragOverStage(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the dragged deal from real leads only
    const sourceDeal = filteredStages.flatMap(stage => stage.deals).find(d => d.id === activeId);
    if (!sourceDeal) return;

    // Determine target stage
    const targetStageFiltered =
      filteredStages.find(stage => stage.id === overId) ||
      filteredStages.find(stage => stage.deals.some(d => d.id === overId));

    if (!targetStageFiltered) return;

    // Build updated deal
    const updatedDeal = {
      ...sourceDeal,
      status: getStatusFromStage(targetStageFiltered.id),
      assigned_to: sourceDeal.assigned_to ?? "",
      interested_products: sourceDeal.interested_products ?? [],
      created_by: sourceDeal.created_by ?? "",
    };

    // Update backend for real leads
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(activeId);
    
    if (isUUID) {
      try {
        await updateLead(activeId, { status: getStatusFromStage(targetStageFiltered.id) });
        toast({
          title: "Deal moved",
          description: `${sourceDeal.name} moved to ${targetStageFiltered.name}`,
        });
      } catch (error) {
        console.error("Failed to update deal:", error);
        toast({
          title: "Error",
          description: "Failed to move deal. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDealClick = (deal: Lead) => {
    setSelectedLead(deal);
  };

  const handleLostClick = (deal: Lead) => {
    setPendingLostLead(deal);
    setShowLostDialog(true);
  };

  const handleLostConfirm = async (reason: string, customReason?: string) => {
    if (!pendingLostLead) return;

    try {
      // Update lead status to Lost
      await updateLead(pendingLostLead.id, { 
        status: "Lost"
      });

      // Get current user info for history entry
      const { data: userData } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userData.user?.id)
        .single();

      // Create lead history entry with the abandon reason
      await supabase
        .from('lead_history')
        .insert({
          lead_id: pendingLostLead.id,
          action: 'Lead Abandoned',
          details: `Lead marked as lost. Reason: ${reason}`,
          created_by: userData.user?.id,
          user_name: userProfile?.full_name || 'Unknown User'
        });

      toast({
        title: "Lead marked as lost",
        description: `${pendingLostLead.name} has been moved to Winbacks`,
      });

      setShowLostDialog(false);
      setPendingLostLead(null);
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
    }
  };

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    await updateLead(leadId, updates);
    setStages(prev => prev.map(stage => ({
      ...stage,
      deals: stage.deals.map(deal => 
        deal.id === leadId ? { ...deal, ...updates } : deal
      )
    })));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="glass-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
              Sales Pipeline
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Drag deals between stages to update their status
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Agent Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger className="w-48 h-9 bg-background border-border">
                  <SelectValue placeholder="Filter by agent" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border shadow-lg z-50">
                  <SelectItem value="all">All Agents ({totalDeals})</SelectItem>
                  {uniqueAgents.map(agent => {
                    const agentDeals = filteredStages
                      .flatMap(s => s.deals)
                      .filter(d => d.assigned_to === agent).length;
                    return (
                      <SelectItem key={agent} value={agent}>
                        {agent} ({agentDeals})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Deal Counter */}
            <div className="flex items-center gap-2 border-l border-border pl-4">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {selectedAgent === "all" ? "Active Deals:" : `${selectedAgent}'s Deals:`}
              </span>
              <span className="text-lg font-semibold text-foreground">{totalDeals}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-5 gap-4 h-[calc(100vh-220px)]">
          {filteredStages.map((stage) => (
            <DropZone 
              key={stage.id} 
              stage={stage}
              isOver={dragOverStage === stage.id}
            >
              {/* Stage Header */}
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground text-sm">
                    {stage.name}
                  </h3>
                  <Badge className="bg-muted text-muted-foreground px-2 py-1 text-xs font-medium">
                    {stage.deals.length}
                  </Badge>
                </div>
              </div>

              {/* Deals Container */}
              <div className="flex-1 p-3 overflow-y-auto">
                <SortableContext 
                  items={stage.deals.map(deal => deal.id)} 
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {stage.deals.map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        onDealClick={handleDealClick}
                        onLostClick={handleLostClick}
                      />
                    ))}
                  </div>
                </SortableContext>
                
                {/* Empty State */}
                {stage.deals.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                    Drop deals here
                  </div>
                )}
              </div>
            </DropZone>
          ))}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDeal && (
            <DealCard 
              deal={activeDeal} 
              onDealClick={() => {}} 
              onLostClick={() => {}}
              isDragOverlay 
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Modals */}
      <LeadDetailsModal 
        lead={selectedLead} 
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
        onUpdateLead={handleUpdateLead}
        pipelineType="sales"
      />

      <AbandonLeadDialog
        open={showLostDialog}
        onOpenChange={(open) => { 
          if (!open) { 
            setShowLostDialog(false); 
            setPendingLostLead(null); 
          } else { 
            setShowLostDialog(true); 
          } 
        }}
        leadName={pendingLostLead?.name || ""}
        onConfirm={handleLostConfirm}
        dialogType="lost"
      />
    </div>
  );
}