import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Tag, Calendar } from "lucide-react";

const dealStages = [
  { 
    name: "Discovery Call Booked", 
    count: 15,
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
      },
      { 
        name: "StartUp Inc", 
        contact: "Anna Wilson", 
        email: "anna@startup.com",
        interested_products: ["PAV"],
        date: "2024-01-12"
      },
      { 
        name: "Global Systems", 
        contact: "Tom Brown", 
        email: "tom@globalsystems.net",
        interested_products: ["Real Estate", "Investments"],
        date: "2024-01-11"
      }
    ]
  },
  { 
    name: "Second Meeting Booked",
    count: 12,
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
      },
      { 
        name: "Big Corp Ltd", 
        contact: "James Wilson", 
        email: "james@bigcorp.com",
        interested_products: ["PAV", "Real Estate"],
        date: "2024-01-07"
      }
    ]
  },
  { 
    name: "Follow-Up Scheduled",
    count: 8,
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
      },
      { 
        name: "Digital Leaders", 
        contact: "Alex Johnson", 
        email: "alex@digitalleaders.net",
        interested_products: ["Insurances"],
        date: "2024-01-04"
      }
    ]
  },
  { 
    name: "Closing Call Scheduled",
    count: 5,
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
      },
      { 
        name: "Success Ltd", 
        contact: "Sophie White", 
        email: "sophie@success.co.uk",
        interested_products: ["PKV", "Insurances"],
        date: "2024-01-01"
      }
    ]
  }
];

export function PipelineDashboard() {
  const totalDeals = dealStages.reduce((acc, stage) => acc + stage.count, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
              Sales Pipeline
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track deals through the sales process
            </p>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Active Deals:</span>
            <span className="text-lg font-semibold text-foreground">{totalDeals}</span>
          </div>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {dealStages.map((stage, index) => (
          <div key={stage.name} className="space-y-4">
            {/* Stage Header */}
            <div className="glass-card">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">{stage.name}</h3>
                <Badge className="bg-muted text-muted-foreground px-3 py-1">
                  {stage.deals.length}
                </Badge>
              </div>
            </div>

            {/* Deals */}
            <div className="space-y-3">
              {stage.deals.map((deal, dealIndex) => (
                <div 
                  key={dealIndex} 
                  className="glass-card hover:bg-glass/30 transition-colors cursor-pointer"
                >
                  <div className="space-y-3">
                    {/* Deal Name & Contact */}
                    <div className="space-y-1">
                      <h4 className="font-medium text-foreground text-sm">{deal.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>{deal.contact}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span>{deal.email}</span>
                      </div>
                    </div>

                    {/* Products */}
                    {deal.interested_products && deal.interested_products.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {deal.interested_products.map(product => (
                          <Badge key={product} variant="outline" className="text-xs px-1 py-0">
                            <Tag className="w-2 h-2 mr-1" />
                            {product}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
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