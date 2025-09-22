import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { useLeadTasks } from "@/hooks/useLeadTasks";
import { useTasks } from "@/hooks/useTasks";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Search, Plus, Upload, ChevronRight, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { AddLeadDialog } from "./AddLeadDialog";
import { MassUploadDialog } from "./MassUploadDialog";
import { AbandonLeadDialog } from "./AbandonLeadDialog";
import { LeadTasksModal } from "./LeadTasksModal";
import { usePermissions } from "@/hooks/usePermissions";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/hooks/useAuth";
import { useProfiles } from "@/hooks/useProfiles";
import { deleteLeadCompletely } from "@/utils/deleteLeadCompletely";
import { getTaskSortingPriority } from "@/lib/utils";

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
  { id: "Webinar Confirmed", title: "Webinar Confirmed", color: "bg-primary", count: 0 },
  { id: "Call-Back", title: "Call-Back Scheduled", color: "bg-warning", count: 0 },
  { id: "Abandoned", title: "Abandoned", color: "bg-destructive", count: 0 },
];

interface LeadCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onOpenTasks: (lead: Lead) => void;
}

function LeadCard({ lead, onClick, onConvert, onOpenTasks }: LeadCardProps) {
  const navigate = useNavigate();
  const { tasks: leadTasks } = useLeadTasks(lead.id);
  const { isAdmin, isSuperAdmin } = usePermissions();
  // DnD is handled by parent DragDropContext


  // Tick every minute to keep time-based UI (like task urgency color) fresh
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const style: React.CSSProperties | undefined = undefined;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTodoButtonColor = () => {
    // If lead is frozen and user is admin (not super admin), show red button
    if (lead.is_frozen && isAdmin && !isSuperAdmin) {
      return "bg-destructive hover:bg-destructive/80";
    }
    
    if (!leadTasks || leadTasks.length === 0) {
      return "bg-muted hover:bg-muted/80";
    }
    
    // Find the earliest pending task
    const pendingTasks = leadTasks.filter(task => !task.done);
    if (pendingTasks.length === 0) {
      return "bg-success hover:bg-success/80";
    }

    const earliestTask = pendingTasks.sort((a, b) => 
      new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    )[0];

    const due = new Date(earliestTask.due_date);
    const dueDay = new Date(due);
    dueDay.setHours(0, 0, 0, 0);

    const todayDate = new Date(now);
    todayDate.setHours(0, 0, 0, 0);
    
    // Overdue by time
    if (due.getTime() < now) {
      return "bg-destructive hover:bg-destructive/80";
    }

    // Calculate day difference for upcoming tasks
    const daysDifference = Math.floor((dueDay.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDifference === 0) {
      // Due later today - ORANGE
      return "bg-warning hover:bg-warning/80";
    }
    
    if (daysDifference === 1) {
      // Due tomorrow - YELLOW
      return "bg-yellow hover:bg-yellow/80";
    }
    
    if (daysDifference <= 7) {
      // Due in next 7 days - GREEN
      return "bg-success hover:bg-success/80";
    }

    // Due in more than 7 days - BLUE
    return "bg-primary hover:bg-primary/80";
  };

  const handleCardClick = () => {
    // Prevent navigation for admins on frozen leads (unless super admin)
    if (lead.is_frozen && isAdmin && !isSuperAdmin) {
      return;
    }
    navigate(`/leads/${lead.id}`, { state: { from: 'leads' } });
  };

  // Determine if the card should be greyed out for admins
  const isCardDisabled = lead.is_frozen && isAdmin && !isSuperAdmin;
  const cardClasses = isCardDisabled 
    ? "glass-card p-4 cursor-not-allowed transition-all duration-200 border border-glass-border/30 opacity-50 grayscale" 
    : "glass-card p-4 cursor-pointer hover:bg-glass/50 transition-all duration-200 border border-glass-border/30";

  return (
    <div
      className={cardClasses}
      onClick={handleCardClick}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="p-1 rounded-md cursor-grab active:cursor-grabbing touch-none select-none text-muted-foreground hover:text-foreground"
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    aria-label="Drag lead"
                    title="Drag to move"
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Drag to move</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <h4 className="font-medium text-foreground text-sm truncate">{lead.name}</h4>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {lead.assigned_to && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="" alt={lead.assigned_to} />
                      <AvatarFallback className="text-xs">
                        {getInitials(lead.assigned_to)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{lead.assigned_to}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onOpenTasks(lead);
              }}
              className={`text-xs h-6 w-6 p-0 ${getTodoButtonColor()}`}
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
            {lead.status !== "Abandoned" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Prevent conversion for admins on frozen leads (unless super admin)
                        if (lead.is_frozen && isAdmin && !isSuperAdmin) {
                          return;
                        }
                        onConvert(lead);
                      }}
                      disabled={isCardDisabled}
                      className="text-xs h-6 w-6 p-0"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Convert to Deal</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
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
  onOpenTasks: (lead: Lead) => void;
}

function LeadStage({ stage, leads, onLeadClick, onConvert, onOpenTasks }: LeadStageProps) {
  return (
    <Droppable droppableId={stage.id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="bg-glass/20 rounded-xl border border-glass-border/30 p-4 min-h-[600px]"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">{stage.title}</h3>
            <Badge className={`${stage.color} text-white`}>{leads.length}</Badge>
          </div>

          <div className="flex-1 space-y-3">
            {leads.map((lead, index) => (
              <Draggable key={lead.id} draggableId={lead.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                  >
                    <LeadCard
                      lead={lead}
                      onClick={onLeadClick}
                      onConvert={onConvert}
                      onOpenTasks={onOpenTasks}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {leads.length === 0 && (
              <div className={`glass-card p-6 text-center border-2 border-dashed border-glass-border/30 transition-colors duration-200 ${snapshot.isDraggingOver ? 'border-accent bg-accent/5' : ''}`}>
                <p className="text-muted-foreground text-sm">
                  {snapshot.isDraggingOver ? 'Drop lead here' : 'No leads in this stage'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Droppable>
  );
}

export function LeadsPipeline() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedLeadForTasks, setSelectedLeadForTasks] = useState<Lead | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showMassUpload, setShowMassUpload] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  
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
      // For non-super admin users, default to showing their own leads
      const defaultAgent = isSuperAdmin ? 'all' : currentUserName;
      setSelectedAgent(getPreference('leadsPipeline_selectedAgent', defaultAgent));
      setIsInitialized(true);
    }
  }, [preferencesLoading, getPreference, isInitialized, isSuperAdmin, currentUserName]);

  // Save selectedAgent to preferences whenever it changes (but not during initialization)
  useEffect(() => {
    if (isInitialized) {
      updatePreference('leadsPipeline_selectedAgent', selectedAgent);
    }
  }, [selectedAgent, isInitialized]);
  const [registeredUsers, setRegisteredUsers] = useState<Array<{id: string, full_name: string, email: string}>>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);
  const [pendingAbandonLead, setPendingAbandonLead] = useState<Lead | null>(null);
  const { leads, loading, createLead, updateLead } = useLeads();
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


  // Get unique agents from both registered users and existing leads
  const uniqueAgents = Array.from(new Set([
    ...registeredUsers.map(user => user.full_name).filter(Boolean),
    ...leads.map(l => l.assigned_to).filter((a): a is string => !!a)
  ]));

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
  
  // Filter leads by search term and selected agent, but only include pipeline leads
  const filteredPipelineLeads = leadsInBoard.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm);
    
    const matchesAgent = selectedAgent === "all" || lead.assigned_to === selectedAgent;
    
    return matchesSearch && matchesAgent;
  });
  
  // Group leads by stage - they're already sorted by the database function
  const stagesWithLeads = leadStages.map(stage => {
    const stageLeads = filteredPipelineLeads.filter(lead => lead.status === stage.id);
    
    console.log(`[PIPELINE] Stage ${stage.id} has ${stageLeads.length} leads (already sorted by database)`);
    console.log(`[PIPELINE] Order for ${stage.id}:`, stageLeads.map(l => l.name));
    
    return {
      ...stage,
      leads: stageLeads,
      count: stageLeads.length
    };
  });

  const totalLeads = leadsInBoard.length;

  const handleAddLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'created_by'>, taskData: {title: string; description?: string; due_date: string}) => {
    try {
      // First create the lead
      const newLead = await createLead(leadData);
      
      if (newLead) {
        // Then create the initial task for the lead
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        
        if (user) {
          // Find registered users for the current user's name
          const { data: profiles, error } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', user.id)
            .single();
          
          const userName = profiles?.full_name || profiles?.email || user.email || "Unknown User";
          
          const taskPayload = {
            lead_id: newLead.id,
            lead_name: leadData.name,
            email_address: leadData.email || null,
            phone_number: leadData.phone || null,
            title: taskData.title,
            description: taskData.description?.trim() || null,
            due_date: taskData.due_date,
            assigned_to: user.id,
            assigned_to_name: userName,
            done: false,
            created_by: user.id,
          };

          await supabase.from('tasks').insert(taskPayload);
          
          // Add history entry for task creation
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', user.id)
            .single();

          await supabase.from('lead_history').insert({
            lead_id: newLead.id,
            action: 'Task Created',
            details: `New task created: "${taskPayload.title}" - Due: ${new Date(taskPayload.due_date).toLocaleDateString()}`,
            user_name: profileData?.full_name || 'Unknown User',
            created_by: user.id,
          });
        }
      }
      
      setShowAddDialog(false);
      // Reset filter to 'all' so user can see their newly created lead
      setSelectedAgent('all');
      toast({
        title: "Success",
        description: "Lead and initial task created successfully!",
      });
    } catch (error) {
      console.error('Error creating lead and task:', error);
      toast({
        title: "Error",
        description: "Failed to create lead and task. Please try again.",
        variant: "destructive",
      });
    }
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

  const handleOpenTasks = (lead: Lead) => {
    setSelectedLeadForTasks(lead);
    setShowTasksModal(true);
  };

  const handleConvertToDeal = async (lead: Lead) => {
    try {
      await updateLead(lead.id, { status: "Discovery Call Booked" });
      toast({ title: "Converted", description: `${lead.name} moved to Sales Pipeline` });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to convert lead", variant: "destructive" });
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const fromStage = source.droppableId;
    const toStage = destination.droppableId;
    if (toStage === fromStage) return;

    // Open abandon dialog to collect reason instead of immediate update
    if (toStage === 'Abandoned') {
      const lead = leads.find(l => l.id === draggableId) || null;
      setPendingAbandonLead(lead);
      setShowAbandonDialog(true);
      return;
    }

    await handleUpdateLead(draggableId, { status: toStage as Lead["status"] });
    toast({ title: 'Lead Updated', description: `Lead moved to ${toStage}` });
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

      <DragDropContext onDragEnd={onDragEnd}>
        {/* Pipeline Stages */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {stagesWithLeads.map((stage) => (
            <LeadStage
              key={stage.id}
              stage={stage}
              leads={stage.leads}
              onLeadClick={handleLeadClick}
              onConvert={handleConvertToDeal}
              onOpenTasks={handleOpenTasks}
            />
          ))}
        </div>
      </DragDropContext>

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

      {/* Tasks Modal */}
      {selectedLeadForTasks && (
        <LeadTasksModal
          open={showTasksModal}
          onOpenChange={setShowTasksModal}
          lead={selectedLeadForTasks}
        />
      )}
    </div>
  );
}