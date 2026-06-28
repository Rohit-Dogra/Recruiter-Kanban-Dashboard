import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  Calendar,
  MapPin,
  Eye,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  UserCheck,
  FileText,
} from "lucide-react";
import candidateAuthService from "@/services/candidate-auth.service";
import applicationService from "@/services/application.service";
import jobService from "@/services/job.service";
import CandidateLayout from "@/layouts/CandidateLayout";
import { useToast } from "@/hooks/use-toast";
import JobDetailsDialog from "@/components/JobDetailsDialog";
import { Job } from "@/services/job.service";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TimelineView, type TimelineItem } from "@/components/ui/TimelineView";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";

/** Map a stage string to a pipeline step index (0-based) */
const STAGE_ORDER = ["applied", "screening", "interview", "offer", "hired"] as const;

function stageIndex(stage: string): number {
  const s = stage?.toLowerCase() || "";
  if (s.includes("reject")) return -1;
  const idx = STAGE_ORDER.findIndex((st) => s.includes(st));
  return idx >= 0 ? idx : 0;
}

/** Build timeline items for an application based on its current stage */
function buildTimeline(app: { stage: string; status: string; appliedDate: string }): TimelineItem[] {
  const current = stageIndex(app.stage || app.status);
  const isRejected = (app.stage || app.status)?.toLowerCase().includes("reject");

  const steps: { label: string; icon: typeof Send }[] = [
    { label: "Applied", icon: Send },
    { label: "Screening", icon: FileText },
    { label: "Interview", icon: UserCheck },
    { label: "Offer", icon: CheckCircle2 },
    { label: "Hired", icon: CheckCircle2 },
  ];

  return steps.map((step, i) => {
    let status: TimelineItem["status"] = "upcoming";
    if (isRejected && i > current) status = "upcoming";
    else if (i < current) status = "completed";
    else if (i === current) status = "current";

    return {
      id: `${i}`,
      title: step.label,
      icon: step.icon,
      status,
      date:
        i === 0
          ? new Date(app.appliedDate).toLocaleDateString()
          : status === "completed" || status === "current"
          ? ""
          : "",
    };
  });
}

const CandidateApplications = () => {
  const [candidate, setCandidate] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false);
  const [loadingJobDetails, setLoadingJobDetails] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const candidateData = candidateAuthService.getCurrentCandidate();
    setCandidate(candidateData);
    if (candidateData?.email) {
      fetchApplications(candidateData);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchApplications = async (candidateData: any) => {
    try {
      setLoading(true);
      if (!candidateData?.email) return;
      const response = await applicationService.getCandidateApplications();
      if (response.success) {
        setApplications(
          response.applications.map((app: any) => ({
            id: app.id,
            jobId: app.jobId,
            jobTitle: app.job?.title || "Unknown Position",
            company: app.job?.company || "Unknown Company",
            status: app.status,
            stage: app.stage || "applied",
            appliedDate: app.createdAt,
            location: app.job?.location || "Not specified",
          }))
        );
      }
    } catch {
      toast({ title: "Error", description: "Failed to load applications", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleViewJobDetails = async (jobId: number) => {
    try {
      setLoadingJobDetails(true);
      const response = await jobService.getJobById(jobId);
      if (response.success && response.job) {
        setSelectedJob(response.job);
        setJobDetailsOpen(true);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load job details", variant: "destructive" });
    } finally {
      setLoadingJobDetails(false);
    }
  };

  const filteredApplications = useMemo(() => {
    if (stageFilter === "all") return applications;
    return applications.filter((app) => {
      const s = (app.stage || "").toLowerCase();
      const f = stageFilter.toLowerCase();
      if (f === "offer") return s.includes("offer");
      return s === f || s.includes(f);
    });
  }, [applications, stageFilter]);

  if (loading) {
    return (
      <CandidateLayout hideFooter>
        <PageSkeleton variant="table" count={5} />
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout hideFooter>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track all your job applications in one place
        </p>
      </div>

      {/* Filter */}
      {applications.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-3 flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground ml-auto">
              {filteredApplications.length} of {applications.length}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Application List */}
      {applications.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No applications yet"
          description="Start applying to jobs to see them here"
          actionLabel="Browse Jobs"
          onAction={() => (window.location.href = "/candidate/jobs")}
        />
      ) : filteredApplications.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No matching applications"
          description="No applications match the selected filter"
          actionLabel="Show All"
          onAction={() => setStageFilter("all")}
        />
      ) : (
        <div className="space-y-3">
          {filteredApplications.map((app) => (
            <Card key={app.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{app.jobTitle}</p>
                    <p className="text-sm text-muted-foreground">{app.company}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {app.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{" "}
                        Applied {new Date(app.appliedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={app.stage?.toLowerCase() as any || "applied"}>
                      {app.stage || app.status}
                    </StatusBadge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedId(expandedId === app.id ? null : app.id)
                      }
                    >
                      {expandedId === app.id ? "Hide" : "Timeline"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => app.jobId && handleViewJobDetails(app.jobId)}
                      disabled={loadingJobDetails || !app.jobId}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Job
                    </Button>
                  </div>
                </div>

                {/* Expandable Timeline */}
                {expandedId === app.id && (
                  <div className="mt-4 pt-4 border-t border-border pl-2">
                    <TimelineView items={buildTimeline(app)} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <JobDetailsDialog
        job={selectedJob}
        open={jobDetailsOpen}
        onOpenChange={setJobDetailsOpen}
      />
    </CandidateLayout>
  );
};

export default CandidateApplications;
