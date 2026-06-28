import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Job } from "@/services/job.service";
import applicationService, { Application } from "@/services/application.service";
import { useToast } from "@/hooks/use-toast";
import { Users, Mail, Phone, Calendar, FileText } from "lucide-react";
import ResumeViewer from "./ResumeViewer";

interface JobCandidatesDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const JobCandidatesDialog = ({ job, open, onOpenChange }: JobCandidatesDialogProps) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [selectedResume, setSelectedResume] = useState<{url: string; name: string} | null>(null);
  const { toast } = useToast();

  const fetchApplications = useCallback(async () => {
    if (!job) return;
    
    try {
      setLoading(true);
      const response = await applicationService.getJobApplications(job.id);
      setApplications(response.applications || []);
    } catch (error: any) {
      toast({
        title: "Error fetching applications",
        description: error.response?.data?.message || "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [job, toast]);

  useEffect(() => {
    if (job && open) {
      fetchApplications();
    }
  }, [job, open, fetchApplications]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "default";
      case "reviewed": return "secondary";
      case "shortlisted": return "default";
      case "interview": return "default";
      case "offered": return "default";
      case "hired": return "default";
      case "rejected": return "destructive";
      default: return "secondary";
    }
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Candidates for {job.title}
          </DialogTitle>
          <DialogDescription>
            {applications.length} applications received
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {loading ? (
            <div className="text-center py-8">
              <p>Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
                <p className="text-muted-foreground">
                  Applications will appear here once candidates start applying
                </p>
              </CardContent>
            </Card>
          ) : (
            applications.map((application) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">
                          {application.candidateProfile?.firstName} {application.candidateProfile?.lastName}
                        </h3>
                        <Badge variant={getStatusColor(application.status)} className="capitalize">
                          {application.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {application.candidateProfile?.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {application.candidateProfile?.phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Applied {new Date(application.appliedDate).toLocaleDateString()}
                        </div>
                      </div>

                      {application.answers && application.answers.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-semibold mb-2">Responses:</h4>
                          <div className="space-y-1">
                            {application.answers.slice(0, 2).map((answer, index) => (
                              <div key={index} className="text-xs">
                                <span className="font-medium">{answer.question}:</span>
                                <span className="ml-2 text-muted-foreground">{answer.answer}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {application.resumeUrl && (
                        <button 
                          className="flex items-center gap-2 px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                          onClick={() => {
                            setSelectedResume({
                              url: application.resumeUrl!,
                              name: `${application.candidateProfile?.firstName} ${application.candidateProfile?.lastName}`
                            });
                            setShowResume(true);
                          }}
                        >
                          <FileText className="w-4 h-4" />
                          View Resume
                        </button>
                      )}
                      <button className="flex items-center gap-2 px-3 py-1 text-sm border rounded hover:bg-muted">
                        <Mail className="w-4 h-4" />
                        Contact
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
      
      <ResumeViewer 
        open={showResume}
        onOpenChange={setShowResume}
        resumeUrl={selectedResume?.url || null}
        candidateName={selectedResume?.name || ''}
      />
    </Dialog>
  );
};

export default JobCandidatesDialog;