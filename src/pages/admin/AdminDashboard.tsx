import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import {
  Users, Briefcase, FileText, DollarSign, Building2, UserCheck,
  Calendar, CreditCard, Loader2, TrendingUp, TrendingDown,
  UserPlus, BriefcaseBusiness, ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AdminDashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => apiClient.get("/admin/stats").then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: chartData } = useQuery({
    queryKey: ["admin", "stats", "chart"],
    queryFn: () => apiClient.get("/admin/stats/chart").then((r) => r.data),
    staleTime: 120_000,
  });

  const { data: activityData } = useQuery({
    queryKey: ["admin", "activity"],
    queryFn: () => apiClient.get("/admin/activity").then((r) => r.data),
    staleTime: 60_000,
  });

  const stats = data?.data;
  const chart = chartData?.data ?? [];
  const activity = activityData?.data ?? [];

  const TrendBadge = ({ value }: { value?: number }) => {
    if (value == null) return null;
    const isUp = value >= 0;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${isUp ? "text-success" : "text-destructive"}`}>
        {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {isUp ? "+" : ""}{value}%
      </span>
    );
  };

  const cards = [
    { label: "Total Users", value: stats?.totalUsers ?? "—", icon: Users, color: "text-info bg-info/10", trend: stats?.trends?.users },
    { label: "Active Jobs", value: stats?.activeJobs ?? "—", icon: Briefcase, color: "text-success bg-success/10", trend: stats?.trends?.jobs },
    { label: "Applications", value: stats?.totalApplications ?? "—", icon: FileText, color: "text-primary bg-primary/10", trend: stats?.trends?.applications },
    { label: "Revenue", value: stats?.revenue != null ? `₹${Number(stats.revenue).toLocaleString()}` : "—", icon: DollarSign, color: "text-warning bg-warning/10" },
    { label: "Companies", value: stats?.totalCompanies ?? "—", icon: Building2, color: "text-primary bg-primary/10" },
    { label: "Candidates", value: stats?.totalCandidates ?? "—", icon: UserCheck, color: "text-success bg-success/10" },
    { label: "Interviews", value: stats?.totalInterviews ?? "—", icon: Calendar, color: "text-primary bg-primary/10" },
    { label: "Active Subs", value: stats?.activeSubscriptions ?? "—", icon: CreditCard, color: "text-warning bg-warning/10" },
  ];

  const activityIcons: Record<string, typeof UserPlus> = {
    user_registered: UserPlus,
    job_posted: BriefcaseBusiness,
    application_submitted: ClipboardList,
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.color}`}>
                <c.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{c.value}</p>
              {c.trend != null && <TrendBadge value={c.trend} />}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Chart (simple bar representation) */}
        {chart.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Overview (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chart.map((m: any) => {
                  const max = Math.max(...chart.map((c: any) => Math.max(c.users, c.jobs, c.applications)), 1);
                  return (
                    <div key={m.month} className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{m.month}</span>
                        <span>{m.users}u / {m.jobs}j / {m.applications}a</span>
                      </div>
                      <div className="flex gap-1 h-4">
                        <div className="bg-info rounded-sm" style={{ width: `${(m.users / max) * 100}%`, minWidth: m.users > 0 ? '4px' : '0' }} title={`${m.users} users`} />
                        <div className="bg-success rounded-sm" style={{ width: `${(m.jobs / max) * 100}%`, minWidth: m.jobs > 0 ? '4px' : '0' }} title={`${m.jobs} jobs`} />
                        <div className="bg-primary rounded-sm" style={{ width: `${(m.applications / max) * 100}%`, minWidth: m.applications > 0 ? '4px' : '0' }} title={`${m.applications} applications`} />
                      </div>
                    </div>
                  );
                })}
                <div className="flex gap-4 text-xs text-muted-foreground pt-2">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-info" /> Users</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-success" /> Jobs</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary" /> Applications</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto">
                {activity.slice(0, 15).map((a: any, i: number) => {
                  const Icon = activityIcons[a.type] || FileText;
                  return (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{a.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {a.type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
