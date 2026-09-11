import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Star,
  Target,
  Users,
} from "lucide-react";

import DashboardHeader from "@/components/DashboardHeader";
import PostJobForm from "@/components/PostJobForm";
import AddCandidateForm from "@/components/AddCandidateForm";
import InterviewScheduler from "@/components/InterviewScheduler";
import ApplicationsModal from "@/components/ApplicationsModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { useCompany } from "@/contexts/CompanyContext";
import { dashboardService, type DashboardStats, type RecentActivity, type TopJob } from "@/services/dashboard.service";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   RECRUITER HOME
   Layout intent: metrics first (what changed), then the two things a recruiter
   acts on — the live activity feed and the jobs that need attention — with
   quick actions pinned where the eye lands last.
   ══════════════════════════════════════════════════════════════════════════ */

const QUICK_ACTIONS = [
  { key: "job", label: "Post a job", hint: "Publish a new role", icon: Plus, tone: "primary" },
  { key: "candidate", label: "Add candidate", hint: "Upload a résumé", icon: Users, tone: "info" },
  { key: "interview", label: "Schedule interview", hint: "Book a slot", icon: Calendar, tone: "warning" },
  { key: "review", label: "Review applications", hint: "Triage the inbox", icon: CheckCircle2, tone: "success" },
] as const;

const ACTION_TONES: Record<string, string> = {
  primary: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
  info: "bg-info/10 text-info group-hover:bg-info group-hover:text-info-foreground",
  warning: "bg-warning/12 text-warning group-hover:bg-warning group-hover:text-warning-foreground",
  success: "bg-success/10 text-success group-hover:bg-success group-hover:text-success-foreground",
};

function formatTimeAgo(dateString: string) {
  const diffInMinutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
}

