import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Award, Code2, Cpu, Gauge, Phone, Upload, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { SectionHeading } from "@/components/marketing/SectionHeading";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/Reveal";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

/* ══════════════════════════════════════════════════════════════════════════
   PIPELINE VISUALISATION
   A live funnel: the bar chart on the left shows candidates surviving each
   stage, and the panel on the right shows the board as it actually looks at
   that stage. It auto-advances until the visitor takes control.
   ══════════════════════════════════════════════════════════════════════════ */

interface Person {
  name: string;
  role: string;
  score: number | null;
}

interface Stage {
  id: string;
  step: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  count: number;
  countLabel: string;
  tone: string;
  footer: string;
  people: Person[];
}

const STAGES: Stage[] = [
  {
    id: "post",
    step: "01",
    title: "Job posted",
    subtitle: "Company posts a job with JD and required skills",
    icon: Upload,
    count: 1,
    countLabel: "position",
    tone: "var(--brand-indigo)",
    footer: "Job live — applications open",
    people: [{ name: "React Developer", role: "3 yrs exp · Remote", score: null }],
  },
  {
    id: "apply",
    step: "02",
    title: "Candidate applies",
    subtitle: "Résumé uploaded, AI extracts skills and experience",
    icon: Cpu,
    count: 48,
    countLabel: "candidates",
    tone: "var(--brand-violet)",
    footer: "Application received",
    people: [
      { name: "Rohit Dogra", role: "Frontend developer", score: null },
      { name: "Arun Kumar", role: "Backend developer", score: null },
      { name: "Eshanya Sharma", role: "Full-stack developer", score: null },
    ],
  },
  {
    id: "ats",
    step: "03",
    title: "ATS score",
    subtitle: "Score out of 100 · skills matched · hire recommendation",
    icon: Gauge,
    count: 48,
    countLabel: "scored",
    tone: "var(--brand-fuchsia)",
    footer: "Profiles under review",
    people: [
      { name: "Rohit Dogra", role: "Frontend developer", score: 91 },
      { name: "Eshanya Sharma", role: "Backend developer", score: 84 },
      { name: "Arun Kumar", role: "Backend developer", score: 62 },
    ],
  },
  {
    id: "aicall",
    step: "04",
    title: "AI calling round",
    subtitle: "AI calls shortlisted candidates for basic screening",
    icon: Phone,
    count: 24,
    countLabel: "called",
    tone: "var(--brand-cyan)",
    footer: "Shortlisted — AI call complete",
    people: [
      { name: "Rohit Dogra", role: "Communication 88", score: 88 },
      { name: "Eshanya Sharma", role: "Communication 94", score: 94 },
    ],
  },
  {
    id: "technical",
    step: "05",
    title: "AI technical interview",
    subtitle: "Domain knowledge · problem solving · full report",
    icon: Code2,
    count: 12,
    countLabel: "interviewed",
    tone: "var(--success)",
    footer: "Technical interview scored",
    people: [
      { name: "Rohit Dogra", role: "Frontend developer", score: 96 },
      { name: "Ankita Kumari", role: "Backend developer", score: 92 },
    ],
  },
  {
    id: "offer",
    step: "06",
    title: "Offer letter",
    subtitle: "Digital offer · e-signature · onboarding tracking",
    icon: Award,
    count: 4,
    countLabel: "offers",
    tone: "var(--warning)",
    footer: "Offer letter sent",
    people: [{ name: "Rohit Dogra", role: "Frontend developer", score: 98 }],
  },
];

const MAX = Math.max(...STAGES.map((s) => s.count));

