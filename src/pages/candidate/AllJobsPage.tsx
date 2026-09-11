import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Briefcase, MapPin, DollarSign, Search, Building2, LayoutGrid, List, SlidersHorizontal, Eye, GraduationCap, Globe, Zap } from "lucide-react";
import CandidateLayout from "@/layouts/CandidateLayout";
import jobService from "@/services/job.service";
import applicationService from "@/services/application.service";
import { useToast } from "@/hooks/use-toast";
import JobApplicationDialog from "@/components/JobApplicationDialog";
import JobDetailsDialog from "@/components/JobDetailsDialog";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";

type ViewMode = "grid" | "list";
type SalaryTuple = [number, number];

function parseSkills(skills: any): string[] {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills;
  try { const p = JSON.parse(skills); return Array.isArray(p) ? p : []; } catch { return []; }
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function AllJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [appliedIds, setAppliedIds] = useState(new Set() as Set<number>);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debSearch, setDebSearch] = useState("");
  const [fType, setFType] = useState("all");
  const [fLoc, setFLoc] = useState("all");
  const [fDept, setFDept] = useState("all");
  const [salRange, setSalRange] = useState<SalaryTuple>([0, 300]);
  const [view, setView] = useState<ViewMode>("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [applyJob, setApplyJob] = useState<any>(null);
  const [viewJob, setViewJob] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { loadJobs(); loadApplied(); }, []);

  async function loadJobs() {
    try {
      setLoading(true);
      const r = await jobService.getAllJobs();
      if (r.success) setJobs(r.jobs || []);
    } catch (_e) {
      toast({ title: "Error", description: "Failed to load jobs", variant: "destructive" });
    } finally { setLoading(false); }
  }

  async function loadApplied() {
    try {
      const r = await applicationService.getCandidateApplications();
      if (r.success) {
        const ids = r.applications.map((a: any) => a.jobId as number);
        setAppliedIds(new Set(ids) as Set<number>);
      }
    } catch (_e) { /* non-critical */ }
  }

  const opts = useMemo(() => {
    const l = new Set<string>(), t = new Set<string>(), d = new Set<string>();
    jobs.forEach((j) => {
      if (j.location) l.add(j.location);
      if (j.type) t.add(j.type);
      if (j.department) d.add(j.department);
    });
    return { locations: [...l].sort(), types: [...t].sort(), departments: [...d].sort() };
  }, [jobs]);

  const filtered = useMemo(() => jobs.filter((j) => {
    const q = debSearch.toLowerCase();
    if (q && !j.title?.toLowerCase().includes(q) && !j.company?.toLowerCase().includes(q)) return false;
    if (fType !== "all" && j.type !== fType) return false;
    if (fLoc !== "all" && j.location !== fLoc) return false;
    if (fDept !== "all" && j.department !== fDept) return false;
    const sk = (j.salaryMax || j.salary || 0) / 1000;
    if (sk > 0 && (sk < salRange[0] || sk > salRange[1])) return false;
    return true;
  }), [jobs, debSearch, fType, fLoc, fDept, salRange]);

  const hasFilters = fType !== "all" || fLoc !== "all" || fDept !== "all" || salRange[0] !== 0 || salRange[1] !== 300;
  const clearAll = () => { setFType("all"); setFLoc("all"); setFDept("all"); setSalRange([0, 300]); };

  if (loading) {
    return <CandidateLayout hideFooter><PageSkeleton variant="cards" count={6} /></CandidateLayout>;
  }

  const jobCard = (j: any) => {
    const skills = parseSkills(j.skills);
    const showSkills = skills.slice(0, 4);
    const extraCount = skills.length - 4;
    return (
      <Card key={j.id} className="group hover:shadow-lg hover:border-primary/30 transition-all duration-200 flex flex-col">
        <CardContent className="p-5 flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {j.workType && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium capitalize">
                  {j.workType === "remote" ? <><Globe className="h-2.5 w-2.5 mr-0.5" />Remote</> : j.workType === "hybrid" ? "Hybrid" : "On-site"}
                </Badge>
              )}
              {j.urgency && j.urgency !== "normal" && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-medium capitalize">
                  <Zap className="h-2.5 w-2.5 mr-0.5" />{j.urgency}
                </Badge>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">{timeAgo(j.createdAt)}</span>
          </div>
          <h3 className="font-semibold text-foreground text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">{j.title}</h3>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 shrink-0" /> {j.company || "Company"}</p>
            {j.location && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" /> {j.location}{j.isRemote ? " (Remote)" : ""}</p>}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {j.type && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{j.type}</span>}
            {j.experience && <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{j.experience}</span>}
            {j.salary && <span className="flex items-center gap-1 text-success dark:text-success font-medium"><DollarSign className="h-3 w-3" />{typeof j.salary === "number" ? `${(j.salary/1000).toFixed(0)}K` : j.salary}</span>}
          </div>
          {j.description && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{j.description}</p>}
          {showSkills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {showSkills.map((s: string, i: number) => <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">{s}</Badge>)}
              {extraCount > 0 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">+{extraCount}</Badge>}
            </div>
          )}
          <div className="mt-auto pt-3 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setViewJob(j)}><Eye className="h-3.5 w-3.5 mr-1" />Details</Button>
            {appliedIds.has(j.id)
              ? <Badge variant="secondary" className="flex-1 justify-center py-1.5">Applied</Badge>
              : <Button size="sm" className="flex-1" onClick={() => setApplyJob(j)}>Apply Now</Button>}
          </div>
        </CardContent>
      </Card>
    );
  };

  const jobRow = (j: any) => {
    const skills = parseSkills(j.skills);
    const showSkills = skills.slice(0, 3);
    return (
      <Card key={j.id} className="group hover:shadow-md hover:border-primary/30 transition-all duration-200">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">{j.title}</p>
              {j.workType && <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 capitalize">{j.workType}</Badge>}
              {j.urgency && j.urgency !== "normal" && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0 capitalize">{j.urgency}</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{j.company || "Company"}</span>
              {j.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span>}
              {j.type && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{j.type}</span>}
              {j.experience && <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{j.experience}</span>}
              {j.salary && <span className="flex items-center gap-1 text-success dark:text-success font-medium"><DollarSign className="h-3 w-3" />{typeof j.salary === "number" ? `${(j.salary/1000).toFixed(0)}K` : j.salary}</span>}
              <span className="text-muted-foreground/60">{timeAgo(j.createdAt)}</span>
            </div>
            {showSkills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {showSkills.map((s: string, i: number) => <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">{s}</Badge>)}
                {skills.length > 3 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">+{skills.length - 3}</Badge>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setViewJob(j)}><Eye className="h-3.5 w-3.5 mr-1" />Details</Button>
            {appliedIds.has(j.id)
              ? <Badge variant="secondary" className="py-1.5 px-3">Applied</Badge>
              : <Button size="sm" onClick={() => setApplyJob(j)}>Apply</Button>}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <CandidateLayout hideFooter>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Find Jobs</h1>
        <p className="text-sm text-muted-foreground mt-1">Discover opportunities that match your skills</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobs or companies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setFiltersOpen(!filtersOpen)} className={filtersOpen ? "bg-primary/10 text-primary" : ""} aria-label="Toggle filters">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <div className="flex border border-border rounded-md">
            <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" onClick={() => setView("grid")} aria-label="Grid view" className="rounded-r-none"><LayoutGrid className="h-4 w-4" /></Button>
            <Button variant={view === "list" ? "secondary" : "ghost"} size="icon" onClick={() => setView("list")} aria-label="List view" className="rounded-l-none"><List className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
      <div className="flex gap-6">
        {filtersOpen && (
          <Card className="w-64 shrink-0 h-fit hidden sm:block">
            <CardContent className="p-4 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Filters</span>
                {hasFilters && <Button variant="ghost" size="sm" onClick={clearAll} className="h-auto p-0 text-xs text-primary">Clear all</Button>}
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Job Type</Label>
                <Select value={fType} onValueChange={setFType}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {opts.types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Location</Label>
                <Select value={fLoc} onValueChange={setFLoc}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {opts.locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Department</Label>
                <Select value={fDept} onValueChange={setFDept}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {opts.departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Salary (K): {salRange[0]}K – {salRange[1]}K</Label>
                <Slider min={0} max={300} step={10} value={salRange} onValueChange={(v) => setSalRange(v as SalaryTuple)} />
              </div>
            </CardContent>
          </Card>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-3">{filtered.length} job{filtered.length !== 1 ? "s" : ""} found</p>
          {filtered.length === 0 ? (
            <EmptyState icon={Briefcase} title="No jobs found" description={debSearch || hasFilters ? "Try adjusting your filters" : "Check back later"} actionLabel={hasFilters ? "Clear Filters" : undefined} onAction={hasFilters ? clearAll : undefined} />
          ) : view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(jobCard)}</div>
          ) : (
            <div className="space-y-2">{filtered.map(jobRow)}</div>
          )}
        </div>
      </div>

      {viewJob && (
        <JobDetailsDialog job={viewJob} open={!!viewJob} onOpenChange={(open) => { if (!open) setViewJob(null); }}
          extraFooter={<div className="pt-4">{appliedIds.has(viewJob.id) ? <Badge variant="secondary" className="py-2 px-4 text-sm">Already Applied</Badge> : <Button onClick={() => { setViewJob(null); setApplyJob(viewJob); }}>Apply for this Job</Button>}</div>}
        />
      )}
      {applyJob && (
        <JobApplicationDialog job={applyJob} open={!!applyJob} onOpenChange={(open) => { if (!open) { setApplyJob(null); loadApplied(); } }} />
      )}
    </CandidateLayout>
  );
}

export default AllJobsPage;