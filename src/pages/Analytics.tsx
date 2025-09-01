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
import { TrendingUp, Users, DollarSign, Target, User, Calendar } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

const Analytics = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const { revenueData, personalAnalytics, companyAnalytics, loading } = useAnalytics(selectedMonth);

  const months = [
    { value: "", label: "All Time" },
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Monitor your CRM performance and key metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
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

      {/* Company Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <div className="text-2xl font-bold">€{companyAnalytics?.totalRevenue.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">Total monthly contributions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Deal Commission</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <div className="text-2xl font-bold">€{companyAnalytics?.averageCommission.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">Average commission per deal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <div className="text-2xl font-bold">{companyAnalytics?.totalLeads}</div>
            )}
            <p className="text-xs text-muted-foreground">All leads in pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <div className="text-2xl font-bold">{companyAnalytics?.conversionRate}%</div>
            )}
            <p className="text-xs text-muted-foreground">Company-wide conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Personal Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Personal Analytics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {loading ? <Skeleton className="h-8 w-16 mx-auto" /> : personalAnalytics?.leadsAssigned || 0}
              </div>
              <p className="text-sm text-muted-foreground">Leads Assigned</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {loading ? <Skeleton className="h-8 w-16 mx-auto" /> : `${personalAnalytics?.conversionRate || 0}%`}
              </div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {loading ? <Skeleton className="h-8 w-20 mx-auto" /> : `€${personalAnalytics?.averageDealAmount || 0}`}
              </div>
              <p className="text-sm text-muted-foreground">Avg. Deal Amount</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {loading ? <Skeleton className="h-6 w-24 mx-auto" /> : personalAnalytics?.mostSoldProduct || 'N/A'}
              </div>
              <p className="text-sm text-muted-foreground">Most Sold Product</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Company & Agent</CardTitle>
          <p className="text-sm text-muted-foreground">
            Monthly contributions and agent commissions breakdown
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Agents & Commissions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(groupedRevenueData).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.month}</TableCell>
                    <TableCell>{row.company}</TableCell>
                    <TableCell className="font-semibold text-primary">€{row.totalRevenue.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {row.agents.map((agent, i) => (
                          <Badge key={i} variant="outline" className="mr-2 mb-1">
                            {agent.agent}: €{agent.commission}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {Object.keys(groupedRevenueData).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No revenue data available for the selected period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;