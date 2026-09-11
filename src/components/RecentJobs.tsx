import { ArrowUpRight, Clock, MapPin, Wallet } from "lucide-react";
import { Link } from "react-router-dom";

import { usePublicRecentJobs } from "@/hooks/useApiQuery";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { Spotlight } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Job {
  id: number;
  title: string;
  company: string;
  location: string | null;
  type: string;
  salary: string | null;
  experience: string | null;
  workType: string;
  skills: string[] | null;
  createdAt: string;
}

/** Employment type → semantic tone. Keeps job chips consistent app-wide. */
const TYPE_TONE: Record<string, string> = {
  "full-time": "text-primary bg-primary/10 border-primary/20",
  "part-time": "text-brand-fuchsia bg-brand-fuchsia/10 border-brand-fuchsia/20",
  contract: "text-warning bg-warning/12 border-warning/25",
  internship: "text-success bg-success/10 border-success/20",
  temporary: "text-destructive bg-destructive/10 border-destructive/20",
};

function timeAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function parseSkills(skills: Job["skills"]): string[] {
  if (Array.isArray(skills)) return skills;
  if (typeof skills === "string") {
    try {
      const parsed = JSON.parse(skills);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

const RecentJobs = () => {
  const { data: jobs, isLoading } = usePublicRecentJobs();

  if (isLoading) {
    return (
      <section className="py-20 sm:py-24">
        <div className="container mx-auto">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-5 h-10 w-96 max-w-full" />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-[var(--radius-xl)]" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const list = (jobs as Job[] | undefined) ?? [];
  if (list.length === 0) return null;

  return (
    <section className="relative py-20 sm:py-24">
      <div className="container mx-auto">
        <SectionHeading
          eyebrow="Fresh opportunities"
          title="Roles posted this week."
          accentWord="this week."
          align="left"
          action={
            <Button asChild variant="outline" pill className="hidden sm:inline-flex">
              <Link to="/candidate/jobs">
                Browse all jobs
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />

        <Stagger gap={0.06} className="mt-10 grid gap-4 md:grid-cols-2">
          {list.slice(0, 8).map((job) => {
            const skills = parseSkills(job.skills);
            const tone = TYPE_TONE[job.type] ?? "text-muted-foreground bg-secondary border-border";

            return (
              <StaggerItem key={job.id}>
                <Link
                  to={`/careers/job/${job.id}`}
                  className="group surface-card relative block h-full overflow-hidden p-5 no-underline transition-all duration-300 ease-expo hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                >
                  <Spotlight />

                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                        {job.title}
                      </h3>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">{job.company}</p>
                    </div>

                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        tone
                      )}
                    >
                      {job.type}
                    </span>
                  </div>

                  <div className="relative mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    {job.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </span>
                    )}
                    <span className="capitalize">{job.workType}</span>
                    {job.salary && (
                      <span className="inline-flex items-center gap-1">
                        <Wallet className="h-3 w-3" />
                        {job.salary}
                      </span>
                    )}
                    <span className="ml-auto inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(job.createdAt)}
                    </span>
                  </div>

                  {skills.length > 0 && (
                    <div className="relative mt-4 flex flex-wrap gap-1.5">
                      {skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                      {skills.length > 4 && (
                        <span className="px-1 text-[11px] text-muted-foreground">+{skills.length - 4}</span>
                      )}
                    </div>
                  )}

                  <ArrowUpRight className="absolute bottom-5 right-5 h-4 w-4 translate-y-1 text-primary opacity-0 transition-all duration-300 ease-expo group-hover:translate-y-0 group-hover:opacity-100" />
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>

        <div className="mt-8 sm:hidden">
          <Button asChild variant="outline" className="w-full" pill>
            <Link to="/candidate/jobs">
              Browse all jobs
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RecentJobs;
