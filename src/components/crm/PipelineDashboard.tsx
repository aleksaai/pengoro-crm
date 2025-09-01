import { Badge } from "@/components/ui/badge";
import { User, Calendar, GripVertical, Clock, Filter, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LeadDetailsModal } from "./LeadDetailsModal";
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
    deals: [
      { 
        id: "deal-1",
        name: "Tech Solutions GmbH", 
        email: "john@techsolutions.de",
        phone: "+49 30 12345678",
        source: "Meta Ads",
        status: "Discovery Call Booked",
        assigned_to: "John Miller",
        interested_products: ["PKV", "PAV"],
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
        created_by: "user-1"
      },
      { 
        id: "deal-2",
        name: "Marketing Plus", 
        email: "sarah@marketingplus.com",
        phone: "+49 40 87654321",
        source: "Website",
        status: "Discovery Call Booked",
        assigned_to: "Sarah Johnson",
        interested_products: ["Investments"],
        created_at: "2024-01-14T09:00:00Z",
        updated_at: "2024-01-14T09:00:00Z",
        created_by: "user-2"
      },
      { 
        id: "deal-3",
        name: "Digital Corp", 
        email: "mike@digitalcorp.eu",
        phone: "+49 89 11223344",
        source: "Referral",
        status: "Discovery Call Booked",
        assigned_to: "Mike Davis",
        interested_products: ["PKV", "Insurances"],
        created_at: "2024-01-13T14:00:00Z",
        updated_at: "2024-01-13T14:00:00Z",
        created_by: "user-3"
      }
    ]
  },
  { 
    id: "second-meeting",
    name: "Second Meeting",
    color: "bg-purple-50 border-purple-200",
    deals: [
      { 
        id: "deal-4",
        name: "Enterprise Solutions", 
        email: "lisa@enterprise.com",
        phone: "+49 69 55566677",
        source: "LinkedIn",
        status: "Second Meeting Booked",
        assigned_to: "Lisa Chen",
        interested_products: ["PKV", "PAV", "Investments"],
        created_at: "2024-01-10T11:00:00Z",
        updated_at: "2024-01-10T11:00:00Z",
        created_by: "user-4"
      },
      { 
        id: "deal-5",
        name: "Innovation Hub", 
        email: "david@innovation.co",
        phone: "+49 221 99887766",
        source: "Website",
        status: "Second Meeting Booked",
        assigned_to: "David Park",
        interested_products: ["Insurances"],
        created_at: "2024-01-09T16:00:00Z",
        updated_at: "2024-01-09T16:00:00Z",
        created_by: "user-5"
      }
    ]
  },
  { 
    id: "follow-up",
    name: "Follow-Up",
    color: "bg-orange-50 border-orange-200",
    deals: [
      { 
        id: "deal-6",
        name: "Mega Enterprise", 
        email: "robert@mega.com",
        phone: "+49 711 44332211",
        source: "Meta Ads",
        status: "Follow-Up Scheduled",
        assigned_to: "Robert Taylor",
        interested_products: ["PKV", "PAV"],
        created_at: "2024-01-06T13:00:00Z",
        updated_at: "2024-01-06T13:00:00Z",
        created_by: "user-6"
      },
      { 
        id: "deal-7",
        name: "Tech Giants", 
        email: "maria@techgiants.com",
        phone: "+49 511 66778899",
        source: "Referral",
        status: "Follow-Up Scheduled",
        assigned_to: "Maria Garcia",
        interested_products: ["Investments", "Real Estate"],
        created_at: "2024-01-05T12:00:00Z",
        updated_at: "2024-01-05T12:00:00Z",
        created_by: "user-7"
      }
    ]
  },
  { 
    id: "closing",
    name: "Closing Call",
    color: "bg-green-50 border-green-200",
    deals: [
      { 
        id: "deal-8",
        name: "Premium Corp", 
        email: "jennifer@premium.com",
        phone: "+49 201 33445566",
        source: "Website",
        status: "Closing Call Scheduled",
        assigned_to: "Jennifer Lee",
        interested_products: ["PKV", "PAV", "Investments"],
        created_at: "2024-01-03T15:00:00Z",
        updated_at: "2024-01-03T15:00:00Z",
        created_by: "user-8"
      },
      { 
        id: "deal-9",
        name: "Elite Systems", 
        email: "michael@elite.com",
        phone: "+49 341 77889900",
        source: "LinkedIn",
        status: "Closing Call Scheduled",
        assigned_to: "Michael Brown",
        interested_products: ["Real Estate"],
        created_at: "2024-01-02T10:00:00Z",
        updated_at: "2024-01-02T10:00:00Z",
        created_by: "user-9"
      }
    ]
  },
  { 
    id: "stuck",
    name: "Stuck",
    color: "bg-red-50 border-red-200",
    deals: [
      { 
        id: "deal-10",
        name: "Difficult Client Ltd", 
        email: "peter@difficult.com",
        phone: "+49 521 12121212",
        source: "Website",
        status: "Stuck",
        assigned_to: "Peter Wilson",
        interested_products: ["PKV"],
        created_at: "2023-12-15T09:00:00Z",
        updated_at: "2023-12-15T09:00:00Z",
        created_by: "user-10"
      }
    ]
  }
];

