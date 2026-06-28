import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import candidateService, { Candidate } from "@/services/candidate.service";
import applicationService, { Application } from "@/services/application.service";
import jobService, { Job } from "@/services/job.service";
import interviewService from "@/services/interview.service";
import emailService from "@/services/email.service";
import teamService, { TeamMember } from "@/services/team.service";

interface InterviewSchedulerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId?: number | null;
}

const InterviewScheduler = ({ open, onOpenChange, applicationId }: InterviewSchedulerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [companyMembers, setCompanyMembers] = useState<TeamMember[]>([]);
  const [createApplicationOpen, setCreateApplicationOpen] = useState(false);
  const [creatingApplication, setCreatingApplication] = useState(false);
  
  const [newApplication, setNewApplication] = useState({
    candidateId: 0,
    jobId: 0,
    status: "shortlisted" as const
  });
  
  const [formData, setFormData] = useState({
    applicationId: 0,
    interviewerId: 0,
    date: "",
    time: "",
    duration: "60",
    type: "video",
    location: "",
    meetingUrl: "",
    mapLink: "",
    notes: ""
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        applicationId: applicationId || 0,
        interviewerId: 0,
        date: "",
        time: "",
        duration: "60",
        type: "video",
        location: "",
        meetingUrl: "",
        mapLink: "",
        notes: ""
      });
    }
  }, [open, applicationId]);

  // Set applicationId when provided
  useEffect(() => {
    if (applicationId) {
      setFormData(prev => ({ ...prev, applicationId }));
    }
  }, [applicationId]);

  // Fetch candidates, jobs, applications and company members when the dialog opens
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const candidatesData = await candidateService.getAllCandidates();
          setCandidates(candidatesData);
          
          const jobsResponse = await jobService.getUserJobs();
          setJobs(jobsResponse.jobs || []);
          
          // Get all applications for user's jobs - don't filter by status
          const applicationsResponse = await applicationService.getAllApplications();
          const applicationsData = applicationsResponse.applications || [];
          setApplications(applicationsData);
          
          // Debug logging
          console.log('InterviewScheduler - applicationId prop:', applicationId);
          console.log('InterviewScheduler - all applications:', applicationsData);
          
          // Fetch company members for interviewer selection
          const membersResponse = await teamService.getMembers();
          setCompanyMembers(membersResponse.members || []);
        } catch (error) {
          console.error("Error fetching data:", error);
          toast({
            title: "Error",
            description: "Failed to load candidates and applications",
            variant: "destructive"
          });
        }
      };
      
      fetchData();
    }
  }, [open, toast, applicationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.applicationId) {
      toast({
        title: "Error",
        description: "Please select a candidate application",
        variant: "destructive"
      });
      return;
    }

    // Validate conditional fields
    if (formData.type === 'video' && !formData.meetingUrl) {
      toast({
        title: "Error",
        description: "Meeting URL is required for virtual interviews",
        variant: "destructive"
      });
      return;
    }

    if (formData.type === 'in-person' && (!formData.location || !formData.mapLink)) {
      toast({
        title: "Error",
        description: "Meeting address and Google Map link are required for onsite interviews",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      // Format date and time for the API
      const scheduledDate = new Date(`${formData.date}T${formData.time}`).toISOString();
      
      const interviewData = {
        applicationId: formData.applicationId,
        scheduledDate,
        duration: parseInt(formData.duration),
        type: formData.type as 'video' | 'in-person',
        location: formData.location,
        meetingUrl: formData.meetingUrl,
        mapLink: formData.mapLink,
        interviewerId: formData.interviewerId || undefined,
        notes: formData.notes
      };
      
      const createdInterview = await interviewService.createInterview(interviewData);
      
      toast({
        title: "Success",
        description: "Interview scheduled and notifications sent",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error scheduling interview:", error);
      toast({
        title: "Error",
        description: "Failed to schedule interview",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApplication = async () => {
    if (!newApplication.candidateId || !newApplication.jobId) {
      toast({
        title: "Error",
        description: "Please select both a candidate and a job",
        variant: "destructive"
      });
      return;
    }
    
    setCreatingApplication(true);
    try {
      const createdApp = await applicationService.createApplication({
        candidateId: newApplication.candidateId,
        jobId: newApplication.jobId,
        status: "shortlisted",
        notes: "Created for interview scheduling"
      });
      
      // Add the new application to our list with candidate and job details
      const candidate = candidates.find(c => c.id === newApplication.candidateId);
      const job = jobs.find(j => j.id === newApplication.jobId);
      
      const newAppWithDetails = {
        ...createdApp,
        candidate,
        job
      };
      
      setApplications([...applications, newAppWithDetails]);
      
      toast({
        title: "Success",
        description: "Application created and ready for interview",
      });
      
      setCreateApplicationOpen(false);
    } catch (error) {
      console.error("Error creating application:", error);
      toast({
        title: "Error",
        description: "Failed to create application",
        variant: "destructive"
      });
    } finally {
      setCreatingApplication(false);
    }
  };

  // Component for creating a new application
  const CreateApplicationDialog = () => (
    <Dialog open={createApplicationOpen} onOpenChange={setCreateApplicationOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Application</DialogTitle>
          <DialogDescription>
            Create a new application for interview scheduling
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Candidate</Label>
            <Select 
              value={newApplication.candidateId ? String(newApplication.candidateId) : ""} 
              onValueChange={(value) => setNewApplication({...newApplication, candidateId: parseInt(value)})}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a candidate" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map(candidate => (
                  <SelectItem key={candidate.id} value={String(candidate.id)}>
                    {candidate.firstName} {candidate.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Select Job</Label>
            <Select 
              value={newApplication.jobId ? String(newApplication.jobId) : ""} 
              onValueChange={(value) => setNewApplication({...newApplication, jobId: parseInt(value)})}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map(job => (
                  <SelectItem key={job.id} value={String(job.id)}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              className="flex-1"
              onClick={handleCreateApplication}
              disabled={creatingApplication}
            >
              {creatingApplication ? "Creating..." : "Create Application"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setCreateApplicationOpen(false)} 
              disabled={creatingApplication}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Candidate Application</Label>
                </div>
                <Select 
                  value={formData.applicationId > 0 ? String(formData.applicationId) : ""} 
                  onValueChange={(value) => setFormData({...formData, applicationId: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Applicant" />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map(app => (
                      <SelectItem key={app.id} value={String(app.id)}>
                        {app.candidate?.firstName} {app.candidate?.lastName} - {app.job?.title}
                      </SelectItem>
                    ))}
                    {applications.length === 0 && (
                      <SelectItem disabled value="none">No eligible applications</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            
              <div className="space-y-2">
                <Label>Interviewer</Label>
                <Select 
                  value={formData.interviewerId > 0 ? String(formData.interviewerId) : ""} 
                  onValueChange={(value) => setFormData({...formData, interviewerId: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select interviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyMembers.map(member => (
                      <SelectItem key={member.id} value={String(member.id)}>
                        {member.name} ({member.role})
                      </SelectItem>
                    ))}
                    {companyMembers.length === 0 && (
                      <SelectItem disabled value="none">No team members available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
            
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Interview Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Virtual Interview</SelectItem>
                    <SelectItem value="in-person">Onsite Interview</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Select value={formData.duration} onValueChange={(value) => setFormData({...formData, duration: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Conditional Fields based on Interview Type */}
            {formData.type === 'video' && (
              <div className="space-y-2">
                <Label>Meeting URL *</Label>
                <Input
                  placeholder="Zoom, Teams, or Google Meet URL"
                  value={formData.meetingUrl}
                  onChange={(e) => setFormData({...formData, meetingUrl: e.target.value})}
                  required
                />
              </div>
            )}

            {formData.type === 'in-person' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meeting Address *</Label>
                  <Input
                    placeholder="Full address of the meeting location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Google Map Link *</Label>
                  <Input
                    placeholder="Google Maps URL for the location"
                    value={formData.mapLink}
                    onChange={(e) => setFormData({...formData, mapLink: e.target.value})}
                    required
                  />
                </div>
              </div>
            )}

            {(formData.type === 'video' || formData.type === 'in-person') && (
              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Input
                  placeholder="Any additional information"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes or agenda items..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Scheduling..." : "Schedule Interview"}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <CreateApplicationDialog />
    </>
  );
};

export default InterviewScheduler;