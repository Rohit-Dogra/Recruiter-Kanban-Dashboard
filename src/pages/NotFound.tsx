import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Compass, Home, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { EASE } from "@/lib/motion";

const SUGGESTIONS = [
  { label: "Recruiter dashboard", to: "/dashboard" },
  { label: "Browse jobs", to: "/candidate/jobs" },
  { label: "Product features", to: "/features" },
];

/**
 * 404. The old version was an unstyled grey page with a bare link; this one
 * stays inside the design system and, more usefully, offers somewhere to go.
 */
const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-5 py-16 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-aurora" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid mask-fade-y opacity-50" />

      <Link to="/" className="absolute left-5 top-5 no-underline sm:left-8 sm:top-8">
        <Logo size="sm" />
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE.expo }}
        className="relative"
      >
        <span className="absolute inset-0 -z-10 blur-3xl" aria-hidden>
          <span className="block h-full w-full rounded-full bg-primary/25" />
        </span>
        <p className="font-display text-[clamp(5rem,22vw,11rem)] font-semibold leading-none tracking-tighter text-gradient-hero">
          404
        </p>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE.expo, delay: 0.12 }}
        className="mt-2 text-display-sm font-semibold text-foreground"
      >
        This page isn't in the pipeline.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE.expo, delay: 0.2 }}
        className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground"
      >
        We couldn't find{" "}
        <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">
          {location.pathname}
        </code>
        . It may have been moved, or the link might be out of date.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE.expo, delay: 0.28 }}
        className="mt-8 flex flex-col gap-2.5 sm:flex-row"
      >
        <Button variant="hero" size="lg" pill onClick={() => navigate(-1)} icon={<ArrowLeft className="h-4 w-4" />}>
          Go back
        </Button>
        <Button asChild variant="outline" size="lg" pill>
          <Link to="/">
            <Home className="h-4 w-4" />
            Home
          </Link>
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-10 w-full max-w-sm rounded-[var(--radius-xl)] border border-border/70 bg-surface/70 p-4 backdrop-blur-sm"
      >
        <p className="flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <Compass className="h-3 w-3" />
          Try one of these
        </p>
        <ul className="mt-3 space-y-1">
          {SUGGESTIONS.map((s) => (
            <li key={s.to}>
              <Link
                to={s.to}
                className="group flex items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-sm text-foreground no-underline transition-colors hover:bg-secondary"
              >
                {s.label}
                <Search className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
};

export default NotFound;
