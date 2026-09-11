import { useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, LayoutDashboard, Play, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import BookDemoModal from "@/components/BookDemoModal";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/motion/Magnetic";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import Scene3D from "@/components/three/Scene3D";
import { EASE } from "@/lib/motion";

/* ══════════════════════════════════════════════════════════════════════════
   HERO
   Asymmetric two-column composition: the claim and CTAs on the left, the live
   3D talent core on the right. The metric strip anchors the bottom so the page
   opens on evidence rather than on a marketing sentence alone.
   ══════════════════════════════════════════════════════════════════════════ */

const METRICS = [
  { value: 95, suffix: "%", label: "Match accuracy" },
  { value: 18, suffix: "K+", label: "Risk factors detected" },
  { value: 10, suffix: "K+", label: "Transferable skills found" },
  { value: 3.5, suffix: "×", label: "Faster hiring", decimals: 1 },
];

const WORDS = ["The future of hiring", "isn't coming."];

const HeroSection = () => {
  const [demoOpen, setDemoOpen] = useState(false);
  const { isAuthenticated, userType } = useAuth();
  const reduce = useReducedMotion();

  // Only the ambient backdrop parallaxes. Fading the copy on scroll left the
  // headline half-erased behind the floating header, which read as a bug.
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 0.3], [0, 80]);

  const dashboardPath =
    userType === "admin" ? "/admin" : userType === "candidate" ? "/candidate/dashboard" : "/dashboard";

  return (
    <section className="relative min-h-[100svh] overflow-hidden pb-16 pt-28 sm:pt-32 lg:pb-24 lg:pt-36">
      {/* ── Ambient backdrop ── */}
      <motion.div aria-hidden style={{ y: reduce ? 0 : bgY }} className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-aurora" />
        <div className="absolute inset-0 bg-grid mask-fade-y opacity-60" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute bottom-0 left-1/2 h-64 w-[120vw] -translate-x-1/2 bg-gradient-to-t from-background to-transparent" />
      </motion.div>

      <div className="container relative mx-auto">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
          {/* ── Left: claim ── */}
          <div className="relative z-10 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE.expo }}
              className="eyebrow"
            >
              <Sparkles className="h-3 w-3 text-primary" />
              AI-powered recruitment
            </motion.div>

            <h1 className="mt-6 text-display-xl font-semibold text-foreground">
              {WORDS.map((line, i) => (
                <span key={line} className="block overflow-hidden pb-[0.06em]">
                  <motion.span
                    className="block"
                    initial={{ y: reduce ? 0 : "100%", opacity: reduce ? 1 : 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: EASE.expo, delay: 0.08 + i * 0.1 }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
              <span className="block overflow-hidden pb-[0.12em]">
                <motion.span
                  className="block"
                  initial={{ y: reduce ? 0 : "100%", opacity: reduce ? 1 : 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, ease: EASE.expo, delay: 0.28 }}
                >
                  <span className="font-accent italic text-gradient-hero">We already run it.</span>
                </motion.span>
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE.expo, delay: 0.42 }}
              className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              Every candidate screened by AI. Every résumé read in depth. Every interview scored on ten-plus
              dimensions. Whether you hire one person or a thousand, the quality never drops.
            </motion.p>

            {/* ── CTAs ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE.expo, delay: 0.52 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              {isAuthenticated ? (
                <Magnetic strength={9}>
                  <Button asChild variant="hero" size="xl" pill className="w-full sm:w-auto">
                    <Link to={dashboardPath}>
                      <LayoutDashboard className="h-4 w-4" />
                      Go to dashboard
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </Link>
                  </Button>
                </Magnetic>
              ) : (
                <>
                  <Magnetic strength={9}>
                    <Button
                      variant="hero"
                      size="xl"
                      pill
                      onClick={() => setDemoOpen(true)}
                      className="w-full sm:w-auto"
                      iconRight={
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                      }
                    >
                      Request a demo
                    </Button>
                  </Magnetic>
                  <Button asChild variant="outline" size="xl" pill className="w-full sm:w-auto">
                    <Link to="/features">
                      <Play className="h-3.5 w-3.5" />
                      See how it works
                    </Link>
                  </Button>
                </>
              )}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-7 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70"
            >
              Trusted across banking · technology · operations · enterprise
            </motion.p>
          </div>

          {/* ── Right: the 3D talent core ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: EASE.expo, delay: 0.15 }}
            className="relative -mx-6 h-[340px] sm:mx-0 sm:h-[440px] lg:h-[560px]"
          >
            <Scene3D className="absolute inset-0" />

            {/* Floating read-outs anchor the abstract object to real product data */}
            <FloatingChip
              className="left-2 top-8 sm:left-6 lg:left-0"
              delay={1.0}
              label="Match score"
              value="94"
              tone="success"
            />
            <FloatingChip
              className="bottom-12 right-2 sm:right-6 lg:right-2"
              delay={1.2}
              label="Screened today"
              value="1,284"
              tone="cyan"
            />
          </motion.div>
        </div>

        {/* ── Metric strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE.expo, delay: 0.6 }}
          className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-xl)] border border-border/70 bg-border/60 shadow-sm lg:mt-16 lg:grid-cols-4"
        >
          {METRICS.map((m) => (
            <div
              key={m.label}
              className="group bg-surface px-5 py-6 transition-colors duration-300 hover:bg-surface-2 sm:px-6"
            >
              <p className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                <AnimatedNumber value={m.value} suffix={m.suffix} decimals={m.decimals ?? 0} />
              </p>
              <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {m.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>

      <BookDemoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </section>
  );
};

function FloatingChip({
  className,
  delay,
  label,
  value,
  tone,
}: {
  className?: string;
  delay: number;
  label: string;
  value: string;
  tone: "success" | "cyan";
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: EASE.expo, delay }}
      className={`glass absolute z-10 rounded-[var(--radius-lg)] px-3.5 py-2.5 shadow-lg ${
        reduce ? "" : "animate-float-y"
      } ${className ?? ""}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p
        className={`font-display text-xl font-semibold tabular-nums ${
          tone === "success" ? "text-success" : "text-brand-cyan"
        }`}
      >
        {value}
      </p>
    </motion.div>
  );
}

export default HeroSection;