interface DealCardProps {
  deal: Lead;
  onDealClick: (deal: Lead) => void;
  isDragOverlay?: boolean;
}

function DealCard({ deal, onDealClick, isDragOverlay = false }: DealCardProps) {
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
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span>{new Date(deal.created_at).toLocaleDateString('de-DE')}</span>
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

  // Filter stages based on selected agent and merge DB leads
  const filteredStages = stages.map(stage => {
    const stageStatus = getStatusFromStage(stage.id);
    const dbDeals = leads
      .filter(l => l.status === stageStatus)
      .filter(l => selectedAgent === "all" || l.assigned_to === selectedAgent);

    const stageDeals = selectedAgent === "all" 
      ? stage.deals 
      : stage.deals.filter(deal => deal.assigned_to === selectedAgent);

    // merge by id to avoid duplicates
    const merged = [...stageDeals, ...dbDeals.filter(d => !stageDeals.some(s => s.id === d.id))];
    return { ...stage, deals: merged };
  });

  const totalDeals = filteredStages.reduce((acc, stage) => acc + stage.deals.length, 0);
  const totalAllDeals = stages.reduce((acc, stage) => acc + stage.deals.length, 0);

  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { 
        distance: 8 
      } 
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const deal = stages.flatMap(stage => stage.deals).find(deal => deal.id === active.id);
    setActiveDeal(deal || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);
    setDragOverStage(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the deal and stages
    const sourceDeal = stages.flatMap(stage => stage.deals).find(deal => deal.id === activeId);
    if (!sourceDeal) return;

    const sourceStage = stages.find(stage => stage.deals.some(deal => deal.id === activeId));
    let targetStage = stages.find(stage => stage.id === overId);
    
    // If dropping on another deal, find its stage
    if (!targetStage) {
      targetStage = stages.find(stage => stage.deals.some(deal => deal.id === overId));
    }

    if (!sourceStage || !targetStage) return;

    // Same stage reordering
    if (sourceStage.id === targetStage.id) {
      const oldIndex = sourceStage.deals.findIndex(d => d.id === activeId);
      let newIndex = sourceStage.deals.findIndex(d => d.id === overId);
      
      // If dropping on the container itself, place at end
      if (newIndex === -1) newIndex = sourceStage.deals.length;
      
      if (oldIndex !== newIndex) {
        setStages(prev => prev.map(stage =>
          stage.id === sourceStage.id
            ? { ...stage, deals: arrayMove(stage.deals, oldIndex, newIndex) }
            : stage
        ));
      }
      return;
    }

    // Cross-stage movement
    const updatedDeal = { ...sourceDeal, status: getStatusFromStage(targetStage.id) };

    setStages(prev => prev.map(stage => {
      if (stage.id === sourceStage.id) {
        return { ...stage, deals: stage.deals.filter(deal => deal.id !== activeId) };
      }
      if (stage.id === targetStage!.id) {
        return { ...stage, deals: [...stage.deals, updatedDeal] };
      }
      return stage;
    }));

    // Update backend
    try {
      await updateLead(activeId, { status: getStatusFromStage(targetStage.id) });
      toast({
        title: "Deal moved",
        description: `${sourceDeal.name} moved to ${targetStage.name}`,
      });
    } catch (error) {
      console.error("Failed to update deal:", error);
      toast({
        title: "Error",
        description: "Failed to move deal. Please try again.",
        variant: "destructive",
      });
      // Revert on error
      setStages(dealStages);
    }
  };

  const handleDealClick = (deal: Lead) => {
    setSelectedLead(deal);
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
                  <SelectItem value="all">All Agents ({totalAllDeals})</SelectItem>
                  {uniqueAgents.map(agent => {
                    const agentDeals = stages.flatMap(s => s.deals).filter(d => d.assigned_to === agent).length;
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
              isDragOverlay 
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Modal */}
      <LeadDetailsModal
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
        onUpdateLead={handleUpdateLead}
      />
    </div>
  );
}