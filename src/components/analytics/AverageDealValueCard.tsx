import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, TrendingUp, Target } from "lucide-react";
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
    <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Target className="w-5 h-5 text-primary" />
              Average Value of Won Deals
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Track the average value of successfully closed deals
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
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className={`${change >= 0 ? 'text-green-600' : 'text-red-600'} h-4 w-4`} />
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
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};