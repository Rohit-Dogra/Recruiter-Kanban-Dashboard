import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Briefcase,
  Building,
  Calendar,
  Check,
  Clock,
  Copy,
  DollarSign,
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Link2,
  MapPin,
  MessageCircle,
  Search,
  Share2,
  Twitter,
  Users,
  X,
  Youtube,
} from "lucide-react";

import jobService, { type Job } from "@/services/job.service";
import companyService from "@/services/company.service";
import authService from "@/services/auth.service";
import candidateAuthService from "@/services/candidate-auth.service";
import applicationService from "@/services/application.service";
import { useToast } from "@/hooks/use-toast";
import JobApplicationDialog from "@/components/JobApplicationDialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Spotlight } from "@/components/motion/Magnetic";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   COMPANY CAREERS PORTAL
   Rebuilt on the design system. The previous version was ~500 lines of inline
   style objects with hard-coded greys, so it only ever worked in light mode and
   shared nothing with the rest of the product. Behaviour — data loading, share
   links, filters, apply flow — is unchanged.
   ══════════════════════════════════════════════════════════════════════════ */

const TYPE_TONE: Record<string, string> = {
  "full-time": "var(--brand-indigo)",
  "part-time": "var(--brand-cyan)",
  contract: "var(--warning)",
  internship: "var(--success)",
  remote: "var(--brand-violet)",
};

interface CompanyLike {
  id?: number;
  userId?: number;
  name?: string;
  description?: string;
  industry?: string;
  size?: string;
  location?: string;
  founded?: string | number;
  website?: string;
  logo?: string;
  logoUrl?: string;
  mission?: string;
  values?: string;
  culture?: string;
  social?: Record<string, string | undefined>;
}

/* ─── Share dialog ─────────────────────────────────────────────────────── */

