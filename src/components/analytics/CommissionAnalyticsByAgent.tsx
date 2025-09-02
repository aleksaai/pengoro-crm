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

  // Sample data based on the screenshot - this will be replaced with real platform data
  const sampleData = [
    { month: "Sep. 2024", "Aleksa Spalevic": 0, "Selim Disli": 0, "Jonas Plewka": 0, "Jannik Conrady": 0, total: 0 },
    { month: "Okt. 2024", "Aleksa Spalevic": 9020, "Selim Disli": 0, "Jonas Plewka": 0, "Jannik Conrady": 0, total: 9020 },
    { month: "Nov. 2024", "Aleksa Spalevic": 12500, "Selim Disli": 3600, "Jonas Plewka": 20500, "Jannik Conrady": 0, total: 36600 },
    { month: "Dez. 2024", "Aleksa Spalevic": 286, "Selim Disli": 0, "Jonas Plewka": 0, "Jannik Conrady": 0, total: 286 },
    { month: "Jan. 2025", "Aleksa Spalevic": 4910, "Selim Disli": 0, "Jonas Plewka": 9490, "Jannik Conrady": 0, total: 14400 },
    { month: "Feb. 2025", "Aleksa Spalevic": 0, "Selim Disli": 0, "Jonas Plewka": 8940, "Jannik Conrady": 0, total: 8940 },
    { month: "März 2025", "Aleksa Spalevic": 0, "Selim Disli": 0, "Jonas Plewka": 19400, "Jannik Conrady": 15100, total: 34500 },
    { month: "Apr. 2025", "Aleksa Spalevic": 0, "Selim Disli": 0, "Jonas Plewka": 0, "Jannik Conrady": 15100, total: 15100 },
    { month: "Mai 2025", "Aleksa Spalevic": 0, "Selim Disli": 0, "Jonas Plewka": 2070, "Jannik Conrady": 0, total: 2070 },
    { month: "Juni 2025", "Aleksa Spalevic": 8550, "Selim Disli": 0, "Jonas Plewka": 0, "Jannik Conrady": 0, total: 8550 },
    { month: "Juli 2025", "Aleksa Spalevic": 0, "Selim Disli": 0, "Jonas Plewka": 4670, "Jannik Conrady": 0, total: 4670 },
  ];

  // Use sample data for now, will transition to real platform data
  const chartData = sampleData;
  
  // Define the sales reps from the screenshot
  const agents = ["Aleksa Spalevic", "Selim Disli", "Jonas Plewka", "Jannik Conrady"];
  
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
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <DollarSign className="w-5 h-5 text-primary" />
            Commission Analytics by Agent
          </CardTitle>
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