import { useState, useEffect, useCallback, useMemo } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { useTasks } from "@/hooks/useTasks";
import { supabase } from "@/integrations/supabase/client";
import { GripVertical, Search, Calendar, Check, X, Clock, Filter } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AbandonLeadDialog } from "./AbandonLeadDialog";
import { LeadTasksModal } from "./LeadTasksModal";
import { AddCustomerProductDialog } from "./AddCustomerProductDialog";
import { useLeadTasks } from "@/hooks/useLeadTasks";
import { usePermissions } from "@/hooks/usePermissions";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/hooks/useAuth";
import { useProfiles } from "@/hooks/useProfiles";
import { getTaskSortingPriority } from "@/lib/utils";

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
  onWonClick: (deal: Lead) => void;
  onOpenTasks: (deal: Lead) => void;
  isDragOverlay?: boolean;
}

const DealCard = React.memo(function DealCard({ deal, onDealClick, onLostClick, onWonClick, onOpenTasks, isDragOverlay = false }: DealCardProps) {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin } = usePermissions();
  const isCardDisabled = deal.is_frozen && isAdmin && !isSuperAdmin;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id, disabled: isCardDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1,
  };

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Don't trigger click if we're dragging or card is disabled
    if (isDragging || isCardDisabled) return;
    e.stopPropagation();
    navigate(`/leads/${deal.id}`, { state: { from: 'pipeline' } });
  }, [isDragging, isCardDisabled, navigate, deal.id]);

  const handleLostClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onLostClick(deal);
  }, [onLostClick, deal]);

  const handleWonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onWonClick(deal);
  }, [onWonClick, deal]);

  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const getTodoButtonColor = useMemo(() => {
    if (deal.is_frozen && isAdmin && !isSuperAdmin) {
      return "bg-destructive hover:bg-destructive/80";
    }

    // Use pre-calculated task priority from database for instant color
    const priority = deal.task_priority;
    
    if (!priority || priority === 999) {
      // No pending tasks
      return "bg-muted hover:bg-muted/80";
    }
    
    switch (priority) {
      case 1:
        // Overdue
        return "bg-destructive hover:bg-destructive/80";
      case 2:
        // Due today
        return "bg-warning hover:bg-warning/80";
      case 3:
        // Due tomorrow
        return "bg-yellow hover:bg-yellow/80";
      case 4:
        // Due within 7 days
        return "bg-success hover:bg-success/80";
      case 5:
      default:
        // Due in future (more than 7 days)
        return "bg-primary hover:bg-primary/80";
    }
  }, [deal.is_frozen, deal.task_priority, isAdmin, isSuperAdmin]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative group bg-white border border-border rounded-lg shadow-sm transition-all duration-200
        ${isDragging ? 'opacity-50 rotate-3 shadow-lg' : ''}
        ${isDragOverlay ? 'shadow-xl border-primary/50' : ''}
        ${isCardDisabled ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:shadow-md hover:-translate-y-0.5'}
      `}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded ${isCardDisabled ? 'hidden pointer-events-none' : 'cursor-grab active:cursor-grabbing'}`}
      >
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </div>

      {/* Card Content */}
      <div className="p-3 cursor-pointer" onClick={handleClick}>
        <div className="space-y-3">
          {/* Company Name */}
          <h4 className="font-medium text-foreground text-sm leading-tight pr-6">
            {deal.name}
          </h4>

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

          {/* Bottom Row with Avatar, Todo Button and Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {deal.assigned_to && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="" alt={deal.assigned_to} />
                        <AvatarFallback className="text-xs">
                          {getInitials(deal.assigned_to)}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{deal.assigned_to}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenTasks(deal);
                }}
                className={`text-xs h-6 w-6 p-0 ${getTodoButtonColor}`}
              >
                <Clock className="w-3 h-3" />
              </Button>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Won Button - only show for Closing Call stage */}
              {deal.status === "Closing Call Scheduled" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleWonClick}
                  disabled={isCardDisabled}
                  className="h-6 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-100 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Won
                </Button>
              )}
              
              {/* Lost Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLostClick}
                disabled={isCardDisabled}
                className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 mr-1" />
                Lost
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

interface DropZoneProps {
  stage: { id: string; name: string; color: string; deals: Lead[] };
  children: React.ReactNode;
  isOver?: boolean;
}

const DropZone = React.memo(function DropZone({ stage, children, isOver = false }: DropZoneProps) {
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
});

export function PipelineDashboard() {
  const [stages, setStages] = useState(dealStages);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeDeal, setActiveDeal] = useState<Lead | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  
  const { updatePreference, getPreference, loading: preferencesLoading } = useUserPreferences();
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const { profiles } = useProfiles();
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [isInitialized, setIsInitialized] = useState(false);

  // Get current user's full name for default filtering
  const currentUserName = profiles.find(p => p.user_id === user?.id)?.full_name || user?.email || '';

  // Initialize selectedAgent from preferences when they load
  useEffect(() => {
    if (!preferencesLoading && !isInitialized) {
      // For non-super admin users, default to showing their own deals
      const defaultAgent = isSuperAdmin ? 'all' : currentUserName;
      setSelectedAgent(getPreference('pipelineDashboard_selectedAgent', defaultAgent));
      setIsInitialized(true);
    }
  }, [preferencesLoading, getPreference, isInitialized, isSuperAdmin, currentUserName]);

  // Save selectedAgent to preferences whenever it changes (but not during initialization)
  useEffect(() => {
    if (isInitialized) {
      updatePreference('pipelineDashboard_selectedAgent', selectedAgent);
    }
  }, [selectedAgent, updatePreference, isInitialized]);
  
  const [registeredUsers, setRegisteredUsers] = useState<Array<{id: string, full_name: string, email: string}>>([]);
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [pendingLostLead, setPendingLostLead] = useState<Lead | null>(null);
  const [selectedLeadForTasks, setSelectedLeadForTasks] = useState<Lead | null>(null);
  const [selectedCustomerForProduct, setSelectedCustomerForProduct] = useState<Lead | null>(null);
  const handleOpenTasks = (lead: Lead) => {
    setSelectedLeadForTasks(lead);
    setShowTasksModal(true);
  };
  const { updateLead, leads } = useLeads();
  const { toast } = useToast();
  const { tasks: allTasks } = useTasks();

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
  
  // Get unique agents from both registered users and existing leads
  const uniqueAgents = Array.from(new Set([
    ...registeredUsers.map(user => user.full_name).filter(Boolean),
    ...leads.map(l => l.assigned_to).filter((a): a is string => !!a)
  ]));

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

  // Get all deals in pipeline (excluding Won, Lost, etc.)
  const pipelineStatuses = new Set(dealStages.map(stage => getStatusFromStage(stage.id)));
  const dealsInBoard = leads.filter(l => pipelineStatuses.has(l.status));

  // Sort deals by pre-calculated task priority for better performance
  const sortDealsByTaskUrgency = useMemo(() => {
    return (stageDeals: Lead[]) => {
      return stageDeals.sort((a, b) => {
        // Use pre-calculated priority from database (lower = more urgent)
        const aPriority = a.task_priority || 999;
        const bPriority = b.task_priority || 999;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // If same priority, sort by earliest due time
        const aTime = a.earliest_due_time ? new Date(a.earliest_due_time).getTime() : Infinity;
        const bTime = b.earliest_due_time ? new Date(b.earliest_due_time).getTime() : Infinity;
        
        if (aTime !== bTime) {
          return aTime - bTime;
        }
        
        // Finally by name for consistent ordering
        return a.name.localeCompare(b.name);
      });
    };
  }, []);

  // Filter stages based on selected agent and show only real leads from DB
  const filteredStages = useMemo(() => {
    return stages.map(stage => {
      const stageStatus = getStatusFromStage(stage.id);
      const dbDeals = leads
        .filter(l => l.status === stageStatus)
        .filter(l => selectedAgent === "all" || l.assigned_to === selectedAgent);
      
      const sortedDeals = sortDealsByTaskUrgency(dbDeals);

      return { ...stage, deals: sortedDeals };
    });
  }, [stages, leads, selectedAgent, sortDealsByTaskUrgency]);

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

  const handleWonClick = (deal: Lead) => {
    handleWonConfirm(deal);
  };

  const handleLostClick = (deal: Lead) => {
    setPendingLostLead(deal);
    setShowLostDialog(true);
  };

  const handleWonConfirm = async (deal: Lead) => {
    try {
      // Check if customer already exists with the same email
      const existingCustomer = leads.find(lead => 
        lead.email === deal.email && 
        lead.status === "Won" && 
        lead.id !== deal.id
      );

      if (existingCustomer) {
        // Customer exists, open Add Product dialog for upsell
        setSelectedCustomerForProduct(existingCustomer);
        setShowAddProductDialog(true);
        
        // Add history entry to the existing customer about the upsell
        const { data: userData } = await supabase.auth.getUser();
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', userData.user?.id)
          .single();

        await supabase
          .from('lead_history')
          .insert({
            lead_id: existingCustomer.id,
            action: 'Upsell Opportunity',
            details: `Upsale to an already existing customer has been created from deal: ${deal.name}`,
            created_by: userData.user?.id,
            user_name: userProfile?.full_name || 'Unknown User'
          });

        // Mark the deal as "Upsold" instead of "Won" to avoid duplicate customers
        await updateLead(deal.id, { status: "Upsold" });
        
        toast({
          title: "Existing Customer Found! 🎯",
          description: `${deal.name} is already a customer. Please add the new product.`,
        });
        return;
      }

      // No existing customer, proceed with normal conversion
      await updateLead(deal.id, { 
        status: "Won"
      });

      // Get current user info for history entry
      const { data: userData } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userData.user?.id)
        .single();

      // Create lead history entry
      await supabase
        .from('lead_history')
        .insert({
          lead_id: deal.id,
          action: 'Lead Won',
          details: 'Lead successfully converted to customer',
          created_by: userData.user?.id,
          user_name: userProfile?.full_name || 'Unknown User'
        });

      toast({
        title: "Deal Won! 🎉",
        description: `${deal.name} has been converted to a customer`,
      });
    } catch (error) {
      console.error('Error marking lead as won:', error);
      toast({
        title: "Error",
        description: "Failed to mark lead as won",
        variant: "destructive",
      });
    }
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
                  <SelectItem value="all">All Agents ({dealsInBoard.length})</SelectItem>
                  {uniqueAgents.map(agent => {
                    const agentDeals = dealsInBoard.filter(d => d.assigned_to === agent).length;
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
                        onWonClick={handleWonClick}
                        onOpenTasks={handleOpenTasks}
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
              onWonClick={() => {}}
              onOpenTasks={() => {}}
              isDragOverlay 
            />
          )}
        </DragOverlay>
      </DndContext>

      {selectedLeadForTasks && (
        <LeadTasksModal
          open={showTasksModal}
          onOpenChange={setShowTasksModal}
          lead={selectedLeadForTasks}
        />
      )}

      {/* Add Product Dialog for existing customers */}
      <AddCustomerProductDialog
        customer={selectedCustomerForProduct}
        open={showAddProductDialog}
        onOpenChange={setShowAddProductDialog}
        onProductAdded={async () => {
          setShowAddProductDialog(false);
          setSelectedCustomerForProduct(null);
          toast({
            title: "Success",
            description: "Product added to existing customer successfully!",
          });
        }}
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