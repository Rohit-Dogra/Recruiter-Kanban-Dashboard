import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Briefcase,
  Calendar,
  FileText,
  MapPin,
  Search,
  TrendingUp,
  Eye,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import CandidateLayout from "@/layouts/CandidateLayout";
import candidateAuthService from "@/services/candidate-auth.service";
import candidateService from "@/services/candidate.service";
import applicationService from "@/services/application.service";
import jobService from "@/services/job.service";
import { CandidateOfferLetterViewer } from "@/components/CandidateOfferLetterViewer";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const CandidateDashboard = () => {
  const [candidate, setCandidate] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const candidateData = candidateAuthService.getCurrentCandidate();
    setCandidate(candidateData);

    if (candidateData?.email) {
      Promise.all([
        fetchProfile(),
        fetchApplications(candidateData),
        fetchRecommendedJobs(),
      ]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await candidateService.getProfile();
      if (response.success && response.candidate) {
        setProfile(response.candidate);
      }
    } catch {
      // Profile may not exist yet
    }
  };

  const fetchApplications = async (candidateData: any) => {
    try {
      if (!candidateData?.email) return;
      const response = await applicationService.getCandidateApplications();
      if (response.success) {
        setApplications(
          response.applications.map((app: any) => ({
            id: app.id,
            jobTitle: app.job?.title || "Unknown Position",
            company: app.job?.company || "Unknown Company",
            status: app.status,
            stage: app.stage || "applied",
            appliedDate: app.createdAt,
            location: app.job?.location || "Not specified",
            hasInterview: app.hasInterview || false,
          }))
        );
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    }
  };

  const fetchRecommendedJobs = async () => {
    try {
      const response = await jobService.getAllJobs();
      if (response.success) {
        setRecommendedJobs((response.jobs || []).slice(0, 4));
      }
    } catch {
      // Non-critical
    }
  };

  // Profile completion percentage
  const profileCompletion = useMemo(() => {
    if (!profile && !candidate) return 0;
    const fields = [
      candidate?.firstName,
      candidate?.lastName,
      candidate?.email,
      profile?.phone,
      profile?.location,
      profile?.currentTitle,
      profile?.experience,
      profile?.education,
      profile?.skills?.length > 0,
      profile?.resumeUrl,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile, candidate]);

  const stats = useMemo(() => {
    const total = applications.length;
    const inProcess = applications.filter(
      (a) => a.status === "reviewed" || a.status === "shortlisted"
    ).length;
    const interviews = applications.filter((a) => a.hasInterview).length;
    const offered = applications.filter((a) => a.status === "offered").length;
    return { total, inProcess, interviews, offered };
  }, [applications]);

  if (loading) {
    return (
      <CandidateLayout hideFooter>
        <PageSkeleton variant="cards" count={4} />
      </CandidateLayout>
    );
  }

  if (!candidate?.email) {
    return (
      <CandidateLayout hideFooter>
        <EmptyState
          icon={User}
          title="Welcome to Hyre"
          description="Please log in as a candidate to view your dashboard."
          actionLabel="Log In"
          onAction={() => (window.location.href = "/login")}
        />
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout hideFooter>
      {/* Welcome Card */}
      <Card className="mb-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarFallback className="bg-primary/15 text-primary text-lg">
              {candidate.firstName?.[0] || "U"}
              {candidate.lastName?.[0] || ""}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Welcome back, {candidate.firstName}!
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your applications and discover new opportunities
            </p>
          </div>
          <div className="w-full sm:w-48 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Profile completion</span>
              <span className="font-medium text-foreground">{profileCompletion}%</span>
            </div>
            <Progress value={profileCompletion} className="h-2" />
            {profileCompletion < 100 && (
              <Link
                to="/candidate/profile"
                className="text-xs text-primary hover:underline"
              >
                Complete your profile →
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Applications", value: stats.total, icon: Briefcase, color: "text-info" },
          { label: "In Process", value: stats.inProcess, icon: TrendingUp, color: "text-warning" },
          { label: "Interviews", value: stats.interviews, icon: Calendar, color: "text-primary" },
          { label: "Offered", value: stats.offered, icon: CheckCircle2, color: "text-success" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Link to="/candidate/jobs">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 text-center">
              <Search className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium text-foreground">Find Jobs</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/candidate/resume">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 text-center">
              <FileText className="h-6 w-6 mx-auto mb-2 text-success" />
              <p className="text-sm font-medium text-foreground">Update Resume</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/candidate/applications">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 text-center">
              <Eye className="h-6 w-6 mx-auto mb-2 text-info" />
              <p className="text-sm font-medium text-foreground">Applications</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/candidate/companies">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 text-center">
              <Building2 className="h-6 w-6 mx-auto mb-2 text-warning" />
              <p className="text-sm font-medium text-foreground">Companies</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Recent Applications
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/candidate/applications">
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title="No applications yet"
                  description="Start your job search journey today"
                  actionLabel="Browse Jobs"
                  onAction={() => (window.location.href = "/candidate/jobs")}
                  className="py-8"
                />
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 4).map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {app.jobTitle}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {app.company} · {app.location}
                        </p>
                      </div>
                      <StatusBadge
                        status={
                          app.stage?.toLowerCase() as any || "applied"
                        }
                      >
                        {app.stage || app.status}
                      </StatusBadge>
                      {(app.status === "offered" || app.status === "hired") && (
                        <CandidateOfferLetterViewer
                          applicationId={app.id}
                          candidateName={`${candidate.firstName} ${candidate.lastName}`}
                          buttonVariant="outline"
                          buttonSize="sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recommended Jobs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Recommended Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recommendedJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No recommendations yet
              </p>
            ) : (
              <div className="space-y-3">
                {recommendedJobs.map((job: any) => (
                  <Link
                    key={job.id}
                    to="/candidate/jobs"
                    className="block rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-sm font-medium text-foreground truncate">
                      {job.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span className="truncate">{job.company || "Company"}</span>
                    </div>
                    {job.location && (
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{job.location}</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CandidateLayout>
  );
};

export default CandidateDashboard;
