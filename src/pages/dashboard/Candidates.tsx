import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import DashboardHeader from "@/components/DashboardHeader";
import CandidateProfile from "@/components/CandidateProfile";
import AddCandidateForm from "@/components/AddCandidateForm";
import { EmailConfirmationDialog } from "@/components/EmailConfirmationDialog";
import { CallConfirmationDialog } from "@/components/CallConfirmationDialog";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TimelineView, type TimelineItem } from "@/components/ui/TimelineView";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import apiClient from "@/lib/api-client";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Plus,
  Search,
  MapPin,
  Calendar,
  Eye,
  Download,
  Mail,
  Phone,
  Send,
  FileText,
  User,
  Clock,
  MessageSquare,
  ExternalLink,
  AlertTriangle,
  Loader2,
  X,
  CheckSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import candidateService, { Candidate } from "@/services/candidate.service";
import applicationService from "@/services/application.service";
import emailService from "@/services/email.service";
import callService from "@/services/call.service";
import pipelineService from "@/services/pipeline.service";
import { useAuth } from "@/contexts/AuthContext";

// ─── CSV Export Helper ──────────────────────────────────────────────────────

function escapeCsvValue(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function exportCandidatesCsv(candidates: MappedCandidate[]) {
  const headers = ['Name', 'Email', 'Phone', 'Position', 'Job Title', 'Stage', 'ATS Score', 'Location', 'Applied Date', 'Skills'];
  const rows = candidates.map(c => [
    c.name,
    c.email || '',
    c.phone || '',
    c.position || '',
    c.jobTitle || '',
    c.stage || '',
    c.score != null ? String(c.score) : '',
    c.location || '',
    c.appliedDate ? new Date(c.appliedDate).toISOString().split('T')[0] : '',
    (c.skills || []).join('; '),
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.map(escapeCsvValue).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `candidates-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface MappedCandidate extends Omit<Candidate, 'atsStatus'> {
  name: string;
  position: string;
  stage: string;
  score: number;
  avatar: string;
  appliedDate: string;
  jobTitle: string;
  applicationId?: number;
  atsStatus?: string;
  aiScore?: number;
  aiNotes?: string;
  resumeUrl?: string;
  resumeMatch?: number;
  skillsMatch?: any;
  aiAnalysis?: any;
  atsScore?: number;
  coverLetter?: string;
  answers?: Array<{ question: string; answer: string }>;
}

interface CandidateNote {
  id: number;
  content: string;
  createdAt: string;
  author?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function stageToStatus(stage: string) {
  const map: Record<string, any> = {
    new: "applied",
    applied: "applied",
    reviewed: "screening",
    shortlisted: "screening",
    screening: "screening",
    interview: "interviewing",
    interviewing: "interviewing",
    offered: "offered",
    hired: "hired",
    rejected: "rejected",
  };
  return map[stage] ?? "pending";
}

function formatDate(d: string | undefined) {
  if (!d) return "Unknown";
  return new Date(d).toLocaleDateString();
}

// ─── Component ──────────────────────────────────────────────────────────────

const Candidates = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  // ── State ───────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [scoreMin, setScoreMin] = useState("");
  const [scoreMax, setScoreMax] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [jobFilter, setJobFilter] = useState("all");

  // Pipeline stages from DB
  const [pipelineStages, setPipelineStages] = useState<{ systemStatus: string; title: string }[]>([]);

  const [selectedCandidate, setSelectedCandidate] = useState<MappedCandidate | null>(null);
  const [selectedCandidateForProfile, setSelectedCandidateForProfile] = useState<{
    id: string;
    applicationId?: string | number;
    name: string;
    email: string;
    phone: string;
    position: string;
    jobTitle?: string;
    location: string;
    experience: string;
    skills: string[];
    score: number;
    avatar: string;
    resumeUrl?: string;
    coverLetter?: string;
    answers?: Array<{ question: string; answer: string }>;
  } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const [emailDialog, setEmailDialog] = useState<{
    open: boolean;
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
  } | null>(null);
  const [callDialog, setCallDialog] = useState<{
    open: boolean;
    candidateId: string;
    candidateName: string;
  } | null>(null);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notes state
  const [notes, setNotes] = useState<CandidateNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Timeline state
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkEmailDialogOpen, setBulkEmailDialogOpen] = useState(false);
  const [bulkEmailSubject, setBulkEmailSubject] = useState("");
  const [bulkEmailBody, setBulkEmailBody] = useState("");
  const [bulkMoveStage, setBulkMoveStage] = useState("");

  // ── Data fetching ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await candidateService.getAllCandidates();
        setCandidates(data || []);
      } catch (err) {
        console.error("Error fetching candidates:", err);
        setError("Failed to load candidates. Please try again.");
        setCandidates([]);
        toast({ title: "Error", description: "Failed to load candidates", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, [toast]);

  // Fetch pipeline stages
  useEffect(() => {
    const fetchStages = async () => {
      const companyId = (user as any)?.invitedByUserId ?? user?.id;
      if (!companyId) return;
      try {
        const stages = await pipelineService.getCompanyPipeline(companyId);
        setPipelineStages(stages.map((s: any) => ({ systemStatus: s.systemStatus, title: s.title })));
      } catch {
        // fallback already handled inside the service
      }
    };
    fetchStages();
  }, [user]);

  const handleCandidateAdded = async () => {
    try {
      setError(null);
      const data = await candidateService.getAllCandidates();
      setCandidates(data || []);
    } catch (err) {
      console.error("Error refreshing candidates:", err);
      setError("Failed to refresh candidates.");
    }
  };

  const handleRetryAts = async (candidateId: number) => {
    try {
      const candidate = candidates.find((c) => c.id === candidateId);
      const applicationId = (candidate as any)?.applicationId || candidateId;
      await applicationService.retryAts(applicationId);
      toast({ title: "ATS Analysis Re-initiated", description: "The resume is being re-analyzed." });
    } catch {
      toast({ title: "Retry Failed", description: "Could not re-initiate ATS analysis.", variant: "destructive" });
    }
  };

  // ── Notes fetching ──────────────────────────────────────────────────────
  const fetchNotes = async (candidateId: number) => {
    setNotesLoading(true);
    try {
      const res = await apiClient.get(`/candidates/${candidateId}/notes`);
      setNotes(Array.isArray(res.data) ? res.data : res.data?.notes ?? []);
    } catch {
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedCandidate || !newNote.trim()) return;
    setAddingNote(true);
    try {
      await apiClient.post(`/candidates/${selectedCandidate.id}/notes`, { content: newNote.trim() });
      setNewNote("");
      await fetchNotes(selectedCandidate.id);
      toast({ title: "Note added" });
    } catch {
      toast({ title: "Failed to add note", variant: "destructive" });
    } finally {
      setAddingNote(false);
    }
  };

  // ── Timeline fetching ──────────────────────────────────────────────────
  const fetchTimeline = async (applicationId: number | undefined) => {
    if (!applicationId) {
      setTimelineItems([]);
      return;
    }
    setTimelineLoading(true);
    try {
      const res = await apiClient.get(`/applications/${applicationId}/timeline`);
      const data = Array.isArray(res.data) ? res.data : res.data?.timeline ?? [];
      setTimelineItems(
        data.map((t: any, i: number) => ({
          id: t.id ?? i,
          title: t.title ?? t.status ?? t.stage ?? "Stage change",
          description: t.description ?? t.notes ?? undefined,
          date: t.date ?? t.createdAt ?? t.changedAt ?? "",
          status: i === 0 ? "current" : "completed",
        }))
      );
    } catch {
      setTimelineItems([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  // ── Candidate selection ─────────────────────────────────────────────────
  const handleSelectCandidate = (c: MappedCandidate) => {
    setSelectedCandidate(c);
    fetchNotes(c.id);
    fetchTimeline((c as any).applicationId);
    if (isMobile) setMobileDetailOpen(true);
  };

  // ── Bulk selection helpers ────────────────────────────────────────────
  const getCandidateKey = (c: MappedCandidate) => `${c.id}-${c.applicationId || 0}`;

  const toggleSelect = useCallback((key: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // ── Mapping & filtering ─────────────────────────────────────────────────
  const mapCandidateData = (candidate: Candidate): MappedCandidate => ({
    ...candidate,
    name: `${candidate.firstName} ${candidate.lastName}`,
    position: candidate.currentTitle || "",
    stage: (candidate as any).stage || "sourced",
    score: (candidate as any).aiScore || 0,
    avatar: (candidate.firstName?.[0] ?? "") + (candidate.lastName?.[0] ?? ""),
    appliedDate: (candidate as any).appliedDate || candidate.createdAt,
    jobTitle: (candidate as any).jobTitle || candidate.currentTitle || "Unknown Position",
    applicationId: (candidate as any).applicationId,
    atsStatus: (candidate as any).atsStatus,
    aiScore: (candidate as any).aiScore,
    aiNotes: (candidate as any).aiNotes,
    resumeUrl: (candidate as any).resumeUrl,
    resumeMatch: (candidate as any).resumeMatch,
    skillsMatch: (candidate as any).skillsMatch,
    aiAnalysis: (candidate as any).aiAnalysis,
    atsScore: (candidate as any).atsScore,
    coverLetter: (candidate as any).coverLetter,
    answers: (candidate as any).answers || [],
  });

  const filteredCandidates = candidates
    .filter((candidate) => {
      const fullName = `${candidate.firstName} ${candidate.lastName}`.toLowerCase();
      const position = candidate.currentTitle?.toLowerCase() || "";
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        position.includes(searchTerm.toLowerCase()) ||
        ((() => { const sk = Array.isArray(candidate.skills) ? candidate.skills : typeof candidate.skills === "string" ? (() => { try { const p = JSON.parse(candidate.skills); return Array.isArray(p) ? p : []; } catch { return []; } })() : []; return sk.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase())); })());
      const matchesStage = stageFilter === "all" || (candidate as any).stage === stageFilter;
      const score = (candidate as any).aiScore || 0;
      const matchesScoreMin = scoreMin === "" || score >= Number(scoreMin);
      const matchesScoreMax = scoreMax === "" || score <= Number(scoreMax);
      const matchesDate =
        !dateFilter || ((candidate as any).appliedDate || candidate.createdAt || "").startsWith(dateFilter);
      const matchesJob =
        jobFilter === "all" || ((candidate as any).jobTitle || "").toLowerCase().includes(jobFilter.toLowerCase());
      return matchesSearch && matchesStage && matchesScoreMin && matchesScoreMax && matchesDate && matchesJob;
    })
    .map(mapCandidateData);

  // Unique job titles for filter
  const jobTitles = Array.from(
    new Set(candidates.map((c) => (c as any).jobTitle || c.currentTitle || "").filter(Boolean))
  );

  // ── Bulk action handlers (depend on filteredCandidates) ───────────────
  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.size === filteredCandidates.length && filteredCandidates.length > 0) {
        return new Set();
      }
      return new Set(filteredCandidates.map(getCandidateKey));
    });
  }, [filteredCandidates]);

  const getSelectedApplicationIds = (): number[] => {
    return filteredCandidates
      .filter(c => selectedIds.has(getCandidateKey(c)) && c.applicationId)
      .map(c => c.applicationId!);
  };

  const handleBulkReject = async () => {
    const ids = getSelectedApplicationIds();
    if (ids.length === 0) {
      toast({ title: "No applications selected", description: "Selected candidates must have application IDs.", variant: "destructive" });
      return;
    }
    setBulkLoading(true);
    try {
      const result = await applicationService.bulkAction({ applicationIds: ids, action: 'reject' });
      toast({ title: "Bulk Reject Complete", description: `${result.successCount} application(s) rejected.` });
      clearSelection();
      const data = await candidateService.getAllCandidates();
      setCandidates(data || []);
    } catch {
      toast({ title: "Bulk Reject Failed", description: "Could not complete bulk reject.", variant: "destructive" });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkMoveStage = async (stage: string) => {
    const ids = getSelectedApplicationIds();
    if (ids.length === 0) {
      toast({ title: "No applications selected", description: "Selected candidates must have application IDs.", variant: "destructive" });
      return;
    }
    setBulkLoading(true);
    try {
      const result = await applicationService.bulkAction({ applicationIds: ids, action: 'move-stage', targetStage: stage });
      toast({ title: "Bulk Move Complete", description: `${result.successCount} application(s) moved to ${stage}.` });
      clearSelection();
      setBulkMoveStage("");
      const data = await candidateService.getAllCandidates();
      setCandidates(data || []);
    } catch {
      toast({ title: "Bulk Move Failed", description: "Could not complete bulk move.", variant: "destructive" });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkEmail = async () => {
    const ids = getSelectedApplicationIds();
    if (ids.length === 0) {
      toast({ title: "No applications selected", description: "Selected candidates must have application IDs.", variant: "destructive" });
      return;
    }
    if (!bulkEmailSubject.trim() || !bulkEmailBody.trim()) {
      toast({ title: "Missing fields", description: "Subject and body are required.", variant: "destructive" });
      return;
    }
    setBulkLoading(true);
    try {
      const result = await applicationService.bulkAction({
        applicationIds: ids,
        action: 'email',
        emailSubject: bulkEmailSubject,
        emailBody: bulkEmailBody,
      });
      toast({ title: "Bulk Email Complete", description: `${result.successCount} email(s) sent.` });
      clearSelection();
      setBulkEmailDialogOpen(false);
      setBulkEmailSubject("");
      setBulkEmailBody("");
    } catch {
      toast({ title: "Bulk Email Failed", description: "Could not send bulk emails.", variant: "destructive" });
    } finally {
      setBulkLoading(false);
    }
  };

  // ── Detail panel content (shared between desktop & mobile sheet) ───────
  const DetailPanel = () => {
    if (!selectedCandidate) {
      return (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <p>Select a candidate to view details</p>
        </div>
      );
    }

    const c = selectedCandidate;

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border p-4">
          <Avatar className="h-14 w-14 ring-2 ring-primary/10">
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
              {c.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">{c.name}</h2>
            <p className="text-sm text-muted-foreground truncate">{c.position}</p>
          </div>
          <ScoreRing score={c.score} size={52} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-3 grid w-auto grid-cols-4">
            <TabsTrigger value="profile"><User className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Profile</TabsTrigger>
            <TabsTrigger value="resume"><FileText className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Resume</TabsTrigger>
            <TabsTrigger value="timeline"><Clock className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Timeline</TabsTrigger>
            <TabsTrigger value="notes"><MessageSquare className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Notes</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-0 space-y-4">
              <div className="grid gap-3">
                {c.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground truncate">{c.email}</span>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{c.phone}</span>
                  </div>
                )}
                {c.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{c.location}</span>
                  </div>
                )}
              </div>

              {c.skills && (() => {
                const skills = Array.isArray(c.skills) ? c.skills : typeof c.skills === "string" ? (() => { try { return JSON.parse(c.skills); } catch { return []; } })() : [];
                return skills.length > 0 ? (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill: string, i: number) => (
                      <span key={i} className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-foreground">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                ) : null;
              })()}

              {c.jobTitle && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Applied For</h4>
                  <p className="text-sm text-foreground">{c.jobTitle}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => setEmailDialog({
                  open: true,
                  candidateId: String(c.id),
                  candidateName: c.name,
                  candidateEmail: c.email,
                })}>
                  <Mail className="h-3.5 w-3.5 mr-1.5" />Email
                </Button>
                <Button size="sm" variant="outline" onClick={() => setCallDialog({
                  open: true,
                  candidateId: String(c.id),
                  candidateName: c.name,
                })}>
                  <Phone className="h-3.5 w-3.5 mr-1.5" />Call
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedCandidateForProfile({
                  id: String(c.id),
                  applicationId: c.applicationId,
                  name: c.name,
                  email: c.email,
                  phone: c.phone || "",
                  position: c.position,
                  jobTitle: c.jobTitle,
                  location: c.location || "",
                  experience: `${c.experience || 0} years`,
                  skills: Array.isArray(c.skills) ? c.skills : typeof c.skills === "string" ? (() => { try { const p = JSON.parse(c.skills); return Array.isArray(p) ? p : []; } catch { return []; } })() : [],
                  score: c.score,
                  avatar: c.avatar,
                  resumeUrl: c.resumeUrl,
                  coverLetter: c.coverLetter,
                  answers: c.answers || [],
                })}>
                  <Eye className="h-3.5 w-3.5 mr-1.5" />Full Profile
                </Button>
              </div>
            </TabsContent>

            {/* Resume Tab */}
            <TabsContent value="resume" className="mt-0 space-y-4">
              {c.resumeUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {c.name.replace(/\s+/g, "_")}_Resume.pdf
                      </p>
                      <p className="text-xs text-muted-foreground">Click to view or download</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={async () => {
                      try {
                        const res = await apiClient.get(`/upload/resume/${c.resumeUrl}`);
                        if (res.data?.url) window.open(res.data.url, "_blank");
                      } catch {
                        toast({ title: "Error", description: "Failed to load resume", variant: "destructive" });
                      }
                    }}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />View Resume
                    </Button>
                    <Button size="sm" variant="outline" onClick={async () => {
                      try {
                        const res = await apiClient.get(`/upload/resume/${c.resumeUrl}`);
                        if (res.data?.url) {
                          const link = document.createElement("a");
                          link.href = res.data.url;
                          link.download = `${c.name.replace(/\s+/g, "_")}_Resume.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      } catch {
                        toast({ title: "Error", description: "Failed to download resume", variant: "destructive" });
                      }
                    }}>
                      <Download className="h-3.5 w-3.5 mr-1.5" />Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">No resume uploaded</p>
                </div>
              )}
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="mt-0">
              {timelineLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : timelineItems.length > 0 ? (
                <TimelineView items={timelineItems} />
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Clock className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">No timeline data available</p>
                </div>
              )}
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="mt-0 space-y-4">
              {/* Add note form */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a note…"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[80px] bg-background"
                />
                <Button size="sm" onClick={handleAddNote} disabled={addingNote || !newNote.trim()}>
                  {addingNote ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                  Add Note
                </Button>
              </div>

              {/* Notes list */}
              {notesLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : notes.length > 0 ? (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        {note.author && <span>{note.author}</span>}
                        <span>{formatDate(note.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Filters + Actions */}
      <Card className="border-border bg-background shadow-sm">
        <CardContent className="p-4 space-y-3">
          {/* Row 1: Search + Actions */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => exportCandidatesCsv(filteredCandidates)}>
                <Download className="w-4 h-4 mr-1.5" />
                Export
              </Button>
              <Button size="sm" onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add Candidate
              </Button>
            </div>
          </div>
          {/* Row 2: Filters inline */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[140px] h-8 text-sm bg-background">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {pipelineStages.map((s) => (
                  <SelectItem key={s.systemStatus} value={s.systemStatus}>{s.title}</SelectItem>
                ))}
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            {jobTitles.length > 0 && (
              <Select value={jobFilter} onValueChange={setJobFilter}>
                <SelectTrigger className="w-[160px] h-8 text-sm bg-background">
                  <SelectValue placeholder="Job" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  {jobTitles.map((jt) => (
                    <SelectItem key={jt} value={jt}>{jt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Score:</span>
              <Input type="number" placeholder="Min" value={scoreMin} onChange={(e) => setScoreMin(e.target.value)} className="w-16 h-8 text-sm bg-background" min={0} max={100} />
              <span className="text-xs text-muted-foreground">–</span>
              <Input type="number" placeholder="Max" value={scoreMax} onChange={(e) => setScoreMax(e.target.value)} className="w-16 h-8 text-sm bg-background" min={0} max={100} />
            </div>
            <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-auto h-8 text-sm bg-background" />
            <span className="text-xs text-muted-foreground ml-auto">{filteredCandidates.length} candidates</span>
          </div>
        </CardContent>
      </Card>

      {/* Main content */}
      {/* Bulk action toolbar */}
      {selectedIds.size > 0 && (
        <Card className="border-primary/30 bg-primary/5 shadow-sm">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{selectedIds.size} selected</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <Button size="sm" variant="destructive" onClick={handleBulkReject} disabled={bulkLoading}>
                  {bulkLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
                  Reject All
                </Button>
                <Select value={bulkMoveStage} onValueChange={(val) => { setBulkMoveStage(val); handleBulkMoveStage(val); }}>
                  <SelectTrigger className="w-[150px] h-8 text-sm bg-background">
                    <SelectValue placeholder="Move Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelineStages.map((s) => (
                      <SelectItem key={s.systemStatus} value={s.systemStatus}>{s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => setBulkEmailDialogOpen(true)} disabled={bulkLoading}>
                  <Mail className="h-3.5 w-3.5 mr-1.5" />Email All
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  <X className="h-3.5 w-3.5 mr-1.5" />Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <PageSkeleton variant="split" />
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive mb-2">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No candidates found matching your criteria.</p>
          <Button variant="default" className="mt-4" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />Add Your First Candidate
          </Button>
        </div>
      ) : (
        <div className="flex gap-4">
          {/* ── Left: Candidate list (40%) ──────────────────────────────── */}
          <div className={`${isMobile ? "w-full" : "w-2/5"} space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]`}>
            {/* Select All header */}
            <div className="flex items-center gap-2 px-1 pb-1">
              <Checkbox
                checked={filteredCandidates.length > 0 && selectedIds.size === filteredCandidates.length}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all candidates"
              />
              <span className="text-xs text-muted-foreground">Select All</span>
            </div>
            {filteredCandidates.map((candidate, index) => {
              const isSelected = selectedCandidate?.id === candidate.id &&
                selectedCandidate?.applicationId === candidate.applicationId;
              const candidateKey = getCandidateKey(candidate);
              const isChecked = selectedIds.has(candidateKey);
              return (
                <Card
                  key={`${candidate.id}-${candidate.applicationId || index}`}
                  className={`cursor-pointer border transition-all hover:shadow-md ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md"
                      : isChecked
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-background hover:border-primary/30"
                  }`}
                  onClick={() => handleSelectCandidate(candidate)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleSelect(candidateKey)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${candidate.name}`}
                        className="shrink-0"
                      />
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                          {candidate.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground truncate">{candidate.name}</h3>
                          <StatusBadge status={stageToStatus(candidate.stage)} className="text-[10px] px-1.5 py-0">
                            {candidate.stage}
                          </StatusBadge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{candidate.position}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />{formatDate(candidate.appliedDate)}
                          </span>
                          {candidate.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3" />{candidate.location}
                            </span>
                          )}
                        </div>
                        {candidate.skills && (() => {
                          const skills = Array.isArray(candidate.skills) ? candidate.skills : typeof candidate.skills === "string" ? (() => { try { return JSON.parse(candidate.skills); } catch { return []; } })() : [];
                          return skills.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {skills.slice(0, 3).map((skill: string, i: number) => (
                              <span key={i} className="inline-flex rounded-full border border-border bg-muted/50 px-1.5 py-0 text-[10px] text-muted-foreground">
                                {skill}
                              </span>
                            ))}
                            {skills.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">+{skills.length - 3}</span>
                            )}
                          </div>
                          ) : null;
                        })()}
                      </div>
                      <div className="shrink-0">
                        {candidate.atsStatus === "failed" ? (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleRetryAts(candidate.id); }}>
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          </Button>
                        ) : candidate.atsStatus === "pending" || candidate.atsStatus === "processing" ? (
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                          <ScoreRing score={candidate.score} size={40} strokeWidth={3} />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ── Right: Detail panel (60%) — desktop only ───────────────── */}
          {!isMobile && (
            <Card className="flex-1 border-border bg-background overflow-hidden min-h-[600px] max-h-[calc(100vh-120px)]">
              <DetailPanel />
            </Card>
          )}
        </div>
      )}

      {/* ── Mobile detail sheet ──────────────────────────────────────────── */}
      {isMobile && (
        <Sheet open={mobileDetailOpen} onOpenChange={setMobileDetailOpen}>
          <SheetContent side="bottom" className="h-[85vh] p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>{selectedCandidate?.name ?? "Candidate Details"}</SheetTitle>
            </SheetHeader>
            <DetailPanel />
          </SheetContent>
        </Sheet>
      )}

      {/* ── Existing dialogs ─────────────────────────────────────────────── */}
      <CandidateProfile
        open={!!selectedCandidateForProfile}
        onOpenChange={(open) => !open && setSelectedCandidateForProfile(null)}
        candidate={selectedCandidateForProfile}
      />

      <AddCandidateForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSuccess={handleCandidateAdded}
      />

      {emailDialog && (
        <EmailConfirmationDialog
          open={emailDialog.open}
          onOpenChange={(open) => !open && setEmailDialog(null)}
          candidateName={emailDialog.candidateName}
          fromStage="Applied"
          toStage="Contacted"
          onConfirm={async (sendEmail, emailContent) => {
            if (sendEmail && emailContent && emailDialog) {
              try {
                await emailService.sendEmail({
                  to: emailDialog.candidateEmail,
                  subject: "Application Update",
                  content: emailContent,
                  candidateName: emailDialog.candidateName,
                });
                toast({ title: "Email Sent", description: `Email sent successfully to ${emailDialog.candidateName}` });
              } catch {
                toast({ title: "Email Failed", description: "Failed to send email. Please try again.", variant: "destructive" });
              }
            }
            setEmailDialog(null);
          }}
        />
      )}

      {callDialog && (
        <CallConfirmationDialog
          open={callDialog.open}
          onOpenChange={(open) => !open && setCallDialog(null)}
          candidateName={callDialog.candidateName}
          onConfirm={async (option) => {
            if (!callDialog) return;
            try {
              const candidate = filteredCandidates.find((c) => String(c.id) === callDialog.candidateId);
              if (!candidate?.phone) {
                toast({ title: "No Phone Number", description: "This candidate doesn't have a phone number on file.", variant: "destructive" });
                setCallDialog(null);
                return;
              }
              const userData = {
                candidateId: callDialog.candidateId,
                candidateName: callDialog.candidateName,
                candidateRole: candidate.currentTitle || "Candidate",
              };
              if (option === "now") {
                await callService.makeCall(candidate.phone, undefined, userData);
                toast({ title: "Call Initiated", description: `AI call initiated to ${callDialog.candidateName}` });
              } else if (option === "1hour" || option === "2hours") {
                const hours = option === "1hour" ? 1 : 2;
                const scheduledTime = new Date();
                scheduledTime.setHours(scheduledTime.getHours() + hours);
                await callService.scheduleCall(candidate.phone, scheduledTime.toISOString(), undefined, userData);
                toast({ title: "Call Scheduled", description: `AI call scheduled for ${callDialog.candidateName} in ${hours} hour${hours > 1 ? "s" : ""}` });
              } else {
                toast({ title: "Call Skipped", description: `Call skipped for ${callDialog.candidateName}` });
              }
            } catch (err) {
              console.error("Call error:", err);
              toast({ title: "Call Failed", description: "Failed to initiate the call. Please try again.", variant: "destructive" });
            }
            setCallDialog(null);
          }}
        />
      )}

      {/* Bulk Email Dialog */}
      <Dialog open={bulkEmailDialogOpen} onOpenChange={setBulkEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Bulk Email</DialogTitle>
            <DialogDescription>
              Send an email to {selectedIds.size} selected candidate(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input
                placeholder="Email subject…"
                value={bulkEmailSubject}
                onChange={(e) => setBulkEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Body</label>
              <Textarea
                placeholder="Email body…"
                value={bulkEmailBody}
                onChange={(e) => setBulkEmailBody(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEmailDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkEmail} disabled={bulkLoading || !bulkEmailSubject.trim() || !bulkEmailBody.trim()}>
              {bulkLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Mail className="h-3.5 w-3.5 mr-1.5" />}
              Send Emails
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Candidates;
