import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, TrendingUp } from "lucide-react";

const dealStages = [
  { 
    name: "Discovery Call Booked", 
    count: 15, 
    value: "€18,400", 
    color: "bg-blue-500/20 text-blue-600 border-blue-500/30",
    deals: [
      { name: "Tech Solutions GmbH", value: "€5,200", contact: "John Miller" },
      { name: "Marketing Plus", value: "€3,400", contact: "Sarah Johnson" },
      { name: "Digital Corp", value: "€2,100", contact: "Mike Davis" },
      { name: "StartUp Inc", value: "€4,200", contact: "Anna Wilson" },
      { name: "Global Systems", value: "€3,500", contact: "Tom Brown" }
    ]
  },
  { 
    name: "Second Meeting Booked", 
    count: 12, 
    value: "€24,600", 
    color: "bg-purple-500/20 text-purple-600 border-purple-500/30",
    deals: [
      { name: "Enterprise Solutions", value: "€8,900", contact: "Lisa Chen" },
      { name: "Innovation Hub", value: "€6,200", contact: "David Park" },
      { name: "Future Tech", value: "€5,800", contact: "Emma Smith" },
      { name: "Big Corp Ltd", value: "€3,700", contact: "James Wilson" }
    ]
  },
  { 
    name: "Follow-Up Scheduled", 
    count: 8, 
    value: "€32,800", 
    color: "bg-orange-500/20 text-orange-600 border-orange-500/30",
    deals: [
      { name: "Mega Enterprise", value: "€15,400", contact: "Robert Taylor" },
      { name: "Tech Giants", value: "€9,200", contact: "Maria Garcia" },
      { name: "Digital Leaders", value: "€8,200", contact: "Alex Johnson" }
    ]
  },
  { 
    name: "Closing Call Scheduled", 
    count: 5, 
    value: "€45,200", 
    color: "bg-green-500/20 text-green-600 border-green-500/30",
    deals: [
      { name: "Premium Corp", value: "€22,100", contact: "Jennifer Lee" },
      { name: "Elite Systems", value: "€12,800", contact: "Michael Brown" },
      { name: "Success Ltd", value: "€10,300", contact: "Sophie White" }
    ]
  }
];

export function PipelineDashboard() {
  const totalValue = dealStages.reduce((acc, stage) => 
    acc + parseInt(stage.value.replace(/[€,]/g, '')), 0
  );

  const totalDeals = dealStages.reduce((acc, stage) => acc + stage.count, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Compact Header */}
      <div className="glass-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
              Sales Pipeline
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your deals through the sales process
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                Pipeline Value
              </div>
              <div className="text-2xl font-display font-bold text-primary">
                €{totalValue.toLocaleString()}
              </div>
            </div>
            <div className="w-px h-8 bg-border/60"></div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                Active Deals
              </div>
              <div className="text-2xl font-display font-bold text-foreground">
                {totalDeals}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Pipeline Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {dealStages.map((stage, index) => (
          <Card 
            key={stage.name} 
            className="glass-card border-0 overflow-hidden hover:scale-105 transition-transform duration-200"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight">
                  {stage.name}
                </CardTitle>
                <Badge className={`${stage.color} px-2 py-1 text-xs font-semibold rounded-full`}>
                  {stage.count}
                </Badge>
              </div>
              <div className="text-xl font-display font-bold text-foreground">
                {stage.value}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-2 pt-0">
              {stage.deals.slice(0, 3).map((deal, dealIndex) => (
                <div 
                  key={dealIndex} 
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs text-foreground truncate">
                      {deal.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {deal.contact}
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-primary ml-2">
                    {deal.value}
                  </div>
                </div>
              ))}
              
              {stage.deals.length > 3 && (
                <div className="text-center pt-1">
                  <span className="text-xs text-muted-foreground">
                    +{stage.deals.length - 3} more deals
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="glass-card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{dealStages[0].count}</div>
            <div className="text-xs text-muted-foreground">Discovery Calls</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{dealStages[1].count}</div>
            <div className="text-xs text-muted-foreground">Second Meetings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{dealStages[2].count}</div>
            <div className="text-xs text-muted-foreground">Follow-ups</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{dealStages[3].count}</div>
            <div className="text-xs text-muted-foreground">Closing Calls</div>
          </div>
        </div>
      </div>
    </div>
  );
}