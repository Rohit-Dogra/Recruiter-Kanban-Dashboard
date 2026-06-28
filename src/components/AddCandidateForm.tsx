import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, X, Upload, User, Briefcase, MapPin, GraduationCap,
  FileText, CheckCircle2, Sparkles, ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import candidateService, { CandidateData, Candidate } from "@/services/candidate.service";
import api from "@/services/api";

interface AddCandidateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (candidate: Candidate) => void;
}

type Step = "upload" | "parsing" | "review";

interface JobOption {
  id: number;
  title: string;
}

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  location: "",
  currentTitle: "",
  currentCompany: "",
  experience: "",
  education: "",
  resumeUrl: "",
  notes: "",
  source: "resume-parsed",
};

const AddCandidateForm = ({ open, onOpenChange, onSuccess }: AddCandidateFormProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const skillInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseStatus, setParseStatus] = useState("");
  const [formData, setFormData] = useState({ ...initialForm });
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [parsedSummary, setParsedSummary] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  // Fetch company jobs when dialog opens
  useEffect(() => {
    if (open) {
      setJobsLoading(true);
      api.get("/jobs")
        .then(res => {
          const data = Array.isArray(res.data) ? res.data : res.data?.jobs || [];
          setJobs(data.map((j: any) => ({ id: j.id, title: j.title })));
        })
        .catch(() => setJobs([]))
        .finally(() => setJobsLoading(false));
    }
  }, [open]);

  const resetForm = () => {
    setFormData({ ...initialForm });
    setSkills([]);
    setNewSkill("");
    setErrors({});
    setStep("upload");
    setResumeFile(null);
    setParsedSummary(null);
    setParseProgress(0);
    setParseStatus("");
    setSelectedJobId("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  // ── Resume upload & parse ───────────────────────────────────────────────
  const handleFileSelect = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF resume.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return;
    }

    setResumeFile(file);
    setStep("parsing");
    setParseProgress(10);
    setParseStatus("Uploading resume...");

    try {
      const fd = new FormData();
      fd.append("resume", file);

      setParseProgress(30);
      setParseStatus("Extracting text from PDF...");

      const response = await api.post("/candidates/parse-resume", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });

      setParseProgress(70);
      setParseStatus("AI is extracting candidate information...");

      const { parsed, resumeUrl } = response.data;

      await new Promise(r => setTimeout(r, 400));
      setParseProgress(100);
      setParseStatus("Done! Review the extracted information.");

      setFormData(prev => ({
        ...prev,
        firstName: parsed.firstName || "",
        lastName: parsed.lastName || "",
        email: parsed.email || "",
        phone: parsed.phone || "",
        location: parsed.location || "",
        currentTitle: parsed.currentTitle || "",
        currentCompany: parsed.currentCompany || "",
        experience: parsed.experience ? mapExperience(parsed.experience) : "",
        education: parsed.education || "",
        resumeUrl: resumeUrl || "",
      }));
      setSkills(Array.isArray(parsed.skills) ? parsed.skills : []);
      setParsedSummary(parsed.summary || null);

      await new Promise(r => setTimeout(r, 500));
      setStep("review");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to parse resume. You can still fill the form manually.";
      toast({ title: "Parse failed", description: msg, variant: "destructive" });
      setStep("review");
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback(() => setDragOver(false), []);

  // ── Skills ──────────────────────────────────────────────────────────────
  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills(prev => [...prev, trimmed]);
      setNewSkill("");
      skillInputRef.current?.focus();
    }
  };
  const removeSkill = (s: string) => setSkills(prev => prev.filter(x => x !== s));

  // ── Validation & Submit ─────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.firstName.trim() || formData.firstName.trim().length < 2)
      errs.firstName = "First name required (min 2 chars)";
    if (!formData.lastName.trim() || formData.lastName.trim().length < 2)
      errs.lastName = "Last name required (min 2 chars)";
    if (!formData.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
      errs.email = "Enter a valid email";
    if (!selectedJobId) errs.jobId = "Please select a job";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const payload: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        location: formData.location.trim() || undefined,
        currentTitle: formData.currentTitle.trim() || undefined,
        currentCompany: formData.currentCompany.trim() || undefined,
        experience: formData.experience ? parseInt(formData.experience.split("-")[0]) : undefined,
        education: formData.education.trim() || undefined,
        skills: skills.length > 0 ? skills : undefined,
        notes: formData.notes.trim() || undefined,
        source: formData.source || "resume-parsed",
        jobId: parseInt(selectedJobId),
      };

      if (formData.resumeUrl) {
        payload.resumeUrl = formData.resumeUrl;
      }

      const response = await api.post("/candidates", payload);
      toast({ title: "Candidate added", description: `${formData.firstName} ${formData.lastName} has been added.` });
      if (onSuccess) onSuccess(response.data);
      handleOpenChange(false);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.response?.data?.errors?.[0]?.msg || "Failed to add candidate";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-xs text-destructive mt-1">{errors[field]}</p> : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New Candidate
          </DialogTitle>
        </DialogHeader>

        {/* ── Step: Upload ──────────────────────────────────────────────── */}
        {step === "upload" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a resume to auto-extract candidate information, or skip to fill manually.
            </p>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <input ref={fileInputRef} type="file" accept=".pdf" className="hidden"
                onChange={e => { const file = e.target.files?.[0]; if (file) handleFileSelect(file); e.target.value = ""; }} />
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Drag & drop a resume PDF here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse · PDF only · Max 10MB</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-muted-foreground">AI-powered parser will extract name, email, skills, experience and more</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button variant="outline" className="w-full" onClick={() => { setFormData(prev => ({ ...prev, source: "manual" })); setStep("review"); }}>
              Fill Manually Without Resume
            </Button>
          </div>
        )}

        {/* ── Step: Parsing ─────────────────────────────────────────────── */}
        {step === "parsing" && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <FileText className="h-7 w-7 text-primary" />
              </div>
              {resumeFile && <p className="text-sm font-medium text-foreground">{resumeFile.name}</p>}
            </div>
            <div className="space-y-2">
              <Progress value={parseProgress} className="h-2" />
              <div className="flex items-center justify-center gap-2">
                {parseProgress < 100 ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                <span className="text-sm text-muted-foreground">{parseStatus}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Step: Review ──────────────────────────────────────────────── */}
        {step === "review" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Resume indicator */}
            {resumeFile && (
              <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 p-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{resumeFile.name}</p>
                  <p className="text-xs text-muted-foreground">Resume parsed · Review and edit the fields below</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => resetForm()}>
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />Re-upload
                </Button>
              </div>
            )}

            {parsedSummary && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">{parsedSummary}</p>
                </div>
              </div>
            )}

            {/* Job Selection */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                Apply for Job <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedJobId} onValueChange={v => { setSelectedJobId(v); if (errors.jobId) setErrors(prev => { const n = { ...prev }; delete n.jobId; return n; }); }}>
                <SelectTrigger>
                  <SelectValue placeholder={jobsLoading ? "Loading jobs..." : "Select a job position"} />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map(job => (
                    <SelectItem key={job.id} value={String(job.id)}>{job.title}</SelectItem>
                  ))}
                  {jobs.length === 0 && !jobsLoading && (
                    <SelectItem value="_none" disabled>No jobs available</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FieldError field="jobId" />
            </div>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                <Input id="firstName" value={formData.firstName} onChange={e => updateField("firstName", e.target.value)} placeholder="John" />
                <FieldError field="firstName" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                <Input id="lastName" value={formData.lastName} onChange={e => updateField("lastName", e.target.value)} placeholder="Doe" />
                <FieldError field="lastName" />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                <Input id="email" type="email" value={formData.email} onChange={e => updateField("email", e.target.value)} placeholder="john@example.com" />
                <FieldError field="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={formData.phone} onChange={e => updateField("phone", e.target.value)} placeholder="+1 (555) 000-0000" />
              </div>
            </div>

            {/* Title & Company */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="currentTitle" className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />Current Title</Label>
                <Input id="currentTitle" value={formData.currentTitle} onChange={e => updateField("currentTitle", e.target.value)} placeholder="Software Engineer" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currentCompany">Current Company</Label>
                <Input id="currentCompany" value={formData.currentCompany} onChange={e => updateField("currentCompany", e.target.value)} placeholder="Acme Inc." />
              </div>
            </div>

            {/* Location, Experience, Education */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="location" className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Location</Label>
                <Input id="location" value={formData.location} onChange={e => updateField("location", e.target.value)} placeholder="New York, NY" />
              </div>
              <div className="space-y-1.5">
                <Label>Experience</Label>
                <Select value={formData.experience} onValueChange={v => updateField("experience", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1">0-1 years</SelectItem>
                    <SelectItem value="2-3">2-3 years</SelectItem>
                    <SelectItem value="4-5">4-5 years</SelectItem>
                    <SelectItem value="6-8">6-8 years</SelectItem>
                    <SelectItem value="9-12">9-12 years</SelectItem>
                    <SelectItem value="13+">13+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="education" className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />Education</Label>
                <Input id="education" value={formData.education} onChange={e => updateField("education", e.target.value)} placeholder="BS CS" />
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-1.5">
              <Label>Skills {skills.length > 0 && <span className="text-muted-foreground font-normal">({skills.length})</span>}</Label>
              <div className="flex gap-2">
                <Input ref={skillInputRef} placeholder="Type a skill and press Enter" value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} />
                <Button type="button" variant="outline" onClick={addSkill} disabled={!newSkill.trim()}>Add</Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {skills.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="flex items-center gap-1 pr-1">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Notes & Source */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={formData.notes} onChange={e => updateField("notes", e.target.value)} placeholder="Additional notes..." rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Select value={formData.source} onValueChange={v => updateField("source", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resume-parsed">Resume Upload</SelectItem>
                    <SelectItem value="manual">Manual Entry</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="job-board">Job Board</SelectItem>
                    <SelectItem value="career-site">Career Site</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {!resumeFile && (
                <Button type="button" variant="outline" onClick={() => setStep("upload")}>
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />Back
                </Button>
              )}
              <div className="flex-1" />
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : "Add Candidate"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

function mapExperience(years: number): string {
  if (years <= 1) return "0-1";
  if (years <= 3) return "2-3";
  if (years <= 5) return "4-5";
  if (years <= 8) return "6-8";
  if (years <= 12) return "9-12";
  return "13+";
}

export default AddCandidateForm;
