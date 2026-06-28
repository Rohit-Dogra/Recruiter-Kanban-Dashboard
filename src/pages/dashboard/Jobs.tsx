import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import DashboardHeader from "@/components/DashboardHeader";
import PostJobForm from "@/components/PostJobForm";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { 
  Plus, 
  Search, 
  MapPin, 
  Users,
  Eye,
  Edit,
  MoreHorizontal,
  Briefcase,
  LayoutGrid,
  List,
  Pause,
  XCircle,
  Copy,
  Clock
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import jobService, { Job } from "@/services/job.service";
import applicationService from "@/services/application.service";
import { useToast } from "@/hooks/use-toast";
import JobDetailsDialog from "@/components/JobDetailsDialog";
import EditJobDialog from "@/components/EditJobDialog";
import JobCandidatesDialog from "@/components/JobCandidatesDialog";

type ViewMode = "grid" | "table";

const Jobs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showPostJobForm, setShowPostJobForm] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicationCounts, setApplicationCounts] = useState<Record<number, number>>({});
  const [qualifiedCounts, setQualifiedCounts] = useState<Record<number, number>>({});
  const [interviewCounts, setInterviewCounts] = useState<Record<number, number>>({});
  const [offerCounts, setOfferCounts] = useState<Record<number, number>>({});
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showEditJob, setShowEditJob] = useState(false);
  const [showCandidates, setShowCandidates] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<number[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchJobs();
  }, []);
  
  useEffect(() => {
    const handleFocus = () => {
      if (jobs.length > 0) {
        refreshApplicationCounts();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [jobs]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobService.getUserJobs();
      const jobsData = response.jobs || [];
      setJobs(jobsData);
      
      const counts: Record<number, number> = {};
      const qualified: Record<number, number> = {};
      const interviews: Record<number, number> = {};
      const offers: Record<number, number> = {};
      
      for (const job of jobsData) {
        try {
          const appResponse = await applicationService.getJobApplications(job.id);
          counts[job.id] = appResponse.count || 0;
          
          const applications = appResponse.applications || [];
          qualified[job.id] = applications.filter((app: any) => app.status === 'qualified' || app.status === 'reviewed').length;
          interviews[job.id] = applications.filter((app: any) => app.status === 'interview' || app.stage === 'interview').length;
          offers[job.id] = applications.filter((app: any) => app.status === 'offer' || app.status === 'hired').length;
        } catch (error) {
          counts[job.id] = 0;
          qualified[job.id] = 0;
          interviews[job.id] = 0;
          offers[job.id] = 0;
        }
      }
      
      setApplicationCounts(counts);
      setQualifiedCounts(qualified);
      setInterviewCounts(interviews);
      setOfferCounts(offers);
    } catch (error: any) {
      toast({
        title: "Error fetching jobs",
        description: error.response?.data?.message || "Failed to load jobs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (job.department && job.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           job.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      const matchesDepartment = !departmentFilter || 
        (job.department && job.department.toLowerCase().includes(departmentFilter.toLowerCase()));
      const matchesLocation = !locationFilter || 
        (job.location && job.location.toLowerCase().includes(locationFilter.toLowerCase()));
      return matchesSearch && matchesStatus && matchesDepartment && matchesLocation;
    });
  }, [jobs, searchTerm, statusFilter, departmentFilter, locationFilter]);

  const getStatusForBadge = (status: string): "active" | "closed" | "draft" | "pending" => {
    switch (status) {
      case "active": return "active";
      case "closed": return "closed";
      case "draft": return "draft";
      case "paused": return "pending";
      default: return "pending";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  const getDaysRemaining = (deadline: string | undefined): number | null => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getAtsScoreAvg = (jobId: number): number | null => {
    // Simple indicator based on application count as proxy
    const count = applicationCounts[jobId] || 0;
    if (count === 0) return null;
    // Return a rough score based on qualified ratio
    const qualCount = qualifiedCounts[jobId] || 0;
    if (count > 0 && qualCount > 0) {
      return Math.round((qualCount / count) * 100);
    }
    return null;
  };

  const handleJobCreated = () => {
    fetchJobs();
  };

  const refreshApplicationCounts = async () => {
    const counts: Record<number, number> = {};
    const qualified: Record<number, number> = {};
    const interviews: Record<number, number> = {};
    const offers: Record<number, number> = {};
    
    for (const job of jobs) {
      try {
        const appResponse = await applicationService.getJobApplications(job.id);
        counts[job.id] = appResponse.count || 0;
        
        const applications = appResponse.applications || [];
        qualified[job.id] = applications.filter((app: any) => app.status === 'qualified' || app.status === 'reviewed').length;
        interviews[job.id] = applications.filter((app: any) => app.status === 'interview' || app.stage === 'interview').length;
        offers[job.id] = applications.filter((app: any) => app.status === 'offer' || app.status === 'hired').length;
      } catch (error) {
        counts[job.id] = 0;
        qualified[job.id] = 0;
        interviews[job.id] = 0;
        offers[job.id] = 0;
      }
    }
    
    setApplicationCounts(counts);
    setQualifiedCounts(qualified);
    setInterviewCounts(interviews);
    setOfferCounts(offers);
  };

  const handleViewDetails = (job: Job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  const handleEditJob = (job: Job) => {
    setSelectedJob(job);
    setShowEditJob(true);
  };

  const handleViewCandidates = (job: Job) => {
    setSelectedJob(job);
    setShowCandidates(true);
  };

  const toggleJobSelection = (jobId: number) => {
    setSelectedJobIds(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId) 
        : [...prev, jobId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedJobIds.length === filteredJobs.length) {
      setSelectedJobIds([]);
    } else {
      setSelectedJobIds(filteredJobs.map(j => j.id));
    }
  };

  const handleBulkPause = async () => {
    try {
      for (const jobId of selectedJobIds) {
        await jobService.updateJob(jobId, { status: 'paused' });
      }
      toast({ title: "Jobs paused", description: `${selectedJobIds.length} job(s) paused successfully.` });
      setSelectedJobIds([]);
      fetchJobs();
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to pause some jobs.", variant: "destructive" });
    }
  };

  const handleBulkClose = async () => {
    try {
      for (const jobId of selectedJobIds) {
        await jobService.updateJob(jobId, { status: 'closed' });
      }
      toast({ title: "Jobs closed", description: `${selectedJobIds.length} job(s) closed successfully.` });
      setSelectedJobIds([]);
      fetchJobs();
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to close some jobs.", variant: "destructive" });
    }
  };

  const handleBulkDuplicate = async () => {
    try {
      for (const jobId of selectedJobIds) {
        const job = jobs.find(j => j.id === jobId);
        if (job) {
          const { id, companyId, createdAt, updatedAt, userId, ...jobData } = job;
          await jobService.createJob({ ...jobData, title: `${job.title} (Copy)`, status: 'draft' });
        }
      }
      toast({ title: "Jobs duplicated", description: `${selectedJobIds.length} job(s) duplicated as drafts.` });
      setSelectedJobIds([]);
      fetchJobs();
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to duplicate some jobs.", variant: "destructive" });
    }
  };

  // Loading state with PageSkeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardHeader 
          title="Jobs" 
          subtitle="Loading jobs..."
          action={
            <Button variant="hero" disabled>
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </Button>
          }
        />
        <PageSkeleton variant="cards" count={6} />
      </div>
    );
  }

  const renderJobCard = (job: Job) => {
    const daysRemaining = getDaysRemaining(job.deadline);
    const atsScore = getAtsScoreAvg(job.id);
    const isSelected = selectedJobIds.includes(job.id);

    return (
      <Card 
        key={job.id} 
        className={`group bg-card border border-border shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 ${isSelected ? 'ring-2 ring-primary border-primary/40' : ''}`}
      >
        <CardContent className="p-5">
          {/* Checkbox + Header */}
          <div className="flex items-start gap-3">
            <div className="pt-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleJobSelection(job.id)}
                aria-label={`Select ${job.title}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 
                  className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate cursor-pointer"
                  onClick={() => handleViewDetails(job)}
                >
                  {job.title}
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => handleViewDetails(job)} className="cursor-pointer">
                      <Eye className="w-4 h-4 mr-2" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditJob(job)} className="cursor-pointer">
                      <Edit className="w-4 h-4 mr-2" /> Edit Job
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleViewCandidates(job)} className="cursor-pointer">
                      <Users className="w-4 h-4 mr-2" /> View Candidates
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Status + Urgency */}
              <div className="flex items-center gap-2 mb-3">
                <StatusBadge status={getStatusForBadge(job.status)} dot>
                  {job.status}
                </StatusBadge>
                {job.urgency && (
                  <Badge variant={getUrgencyColor(job.urgency)} className="capitalize text-xs">
                    {job.urgency}
                  </Badge>
                )}
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {job.company}
                </span>
                {job.department && (
                  <span>{job.department}</span>
                )}
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.location}{job.isRemote ? " (Remote)" : ""}
                  </span>
                )}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5 text-sm">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">{applicationCounts[job.id] || 0}</span>
                  <span className="text-muted-foreground text-xs">applicants</span>
                </div>
                {daysRemaining !== null && (
                  <div className={`flex items-center gap-1.5 text-sm ${daysRemaining <= 3 ? 'text-destructive' : daysRemaining <= 7 ? 'text-warning' : 'text-muted-foreground'}`}>
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      {daysRemaining > 0 ? `${daysRemaining}d left` : daysRemaining === 0 ? 'Today' : 'Expired'}
                    </span>
                  </div>
                )}
                {atsScore !== null && (
                  <div className="flex items-center gap-1.5">
                    <ScoreRing score={atsScore} size={28} strokeWidth={3} showLabel={true} />
                    <span className="text-xs text-muted-foreground">ATS</span>
                  </div>
                )}
              </div>

              {/* Skills */}
              {(() => {
                const skills = Array.isArray(job.skills) ? job.skills : typeof job.skills === "string" ? (() => { try { return JSON.parse(job.skills); } catch { return []; } })() : [];
                return skills.length > 0 ? (
                <div className="flex flex-wrap gap-1 mb-3">
                  {skills.slice(0, 3).map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs px-2 py-0 bg-primary/10 text-primary">
                      {skill}
                    </Badge>
                  ))}
                  {skills.length > 3 && (
                    <Badge variant="outline" className="text-xs px-2 py-0 border-border text-muted-foreground">
                      +{skills.length - 3}
                    </Badge>
                  )}
                </div>
                ) : null;
              })()}

              {/* Footer actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {new Date(job.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate(`/dashboard/jobs/${job.id}/pipeline`)}>
                    <Users className="w-3 h-3 mr-1" /> Pipeline
                  </Button>
                  <Button variant="default" size="sm" className="h-7 text-xs" onClick={() => handleEditJob(job)}>
                    <Edit className="w-3 h-3 mr-1" /> Edit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTableView = () => (
    <Card className="bg-card border border-border shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-3 text-left w-10">
                  <Checkbox
                    checked={selectedJobIds.length === filteredJobs.length && filteredJobs.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all jobs"
                  />
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground">Job Title</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Department</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Location</th>
                <th className="p-3 text-center font-medium text-muted-foreground">Applicants</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Deadline</th>
                <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => {
                const daysRemaining = getDaysRemaining(job.deadline);
                const isSelected = selectedJobIds.includes(job.id);
                return (
                  <tr key={job.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                    <td className="p-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleJobSelection(job.id)}
                        aria-label={`Select ${job.title}`}
                      />
                    </td>
                    <td className="p-3">
                      <button onClick={() => handleViewDetails(job)} className="font-medium text-foreground hover:text-primary transition-colors text-left">
                        {job.title}
                      </button>
                      <p className="text-xs text-muted-foreground">{job.company}</p>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={getStatusForBadge(job.status)}>
                        {job.status}
                      </StatusBadge>
                    </td>
                    <td className="p-3 text-muted-foreground">{job.department || "—"}</td>
                    <td className="p-3 text-muted-foreground">{job.location || "—"}</td>
                    <td className="p-3 text-center">
                      <span className="font-medium text-foreground">{applicationCounts[job.id] || 0}</span>
                    </td>
                    <td className="p-3">
                      {daysRemaining !== null ? (
                        <span className={`text-xs font-medium ${daysRemaining <= 3 ? 'text-destructive' : daysRemaining <= 7 ? 'text-warning' : 'text-muted-foreground'}`}>
                          {daysRemaining > 0 ? `${daysRemaining}d left` : daysRemaining === 0 ? 'Today' : 'Expired'}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleViewCandidates(job)}>
                          <Users className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditJob(job)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => handleViewDetails(job)} className="cursor-pointer">
                              <Eye className="w-4 h-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/jobs/${job.id}/pipeline`)} className="cursor-pointer">
                              <Users className="w-4 h-4 mr-2" /> Pipeline
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Jobs" 
        subtitle={`${filteredJobs.length} active job postings`}
        action={
          <Button variant="hero" onClick={() => setShowPostJobForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        }
      />

      {/* View Toggle + Filters */}
      <Card className="bg-card border border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Top row: search + view toggle */}
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center border border-border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    className="h-9 w-9 rounded-r-none"
                    onClick={() => setViewMode("grid")}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="icon"
                    className="h-9 w-9 rounded-l-none"
                    onClick={() => setViewMode("table")}
                    aria-label="Table view"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Additional filters row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Filter by department..."
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="sm:w-[200px]"
              />
              <Input
                placeholder="Filter by location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="sm:w-[200px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      {selectedJobIds.length > 0 && (
        <Card className="bg-primary/5 border border-primary/20 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {selectedJobIds.length} job{selectedJobIds.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkPause}>
                  <Pause className="w-4 h-4 mr-1" /> Pause
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkClose}>
                  <XCircle className="w-4 h-4 mr-1" /> Close
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkDuplicate}>
                  <Copy className="w-4 h-4 mr-1" /> Duplicate
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedJobIds([])}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jobs Content */}
      {filteredJobs.length === 0 ? (
        jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="Post your first job"
            description="Get started by creating your first job posting to attract candidates."
            actionLabel="Post New Job"
            onAction={() => setShowPostJobForm(true)}
          />
        ) : (
          <EmptyState
            icon={Search}
            title="No jobs found"
            description="Try adjusting your search or filters to find what you're looking for."
          />
        )
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredJobs.map(renderJobCard)}
        </div>
      ) : (
        renderTableView()
      )}
      
      <PostJobForm 
        open={showPostJobForm} 
        onOpenChange={setShowPostJobForm}
        onJobCreated={handleJobCreated}
      />
      
      <JobDetailsDialog 
        job={selectedJob}
        open={showJobDetails}
        onOpenChange={setShowJobDetails}
      />
      
      <EditJobDialog 
        job={selectedJob}
        open={showEditJob}
        onOpenChange={setShowEditJob}
        onJobUpdated={handleJobCreated}
      />
      
      <JobCandidatesDialog 
        job={selectedJob}
        open={showCandidates}
        onOpenChange={setShowCandidates}
      />
    </div>
  );
};

export default Jobs;
