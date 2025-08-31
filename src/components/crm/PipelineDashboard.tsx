import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Tag, Calendar } from "lucide-react";

const dealStages = [
  { 
    name: "Discovery Call Booked", 
    deals: [
      { 
        name: "Tech Solutions GmbH", 
        contact: "John Miller", 
        email: "john@techsolutions.de",
        interested_products: ["PKV", "PAV"],
        date: "2024-01-15"
      },
      { 
        name: "Marketing Plus", 
        contact: "Sarah Johnson", 
        email: "sarah@marketingplus.com",
        interested_products: ["Investments"],
        date: "2024-01-14"
      },
      { 
        name: "Digital Corp", 
        contact: "Mike Davis", 
        email: "mike@digitalcorp.eu",
        interested_products: ["PKV", "Insurances"],
        date: "2024-01-13"
      }
    ]
  },
  { 
    name: "Second Meeting Booked",
    deals: [
      { 
        name: "Enterprise Solutions", 
        contact: "Lisa Chen", 
        email: "lisa@enterprise.com",
        interested_products: ["PKV", "PAV", "Investments"],
        date: "2024-01-10"
      },
      { 
        name: "Innovation Hub", 
        contact: "David Park", 
        email: "david@innovation.co",
        interested_products: ["Insurances"],
        date: "2024-01-09"
      },
      { 
        name: "Future Tech", 
        contact: "Emma Smith", 
        email: "emma@futuretech.io",
        interested_products: ["PKV"],
        date: "2024-01-08"
      }
    ]
  },
  { 
    name: "Follow-Up Scheduled",
    deals: [
      { 
        name: "Mega Enterprise", 
        contact: "Robert Taylor", 
        email: "robert@mega.com",
        interested_products: ["PKV", "PAV"],
        date: "2024-01-06"
      },
      { 
        name: "Tech Giants", 
        contact: "Maria Garcia", 
        email: "maria@techgiants.com",
        interested_products: ["Investments", "Real Estate"],
        date: "2024-01-05"
      }
    ]
  },
  { 
    name: "Closing Call Scheduled",
    deals: [
      { 
        name: "Premium Corp", 
        contact: "Jennifer Lee", 
        email: "jennifer@premium.com",
        interested_products: ["PKV", "PAV", "Investments"],
        date: "2024-01-03"
      },
      { 
        name: "Elite Systems", 
        contact: "Michael Brown", 
        email: "michael@elite.com",
        interested_products: ["Real Estate"],
        date: "2024-01-02"
      }
    ]
  },
  { 
    name: "Stuck",
    deals: [
      { 
        name: "Difficult Client Ltd", 
        contact: "Peter Wilson", 
        email: "peter@difficult.com",
        interested_products: ["PKV"],
        date: "2023-12-15"
      },
      { 
        name: "Slow Corp", 
        contact: "Jane Slow", 
        email: "jane@slow.com",
        interested_products: ["PAV", "Insurances"],
        date: "2023-12-10"
      }
    ]
  }
];

export function PipelineDashboard() {
  const totalDeals = dealStages.reduce((acc, stage) => acc + stage.deals.length, 0);

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
      <div className="grid grid-cols-5 gap-4 h-[calc(100vh-200px)]">
        {dealStages.map((stage, index) => (
          <div key={stage.name} className="flex flex-col">
            {/* Column Header */}
            <div className="glass-card mb-3 flex-shrink-0">
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
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {stage.deals.map((deal, dealIndex) => (
                <div 
                  key={dealIndex} 
                  className="glass-card hover:bg-glass/50 transition-colors cursor-pointer p-3"
                >
                  <div className="space-y-2">
                    {/* Company Name */}
                    <h4 className="font-medium text-foreground text-sm leading-tight">
                      {deal.name}
                    </h4>
                    
                    {/* Contact */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span className="truncate">{deal.contact}</span>
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
                      <span>{new Date(deal.date).toLocaleDateString('de-DE')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}