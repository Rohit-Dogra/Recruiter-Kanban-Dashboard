import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  Crown,
  FileText,
  Phone,
  Play,
  Quote,
  Sparkles,
  Star,
  UserRound,
  Users,
  Video,
  Zap,
  type LucideIcon,
} from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { ScrollProgress } from "@/components/marketing/ScrollProgress";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { Magnetic, Spotlight } from "@/components/motion/Magnetic";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

/* ══════════════════════════════════════════════════════════════════════════
   FEATURES / PRICING
   Same content as before, rebuilt on the design system: no per-theme colour
   branching, no hard-coded hex, and every accent drawn from brand tokens so
   the page matches the rest of the product in both themes.
   ══════════════════════════════════════════════════════════════════════════ */

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
  tone: string;
}

const FEATURES: Feature[] = [
  {
    icon: Phone,
    title: "AI phone screening",
    desc: "The AI calls candidates on its own and returns a full report — scores, transcript and a hire / no-hire recommendation.",
    tone: "var(--brand-indigo)",
  },
  {
    icon: Video,
    title: "AI technical interview",
    desc: "Avatar-led video and voice interviews with MCQ assessments. Technical and communication scores arrive in real time.",
    tone: "var(--brand-violet)",
  },
  {
    icon: FileText,
    title: "ATS résumé scoring",
    desc: "Every résumé parsed and scored out of 100 automatically, with skill-match analysis and a clear recommendation.",
    tone: "var(--brand-cyan)",
  },
  {
    icon: BarChart3,
    title: "Hiring analytics",
    desc: "Funnel reports, source tracking, time-to-hire metrics and custom date ranges — the numbers leadership asks for.",
    tone: "var(--warning)",
  },
  {
    icon: Users,
    title: "Team collaboration",
    desc: "Role-based access, a team activity log and unlimited members on Diamond. Everyone aligned, nothing lost in DMs.",
    tone: "var(--brand-fuchsia)",
  },
  {
    icon: Sparkles,
    title: "AI job descriptions",
    desc: "Generate complete JDs, screening questions and interview criteria in one click from the job role.",
    tone: "var(--success)",
  },
];

const PIPELINE = [
  { step: "01", label: "Post job", desc: "AI generates the JD and screening questions. Published in two minutes." },
  { step: "02", label: "Candidates apply", desc: "Résumés parsed, ATS scored and skill-matched the moment they arrive." },
  { step: "03", label: "AI phone screen", desc: "The AI calls candidates, scores communication and files the report." },
  { step: "04", label: "AI tech interview", desc: "Avatar AI runs the technical round and returns a full scorecard." },
  { step: "05", label: "Send offer", desc: "Digital offer letter with e-signature, sent straight from the pipeline." },
];

const STATS = [
  { value: 95, suffix: "%", label: "Résumé match accuracy" },
  { value: 14, suffix: " days", label: "Average time-to-hire" },
  { value: 3.5, suffix: "×", decimals: 1, label: "Faster than manual" },
  { value: 500, suffix: "+", label: "Companies on Hyre" },
];

const PLANS = [
  {
    name: "Silver",
    price: "₹999",
    duration: "1 month",
    icon: Star,
    popular: false,
    features: ["10 phone screenings", "5 technical interviews", "3 team members", "Basic analytics", "Email support"],
  },
  {
    name: "Gold",
    price: "₹2,499",
    duration: "3 months",
    icon: Crown,
    popular: true,
    features: [
      "30 phone screenings",
      "15 technical interviews",
      "10 team members",
      "Advanced analytics",
      "Priority support",
      "AI insights",
    ],
  },
  {
    name: "Diamond",
    price: "₹4,999",
    duration: "6 months",
    icon: Zap,
    popular: false,
    features: [
      "100 phone screenings",
      "50 technical interviews",
      "Unlimited members",
      "Full analytics",
      "24/7 support",
      "Dedicated manager",
    ],
  },
];

const TESTIMONIALS = [
  {
    name: "Rohit Dogra",
    role: "CTO, Driffle",
    text: "Hyre cut our hiring time from six weeks to twelve days. The AI phone screening alone saves us fifteen hours a week.",
    score: "60% faster",
  },
  {
    name: "Priya Sharma",
    role: "HR Lead, NexTech",
    text: "The ATS scoring and AI interview reports are remarkably accurate. We hired three engineers in ten days using Hyre.",
    score: "10 days",
  },
  {
    name: "Rahul Agarwal",
    role: "Founder, DevHouse",
    text: "Best investment for our startup. The offer letter feature alone is worth it — everything lives in one place.",
    score: "3.5× ROI",
  },
];

const TRUST_POINTS = ["No credit card required", "14-day free trial", "Set up in five minutes", "500+ companies"];

