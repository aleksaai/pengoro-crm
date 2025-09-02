import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "@/hooks/useAnalytics";

interface DealDurationCardProps {
  selectedMonth?: string;
}

export const DealDurationCard = ({ selectedMonth }: DealDurationCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { revenueData, loading } = useAnalytics(selectedMonth === "all" ? undefined : selectedMonth);

  // Mock deal duration calculation (this should be calculated from actual deal lifecycle data)
  const averageDurationDays = 29;
  const averageDurationHours = 15;
  
  // Mock previous period for comparison
  const previousDurationDays = 25;
  const changeDays = averageDurationDays - previousDurationDays;
  const changeHours = averageDurationHours;

  const formatDuration = (days: number, hours: number) => {
    if (days === 0) {
      return `${hours} hours`;
    }
    if (hours === 0) {
      return `${days} days`;
    }
    return `${days} days, ${hours} hours`;
  };

  return (
    <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="w-5 h-5 text-primary" />
              Deal Duration
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor the time it takes to close deals
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
            PAST 12 MONTHS
          </span>
          <span>•</span>
          <span>FINANCIAL AND INSURANCE</span>
          <span>•</span>
          <span>WON, LOST</span>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className={`h-4 w-4 ${changeDays >= 0 ? 'text-red-600' : 'text-green-600'}`} />
                <span className={`text-sm font-medium ${changeDays >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {changeDays >= 0 ? '+' : ''}{formatDuration(changeDays, changeHours)}
                </span>
              </div>
              <div className="text-3xl font-bold">
                {formatDuration(averageDurationDays, averageDurationHours)}
              </div>
              <div className="text-sm text-muted-foreground">
                Average duration (days)
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};