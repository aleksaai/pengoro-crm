import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, DollarSign, Target, User, Calendar, ArrowUpRight, ArrowDownRight, BarChart3, PieChart } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

const Analytics = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const { revenueData, personalAnalytics, companyAnalytics, loading } = useAnalytics(
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
  ];

  const groupedRevenueData = revenueData.reduce((acc, item) => {
    const key = `${item.month}-${item.company}`;
    if (!acc[key]) {
      acc[key] = {
        month: item.month,
        company: item.company,
        agents: [],
        totalRevenue: 0,
      };
    }
    acc[key].agents.push({ agent: item.agent, commission: item.commission });
    acc[key].totalRevenue += item.revenue;
    return acc;
  }, {} as Record<string, { month: string; company: string; agents: { agent: string; commission: number }[]; totalRevenue: number }>);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary/80 to-accent p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-white/80 text-lg">Monitor your CRM performance with advanced insights</p>
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
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/20 rounded-full blur-2xl"></div>
      </div>

      {/* Company Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <div className="text-3xl font-bold text-foreground mb-2">
                €{companyAnalytics?.totalRevenue.toLocaleString()}
              </div>
            )}
            <div className="flex items-center space-x-1">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <p className="text-xs text-green-600 font-medium">+12.5% from last period</p>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Deal Commission</CardTitle>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <div className="text-3xl font-bold text-foreground mb-2">
                €{companyAnalytics?.averageCommission.toLocaleString()}
              </div>
            )}
            <div className="flex items-center space-x-1">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <p className="text-xs text-green-600 font-medium">+8.3% from last period</p>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <div className="text-3xl font-bold text-foreground mb-2">
                {companyAnalytics?.totalLeads}
              </div>
            )}
            <div className="flex items-center space-x-1">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <p className="text-xs text-green-600 font-medium">+15.2% from last period</p>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <div className="text-3xl font-bold text-foreground mb-2">
                {companyAnalytics?.conversionRate}%
              </div>
            )}
            <div className="flex items-center space-x-1">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <p className="text-xs text-green-600 font-medium">+3.1% from last period</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personal Analytics */}
      <Card className="overflow-hidden border-2 hover:border-primary/20 transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Personal Analytics</CardTitle>
              <p className="text-sm text-muted-foreground">Your individual performance metrics</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center group">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-primary mb-1">
                {loading ? <Skeleton className="h-8 w-16 mx-auto" /> : personalAnalytics?.leadsAssigned || 0}
              </div>
              <p className="text-sm text-muted-foreground font-medium">Leads Assigned</p>
            </div>
            <div className="text-center group">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-primary mb-1">
                {loading ? <Skeleton className="h-8 w-16 mx-auto" /> : `${personalAnalytics?.conversionRate || 0}%`}
              </div>
              <p className="text-sm text-muted-foreground font-medium">Conversion Rate</p>
            </div>
            <div className="text-center group">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-primary mb-1">
                {loading ? <Skeleton className="h-8 w-20 mx-auto" /> : `€${personalAnalytics?.averageDealAmount || 0}`}
              </div>
              <p className="text-sm text-muted-foreground font-medium">Avg. Deal Amount</p>
            </div>
            <div className="text-center group">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div className="text-lg font-bold text-primary mb-1">
                {loading ? <Skeleton className="h-6 w-24 mx-auto" /> : personalAnalytics?.mostSoldProduct || 'N/A'}
              </div>
              <p className="text-sm text-muted-foreground font-medium">Most Sold Product</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Table */}
      <Card className="overflow-hidden border-2 hover:border-primary/20 transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/10 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <PieChart className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Revenue by Company & Agent</CardTitle>
                <p className="text-sm text-muted-foreground">Monthly contributions and agent commissions breakdown</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-muted/50">
                    <TableHead className="font-semibold">Month</TableHead>
                    <TableHead className="font-semibold">Company</TableHead>
                    <TableHead className="font-semibold">Revenue</TableHead>
                    <TableHead className="font-semibold">Agents & Commissions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(groupedRevenueData).map((row, index) => (
                    <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{row.month}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary"></div>
                          {row.company}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-lg text-green-600">
                          €{row.totalRevenue.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {row.agents.map((agent, i) => (
                            <Badge key={i} variant="outline" className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 hover:from-primary/20 hover:to-accent/20 transition-all">
                              {agent.agent}: €{agent.commission}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {Object.keys(groupedRevenueData).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                            <BarChart3 className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground text-lg">No revenue data available for the selected period</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;