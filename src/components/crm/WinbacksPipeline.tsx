import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone, User, RotateCcw, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useProfiles } from "@/hooks/useProfiles";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TaskCreateModal } from "@/components/crm/TaskCreateModal";
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
  onReactivate: (leadId: string) => void;
}

function WinbackCard({ lead, onReactivate }: WinbackCardProps) {
  const navigate = useNavigate();
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

  const handleClick = () => {
    navigate(`/leads/${lead.id}`, { state: { from: 'winbacks' } });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="glass-card p-4 cursor-pointer hover:bg-glass/50 transition-all duration-200 border border-glass-border/30"
      onClick={handleClick}
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
  onReactivate: (leadId: string) => void;
}

function WinbackStage({ stage, leads, onReactivate }: WinbackStageProps) {
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
  const [registeredUsers, setRegisteredUsers] = useState<Array<{id: string, full_name: string, email: string}>>([]);
  const [winbackLeads, setWinbackLeads] = useState<LeadWithReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showTaskCreateModal, setShowTaskCreateModal] = useState(false);
  const [selectedLeadForTask, setSelectedLeadForTask] = useState<LeadWithReason | null>(null);
  const { leads, updateLead } = useLeads();
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const { profiles } = useProfiles();
  const { preferences, loading: preferencesLoading, updatePreference, getPreference } = useUserPreferences();
  const { toast } = useToast();
  
  // Get current user's profile
  const currentProfile = profiles.find(p => p.user_id === user?.id);
  
  // Initialize filters with user preferences or defaults
  const getDefaultSearchTerm = () => getPreference('winbacks_searchTerm', '');
  const getDefaultSelectedAgent = () => {
    const saved = getPreference('winbacks_selectedAgent', null);
    // If no saved preference and user is not super admin, default to their own leads
    if (saved === null && !isSuperAdmin && currentProfile?.full_name) {
      return currentProfile.full_name;
    }
    return saved || 'all';
  };
  
  const [searchTerm, setSearchTerm] = useState<string>(getDefaultSearchTerm());
  const [selectedAgent, setSelectedAgent] = useState<string>(getDefaultSelectedAgent());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Update filters when preferences load
  useEffect(() => {
    if (!preferencesLoading) {
      setSearchTerm(getDefaultSearchTerm());
      setSelectedAgent(getDefaultSelectedAgent());
    }
  }, [preferencesLoading, preferences, currentProfile?.full_name, isSuperAdmin]);

  // Save filter preferences when they change
  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    updatePreference('winbacks_searchTerm', value);
  };

  const handleSelectedAgentChange = (value: string) => {
    setSelectedAgent(value);
    updatePreference('winbacks_selectedAgent', value);
  };

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

  // Optimized function to extract abandon reason from details
  const extractAbandonReason = (details: string | null | undefined): string => {
    if (!details) return 'Other Reason';
    
    if (details.includes('Never reached')) return 'Never reached';
    if (details.includes('Future Call')) return 'Future Call';
    if (details.includes('Bad Lead Quality')) return 'Bad Lead Quality';
    if (details.includes('No Interest')) return 'No Interest';
    if (details.includes('Chose Competitor')) return 'Chose Competitor';
    if (details.includes('Reason: ')) return details.split('Reason: ')[1] || 'Other Reason';
    if (details.includes('Reason changed to: ')) return details.split('Reason changed to: ')[1] || 'Other Reason';
    
    return 'Other Reason';
  };

  // Fetch winback leads with abandon reasons - OPTIMIZED
  useEffect(() => {
    const fetchWinbackLeads = async () => {
      console.log('🔄 Fetching winback leads...');
      setLoading(true);
      
      try {
        // Get abandoned/lost leads
        const abandonedLeads = leads.filter(lead => 
          lead.status === 'Abandoned' || lead.status === 'Lost'
        );

        if (abandonedLeads.length === 0) {
          console.log('✅ No abandoned/lost leads found');
          setWinbackLeads([]);
          setLoading(false);
          return;
        }

        // Single optimized query to get all abandon reasons at once
        const leadIds = abandonedLeads.map(lead => lead.id);
        const { data: historyData, error } = await supabase
          .from('lead_history')
          .select('lead_id, details, created_at')
          .in('lead_id', leadIds)
          .in('action', ['Lead Abandoned', 'Abandon Reason Updated'])
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching lead history:', error);
          throw error;
        }

        console.log(`✅ Fetched ${historyData?.length || 0} history entries for ${leadIds.length} leads`);

        // Group history by lead_id and get the most recent entry
        const historyByLead = new Map<string, string>();
        historyData?.forEach(entry => {
          if (!historyByLead.has(entry.lead_id)) {
            historyByLead.set(entry.lead_id, extractAbandonReason(entry.details));
          }
        });

        // Map leads with their abandon reasons
        const leadsWithReasons: LeadWithReason[] = abandonedLeads.map(lead => ({
          ...lead,
          abandonReason: historyByLead.get(lead.id) || 'Other Reason'
        }));

        // Clean up tasks for leads in "Lost" status
        await cleanupLostLeadTasks(leadsWithReasons);

        console.log(`✅ Processed ${leadsWithReasons.length} winback leads`);
        setWinbackLeads(leadsWithReasons);
        
      } catch (error) {
        console.error('❌ Error fetching winback leads:', error);
        toast({
          title: "Error Loading Winbacks",
          description: "Failed to load winback leads. Please refresh the page.",
          variant: "destructive",
        });
        setWinbackLeads([]);
      } finally {
        setLoading(false);
      }
    };

    // Cleanup function to delete tasks for leads in "Lost" winback status
    const cleanupLostLeadTasks = async (winbackLeads: LeadWithReason[]) => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', userData.user?.id)
          .single();

        let cleanedCount = 0;

        for (const lead of winbackLeads) {
          // Check if lead is in "Lost" status (not "Never reached" or "Future Call")
          if (lead.abandonReason && !['Never reached', 'Future Call'].includes(lead.abandonReason)) {
            const { data: existingTasks, error: tasksError } = await supabase
              .from('tasks')
              .select('id')
              .eq('lead_id', lead.id);

            if (tasksError) {
              console.error('Error checking tasks for lead:', lead.name, tasksError);
              continue;
            }

            if (existingTasks && existingTasks.length > 0) {
              console.log(`🧹 Cleaning up ${existingTasks.length} tasks for Lost lead: ${lead.name}`);
              
              const { error: deleteError } = await supabase
                .from('tasks')
                .delete()
                .eq('lead_id', lead.id);

              if (deleteError) {
                console.error('Error deleting tasks for lead:', lead.name, deleteError);
              } else {
                cleanedCount += existingTasks.length;
                console.log(`✅ Deleted ${existingTasks.length} tasks for Lost lead: ${lead.name}`);
                
                // Log cleanup in history
                await supabase
                  .from('lead_history')
                  .insert({
                    lead_id: lead.id,
                    action: 'Tasks Cleaned Up',
                    details: `Deleted ${existingTasks.length} existing tasks - Lead in Lost winback status (${lead.abandonReason})`,
                    created_by: userData.user?.id,
                    user_name: userProfile?.full_name || 'System'
                  });
              }
            }
          }
        }

        if (cleanedCount > 0) {
          console.log(`✅ Cleanup complete: Deleted ${cleanedCount} tasks from Lost winback leads`);
          toast({
            title: "Tasks Cleaned Up",
            description: `Removed ${cleanedCount} existing tasks from Lost winback leads`,
          });
        }
      } catch (error) {
        console.error('Error during Lost lead tasks cleanup:', error);
      }
    };

    // Only fetch if we have leads
    if (leads.length > 0) {
      fetchWinbackLeads();
    } else {
      setWinbackLeads([]);
      setLoading(false);
    }
  }, [leads, toast]);

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
      // First check if the lead has any tasks
      const { data: existingTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id')
        .eq('lead_id', leadId);

      if (tasksError) throw tasksError;

      // If no tasks exist, require task creation first
      if (!existingTasks || existingTasks.length === 0) {
        const leadToReactivate = winbackLeads.find(lead => lead.id === leadId);
        if (leadToReactivate) {
          setSelectedLeadForTask(leadToReactivate);
          setShowTaskCreateModal(true);
          return;
        }
      }

      // If tasks exist, proceed with reactivation
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
    console.log(`🔄 Updating abandon reason for lead ${leadId} to: ${newReason}`);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userData.user?.id)
        .single();

      // Check if moving to "Lost" stage (any reason that's not "Never reached" or "Future Call")
      const isMovingToLost = !['Never reached', 'Future Call'].includes(newReason);
      
      if (isMovingToLost) {
        // Delete all tasks for this lead when moving to Lost stage
        const { error: deleteTasksError } = await supabase
          .from('tasks')
          .delete()
          .eq('lead_id', leadId);

        if (deleteTasksError) {
          console.error('❌ Error deleting tasks:', deleteTasksError);
          throw deleteTasksError;
        }

        console.log(`✅ Deleted all tasks for lead ${leadId} (moved to Lost stage)`);
        
        // Log task deletion in history
        await supabase
          .from('lead_history')
          .insert({
            lead_id: leadId,
            action: 'Tasks Deleted',
            details: 'All tasks deleted - Lead moved to Lost stage',
            created_by: userData.user?.id,
            user_name: userProfile?.full_name || 'Unknown User'
          });
      }

      // Add new history entry with updated reason
      const { error: historyError } = await supabase
        .from('lead_history')
        .insert({
          lead_id: leadId,
          action: 'Abandon Reason Updated',
          details: `Reason changed to: ${newReason}`,
          created_by: userData.user?.id,
          user_name: userProfile?.full_name || 'Unknown User'
        });

      if (historyError) {
        console.error('❌ Error inserting history:', historyError);
        throw historyError;
      }

      // Optimized update: Just update the specific lead in state instead of refetching everything
      setWinbackLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId 
            ? { ...lead, abandonReason: newReason }
            : lead
        )
      );

      console.log(`✅ Successfully updated abandon reason for lead ${leadId}`);
      
      toast({
        title: "Lead Moved",
        description: `Lead moved to ${newReason} stage${isMovingToLost ? ' - All tasks deleted' : ''}`,
      });
      
    } catch (error) {
      console.error('❌ Error updating abandon reason:', error);
      toast({
        title: "Error",
        description: "Failed to move lead. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <div className="text-lg text-muted-foreground">Loading winbacks...</div>
        <div className="text-sm text-muted-foreground">Fetching abandoned and lost leads...</div>
      </div>
    );
  }

  const handleTaskCreated = () => {
    setShowTaskCreateModal(false);
    setSelectedLeadForTask(null);
    
    // Now proceed with reactivation since task was created
    if (selectedLeadForTask) {
      handleReactivate(selectedLeadForTask.id);
    }
  };

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
              onChange={(e) => handleSearchTermChange(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={selectedAgent} onValueChange={handleSelectedAgentChange}>
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
              onReactivate={handleReactivate}
            />
          ))}
        </div>

        <DragOverlay>
          {activeId ? (
            <WinbackCard
              lead={winbackLeads.find(lead => lead.id === activeId)!}
              onReactivate={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Creation Modal */}
      {selectedLeadForTask && user && (
        <TaskCreateModal
          open={showTaskCreateModal}
          onOpenChange={(open) => {
            setShowTaskCreateModal(open);
            if (!open) setSelectedLeadForTask(null);
          }}
          leadId={selectedLeadForTask.id}
          leadName={selectedLeadForTask.name}
          leadEmail={selectedLeadForTask.email}
          leadPhone={selectedLeadForTask.phone}
          currentUserId={user.id}
          currentUserName={profiles.find(p => p.user_id === user.id)?.full_name || user.email || "Unknown User"}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}