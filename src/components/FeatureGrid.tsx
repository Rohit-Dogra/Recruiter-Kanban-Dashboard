import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Award,
  BarChart3,
  Brain,
  Briefcase,
  CheckCircle,
  Code2,
  Eye,
  FileSearch,
  Gauge,
  Mail,
  MessageSquare,
  Phone,
  Shield,
  Star,
  Target,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { Spotlight } from "@/components/motion/Magnetic";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

/* ══════════════════════════════════════════════════════════════════════════
   WHAT THE PLATFORM DOES
   Three movements:
     1. The pipeline, as an interactive stepper you can click through.
     2. A bento grid of supporting capabilities, sized by importance.
     3. The ten scoring dimensions, as a dense chip wall.
   ══════════════════════════════════════════════════════════════════════════ */

interface Stage {
  step: string;
  icon: LucideIcon;
  title: string;
  badge: string;
  description: string;
  detail: string;
  tone: string;
}

const STAGES: Stage[] = [
  {
    step: "01",
    icon: Briefcase,
    title: "Job posting",
    badge: "Start",
    description: "Post a role with required skills, experience and JD.",
    detail: "Auto-tagging and multi-platform publishing put the role in front of the right candidates immediately.",
    tone: "var(--brand-indigo)",
  },
  {
    step: "02",
    icon: FileSearch,
    title: "Candidate applies",
    badge: "Apply",
    description: "Résumés are parsed the moment they land.",
    detail: "Skills, education and experience are extracted structurally — no manual data entry, no lost applications.",
    tone: "var(--brand-violet)",
  },
  {
    step: "03",
    icon: Gauge,
    title: "ATS score & match",
    badge: "AI",
    description: "Every applicant gets a score out of 100.",
    detail: "Matched skills, missing skills and a hire / no-hire recommendation, with the reasoning shown to your team.",
    tone: "var(--brand-fuchsia)",
  },
  {
    step: "04",
    icon: Phone,
    title: "AI calling round",
    badge: "AI call",
    description: "Shortlisted candidates get a screening call.",
    detail: "The AI asks basic screening questions, evaluates communication, and returns a full transcript and report.",
    tone: "var(--brand-cyan)",
  },
  {
    step: "05",
    icon: Code2,
    title: "AI technical interview",
    badge: "Tech",
    description: "A complete technical interview, scored.",
    detail: "Domain knowledge, problem solving and communication, each scored with evidence from the conversation.",
    tone: "var(--success)",
  },
  {
    step: "06",
    icon: Award,
    title: "Offer letter",
    badge: "Hire",
    description: "Branded digital offers with e-signature.",
    detail: "Offer letters go out with onboarding tracking built in, so nothing stalls between yes and day one.",
    tone: "var(--warning)",
  },
];

const SUPPORTING = [
  {
    icon: BarChart3,
    title: "Analytics that answer questions",
    description:
      "Time-to-hire, source effectiveness, funnel drop-off and per-recruiter performance — the numbers your leadership actually asks for.",
    badge: "Insights",
    span: "lg:col-span-2",
  },
  {
    icon: Zap,
    title: "Bulk hiring engine",
    description: "Process 1,000 candidates with the same rigour as the first. Zero added delay per candidate.",
    badge: "Scale",
    span: "",
  },
  {
    icon: Mail,
    title: "Candidate email alerts",
    description: "Automatic mail at every stage — applied, shortlisted, interview scheduled, offer sent.",
    badge: "Auto",
    span: "",
  },
  {
    icon: Shield,
    title: "Enterprise security",
    description: "GDPR compliant, JWT + OAuth 2.0, 54 audit dimensions, encrypted storage at rest and in transit.",
    badge: "Security",
    span: "lg:col-span-2",
  },
];

const DIMENSIONS = [
  { icon: Brain, label: "Technical knowledge", desc: "Depth and accuracy of domain expertise" },
  { icon: MessageSquare, label: "Communication", desc: "Clarity, articulation and coherence" },
  { icon: Activity, label: "Engagement", desc: "Active participation and enthusiasm" },
  { icon: Star, label: "Emotional intelligence", desc: "Self-awareness, empathy, social skills" },
  { icon: CheckCircle, label: "Professionalism", desc: "Conduct, tone and workplace readiness" },
  { icon: TrendingUp, label: "Confidence level", desc: "Assurance in responses" },
  { icon: Gauge, label: "Speaking pace", desc: "Rate of speech analysis" },
  { icon: Eye, label: "Eye contact", desc: "Visual engagement, when video is enabled" },
  { icon: Target, label: "Red flags", desc: "Inconsistencies, evasion, concerning patterns" },
  { icon: Award, label: "Overall fit", desc: "Holistic assessment across every dimension" },
];

