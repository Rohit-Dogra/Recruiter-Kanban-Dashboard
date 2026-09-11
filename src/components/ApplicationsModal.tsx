import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { dashboardService, JobWithApplications } from "@/services/dashboard.service";
import applicationService from "@/services/application.service";
import { OfferLetterViewer } from "@/components/OfferLetterViewer";
import { Users, Mail, Phone, Calendar, Star, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApplicationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ApplicationsModal = ({ open, onOpenChange }: ApplicationsModalProps) => {
  const [jobsWithApplications, setJobsWithApplications] = useState<JobWithApplications[]>([]);
  const [loading, setLoading] = useState(false);
  const [retryingIds, setRetryingIds] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchApplications();
    }
  }, [open]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getApplicationsByJob();
      setJobsWithApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryAts = async (applicationId: number) => {
    setRetryingIds(prev => new Set(prev).add(applicationId));
    try {
      await applicationService.retryAts(applicationId);
      toast({ title: "ATS Analysis Re-initiated", description: "The resume is being re-analyzed." });
      // Refresh after a short delay to show updated status
      setTimeout(() => fetchApplications(), 2000);
    } catch (error) {
      toast({ title: "Retry Failed", description: "Could not re-initiate ATS analysis.", variant: "destructive" });
    } finally {
      setRetryingIds(prev => {
        const next = new Set(prev);
        next.delete(applicationId);
        return next;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-info/14 text-info';
      case 'reviewed': return 'bg-warning/14 text-warning';
      case 'shortlisted': return 'bg-success/14 text-success';
      case 'interview': return 'bg-primary/14 text-primary';
      case 'offered': return 'bg-warning/14 text-warning';
      case 'hired': return 'bg-success/14 text-success';
      case 'rejected': return 'bg-destructive/14 text-destructive';
      default: return 'bg-secondary text-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Review Applications
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {jobsWithApplications.map((job) => (
              <Card key={job.id} className="border border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {job.applications.length} applications
                  </p>
                </CardHeader>
                <CardContent>
                  {job.applications.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No applications yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {job.applications.map((application) => (
                        <div
                          key={application.id}
                          className="flex flex-col gap-3 p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                                {application.candidateName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm">{application.candidateName}</h4>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate">{application.email}</span>
                                </div>
                                {application.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    <span>{application.phone}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDate(application.appliedDate)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {application.atsStatus === 'completed' && application.aiScore ? (
                                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-warning/10 text-warning">
                                  <Star className="w-3 h-3 fill-current" />
                                  <span className="text-sm font-semibold">{application.aiScore}</span>
                                </div>
                              ) : application.atsStatus === 'failed' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 text-destructive border-destructive/30 hover:bg-destructive/10"
                                  disabled={retryingIds.has(application.id)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRetryAts(application.id);
                                  }}
                                >
                                  {retryingIds.has(application.id) ? (
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  ) : (
                                    <RefreshCw className="w-3 h-3 mr-1" />
                                  )}
                                  Retry Analysis
                                </Button>
                              ) : (
                                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-muted-foreground">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span className="text-xs">Analysis pending</span>
                                </div>
                              )}
                              <Badge className={`text-xs ${getStatusColor(application.status)}`}>
                                {application.status}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Show Offer Letter Button if status is offered or hired */}
                          {(application.status === 'offered' || application.status === 'hired') && (
                            <div className="pl-14">
                              <OfferLetterViewer
                                applicationId={application.id}
                                candidateName={application.candidateName}
                                buttonVariant="outline"
                                buttonSize="sm"
                                buttonClassName="w-full max-w-xs"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {jobsWithApplications.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No jobs with applications found</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationsModal;