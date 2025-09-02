import { PipelineConversionAnalytics } from "@/components/analytics/PipelineConversionAnalytics";
import { CommissionAnalyticsByAgent } from "@/components/analytics/CommissionAnalyticsByAgent";
import { AverageDealValueCard } from "@/components/analytics/AverageDealValueCard";
import { DealDurationCard } from "@/components/analytics/DealDurationCard";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  Calendar, 
  BarChart3, 
  PieChart,
  Activity,
} from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

const Analytics = () => {
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const { revenueData, personalAnalytics, companyAnalytics, loading, refetch } = useAnalytics(
    selectedMonth === "all" ? undefined : selectedMonth
  );

  const months = [
    { value: "all", label: "All Time" },
    { value: "2024-01", label: "Januar 2024" },
    { value: "2024-02", label: "Februar 2024" },
    { value: "2024-03", label: "März 2024" },
    { value: "2024-04", label: "April 2024" },
    { value: "2024-05", label: "Mai 2024" },
    { value: "2024-06", label: "Juni 2024" },
    { value: "2024-07", label: "Juli 2024" },
    { value: "2024-08", label: "August 2024" },
    { value: "2024-09", label: "September 2024" },
    { value: "2024-10", label: "Oktober 2024" },
    { value: "2024-11", label: "November 2024" },
    { value: "2024-12", label: "Dezember 2024" },
    { value: "2025-01", label: "Januar 2025" },
    { value: "2025-02", label: "Februar 2025" },
    { value: "2025-03", label: "März 2025" },
    { value: "2025-04", label: "April 2025" },
    { value: "2025-05", label: "Mai 2025" },
    { value: "2025-06", label: "Juni 2025" },
    { value: "2025-07", label: "Juli 2025" },
    { value: "2025-08", label: "August 2025" },
    { value: "2025-09", label: "September 2025" },
    { value: "2025-10", label: "Oktober 2025" },
    { value: "2025-11", label: "November 2025" },
    { value: "2025-12", label: "Dezember 2025" },
  ];

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('analytics-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_products'
        },
        () => {
          console.log('Customer products updated, refreshing analytics...');
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        () => {
          console.log('Leads updated, refreshing analytics...');
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [refetch]);

  // Transform data for charts - Commission is our actual revenue
  const revenueChartData = revenueData.reduce((acc, item) => {
    const existing = acc.find(d => d.month === item.month);
    if (existing) {
      existing.revenue += item.commission; // Commission is our revenue
      existing.customerContributions += item.revenue; // Customer contributions
    } else {
      acc.push({
        month: item.month,
        revenue: item.commission, // Commission is our revenue
        customerContributions: item.revenue, // Customer contributions
      });
    }
    return acc;
  }, [] as Array<{ month: string; revenue: number; customerContributions: number }>);

  // Company distribution data - based on commission earned
  const companyData = revenueData.reduce((acc, item) => {
    const existing = acc.find(d => d.company === item.company);
    if (existing) {
      existing.revenue += item.commission; // Commission is our revenue
    } else {
      acc.push({
        company: item.company,
        revenue: item.commission, // Commission is our revenue
      });
    }
    return acc;
  }, [] as Array<{ company: string; revenue: number }>);

  // Agent performance data
  const agentData = revenueData.reduce((acc, item) => {
    const existing = acc.find(d => d.agent === item.agent);
    if (existing) {
      existing.commission += item.commission;
      existing.deals += 1;
    } else {
      acc.push({
        agent: item.agent,
        commission: item.commission,
        deals: 1,
      });
    }
    return acc;
  }, [] as Array<{ agent: string; commission: number; deals: number }>);

  // Mock trend data for demonstration - adjusted to show commission revenue
  const trendData = [
    { month: 'Jan', leads: 45, conversions: 12, revenue: 1500 },
    { month: 'Feb', leads: 52, conversions: 15, revenue: 1850 },
    { month: 'Mar', leads: 48, conversions: 13, revenue: 1620 },
    { month: 'Apr', leads: 61, conversions: 18, revenue: 2210 },
    { month: 'May', leads: 55, conversions: 16, revenue: 1980 },
    { month: 'Jun', leads: 67, conversions: 21, revenue: 2540 },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))', 'hsl(var(--secondary-foreground))', 'hsl(var(--accent-foreground))', 'hsl(var(--ring))'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: €${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Real-time performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48 h-9">
              <SelectValue placeholder="Filter by month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pipeline Conversion Analytics */}
      <PipelineConversionAnalytics />

      {/* Commission Analytics by Agent */}
      <CommissionAnalyticsByAgent selectedMonth={selectedMonth} />

      {/* Deal Value and Duration Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AverageDealValueCard selectedMonth={selectedMonth} />
        <DealDurationCard selectedMonth={selectedMonth} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Commission Revenue & Customer Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueChartData.length > 0 ? revenueChartData : trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} name="Commission Revenue" />
                  <Area type="monotone" dataKey="customerContributions" stackId="2" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.2} name="Customer Contributions" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Commission Revenue by Company</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Tooltip />
                  <Legend />
                  <Pie 
                    data={companyData.length > 0 ? companyData : [
                      { company: 'Allianz', revenue: 4500 },
                      { company: 'AXA', revenue: 3200 },
                      { company: 'Munich Re', revenue: 2800 },
                      { company: 'Generali', revenue: 1500 },
                    ]}
                    cx="50%" 
                    cy="50%" 
                    outerRadius={80} 
                    dataKey="revenue"
                    nameKey="company"
                  >
                    {(companyData.length > 0 ? companyData : [
                      { company: 'Allianz', revenue: 4500 },
                      { company: 'AXA', revenue: 3200 },
                      { company: 'Munich Re', revenue: 2800 },
                      { company: 'Generali', revenue: 1500 },
                    ]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Agent Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agentData.length > 0 ? agentData : [
                  { agent: 'Alex Mueller', commission: 5200, deals: 12 },
                  { agent: 'Sarah Schmidt', commission: 4800, deals: 10 },
                  { agent: 'Michael Weber', commission: 4200, deals: 9 },
                  { agent: 'Anna Fischer', commission: 3900, deals: 8 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="commission" fill="hsl(var(--primary))" />
                  <Bar dataKey="deals" fill="hsl(var(--muted-foreground))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Personal Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-3xl font-semibold">{loading ? "..." : personalAnalytics?.leadsAssigned || 0}</div>
                <p className="text-sm text-muted-foreground">Leads Assigned</p>
              </div>
              <div>
                <div className="text-3xl font-semibold">{loading ? "..." : `${personalAnalytics?.conversionRate || 0}%`}</div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
              </div>
              <div>
                <div className="text-3xl font-semibold">€{loading ? "..." : personalAnalytics?.averageDealAmount || 0}</div>
                <p className="text-sm text-muted-foreground">Avg. Deal Amount</p>
              </div>
              <div>
                <div className="text-lg font-medium truncate">{loading ? "..." : personalAnalytics?.mostSoldProduct || 'N/A'}</div>
                <p className="text-sm text-muted-foreground">Top Product</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Width Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Lead Performance Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }} />
                <Line type="monotone" dataKey="conversions" stroke="hsl(var(--muted-foreground))" strokeWidth={3} dot={{ fill: 'hsl(var(--muted-foreground))', strokeWidth: 2, r: 6 }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--accent-foreground))" strokeWidth={3} dot={{ fill: 'hsl(var(--accent-foreground))', strokeWidth: 2, r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;