const ShareDialog: React.FC<{ job: Job | null; onClose: () => void }> = ({ job, onClose }) => {
  const [copied, setCopied] = useState<"link" | "text" | null>(null);

  if (!job) return null;

  const jobUrl = `${window.location.origin}/careers/job/${job.id}`;
  const shareText = `*${job.title}* at *${job.company}*\nLocation: ${job.location || "Remote"}\nType: ${job.type?.replace(
    "-",
    " "
  )}\n${job.salary ? `Salary: ${job.salary}\n` : ""}Apply: ${jobUrl}\n#Jobs #Hiring`;

  const copy = async (value: string, kind: "link" | "text") => {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  };

  const channels = [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      action: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank"),
    },
    {
      label: "LinkedIn",
      icon: Link2,
      action: () =>
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`, "_blank"),
    },
    { label: "Copy link", icon: copied === "link" ? Check : Copy, action: () => copy(jobUrl, "link") },
    { label: "Copy post", icon: copied === "text" ? Check : Share2, action: () => copy(shareText, "text") },
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Share this role</DialogTitle>
          <DialogDescription>
            {job.title} · {job.company}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 grid grid-cols-2 gap-2.5">
          {channels.map((c) => (
            <button
              key={c.label}
              onClick={c.action}
              className="group flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-surface-2/50 p-4 transition-all duration-300 ease-expo hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 ease-spring group-hover:scale-110">
                <c.icon className="h-4.5 w-4.5" />
              </span>
              <span className="text-xs font-medium text-foreground">{c.label}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ─── Job card ─────────────────────────────────────────────────────────── */

function parseSkills(skills: unknown): string[] {
  if (Array.isArray(skills)) return skills as string[];
  if (typeof skills === "string") {
    try {
      const p = JSON.parse(skills);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

const JobCard: React.FC<{
  job: Job;
  applied: boolean;
  onApply: () => void;
  onShare: () => void;
}> = ({ job, applied, onApply, onShare }) => {
  const tone = TYPE_TONE[job.type ?? ""] ?? "var(--primary)";
  const skills = parseSkills((job as { skills?: unknown }).skills);

  return (
    <article className="surface-card group relative flex h-full flex-col overflow-hidden p-5 transition-all duration-300 ease-expo hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg">
      <Spotlight />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-semibold tracking-tight text-foreground">
            {job.title}
          </h3>
          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
            {job.company}
            {job.department ? ` · ${job.department}` : ""}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onShare}
          aria-label={`Share ${job.title}`}
          className="shrink-0"
          data-compact
        >
          <Share2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="relative mt-3 flex flex-wrap gap-1.5">
        {job.type && (
          <span
            className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize"
            style={{
              color: `hsl(${tone})`,
              background: `hsl(${tone} / 0.1)`,
              borderColor: `hsl(${tone} / 0.2)`,
            }}
          >
            {job.type.replace("-", " ")}
          </span>
        )}
        {job.location && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground">
            <MapPin className="h-2.5 w-2.5" />
            {job.location}
          </span>
        )}
        {job.salary && (
          <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2.5 py-0.5 text-[11px] text-success">
            <DollarSign className="h-2.5 w-2.5" />
            {job.salary}
          </span>
        )}
        {job.deadline && (
          <span className="inline-flex items-center gap-1 rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-0.5 text-[11px] text-destructive">
            <Clock className="h-2.5 w-2.5" />
            by{" "}
            {new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      {job.description && (
        <p className="relative mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {job.description.replace(/<[^>]*>/g, "")}
        </p>
      )}

      {skills.length > 0 && (
        <div className="relative mt-3 flex flex-wrap gap-1.5">
          {skills.slice(0, 5).map((s) => (
            <span
              key={s}
              className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
            >
              {s}
            </span>
          ))}
          {skills.length > 5 && (
            <span className="px-1 text-[11px] text-muted-foreground">+{skills.length - 5}</span>
          )}
        </div>
      )}

      <div className="relative mt-auto flex items-center justify-between gap-3 border-t border-border/70 pt-4 [margin-top:1rem]">
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <Briefcase className="h-3 w-3" />
          {job.experience || "Any experience"}
        </span>

        {applied ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
            Applied
          </span>
        ) : (
          <Button
            variant="hero"
            size="sm"
            onClick={onApply}
            iconRight={<ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />}
          >
            Apply now
          </Button>
        )}
      </div>
    </article>
  );
};

/* ─── Page ─────────────────────────────────────────────────────────────── */

const CompanyJobsPortal = () => {
  const [data, setData] = useState<{ company: CompanyLike; jobs: Job[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplication, setShowApplication] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [shareModalJob, setShareModalJob] = useState<Job | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<Set<number>>(new Set());
  const [activeFilter, setActiveFilter] = useState("all");
  const { toast } = useToast();

  const checkAppliedJobs = useCallback(async () => {
    const candidate = candidateAuthService.getCurrentCandidate();
    if (!candidate?.email) return;
    try {
      const res = await applicationService.getCandidateApplications();
      if (res.success && res.applications) {
        setAppliedJobs(new Set(res.applications.map((a: { jobId?: number; job?: { id: number } }) => a.jobId || a.job?.id)));
      }
    } catch {
      /* not signed in as a candidate — nothing to mark */
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(window.location.search);
      const urlCompanyId = params.get("company");
      const urlUserId = params.get("u");
      const currentUser = authService.getCurrentUser();
      let company: CompanyLike | null = null;
      let jobs: Job[] = [];

      if (currentUser && !urlCompanyId) {
        const [cr, jr]: [any, any] = await Promise.all([
          companyService.getCompany().catch((e: unknown) => ({ error: e })),
          jobService.getUserJobs().catch((e: unknown) => ({ error: e })),
        ]);
        company = cr && !cr.error ? cr.company || cr : null;
        jobs = jr && !jr.error ? jr.jobs || jr : [];
      } else if (urlCompanyId) {
        const id = Number(urlCompanyId);
        const uid = urlUserId ? Number(urlUserId) : null;
        const cr: any = await companyService.getCompanyById(id).catch((e: unknown) => ({ error: e }));
        company = cr && !cr.error ? cr.company || cr : null;
        if (!company) {
          const cr2: any = await companyService.getCompanyByUserId(uid ?? id).catch((e: unknown) => ({ error: e }));
          company = cr2 && !cr2.error ? cr2.company || cr2 : null;
        }
        const jr: any = await jobService.getAllJobs().catch((e: unknown) => ({ error: e }));
        const all = jr && !jr.error ? jr.jobs || jr : [];
        if (company && Array.isArray(all)) {
          jobs = all.filter((j: Job) => j.status === "active" && j.companyId === company!.userId);
        }
      } else {
        toast({ title: "Authentication required", variant: "destructive" });
        setData(null);
        setLoading(false);
        return;
      }

      if (Array.isArray(jobs)) jobs = jobs.filter((j: Job) => j.status === "active");
      if (!company) {
        toast({ title: "Company not found", variant: "destructive" });
        setData(null);
        return;
      }
      setData({ company, jobs });
    } catch {
      toast({ title: "Error loading data", variant: "destructive" });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
    checkAppliedJobs();
  }, [loadData, checkAppliedJobs]);

  useEffect(() => {
    if (data?.company?.name) document.title = `Careers at ${data.company.name}`;
  }, [data]);

  const handleCopyCompanyLink = async () => {
    try {
      const cId = data?.company?.id;
      const uId = data?.company?.userId;
      if (!cId) {
        toast({ title: "Unable to share", variant: "destructive" });
        return;
      }
      await navigator.clipboard.writeText(
        `${window.location.origin}/careers?company=${cId}${uId ? `&u=${uId}` : ""}`
      );
      setCopiedLink(true);
      toast({ title: "Link copied" });
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-svh bg-background">
        <div className="bg-[hsl(252_30%_8%)] px-5 py-16 sm:px-8">
          <div className="mx-auto max-w-6xl space-y-4">
            <Skeleton className="h-20 w-20 rounded-[var(--radius-xl)] bg-white/10" />
            <Skeleton className="h-10 w-64 bg-white/10" />
            <Skeleton className="h-4 w-full max-w-xl bg-white/10" />
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-[var(--radius-2xl)]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (!data) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-5">
        <EmptyState
          icon={Building}
          tone="error"
          title="Page not available"
          description="This company page could not be loaded. Check the link, or ask the company for a fresh one."
          className="max-w-md"
        />
      </div>
    );
  }

  const { company, jobs } = data;
  const jobTypes = ["all", ...Array.from(new Set(jobs.map((j) => j.type).filter(Boolean)))] as string[];
  const filteredJobs = jobs.filter((j) => {
    const q = searchTerm.toLowerCase();
    const matches =
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      (j.department && j.department.toLowerCase().includes(q));
    return matches && (activeFilter === "all" || j.type === activeFilter);
  });

  const about = [
    { icon: "🎯", title: "Our mission", text: company.mission },
    { icon: "💎", title: "Our values", text: company.values },
    { icon: "🌱", title: "Our culture", text: company.culture },
  ].filter((a) => a.text);

  const socials = [
    { key: "facebook", label: "Facebook", icon: Facebook },
    { key: "twitter", label: "Twitter", icon: Twitter },
    { key: "instagram", label: "Instagram", icon: Instagram },
    { key: "youtube", label: "YouTube", icon: Youtube },
  ].filter((s) => company.social?.[s.key]);

  return (
    <div className="min-h-svh bg-background">
      <ShareDialog job={shareModalJob} onClose={() => setShareModalJob(null)} />

      {/* ══ HERO ══ */}
      <section className="relative isolate overflow-hidden bg-[hsl(252_30%_8%)] pb-14 pt-14 text-white sm:pb-20 sm:pt-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(60%_60%_at_15%_0%,hsl(262_92%_60%/0.35),transparent_65%),radial-gradient(50%_60%_at_95%_100%,hsl(190_95%_50%/0.22),transparent_65%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:26px_26px]"
        />

        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-[var(--radius-xl)] bg-white shadow-xl sm:h-20 sm:w-20"
          >
            {company.logoUrl || company.logo ? (
              <img
                src={company.logoUrl || company.logo}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : null}
            <span className="absolute font-display text-3xl font-semibold text-[hsl(252_30%_10%)]">
              {(company.name || "C").charAt(0)}
            </span>
          </motion.div>

          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-[hsl(158_70%_60%/0.25)] bg-[hsl(158_70%_50%/0.12)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(158_70%_72%)]"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
            </span>
            We're hiring
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 text-display-md font-semibold text-white"
          >
            {company.name}
          </motion.h1>

          {company.description && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/65"
            >
              {company.description}
            </motion.p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              company.industry && { icon: Building, label: company.industry },
              company.size && { icon: Users, label: company.size },
              company.location && { icon: MapPin, label: company.location },
              company.founded && { icon: Calendar, label: `Est. ${company.founded}` },
            ]
              .filter(Boolean)
              .map((chip) => {
                const c = chip as { icon: typeof Building; label: string };
                return (
                  <span
                    key={c.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/80 backdrop-blur-sm"
                  >
                    <c.icon className="h-3 w-3" />
                    {c.label}
                  </span>
                );
              })}
          </div>

          <div className="mt-7 flex flex-wrap gap-2.5">
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-[hsl(252_30%_10%)] no-underline shadow-lg transition-transform duration-200 hover:-translate-y-0.5"
              >
                <Globe className="h-3.5 w-3.5" />
                Website
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <button
              onClick={handleCopyCompanyLink}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-[13px] font-medium text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Copied
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" /> Share page
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ══ ABOUT ══ */}
      {about.length > 0 && (
        <section className="border-b border-border/60 bg-surface-2/40 py-14">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">Why join us</h2>
            <p className="mt-1 text-sm text-muted-foreground">What sets this team apart</p>

            <Stagger gap={0.08} className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {about.map((a) => (
                <StaggerItem key={a.title}>
                  <div className="surface-card h-full p-5 transition-all duration-300 ease-expo hover:-translate-y-1 hover:border-primary/25">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-primary/10 text-xl">
                      {a.icon}
                    </span>
                    <h3 className="mt-4 text-[15px] font-semibold text-foreground">{a.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{a.text}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* ══ SOCIAL ══ */}
      {socials.length > 0 && (
        <section className="border-b border-border/60 py-9">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Follow along</p>
            <div className="mt-3.5 flex flex-wrap gap-2">
              {socials.map((s) => (
                <a
                  key={s.key}
                  href={company.social![s.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2 text-[13px] font-medium text-foreground no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
                >
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ JOBS ══ */}
      <section className="py-12 pb-24 sm:py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">Open positions</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {filteredJobs.length} {filteredJobs.length === 1 ? "role" : "roles"} available
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-info/20 bg-info/10 px-3 py-1.5 text-xs font-medium text-info">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
              </span>
              Actively hiring
            </span>
          </div>

          {/* Search + filters */}
          <div className="mt-6 space-y-3">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search roles or departments…"
              startAdornment={<Search />}
              endAdornment={
                searchTerm ? (
                  <button
                    type="button"
                    data-compact
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                    className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-xs)] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : undefined
              }
            />

            <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
              {jobTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveFilter(t)}
                  className={cn(
                    "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium capitalize transition-all duration-200",
                    activeFilter === t
                      ? "border-primary bg-primary text-primary-foreground shadow-glow"
                      : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground"
                  )}
                >
                  {t === "all" ? "All roles" : t.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          {filteredJobs.length === 0 ? (
            <EmptyState
              className="mt-8"
              icon={Briefcase}
              title="No roles match that search"
              description="Try a different keyword, or clear the filters to see everything that's open."
              actionLabel={searchTerm || activeFilter !== "all" ? "Clear filters" : undefined}
              onAction={() => {
                setSearchTerm("");
                setActiveFilter("all");
              }}
            />
          ) : (
            <Stagger gap={0.05} className="mt-6 grid gap-4 lg:grid-cols-2">
              {filteredJobs.map((job) => (
                <StaggerItem key={job.id}>
                  <JobCard
                    job={job}
                    applied={appliedJobs.has(job.id)}
                    onApply={() => {
                      setSelectedJob(job);
                      setShowApplication(true);
                    }}
                    onShare={() => setShareModalJob(job)}
                  />
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-border/60 bg-surface-2/40 py-7">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 sm:px-8">
          <span className="font-display text-sm font-semibold text-foreground">{company.name}</span>
          <span className="font-mono text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} All rights reserved
          </span>
        </div>
      </footer>

      <JobApplicationDialog
        job={selectedJob}
        open={showApplication}
        onOpenChange={setShowApplication}
        onApplicationSubmitted={() => {
          if (selectedJob) setAppliedJobs((prev) => new Set([...prev, selectedJob.id]));
          checkAppliedJobs();
        }}
      />
    </div>
  );
};

export default CompanyJobsPortal;
