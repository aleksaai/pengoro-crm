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

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88'];

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
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary/80 to-accent p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Interactive Analytics</h1>
            <p className="text-white/80 text-lg">Real-time performance insights with interactive charts</p>
          </div>
          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <Calendar className="h-5 w-5" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent className="bg-card/95 backdrop-blur-sm border-border/50">
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{loading ? "..." : companyAnalytics ? 
                (revenueData.reduce((sum, item) => sum + item.commission, 0)).toLocaleString() : "0"}
            </div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +12.5% from last period
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Commission</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{loading ? "..." : companyAnalytics?.averageCommission.toLocaleString()}
            </div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +8.3% from last period
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : companyAnalytics?.totalLeads}
            </div>
            <p className="text-xs text-purple-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +15.2% from last period
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : companyAnalytics?.conversionRate}%
            </div>
            <p className="text-xs text-orange-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +3.1% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Commission Revenue & Customer Contributions
            </CardTitle>
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
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stackId="1" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6}
                    name="Commission Revenue"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="customerContributions" 
                    stackId="2" 
                    stroke="#82ca9d" 
                    fill="#82ca9d" 
                    fillOpacity={0.6}
                    name="Customer Contributions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Company Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Commission Revenue by Company
            </CardTitle>
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
        {/* Agent Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Agent Performance
            </CardTitle>
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
                  <Bar dataKey="commission" fill="#8884d8" />
                  <Bar dataKey="deals" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Personal Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Personal Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 h-80">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {loading ? "..." : personalAnalytics?.leadsAssigned || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Leads Assigned</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {loading ? "..." : `${personalAnalytics?.conversionRate || 0}%`}
                  </div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    €{loading ? "..." : personalAnalytics?.averageDealAmount || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Avg. Deal Amount</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600 mb-2">
                    {loading ? "..." : personalAnalytics?.mostSoldProduct || 'N/A'}
                  </div>
                  <p className="text-sm text-muted-foreground">Top Product</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Width Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Lead Performance Timeline
          </CardTitle>
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
                <Line 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#8884d8" 
                  strokeWidth={3}
                  dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="conversions" 
                  stroke="#82ca9d" 
                  strokeWidth={3}
                  dot={{ fill: '#82ca9d', strokeWidth: 2, r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#ffc658" 
                  strokeWidth={3}
                  dot={{ fill: '#ffc658', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;