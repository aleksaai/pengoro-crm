import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const dealStages = [
  { 
    name: "New Leads", 
    count: 24, 
    value: "€12,400", 
    color: "status-new",
    deals: [
      { name: "Tech Solutions GmbH", value: "€5,200", source: "Meta Ads" },
      { name: "Marketing Plus", value: "€3,400", source: "Website" },
      { name: "Digital Corp", value: "€2,100", source: "Meta Ads" }
    ]
  },
  { 
    name: "Contacted", 
    count: 18, 
    value: "€24,600", 
    color: "status-contacted",
    deals: [
      { name: "Enterprise Solutions", value: "€8,900", source: "Referral" },
      { name: "StartUp Inc", value: "€4,200", source: "Meta Ads" },
      { name: "Global Tech", value: "€6,800", source: "Website" }
    ]
  },
  { 
    name: "Qualified", 
    count: 12, 
    value: "€36,800", 
    color: "status-qualified",
    deals: [
      { name: "Big Corp Ltd", value: "€15,400", source: "Meta Ads" },
      { name: "Innovation Hub", value: "€9,200", source: "Referral" },
      { name: "Future Systems", value: "€7,600", source: "Website" }
    ]
  },
  { 
    name: "Proposal", 
    count: 8, 
    value: "€45,200", 
    color: "status-proposal",
    deals: [
      { name: "Mega Enterprise", value: "€22,100", source: "Meta Ads" },
      { name: "Tech Giants", value: "€12,800", source: "Referral" },
      { name: "Digital Leaders", value: "€8,900", source: "Website" }
    ]
  }
];

const getSourceBadgeClass = (source: string) => {
  switch (source) {
    case "Meta Ads": return "source-meta";
    case "Website": return "source-website";
    case "Referral": return "source-referral";
    default: return "source-manual";
  }
};

export function PipelineDashboard() {
  const totalValue = dealStages.reduce((acc, stage) => 
    acc + parseInt(stage.value.replace(/[€,]/g, '')), 0
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="glass-card modern-card">
        <div className="space-y-4">
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
            Sales Pipeline
          </h1>
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Pipeline Value</span>
              <span className="text-3xl font-display font-bold text-primary">€{totalValue.toLocaleString()}</span>
            </div>
            <div className="h-12 w-px bg-border/60"></div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Deals</span>
              <span className="text-2xl font-display font-semibold text-foreground">
                {dealStages.reduce((acc, stage) => acc + stage.count, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {dealStages.map((stage, index) => (
          <Card 
            key={stage.name} 
            className="modern-card border-0 overflow-hidden group"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="pb-4 space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider">
                  {stage.name}
                </CardTitle>
                <Badge className={`${stage.color} px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 group-hover:scale-110`}>
                  {stage.count}
                </Badge>
              </div>
              <div className="text-3xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
                {stage.value}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {stage.deals.map((deal, dealIndex) => (
                <div 
                  key={dealIndex} 
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-glass/30 to-glass-accent/30 border border-glass-border/40 hover:border-primary/30 transition-all duration-200 hover:shadow-md backdrop-blur-sm group/deal"
                >
                  <div className="space-y-2">
                    <p className="font-display font-medium text-sm text-foreground group-hover/deal:text-primary transition-colors">
                      {deal.name}
                    </p>
                    <Badge className={`${getSourceBadgeClass(deal.source)} text-2xs px-2 py-1 rounded-md transition-all duration-200 hover:scale-105`}>
                      {deal.source}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="font-display font-bold text-base text-primary group-hover/deal:text-primary-deep transition-colors">
                      {deal.value}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}