const PipelineVisualization = () => {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  // Only cycle while the section is actually on screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !visible || reduce) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % STAGES.length), 3600);
    return () => window.clearInterval(id);
  }, [auto, visible, reduce]);

  const stage = STAGES[active];

  const select = (i: number) => {
    setAuto(false);
    setActive(i);
  };

  return (
    <section ref={sectionRef} id="pipeline" className="relative overflow-hidden py-20 sm:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[820px] max-w-[120vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[140px]" />
      </div>

      <div className="container mx-auto">
        <SectionHeading
          eyebrow="Live pipeline"
          title="Watch 48 applicants become 4 offers."
          accentWord="4 offers."
          description="Every narrowing step is a decision the system can explain — not a black box that returns a shortlist."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8">
          {/* ── Funnel ── */}
          <Reveal direction="left" className="surface-card p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Candidates remaining
              </span>
              {!auto && (
                <button
                  onClick={() => setAuto(true)}
                  className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary transition-opacity hover:opacity-70"
                >
                  Auto-play
                </button>
              )}
            </div>

            <ul className="mt-5 space-y-2.5">
              {STAGES.map((s, i) => {
                const isActive = i === active;
                const pct = (s.count / MAX) * 100;
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => select(i)}
                      aria-current={isActive}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-[var(--radius-md)] p-2 text-left transition-colors duration-300",
                        isActive ? "bg-secondary/70" : "hover:bg-secondary/40"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] transition-all duration-300",
                          isActive ? "scale-105" : "opacity-60 group-hover:opacity-100"
                        )}
                        style={{ background: `hsl(${s.tone} / 0.12)`, color: `hsl(${s.tone})` }}
                      >
                        <s.icon className="h-4 w-4" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span
                            className={cn(
                              "truncate text-[13px] font-medium transition-colors",
                              isActive ? "text-foreground" : "text-muted-foreground"
                            )}
                          >
                            {s.title}
                          </span>
                          <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                            {s.count}
                          </span>
                        </span>

                        <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-border/70">
                          <motion.span
                            className="block h-full rounded-full"
                            style={{ background: `hsl(${s.tone})` }}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${pct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.9, ease: EASE.expo, delay: i * 0.08 }}
                          />
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-5">
              <div>
                <p className="font-display text-2xl font-semibold text-foreground">8.3%</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Applicant → offer
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/features">
                  How it works
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </Reveal>

          {/* ── Stage board ── */}
          <Reveal direction="right" className="relative">
            <div className="surface-card relative h-full overflow-hidden p-5 sm:p-7">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl transition-colors duration-700"
                style={{ background: `hsl(${stage.tone} / 0.18)` }}
              />

              <AnimatePresence mode="wait">
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.34, ease: EASE.expo }}
                  className="relative flex h-full flex-col"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span
                        className="font-mono text-[11px] uppercase tracking-[0.18em]"
                        style={{ color: `hsl(${stage.tone})` }}
                      >
                        Stage {stage.step}
                      </span>
                      <h3 className="mt-1.5 font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                        {stage.title}
                      </h3>
                      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                        {stage.subtitle}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-display text-3xl font-semibold tabular-nums text-foreground">
                        {stage.count}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        {stage.countLabel}
                      </p>
                    </div>
                  </div>

                  {/* Candidate cards as they appear on the real board */}
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {stage.people.map((p, i) => (
                      <motion.li
                        key={p.name}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: EASE.expo, delay: 0.08 + i * 0.07 }}
                        className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border/70 bg-surface-2/60 p-3"
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                          style={{
                            background: `linear-gradient(135deg, hsl(${stage.tone}), hsl(${stage.tone} / 0.65))`,
                          }}
                        >
                          {p.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-foreground">{p.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{p.role}</span>
                        </span>
                        {p.score != null && <ScoreRing score={p.score} size={38} strokeWidth={3} />}
                      </motion.li>
                    ))}
                  </ul>

                  <p
                    className="mt-5 inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{ background: `hsl(${stage.tone} / 0.1)`, color: `hsl(${stage.tone})` }}
                  >
                    <ArrowRight className="h-3 w-3" />
                    {stage.footer}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default PipelineVisualization;
