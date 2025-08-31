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
    <div className="space-y-6">
      <div className="glass-card">
        <h1 className="text-3xl font-bold text-foreground mb-2">Sales Pipeline</h1>
        <p className="text-muted-foreground">
          Total Pipeline Value: <span className="font-semibold text-primary">€{totalValue.toLocaleString()}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dealStages.map((stage) => (
          <Card key={stage.name} className="glass-card border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stage.name}
                </CardTitle>
                <Badge className={`${stage.color} px-2 py-1 text-xs font-medium rounded-full border`}>
                  {stage.count}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {stage.value}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {stage.deals.map((deal, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-sm text-foreground">{deal.name}</p>
                    <Badge className={`${getSourceBadgeClass(deal.source)} text-xs px-2 py-0.5 mt-1 rounded-md border`}>
                      {deal.source}
                    </Badge>
                  </div>
                  <span className="font-semibold text-sm text-primary">{deal.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}