const FeatureGrid = () => {
  const [active, setActive] = useState(0);
  const stage = STAGES[active];

  return (
    <section id="features" className="relative overflow-hidden py-20 sm:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-dots mask-fade-y opacity-40" />

      <div className="container mx-auto">
        <SectionHeading
          eyebrow="The pipeline"
          title="Six stages. One continuous system."
          accentWord="One"
          description="Each stage hands structured data to the next, so nothing is re-keyed and nothing falls through."
        />

        {/* ── Interactive stepper ─────────────────────────────────────────── */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-8">
          {/* Step rail */}
          <Stagger className="flex gap-2 overflow-x-auto pb-2 no-scrollbar lg:flex-col lg:overflow-visible lg:pb-0">
            {STAGES.map((s, i) => {
              const isActive = i === active;
              return (
                <StaggerItem key={s.step} className="shrink-0 lg:shrink">
                  <button
                    onClick={() => setActive(i)}
                    aria-current={isActive}
                    className={cn(
                      "group relative flex w-56 items-center gap-3 rounded-[var(--radius-lg)] border p-3 text-left transition-all duration-300 ease-expo lg:w-full",
                      isActive
                        ? "border-primary/30 bg-surface shadow-md"
                        : "border-border/60 bg-surface-2/50 hover:border-border-strong hover:bg-surface-2"
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="stage-indicator"
                        className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-gradient-primary"
                        transition={{ type: "spring", stiffness: 360, damping: 30 }}
                      />
                    )}
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-transform duration-300 ease-spring group-hover:scale-105"
                      style={{
                        background: `hsl(${s.tone} / 0.12)`,
                        color: `hsl(${s.tone})`,
                      }}
                    >
                      <s.icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        {s.step} · {s.badge}
                      </span>
                      <span
                        className={cn(
                          "block truncate text-sm font-medium transition-colors",
                          isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {s.title}
                      </span>
                    </span>
                  </button>
                </StaggerItem>
              );
            })}
          </Stagger>

          {/* Detail panel */}
          <Reveal direction="right" className="relative">
            <div className="surface-card ring-gradient relative min-h-[320px] overflow-hidden p-7 sm:p-9">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl transition-colors duration-700"
                style={{ background: `hsl(${stage.tone} / 0.16)` }}
              />

              <AnimatePresence mode="wait">
                <motion.div
                  key={stage.step}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.32, ease: EASE.expo }}
                  className="relative pb-10"
                >
                  <span
                    className="font-display text-[5rem] font-semibold leading-none tracking-tighter opacity-15"
                    style={{ color: `hsl(${stage.tone})` }}
                  >
                    {stage.step}
                  </span>

                  <h3 className="mt-2 text-display-sm font-semibold text-foreground">{stage.title}</h3>
                  <p className="mt-3 max-w-lg text-base leading-relaxed text-foreground/80">{stage.description}</p>
                  <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-muted-foreground">{stage.detail}</p>
                </motion.div>
              </AnimatePresence>

              {/* Progress through the pipeline */}
              <div className="absolute inset-x-7 bottom-7 sm:inset-x-9 sm:bottom-9">
                <div className="flex items-center gap-1.5">
                  {STAGES.map((s, i) => (
                    <button
                      key={s.step}
                      onClick={() => setActive(i)}
                      aria-label={`Go to stage ${s.step}: ${s.title}`}
                      className="group/dot h-6 flex-1"
                    >
                      <span
                        className={cn(
                          "block h-1 w-full rounded-full transition-all duration-400 ease-expo",
                          i === active ? "bg-primary" : "bg-border group-hover/dot:bg-border-strong"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ── Supporting capabilities: bento ──────────────────────────────── */}
        <div className="mt-24">
          <SectionHeading
            eyebrow="Built around it"
            title="Everything the pipeline needs to run itself."
            accentWord="itself."
            align="left"
          />

          <Stagger gap={0.08} className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SUPPORTING.map((f) => (
              <StaggerItem key={f.title} className={f.span}>
                <article className="surface-card group relative h-full overflow-hidden p-6 transition-all duration-300 ease-expo hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg">
                  <Spotlight />
                  <div className="relative flex items-start justify-between gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-primary/10 text-primary transition-transform duration-300 ease-spring group-hover:scale-110 group-hover:-rotate-6">
                      <f.icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      {f.badge}
                    </span>
                  </div>
                  <h4 className="relative mt-5 font-display text-lg font-semibold tracking-tight text-foreground">
                    {f.title}
                  </h4>
                  <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        {/* ── Scoring dimensions ──────────────────────────────────────────── */}
        <div className="mt-24">
          <SectionHeading
            eyebrow="Interview scoring"
            title="Ten dimensions, every single interview."
            accentWord="Ten"
            description="The same rubric applied to everyone — which is what makes the scores comparable."
          />

          <Stagger gap={0.04} className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {DIMENSIONS.map((d, i) => (
              <StaggerItem key={d.label}>
                <div className="surface-card group h-full p-4 transition-all duration-300 ease-expo hover:-translate-y-1 hover:border-primary/25">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-secondary text-muted-foreground transition-colors duration-300 group-hover:bg-primary/12 group-hover:text-primary">
                      <d.icon className="h-4 w-4" />
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-muted-foreground/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-3 text-[13px] font-medium leading-snug text-foreground">{d.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
