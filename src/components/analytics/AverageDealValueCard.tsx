import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, TrendingUp, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "@/hooks/useAnalytics";

interface AverageDealValueCardProps {
  selectedMonth?: string;
}

export const AverageDealValueCard = ({ selectedMonth }: AverageDealValueCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { revenueData, loading } = useAnalytics(selectedMonth === "all" ? undefined : selectedMonth);

  // Calculate average deal value from revenue data
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalDeals = revenueData.length;
  const averageDealValue = totalDeals > 0 ? totalRevenue / totalDeals : 0;
  
  // Mock previous period for comparison (this should be calculated from actual data)
  const previousAverageDealValue = 2000; // This should come from previous period data
  const change = averageDealValue - previousAverageDealValue;
  const changePercentage = previousAverageDealValue > 0 ? (change / previousAverageDealValue) * 100 : 0;

  return (
    <Card className="h-fit">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Euro className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Average value of won deals</CardTitle>
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
          <span>WON</span>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className={`h-4 w-4 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {change >= 0 ? '+' : ''}{change.toLocaleString()} € ({changePercentage.toFixed(2)}%)
                </span>
              </div>
              <div className="text-3xl font-bold">
                {averageDealValue.toLocaleString()} €
              </div>
              <div className="text-sm text-muted-foreground">
                Average deal value (EUR)
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};