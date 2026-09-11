import { ArrowRight, Briefcase, FileText, Users, Video } from "lucide-react";
import { Link } from "react-router-dom";

import { usePublicStats } from "@/hooks/useApiQuery";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { Stagger, StaggerItem, Reveal } from "@/components/motion/Reveal";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Spotlight } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   PLATFORM NUMBERS
   Live counts from the public stats endpoint, with the AI-analysis figures
   underneath as a secondary band so the hierarchy stays clear.
   ══════════════════════════════════════════════════════════════════════════ */

const ANALYSIS = [
  { value: 18, suffix: "K+", label: "Risk factors detected" },
  { value: 10, suffix: "K+", label: "Transferable skills found" },
  { value: 51, suffix: "K+", label: "Learnable skills mapped" },
  { value: 85, suffix: "%", label: "Similarity detection rate" },
];

const StatsSection = () => {
  const { data: publicStats } = usePublicStats();

  const stats = [
    {
      icon: FileText,
      value: publicStats?.totalResumesScreened ?? 10000,
      label: "Résumés screened",
      description: "AI-analysed résumés across every company on the platform",
      trend: "+32%",
      tone: "primary",
    },
    {
      icon: Users,
      value: publicStats?.totalCompanies ?? 500,
      label: "Active companies",
      description: "Organisations running their hiring on Hyre",
      trend: "+25%",
      tone: "success",
    },
    {
      icon: Briefcase,
      value: publicStats?.totalJobsPosted ?? 2500,
      label: "Jobs posted",
      description: "Open positions across every industry we serve",
      trend: "+48%",
      tone: "cyan",
    },
    {
      icon: Video,
      value: publicStats?.totalInterviews ?? 8000,
      label: "Interviews conducted",
      description: "AI-led interviews completed end to end",
      trend: "+180%",
      tone: "warning",
    },
  ] as const;

  const toneClass: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    cyan: "bg-brand-cyan/10 text-brand-cyan",
    warning: "bg-warning/12 text-warning",
  };

  return (
    <section id="analytics" className="relative overflow-hidden py-20 sm:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-subtle" />

      <div className="container mx-auto">
        <SectionHeading
          eyebrow="By the numbers"
          title="Measured, not claimed."
          accentWord="not claimed."
          description="These figures come straight from the platform — they move as the product is used."
          align="left"
          action={
            <Button asChild variant="outline" pill>
              <Link to="/signup">
                Start hiring
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />

        {/* ── Primary stats ── */}
        <Stagger gap={0.08} className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StaggerItem key={s.label}>
              <article className="surface-card group relative h-full overflow-hidden p-6 transition-all duration-300 ease-expo hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg">
                <Spotlight />

                <div className="relative flex items-start justify-between">
                  <span
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] transition-transform duration-300 ease-spring group-hover:scale-110",
                      toneClass[s.tone]
                    )}
                  >
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                    {s.trend}
                  </span>
                </div>

                <p className="relative mt-6 font-display text-[2.5rem] font-semibold leading-none tracking-tight text-foreground">
                  <AnimatedNumber value={s.value} suffix="+" />
                </p>
                <p className="relative mt-2 text-sm font-medium text-foreground">{s.label}</p>
                <p className="relative mt-1 text-xs leading-relaxed text-muted-foreground">{s.description}</p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>

        {/* ── Secondary analysis band ── */}
        <Reveal className="mt-4">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-xl)] border border-border/70 bg-border/60 lg:grid-cols-4">
            {ANALYSIS.map((a) => (
              <div key={a.label} className="bg-surface px-5 py-5 transition-colors duration-300 hover:bg-surface-2">
                <p className="font-display text-2xl font-semibold tracking-tight text-foreground">
                  <AnimatedNumber value={a.value} suffix={a.suffix} />
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {a.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default StatsSection;
