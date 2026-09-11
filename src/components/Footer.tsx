import { ArrowRight, Github, Linkedin, Mail, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";
import { BRAND } from "@/lib/brand";

/* ══════════════════════════════════════════════════════════════════════════
   FOOTER
   Opens with a closing CTA panel (the old footer had none, so the page just
   stopped), then the link columns on the normal page surface rather than an
   inverted slab that fought the rest of the design.
   ══════════════════════════════════════════════════════════════════════════ */

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", to: "/features" },
      { label: "Pipeline", to: "/#pipeline" },
      { label: "Analytics", to: "/#analytics" },
      { label: "Pricing", to: "/features#pricing" },
    ],
  },
  {
    title: "For candidates",
    links: [
      { label: "Browse jobs", to: "/candidate/jobs" },
      { label: "Companies", to: "/candidate/companies" },
      { label: "Careers", to: "/careers/" },
      { label: "Create profile", to: "/signup" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Log in", to: "/login" },
      { label: "Get started", to: "/signup" },
      { label: "Privacy policy", to: "/privacy" },
    ],
  },
];

const SOCIALS = [
  { label: "Twitter", href: BRAND.social.twitter, icon: Twitter },
  { label: "LinkedIn", href: BRAND.social.linkedin, icon: Linkedin },
  { label: "GitHub", href: BRAND.social.github, icon: Github },
  { label: "Email", href: `mailto:${BRAND.email.general}`, icon: Mail },
];

const Footer = () => (
  <footer className="relative overflow-hidden border-t border-border/60 pt-20 sm:pt-24">
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-aurora opacity-70" />

    <div className="container mx-auto">
      {/* ── Closing CTA ── */}
      <Reveal>
        <div className="ring-gradient relative overflow-hidden rounded-[var(--radius-2xl)] border border-border/60 bg-gradient-card px-6 py-12 text-center shadow-lg sm:px-12 sm:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[36rem] max-w-[120%] -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]"
          />

          <h2 className="relative mx-auto max-w-2xl text-display-md font-semibold text-foreground">
            Stop reading résumés.{" "}
            <span className="font-accent italic text-gradient-hero">Start meeting finalists.</span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
            Set up your first pipeline in under ten minutes. No card required to try it.
          </p>

          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Magnetic strength={8}>
              <Button asChild variant="hero" size="xl" pill className="w-full sm:w-auto">
                <Link to="/signup">
                  Get started free
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Link>
              </Button>
            </Magnetic>
            <Button asChild variant="outline" size="xl" pill className="w-full sm:w-auto">
              <Link to="/features">Explore the platform</Link>
            </Button>
          </div>
        </div>
      </Reveal>

      {/* ── Link columns ── */}
      <div className="mt-16 grid gap-10 pb-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Link to="/" className="inline-block no-underline">
            <Logo size="lg" />
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
            AI-native recruitment: parse, score, screen and interview every candidate with the same rigour,
            at any volume.
          </p>

          <div className="mt-6 flex gap-1.5">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={s.label}
                data-tap
                className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-border/70 text-muted-foreground transition-all duration-300 ease-expo hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/8 hover:text-primary"
              >
                <s.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="group inline-flex items-center gap-1 text-sm text-muted-foreground no-underline transition-colors duration-200 hover:text-foreground"
                  >
                    {l.label}
                    <ArrowRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* ── Legal bar ── */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 py-7 sm:flex-row">
        <p className="font-mono text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link to="/privacy" className="text-xs text-muted-foreground no-underline hover:text-foreground">
            Privacy
          </Link>
          <Link to="/privacy" className="text-xs text-muted-foreground no-underline hover:text-foreground">
            Terms
          </Link>
          <Link to="/privacy" className="text-xs text-muted-foreground no-underline hover:text-foreground">
            Cookies
          </Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
