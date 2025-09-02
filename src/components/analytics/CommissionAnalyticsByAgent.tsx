import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "@/hooks/useAnalytics";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CommissionAnalyticsByAgentProps {
  selectedMonth?: string;
}

export const CommissionAnalyticsByAgent = ({ selectedMonth }: CommissionAnalyticsByAgentProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { revenueData, loading } = useAnalytics(selectedMonth === "all" ? undefined : selectedMonth);

  // Transform data for stacked bar chart
  const chartData = revenueData.reduce((acc, item) => {
    const existing = acc.find(d => d.month === item.month);
    if (existing) {
      existing[item.agent] = (existing[item.agent] || 0) + item.commission;
      existing.total += item.commission;
    } else {
      acc.push({
        month: item.month,
        [item.agent]: item.commission,
        total: item.commission,
      });
    }
    return acc;
  }, [] as Array<{ month: string; total: number; [key: string]: any }>);

  // Get unique agents for colors
  const agents = [...new Set(revenueData.map(item => item.agent))];
  
  // Define colors for agents
  const agentColors = [
    'hsl(var(--primary))',
    'hsl(var(--secondary-foreground))',
    'hsl(var(--accent-foreground))',
    'hsl(var(--muted-foreground))',
    'hsl(var(--ring))',
    'hsl(142, 76%, 36%)', // Green
    'hsl(262, 83%, 58%)', // Purple
    'hsl(346, 87%, 43%)', // Pink/Red
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{`${label}`}</p>
          {payload
            .filter((entry: any) => entry.dataKey !== 'total' && entry.value > 0)
            .map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {`${entry.dataKey}: €${entry.value?.toLocaleString()}`}
              </p>
            ))}
          <p className="font-medium text-sm pt-1 border-t border-border mt-1">
            Total: €{payload.find((p: any) => p.dataKey === 'total')?.value?.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Commission Analytics by Agent</CardTitle>
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
            <Skeleton className="h-80 w-full" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {agents.map((agent, index) => (
                  <Bar
                    key={agent}
                    dataKey={agent}
                    stackId="commission"
                    fill={agentColors[index % agentColors.length]}
                    radius={index === agents.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-80 text-muted-foreground">
              <div className="text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No commission data available for the selected period</p>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};