const Dashboard = () => {
  const { company, user } = useCompany();

  const [showPostJobForm, setShowPostJobForm] = useState(false);
  const [showAddCandidateForm, setShowAddCandidateForm] = useState(false);
  const [showInterviewScheduler, setShowInterviewScheduler] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topJobs, setTopJobs] = useState<TopJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [stats, activity, jobs] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getRecentActivity(),
        dashboardService.getTopPerformingJobs(),
      ]);

      setDashboardStats(stats);
      // Coerce to arrays: an unexpected payload shape should surface as an
      // empty state, not crash the page in `.slice()` further down.
      setRecentActivity(Array.isArray(activity) ? activity : []);
      setTopJobs(Array.isArray(jobs) ? jobs : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openAction = (key: (typeof QUICK_ACTIONS)[number]["key"]) => {
    if (key === "job") setShowPostJobForm(true);
    if (key === "candidate") setShowAddCandidateForm(true);
    if (key === "interview") setShowInterviewScheduler(true);
    if (key === "review") setShowApplicationsModal(true);
  };

  const stats = dashboardStats
    ? [
        {
          title: "Active jobs",
          value: dashboardStats.activeJobs,
          trend: dashboardStats.activeJobsTrend ?? 2,
          icon: Briefcase,
          tone: "brand" as const,
        },
        {
          title: "Total candidates",
          value: dashboardStats.totalCandidates,
          trend: dashboardStats.totalCandidatesTrend ?? 18,
          icon: Users,
          tone: "cyan" as const,
        },
        {
          title: "Interviews this week",
          value: dashboardStats.interviewsThisWeek,
          trend: dashboardStats.interviewsTrend ?? -3,
          icon: Calendar,
          tone: "fuchsia" as const,
        },
        {
          title: "Hiring success rate",
          value: `${dashboardStats.hiringSuccessRate}%`,
          trend: dashboardStats.hiringRateTrend ?? 5,
          icon: Target,
          tone: "success" as const,
        },
      ]
    : [];

  return (
    <div className="pb-4">
      <DashboardHeader
        title={`Welcome back, ${user?.firstName || "there"}`}
        subtitle={`Here's what's moving at ${company?.name || "your company"}.`}
        lastUpdated={lastUpdated}
        action={
          <Button variant="hero" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setShowPostJobForm(true)}>
            Post a job
          </Button>
        }
      />

      {error && !loading ? (
        <EmptyState
          icon={AlertTriangle}
          tone="error"
          title="Unable to load your dashboard"
          description={error}
          actionLabel="Try again"
          onAction={fetchDashboardData}
        />
      ) : (
        <div className="space-y-5">
          {/* ── Metrics ── */}
          <Stagger gap={0.06} className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <StaggerItem key={i}>
                    <StatCard loading title="" value="" />
                  </StaggerItem>
                ))
              : stats.map((s) => (
                  <StaggerItem key={s.title}>
                    <StatCard
                      title={s.title}
                      value={s.value}
                      icon={s.icon}
                      trend={s.trend}
                      tone={s.tone}
                      trendLabel="vs last period"
                    />
                  </StaggerItem>
                ))}
          </Stagger>

          <div className="grid min-w-0 gap-4 lg:grid-cols-3">
            {/* ── Activity feed ── */}
            <Card className="min-w-0 lg:col-span-2">
              <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
                <div>
                  <CardTitle>Recent activity</CardTitle>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    The latest movements across your pipeline
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm" className="shrink-0">
                  <Link to="/dashboard/candidates">
                    View all
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardHeader>

              <CardContent className="pt-0">
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-[var(--radius-md)] p-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-3.5 w-3/5" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                        <Skeleton className="h-6 w-12 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : recentActivity.length === 0 ? (
                  <EmptyState
                    size="sm"
                    icon={Clock}
                    title="Nothing has happened yet"
                    description="Activity appears here as candidates apply, get scored and move between stages."
                    actionLabel="Post your first job"
                    onAction={() => setShowPostJobForm(true)}
                  />
                ) : (
                  <ul className="-mx-2 space-y-0.5">
                    {recentActivity.slice(0, 8).map((activity, index) => (
                      <li key={index} className="min-w-0">
                        <div className="group flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2.5 transition-colors duration-200 hover:bg-secondary/60">
                          <Avatar className="h-10 w-10 transition-transform duration-300 group-hover:scale-105">
                            <AvatarFallback>{activity.avatar}</AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-foreground">{activity.message}</p>
                            <p className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                              <Clock className="h-2.5 w-2.5" />
                              {formatTimeAgo(activity.time)}
                            </p>
                          </div>

                          {activity.score != null && (
                            <span className="flex shrink-0 items-center gap-1 rounded-full bg-warning/12 px-2 py-1 text-xs font-semibold tabular-nums text-warning">
                              <Star className="h-3 w-3 fill-current" />
                              {activity.score}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* ── Top jobs ── */}
            <Card className="min-w-0">
              <CardHeader className="pb-3">
                <CardTitle>Top performing jobs</CardTitle>
                <p className="mt-1 text-[13px] text-muted-foreground">Ranked by applications received</p>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-3 rounded-[var(--radius-lg)] border border-border/60 p-4">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-2 w-full rounded-full" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  ))
                ) : topJobs.length === 0 ? (
                  <EmptyState
                    size="sm"
                    icon={Briefcase}
                    title="No jobs yet"
                    description="Your best-performing roles will be ranked here."
                    actionLabel="Post a job"
                    onAction={() => setShowPostJobForm(true)}
                  />
                ) : (
                  [...topJobs]
                    .sort((a, b) => b.applications - a.applications)
                    .slice(0, 5)
                    .map((job, index) => {
                      const qualifiedPct = job.applications > 0 ? (job.qualified / job.applications) * 100 : 0;
                      return (
                        <div
                          key={index}
                          className="group rounded-[var(--radius-lg)] border border-border/60 bg-surface-2/40 p-4 transition-all duration-300 ease-expo hover:border-primary/25 hover:bg-surface-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="truncate text-[13px] font-semibold text-foreground transition-colors group-hover:text-primary">
                                {job.title}
                              </h4>
                              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{job.location}</p>
                            </div>
                            <StatusBadge
                              size="sm"
                              status={job.urgency === "high" ? "failed" : job.urgency === "medium" ? "draft" : "closed"}
                            >
                              {job.urgency}
                            </StatusBadge>
                          </div>

                          <div className="mt-3 space-y-2">
                            <Progress
                              value={qualifiedPct}
                              tone={qualifiedPct >= 50 ? "success" : "brand"}
                              className="h-1.5"
                            />
                            <div className="flex items-center justify-between font-mono text-[11px]">
                              <span className="text-muted-foreground">
                                {job.applications} application{job.applications === 1 ? "" : "s"}
                              </span>
                              <span className="flex items-center gap-1 font-semibold text-success">
                                <CheckCircle2 className="h-3 w-3" />
                                {job.qualified} qualified
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Quick actions ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Quick actions</CardTitle>
              <p className="mt-1 text-[13px] text-muted-foreground">Common tasks, one tap away</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.key}
                    onClick={() => openAction(a.key)}
                    className={cn(
                      "group flex flex-col items-start gap-3 rounded-[var(--radius-lg)] border border-border/60 bg-surface-2/40 p-4 text-left",
                      "transition-all duration-300 ease-expo hover:-translate-y-1 hover:border-primary/25 hover:shadow-md",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] transition-all duration-300 ease-spring group-hover:scale-110",
                        ACTION_TONES[a.tone]
                      )}
                    >
                      <a.icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-foreground">{a.label}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{a.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <PostJobForm open={showPostJobForm} onOpenChange={setShowPostJobForm} />
      <AddCandidateForm open={showAddCandidateForm} onOpenChange={setShowAddCandidateForm} />
      <InterviewScheduler open={showInterviewScheduler} onOpenChange={setShowInterviewScheduler} />
      <ApplicationsModal open={showApplicationsModal} onOpenChange={setShowApplicationsModal} />
    </div>
  );
};

export default Dashboard;
