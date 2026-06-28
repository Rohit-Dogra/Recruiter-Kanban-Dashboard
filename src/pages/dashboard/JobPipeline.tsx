import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/KanbanBoard";
import DashboardHeader from "@/components/DashboardHeader";
import { ArrowLeft, Users, Clock, TrendingUp } from "lucide-react";
import jobService, { Job } from "@/services/job.service";
import applicationService from "@/services/application.service";
import { useToast } from "@/hooks/use-toast";
import { useDynamicPipeline } from "@/hooks/useDynamicPipeline";
import { useAuth } from "@/contexts/AuthContext";

const JobPipeline = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const effectiveCompanyId = user?.invitedByUserId ?? user?.id;
  const dynamicStages = useDynamicPipeline(effectiveCompanyId);

  useEffect(() => {
    if (jobId) {
      fetchJobData();
    }
  }, [jobId]);

  const fetchJobData = async () => {
    if (!jobId) return;
    
    try {
      setLoading(true);
      // Fetch job details
      const jobResponse = await jobService.getJobById(parseInt(jobId));
      setJob(jobResponse.job);
      
      // Fetch applications for this job
      const appResponse = await applicationService.getJobApplications(parseInt(jobId));
      setApplications(appResponse.applications || []);
    } catch (error: any) {

      toast({
        title: "Error fetching job data",
        description: error.response?.data?.message || "Failed to load job data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardHeader 
          title="Loading..."
          subtitle="Fetching job pipeline data"
        />
        <div className="text-center py-12">
          <p>Loading pipeline...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-6">
        <DashboardHeader 
          title="Job Not Found"
          subtitle="The requested job could not be found"
        />
      </div>
    );
  }

  // Calculate stats from real application data
  const totalApplications = applications.length;
  const reviewedApplications = applications.filter(app => app.status === 'reviewed').length;
  const interviewApplications = applications.filter(app => app.status === 'interview').length;
  const offeredApplications = applications.filter(app => app.status === 'offered').length;

  const pipelineStats = [
    { title: "Total Applications", value: totalApplications, icon: Users },
    { title: "Reviewed", value: reviewedApplications, icon: TrendingUp },
    { title: "In Interview", value: interviewApplications, icon: Clock },
    { title: "Offers Extended", value: offeredApplications, icon: Users }
  ];

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title={`Pipeline: ${job.title}`}
        subtitle={`${job.department} • ${job.location}`}
        action={
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        }
      />
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {pipelineStats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title} className="bg-gradient-card border border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <IconComponent className="w-4 h-4 text-muted-foreground" />
                  <Badge variant="secondary">{stat.value}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{stat.title}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pipeline */}
      <Card className="bg-gradient-card border border-border/50">
        <CardHeader>
          <CardTitle>Recruitment Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <KanbanBoard 
            jobId={jobId} 
            applications={applications} 
            onRefresh={fetchJobData}
            customStages={dynamicStages.length > 0 ? dynamicStages : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default JobPipeline;