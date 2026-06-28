import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  MapPin, Calendar, Briefcase, Clock, DollarSign,
  Building2, ArrowLeft, CheckCircle2, Loader2,
  Share2, Copy, Check,
} from "lucide-react";
import jobService, { Job } from "@/services/job.service";
import candidateAuthService from "@/services/candidate-auth.service";
import applicationService from "@/services/application.service";
import { useToast } from "@/hooks/use-toast";
import JobApplicationDialog from "@/components/JobApplicationDialog";

const JobShare = () => {
  const { jobId }        = useParams();
  const [searchParams]   = useSearchParams();
  const navigate         = useNavigate();
  const { toast }        = useToast();
  const [job, setJob]               = useState<Job | null>(null);
  const [loading, setLoading]       = useState(true);
  const [showApplication, setShowApplication] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [copied, setCopied]         = useState(false);

  useEffect(() => {
    const title   = searchParams.get("title")       || "Job Opportunity";
    const company = searchParams.get("company")     || "Company";
    const desc    = searchParams.get("description") || "Great job opportunity available";

    document.title = `${title} at ${company} - HirerMind`;
    updateMeta("og:title",            `${title} at ${company}`);
    updateMeta("og:description",      desc);
    updateMeta("og:url",              window.location.href);
    updateMeta("og:type",             "website");
    updateMeta("og:site_name",        "HirerMind");
    updateMeta("og:image",            `${window.location.origin}/job-card-preview.png`);
    updateMeta("twitter:card",        "summary_large_image");
    updateMeta("twitter:title",       `${title} at ${company}`);
    updateMeta("twitter:description", desc);
    updateMeta("twitter:image",       `${window.location.origin}/job-card-preview.png`);

    if (jobId) fetchJobDetails();
  }, [jobId, searchParams]);

  const updateMeta = (property: string, content: string) => {
    let meta = document.querySelector(`meta[property="${property}"]`) ||
               document.querySelector(`meta[name="${property}"]`);
    if (!meta) {
      meta = document.createElement("meta");
      if (property.startsWith("og:") || property.startsWith("twitter:"))
        meta.setAttribute("property", property);
      else meta.setAttribute("name", property);
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
  };

  const checkIfApplied = async () => {
    const id = jobId || job?.id;
    if (!id) return;
    const candidate = candidateAuthService.getCurrentCandidate();
    if (!candidate?.email) return;
    try {
      const res = await applicationService.checkIfApplied(Number(id), candidate.email);
      if (res.success) setHasApplied(res.hasApplied);
    } catch {}
  };

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const res = await jobService.getJobById(Number(jobId));
      setJob(res.job);
      await checkIfApplied();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to load job", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: job?.title || "Job", url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast({ title: "Link copied!", description: "Share this link with others." });
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading job details…</p>
      </div>
    </div>
  );

  /* ── Not found ── */
  if (!job) return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-7 h-7 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Job Not Found</h2>
        <p className="text-muted-foreground text-sm mb-6">This job doesn't exist or has been removed.</p>
        <Button onClick={() => navigate("/careers")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Careers
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5">

        {/* ── Top action bar ── */}
        <div className="flex items-center justify-between gap-3">
          {/* Back to Jobs — bigger, more prominent */}
          <button
            onClick={() => navigate("/candidate/jobs")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background border border-border hover:border-border/70 hover:bg-muted/30 text-sm font-semibold text-foreground transition-all group shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-muted-foreground" />
            Back to Jobs
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background border border-border hover:border-border/70 hover:bg-muted/30 text-sm font-semibold text-foreground transition-all shadow-sm"
          >
            {copied
              ? <><Check className="w-4 h-4 text-emerald-500" /> Copied!</>
              : <><Share2 className="w-4 h-4 text-muted-foreground" /> Share</>
            }
          </button>
        </div>

        {/* ── Hero card ── */}
        <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Gradient strip */}
          <div className="h-1.5 bg-gradient-to-r from-primary via-blue-500 to-violet-500" />

          <div className="p-5 sm:p-7">
            {/* Company + title */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-base sm:text-lg font-black text-primary flex-shrink-0">
                {job.company.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                  {job.title}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  {job.company}
                </p>
              </div>
            </div>

            {/* Meta pills */}
            <div className="flex flex-wrap gap-2 mt-5">
              <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-muted border border-border text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {job.location}{job.isRemote && " · Remote"}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 capitalize">
                <Briefcase className="w-3 h-3" />
                {job.type?.replace("-", " ")}
              </span>
              {job.experience && (
                <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 capitalize">
                  {job.experience} level
                </span>
              )}
              {job.salary && (
                <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <DollarSign className="w-3 h-3" />
                  {job.salary}
                </span>
              )}
              {job.deadline && (
                <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600">
                  <Clock className="w-3 h-3" />
                  Deadline: {new Date(job.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
              {job.department && (
                <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-muted border border-border text-muted-foreground">
                  {job.department}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                Posted {new Date(job.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        <div className="bg-background border border-border rounded-2xl p-5 sm:p-7 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Job Description
          </h2>
          <p className="text-sm sm:text-base text-foreground/80 leading-relaxed whitespace-pre-line">
            {job.description}
          </p>
        </div>

        {/* ── Skills ── */}
        {(() => {
          const skills = Array.isArray(job.skills) ? job.skills : typeof job.skills === "string" ? (() => { try { return JSON.parse(job.skills); } catch { return []; } })() : [];
          return skills.length > 0 ? (
          <div className="bg-background border border-border rounded-2xl p-5 sm:p-7 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Required Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: string, i: number) => (
                <span
                  key={i}
                  className="text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg bg-muted border border-border text-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          ) : null;
        })()}

        {/* ── Apply CTA ── */}
        <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="h-1 bg-gradient-to-r from-primary via-blue-500 to-violet-500" />
          <div className="p-5 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold text-foreground">Ready to apply?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Submit your application for <span className="font-semibold text-foreground">{job.title}</span> at {job.company}.
              </p>
            </div>
            {hasApplied ? (
              <div className="flex items-center gap-2.5 px-5 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-bold flex-shrink-0 w-full sm:w-auto justify-center">
                <CheckCircle2 className="w-5 h-5" />
                Application Submitted
              </div>
            ) : (
              <Button
                size="lg"
                onClick={() => setShowApplication(true)}
                className="w-full sm:w-auto px-8 py-3 text-sm font-bold rounded-xl flex-shrink-0"
              >
                Apply for this Position
              </Button>
            )}
          </div>
        </div>

        {/* bottom padding */}
        <div className="h-4" />
      </div>

      <JobApplicationDialog
        job={job}
        open={showApplication}
        onOpenChange={setShowApplication}
        onApplicationSubmitted={() => {
          toast({ title: "Application Submitted!", description: "We'll review your application and get back to you soon." });
          setHasApplied(true);
          checkIfApplied();
        }}
      />
    </div>
  );
};

export default JobShare;
