import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { Link } from "react-router-dom";

import { Logo } from "@/components/brand/Logo";
import { EASE } from "@/lib/motion";

/* ══════════════════════════════════════════════════════════════════════════
   AUTH LAYOUT
   Split canvas: a dark brand panel carrying proof points on the left, the form
   on a clean surface at the right. On mobile the brand panel collapses to a
   compact header so the form is above the fold instead of below a hero.
   ══════════════════════════════════════════════════════════════════════════ */

const PROOF = [
  "Every résumé parsed and scored automatically",
  "AI screening calls and technical interviews",
  "Offers, e-signature and onboarding in one place",
];

interface AuthLayoutProps {
  children: ReactNode;
  /** Optional override for the brand panel headline. */
  headline?: string;
}

const AuthLayout = ({ children, headline = "Hire the right person, faster." }: AuthLayoutProps) => (
  <div className="flex min-h-svh flex-col lg:flex-row">
    {/* ── Brand panel ── */}
    <aside className="relative isolate overflow-hidden bg-[hsl(252_30%_8%)] px-5 py-6 text-white lg:flex lg:w-[44%] lg:max-w-[620px] lg:flex-col lg:justify-between lg:px-12 lg:py-12">
      {/* Ambient layers */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(70%_60%_at_20%_0%,hsl(262_92%_60%/0.35),transparent_65%),radial-gradient(60%_60%_at_90%_100%,hsl(190_95%_50%/0.22),transparent_65%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:56px_56px]"
      />

      <div className="flex items-center justify-between gap-4">
        <Link to="/" className="no-underline [&_*]:!text-white" aria-label="Hyre — home">
          <Logo size="md" />
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 no-underline backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white lg:hidden"
        >
          <ArrowLeft className="h-3 w-3" />
          Home
        </Link>
      </div>

      {/* Desktop-only pitch */}
      <div className="hidden lg:block">
        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE.expo }}
          className="max-w-sm font-display text-4xl font-semibold leading-[1.1] tracking-tight"
        >
          {headline.split(" ").slice(0, -1).join(" ")}{" "}
          <span className="font-accent italic text-[hsl(272_96%_80%)]">
            {headline.split(" ").slice(-1)}
          </span>
        </motion.h2>

        <ul className="mt-8 space-y-3.5">
          {PROOF.map((line, i) => (
            <motion.li
              key={line}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: EASE.expo, delay: 0.15 + i * 0.09 }}
              className="flex items-start gap-3 text-sm text-white/70"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[hsl(262_92%_68%/0.2)] text-[hsl(272_96%_82%)]">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              {line}
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Desktop-only footer proof */}
      <div className="hidden items-center gap-6 lg:flex">
        {[
          { value: "95%", label: "Match accuracy" },
          { value: "3.5×", label: "Faster hiring" },
          { value: "10K+", label: "Résumés screened" },
        ].map((m) => (
          <div key={m.label}>
            <p className="font-display text-xl font-semibold">{m.value}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Mobile-only one-liner */}
      <p className="mt-2 text-sm text-white/60 lg:hidden">AI-powered recruitment, end to end.</p>
    </aside>

    {/* ── Form panel ── */}
    <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE.expo, delay: 0.1 }}
        className="w-full max-w-md"
      >
        <Link
          to="/"
          className="mb-6 hidden items-center gap-1.5 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground lg:inline-flex"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
        {children}
      </motion.div>
    </main>
  </div>
);

export default AuthLayout;
