import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Reveal } from "@/components/motion/Reveal";
import { BRAND } from "@/lib/brand";

/* A long-form legal page benefits from a reading rail: the section list lets
   people jump straight to the clause they came for. */
const SECTIONS = [
  {
    id: "collect",
    title: "Information we collect",
    body: "We collect information you provide directly to us, such as when you create an account, post a job, apply for a position, or contact us for support.",
  },
  {
    id: "use",
    title: "How we use your information",
    body: "We use the information we collect to provide, maintain and improve our services, process transactions, and communicate with you about your account.",
  },
  {
    id: "sharing",
    title: "Information sharing",
    body: "We do not sell, trade or otherwise transfer your personal information to third parties without your consent, except as described in this policy.",
  },
  {
    id: "security",
    title: "Data security",
    body: "We implement appropriate technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure or destruction.",
  },
  {
    id: "contact",
    title: "Contact us",
    body: `If you have any questions about this privacy policy, write to us at ${BRAND.email.privacy} and we'll respond within five working days.`,
  },
];

const Privacy = () => {
  const updated = useMemo(
    () => new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
    []
  );

  return (
    <div className="min-h-svh bg-background">
      <Header />

      <main id="main" className="relative overflow-hidden pb-20 pt-32 sm:pt-36">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-aurora opacity-70" />

        <div className="container mx-auto max-w-5xl">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>

          <div className="mt-6 flex items-start gap-4">
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-primary/10 text-primary sm:flex">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-display-md font-semibold text-foreground">Privacy policy</h1>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Last updated {updated}
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
            {/* Reading rail */}
            <nav aria-label="Sections" className="lg:sticky lg:top-28 lg:self-start">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">On this page</p>
              <ul className="mt-3 space-y-1">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="block rounded-[var(--radius-sm)] px-3 py-1.5 text-[13px] text-muted-foreground no-underline transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Clauses */}
            <div className="space-y-4">
              {SECTIONS.map((s, i) => (
                <Reveal key={s.id} delay={i * 0.05}>
                  <section id={s.id} className="surface-card scroll-mt-28 p-6 sm:p-7">
                    <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">{s.title}</h2>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
                  </section>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
