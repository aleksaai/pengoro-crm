import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Tag, Calendar } from "lucide-react";
import { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LeadDetailsModal } from "./LeadDetailsModal";
import { useLeads, type Lead } from "@/hooks/useLeads";

const dealStages = [
  { 
    id: "discovery",
    name: "Discovery Call Booked", 
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
    name: "Second Meeting Booked",
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
    name: "Follow-Up Scheduled",
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
    name: "Closing Call Scheduled",
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
      },
      { 
        id: "deal-11",
        name: "Slow Corp", 
        email: "jane@slow.com",
        phone: "+49 621 34343434",
        source: "Referral",
        status: "Stuck",
        assigned_to: "Jane Slow",
        interested_products: ["PAV", "Insurances"],
        created_at: "2023-12-10T14:00:00Z",
        updated_at: "2023-12-10T14:00:00Z",
        created_by: "user-11"
      }
    ]
  }
];

interface DealCardProps {
  deal: Lead;
  onDealClick: (deal: Lead) => void;
}

function DealCard({ deal, onDealClick }: DealCardProps) {
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="glass-card hover:bg-glass/50 transition-colors cursor-pointer p-3"
      onClick={(e) => {
        e.preventDefault();
        onDealClick(deal);
      }}
    >
      <div className="space-y-2">
        {/* Company Name */}
        <h4 className="font-medium text-foreground text-sm leading-tight">
          {deal.name}
        </h4>
        
        {/* Contact */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <User className="w-3 h-3" />
          <span className="truncate">{deal.assigned_to}</span>
        </div>

        {/* Products */}
        {deal.interested_products && deal.interested_products.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {deal.interested_products.map(product => (
              <Badge key={product} variant="outline" className="text-xs px-1 py-0 h-5">
                {product}
              </Badge>
            ))}
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>{new Date(deal.created_at).toLocaleDateString('de-DE')}</span>
        </div>
      </div>
    </div>
  );
}

export function PipelineDashboard() {
  const [stages, setStages] = useState(dealStages);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const { updateLead } = useLeads();
  
  const totalDeals = stages.reduce((acc, stage) => acc + stage.deals.length, 0);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the deal being dragged
    const sourceDeal = stages.flatMap(stage => stage.deals).find(deal => deal.id === activeId);
    if (!sourceDeal) return;

    // Find source and target stages
    const sourceStage = stages.find(stage => stage.deals.some(deal => deal.id === activeId));
    const targetStage = stages.find(stage => stage.id === overId);

    if (!sourceStage || !targetStage || sourceStage.id === targetStage.id) return;

    // Update the deal status to match the new stage
    const updatedDeal = { ...sourceDeal, status: targetStage.name };

    // Update stages state
    setStages(prev => prev.map(stage => {
      if (stage.id === sourceStage.id) {
        return { ...stage, deals: stage.deals.filter(deal => deal.id !== activeId) };
      }
      if (stage.id === targetStage.id) {
        return { ...stage, deals: [...stage.deals, updatedDeal] };
      }
      return stage;
    }));

    // Update in backend
    try {
      await updateLead(activeId, { status: targetStage.name });
    } catch (error) {
      console.error("Failed to update lead status:", error);
      // Revert changes on error
      setStages(dealStages);
    }
  };

  const handleDealClick = (deal: Lead) => {
    setSelectedLead(deal);
  };

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    await updateLead(leadId, updates);
    
    // Update local state
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
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
            Sales Pipeline
          </h1>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Active Deals:</span>
            <span className="text-lg font-semibold text-foreground">{totalDeals}</span>
          </div>
        </div>
      </div>

      {/* Pipeline Columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-5 gap-4 h-[calc(100vh-200px)]">
          {stages.map((stage, index) => (
            <div key={stage.id} className="flex flex-col">
              {/* Column Header - Drop Zone */}
              <div 
                className="glass-card mb-3 flex-shrink-0"
                id={stage.id}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground text-sm leading-tight">
                    {stage.name}
                  </h3>
                  <Badge className="bg-muted text-muted-foreground px-2 py-1 text-xs">
                    {stage.deals.length}
                  </Badge>
                </div>
              </div>

              {/* Deals List - Scrollable */}
              <SortableContext 
                items={stage.deals.map(deal => deal.id)} 
                strategy={verticalListSortingStrategy}
              >
                <div 
                  className="flex-1 space-y-2 overflow-y-auto pr-1 min-h-20 p-2 rounded-lg border-2 border-dashed border-transparent transition-colors"
                  style={{
                    borderColor: 'var(--dnd-over-color, transparent)'
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).style.setProperty('--dnd-over-color', 'hsl(var(--primary))');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).style.setProperty('--dnd-over-color', 'transparent');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).style.setProperty('--dnd-over-color', 'transparent');
                  }}
                >
                  {stage.deals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onDealClick={handleDealClick}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>

      {/* Lead Details Modal */}
      <LeadDetailsModal
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
        onUpdateLead={handleUpdateLead}
      />
    </div>
  );
}