import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/StatCard";
import DashboardHeader from "@/components/DashboardHeader";
import PostJobForm from "@/components/PostJobForm";
import InterviewScheduler from "@/components/InterviewScheduler";
import ApplicationsModal from "@/components/ApplicationsModal";
import { useCompany } from "@/contexts/CompanyContext";
import { dashboardService, DashboardStats, RecentActivity, TopJob } from "@/services/dashboard.service";
import { 
  Users, 
  Briefcase, 
  Calendar, 
  Target,
  Plus,
  ArrowRight,
  Star,
  Clock,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import AddCandidateForm from "@/components/AddCandidateForm";
import { EmptyState } from "@/components/ui/EmptyState";

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
        dashboardService.getTopPerformingJobs()
      ]);
      
      setDashboardStats(stats);
      setRecentActivity(activity);
      setTopJobs(jobs);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };
  const stats = dashboardStats ? [
    {
      title: "Active Jobs",
      value: dashboardStats.activeJobs.toString(),
      trend: dashboardStats.activeJobsTrend ?? 2,
      icon: Briefcase,
    },
    {
      title: "Total Candidates",
      value: dashboardStats.totalCandidates.toString(),
      trend: dashboardStats.totalCandidatesTrend ?? 18,
      icon: Users,
    },
    {
      title: "Interviews This Week",
      value: dashboardStats.interviewsThisWeek.toString(),
      trend: dashboardStats.interviewsTrend ?? -3,
      icon: Calendar,
    },
    {
      title: "Hiring Success Rate",
      value: `${dashboardStats.hiringSuccessRate}%`,
      trend: dashboardStats.hiringRateTrend ?? 5,
      icon: Target,
    }
  ] : [];

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title={`Welcome back, ${user?.firstName || 'User'}!`}
        subtitle={`Here's what's happening at ${company?.name || 'your company'}.`}
        lastUpdated={lastUpdated}
        action={
          <Button variant="hero" onClick={() => setShowPostJobForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        }
      />

      {/* Error State */}
      {error && !loading && (
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load dashboard"
          description={error}
          actionLabel="Retry"
          onAction={() => fetchDashboardData()}
        />
      )}

      {!error && (
      <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
              trendLabel="vs last period"
            />
          ))
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-card border border-border/50 shadow-card hover:shadow-elegant transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
                <p className="text-sm text-muted-foreground">Latest updates from your recruitment pipeline</p>
              </div>
              <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="animate-pulse flex items-center gap-4 p-4">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2" />
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.slice(0, 10).map((activity, index) => (
                  <div key={index} className="group flex items-center gap-4 p-4 rounded-xl bg-background/50 hover:bg-background/80 hover:shadow-sm transition-all duration-300 border border-transparent hover:border-primary/10">
                    <Avatar className="w-12 h-12 ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all duration-300">
                      <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-primary/10 to-primary/5 text-primary group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300">
                        {activity.avatar}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-300 truncate">{activity.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.time)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-warning/10 text-warning">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-sm font-semibold">{activity.score}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Jobs */}
        <div>
          <Card className="bg-gradient-card border border-border/50 shadow-card hover:shadow-elegant transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold">Top Performing Jobs</CardTitle>
                <p className="text-sm text-muted-foreground">Jobs with highest engagement</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse space-y-4 p-4">
                    <div className="flex justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-32"></div>
                        <div className="h-3 bg-muted rounded w-20"></div>
                      </div>
                      <div className="h-6 bg-muted rounded w-16"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-muted rounded"></div>
                      <div className="flex justify-between">
                        <div className="h-3 bg-muted rounded w-16"></div>
                        <div className="h-3 bg-muted rounded w-8"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : topJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="w-8 h-8 mx-auto mb-2" />
                  <p>No jobs found</p>
                </div>
              ) : (
                [...topJobs].sort((a, b) => b.applications - a.applications).slice(0, 5).map((job, index) => (
                  <div key={index} className="group space-y-4 p-4 rounded-xl bg-background/50 hover:bg-background/80 hover:shadow-sm transition-all duration-300 border border-transparent hover:border-primary/10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors duration-300">{job.title}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                          {job.location}
                        </p>
                      </div>
                      <Badge 
                        variant={job.urgency === "high" ? "destructive" : job.urgency === "medium" ? "default" : "secondary"}
                        className="text-xs font-medium px-2 py-1"
                      >
                        {job.urgency}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground">Applications</span>
                        <span className="text-sm font-bold text-foreground">{job.applications}</span>
                      </div>
                      <div className="relative">
                        <Progress value={job.applications > 0 ? (job.qualified / job.applications) * 100 : 0} className="h-2 bg-muted/50" />
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full opacity-50"></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground">Qualified</span>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-success" />
                          <span className="text-sm font-bold text-success">{job.qualified}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-card border border-border/50 shadow-card hover:shadow-elegant transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
            <p className="text-sm text-muted-foreground">Streamline your recruitment workflow</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="group h-24 flex-col gap-3 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 hover:scale-105" onClick={() => setShowPostJobForm(true)}>
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary-foreground/20 transition-colors duration-300">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">Post Job</span>
            </Button>
            <Button variant="outline" className="group h-24 flex-col gap-3 hover:bg-info hover:text-info-foreground hover:border-info transition-all duration-300 hover:scale-105" onClick={() => setShowAddCandidateForm(true)}>
              <div className="p-2 rounded-lg bg-info/10 group-hover:bg-info-foreground/20 transition-colors duration-300">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">Add Candidate</span>
            </Button>
            <Button variant="outline" className="group h-24 flex-col gap-3 hover:bg-warning hover:text-warning-foreground hover:border-warning transition-all duration-300 hover:scale-105" onClick={() => setShowInterviewScheduler(true)}>
              <div className="p-2 rounded-lg bg-warning/10 group-hover:bg-warning-foreground/20 transition-colors duration-300">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">Schedule Interview</span>
            </Button>
            <Button variant="outline" className="group h-24 flex-col gap-3 hover:bg-success hover:text-success-foreground hover:border-success transition-all duration-300 hover:scale-105" onClick={() => setShowApplicationsModal(true)}>
              <div className="p-2 rounded-lg bg-success/10 group-hover:bg-success-foreground/20 transition-colors duration-300">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">Review Applications</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      </>
      )}
      
      <PostJobForm open={showPostJobForm} onOpenChange={setShowPostJobForm} />
      <AddCandidateForm open={showAddCandidateForm} onOpenChange={setShowAddCandidateForm} />
      <InterviewScheduler open={showInterviewScheduler} onOpenChange={setShowInterviewScheduler} />
      <ApplicationsModal open={showApplicationsModal} onOpenChange={setShowApplicationsModal} />
    </div>
  );
};

export default Dashboard;