const BOARD_PREVIEW = [
  { label: "Applied", count: 48, tone: "var(--brand-indigo)" },
  { label: "AI screened", count: 32, tone: "var(--brand-violet)" },
  { label: "Interviewed", count: 18, tone: "var(--brand-cyan)" },
  { label: "Hired", count: 6, tone: "var(--success)" },
];

const FeaturesPage = () => {
  const [showSignupModal, setShowSignupModal] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <Header />

      <main id="main">
        {/* ════════ HERO ════════ */}
        <section className="relative overflow-hidden pb-16 pt-32 sm:pt-36">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-aurora" />
            <div className="absolute inset-0 bg-grid mask-fade-y opacity-50" />
          </div>

          <div className="container mx-auto text-center">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE.expo }}
              className="eyebrow"
            >
              <Sparkles className="h-3 w-3 text-primary" />
              The complete platform
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE.expo, delay: 0.08 }}
              className="mx-auto mt-6 max-w-3xl text-display-lg font-semibold text-foreground"
            >
              Every step of hiring,{" "}
              <span className="font-accent italic text-gradient-hero">handled by one system.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE.expo, delay: 0.18 }}
              className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground"
            >
              Posting, screening, interviewing, scoring and offers — in one pipeline, with the AI doing the
              repetitive parts and your team doing the judgement.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE.expo, delay: 0.26 }}
              className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"
            >
              <Magnetic strength={8}>
                <Button
                  variant="hero"
                  size="xl"
                  pill
                  className="w-full sm:w-auto"
                  onClick={() => setShowSignupModal(true)}
                  iconRight={<ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />}
                >
                  Start free trial
                </Button>
              </Magnetic>
              <Button asChild variant="outline" size="xl" pill className="w-full sm:w-auto">
                <Link to="/ai-interview-demo">
                  <Play className="h-3.5 w-3.5" />
                  See the demo
                </Link>
              </Button>
            </motion.div>

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
            >
              {TRUST_POINTS.map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-success" strokeWidth={3} />
                  {t}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Board preview — a real window chrome, on-palette */}
          <Reveal delay={0.35} className="container mx-auto mt-14 max-w-4xl">
            <div className="ring-gradient overflow-hidden rounded-[var(--radius-2xl)] border border-border/60 bg-gradient-card p-5 shadow-xl sm:p-6">
              <div className="mb-5 flex items-center gap-2.5 border-b border-border/70 pb-4">
                <span className="flex gap-1.5" aria-hidden>
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  Hyre — recruitment pipeline
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {BOARD_PREVIEW.map((b, i) => (
                  <motion.div
                    key={b.label}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, ease: EASE.expo, delay: 0.1 + i * 0.08 }}
                    className="rounded-[var(--radius-lg)] border p-4"
                    style={{
                      background: `hsl(${b.tone} / 0.08)`,
                      borderColor: `hsl(${b.tone} / 0.2)`,
                    }}
                  >
                    <p
                      className="font-display text-2xl font-semibold tabular-nums"
                      style={{ color: `hsl(${b.tone})` }}
                    >
                      <AnimatedNumber value={b.count} />
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-muted-foreground">{b.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* ════════ STATS ════════ */}
        <section id="analytics" className="border-y border-border/60 bg-surface-2/40 py-12">
          <div className="container mx-auto">
            <Stagger gap={0.07} className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {STATS.map((s) => (
                <StaggerItem key={s.label} className="text-center">
                  <p className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    <AnimatedNumber value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
                  </p>
                  <p className="mt-1.5 text-[13px] text-muted-foreground">{s.label}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* ════════ FEATURES ════════ */}
        <section id="features" className="py-20 sm:py-28">
          <div className="container mx-auto">
            <SectionHeading
              eyebrow="Platform features"
              title="Six systems that replace a dozen tools."
              accentWord="a dozen tools."
              description="Each one is useful alone. Together they remove the handoffs where candidates usually go cold."
            />

            <Stagger gap={0.07} className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <StaggerItem key={f.title}>
                  <article className="surface-card group relative h-full overflow-hidden p-6 transition-all duration-300 ease-expo hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-lg">
                    <Spotlight />
                    <span
                      className="relative flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border transition-transform duration-300 ease-spring group-hover:scale-110 group-hover:-rotate-6"
                      style={{
                        background: `hsl(${f.tone} / 0.1)`,
                        borderColor: `hsl(${f.tone} / 0.2)`,
                        color: `hsl(${f.tone})`,
                      }}
                    >
                      <f.icon className="h-5 w-5" />
                    </span>
                    <h3 className="relative mt-5 font-display text-lg font-semibold tracking-tight text-foreground">
                      {f.title}
                    </h3>
                    <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </article>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* ════════ PIPELINE ════════ */}
        <section id="pipeline" className="border-y border-border/60 bg-surface-2/40 py-20 sm:py-28">
          <div className="container mx-auto">
            <SectionHeading
              eyebrow="How it runs"
              title="Five steps from open role to signed offer."
              accentWord="signed offer."
            />

            <Stagger gap={0.08} className="relative mt-12 space-y-3">
              {PIPELINE.map((p, i) => (
                <StaggerItem key={p.step}>
                  <div className="group relative flex items-start gap-4 rounded-[var(--radius-xl)] border border-border/70 bg-surface p-5 transition-all duration-300 ease-expo hover:border-primary/25 hover:shadow-md sm:items-center">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-gradient-primary font-mono text-sm font-semibold text-white shadow-glow transition-transform duration-300 ease-spring group-hover:scale-105">
                      {p.step}
                    </span>

                    <div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-5">
                      <h3 className="shrink-0 font-display text-base font-semibold tracking-tight text-foreground sm:w-52">
                        {p.label}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:mt-0">{p.desc}</p>
                    </div>

                    {i < PIPELINE.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute -bottom-3 left-[1.625rem] h-3 w-px bg-gradient-to-b from-border to-transparent"
                      />
                    )}
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* ════════ PRICING ════════ */}
        <section id="pricing" className="py-20 sm:py-28">
          <div className="container mx-auto">
            <SectionHeading
              eyebrow="Pricing"
              title="Pick a plan, change it whenever."
              accentWord="whenever."
              description="Every plan includes the full pipeline. The difference is volume and support."
            />

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {PLANS.map((plan, i) => (
                <Reveal key={plan.name} delay={i * 0.08}>
                  <div
                    className={cn(
                      "relative flex h-full flex-col rounded-[var(--radius-2xl)] border p-6 transition-all duration-300 ease-expo sm:p-7",
                      plan.popular
                        ? "border-primary/40 bg-gradient-card shadow-glow-lg lg:-translate-y-3 lg:scale-[1.02]"
                        : "border-border/70 bg-gradient-card shadow-sm hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg"
                    )}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-glow">
                        Most popular
                      </span>
                    )}

                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]",
                          plan.popular ? "bg-gradient-primary text-white" : "bg-secondary text-muted-foreground"
                        )}
                      >
                        <plan.icon className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <p className="font-display text-lg font-semibold tracking-tight text-foreground">
                          {plan.name}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                          {plan.duration}
                        </p>
                      </div>
                    </div>

                    <p className="mt-6 font-display text-4xl font-semibold tracking-tight text-foreground">
                      {plan.price}
                      <span className="ml-1.5 text-sm font-normal text-muted-foreground">/{plan.duration}</span>
                    </p>

                    <ul className="mt-6 flex-1 space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                            <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={plan.popular ? "hero" : "outline"}
                      size="lg"
                      className="mt-7 w-full"
                      onClick={() => setShowSignupModal(true)}
                    >
                      Get {plan.name}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ TESTIMONIALS ════════ */}
        <section className="border-t border-border/60 bg-surface-2/40 py-20 sm:py-28">
          <div className="container mx-auto">
            <SectionHeading
              eyebrow="In production"
              title="Teams that stopped reading résumés."
              accentWord="stopped reading résumés."
            />

            <Stagger gap={0.08} className="mt-12 grid gap-4 lg:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <StaggerItem key={t.name}>
                  <figure className="surface-card flex h-full flex-col p-6 transition-all duration-300 ease-expo hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg">
                    <Quote className="h-5 w-5 shrink-0 text-primary/40" aria-hidden />
                    <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/85">
                      {t.text}
                    </blockquote>
                    <figcaption className="mt-5 flex items-center justify-between gap-3 border-t border-border/70 pt-4">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-foreground">{t.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{t.role}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-success/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-success">
                        {t.score}
                      </span>
                    </figcaption>
                  </figure>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      </main>

      <Footer />

      {/* ── Role picker before signup ── */}
      <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>How will you use Hyre?</DialogTitle>
            <DialogDescription>Pick the workspace that fits — you can change it later.</DialogDescription>
          </DialogHeader>

          <div className="mt-2 grid gap-3">
            {[
              {
                to: "/signup",
                icon: Building2,
                title: "I'm hiring",
                desc: "Post roles, screen candidates, run AI interviews.",
              },
              {
                to: "/signup",
                icon: UserRound,
                title: "I'm job hunting",
                desc: "Build a profile, apply once, get matched.",
              },
            ].map((o) => (
              <Link
                key={o.title}
                to={o.to}
                onClick={() => setShowSignupModal(false)}
                className="group flex items-center gap-4 rounded-[var(--radius-lg)] border border-border bg-surface-2/50 p-4 no-underline transition-all duration-300 ease-expo hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary/10 text-primary transition-transform duration-300 ease-spring group-hover:scale-110">
                  <o.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{o.title}</span>
                  <span className="block text-xs text-muted-foreground">{o.desc}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeaturesPage;
