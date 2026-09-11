import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowRight, LayoutDashboard, Menu, Moon, Sun, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/motion/Magnetic";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   MARKETING HEADER
   A floating glass command bar rather than a full-width band: it detaches from
   the top edge on scroll, so the page reads as content moving underneath a
   persistent control surface.
   ══════════════════════════════════════════════════════════════════════════ */

interface NavItem {
  label: string;
  /** Section id on the landing page, or a route. */
  to?: string;
  section?: string;
  page?: string;
}

const NAV: NavItem[] = [
  { label: "Features", to: "/features" },
  { label: "Pipeline", section: "pipeline" },
  { label: "Analytics", section: "analytics" },
  { label: "Pricing", page: "/features", section: "pricing" },
];

const Header = () => {
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated, userType } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  // Lock the page behind the mobile sheet.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const dashboardPath =
    userType === "admin" ? "/admin" : userType === "candidate" ? "/candidate/dashboard" : "/dashboard";

  const scrollToSection = (id: string, page = "/") => {
    setMobileOpen(false);
    const go = () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (location.pathname === page) {
      go();
    } else {
      navigate(page);
      window.setTimeout(go, 320);
    }
  };

  const handleNav = (item: NavItem) => {
    if (item.to) {
      setMobileOpen(false);
      navigate(item.to);
      return;
    }
    scrollToSection(item.section!, item.page ?? "/");
  };

  const isActive = (item: NavItem) => item.to != null && location.pathname === item.to;

  return (
    <>
      {/* Skip link — the first stop for keyboard users */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[var(--radius-md)] focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4"
      >
        <div
          className={cn(
            "container mx-auto flex items-center justify-between gap-3 rounded-[var(--radius-xl)] px-3 py-2.5 sm:px-4",
            "transition-all duration-500 ease-expo",
            scrolled
              ? "glass border-border/60 shadow-lg"
              : "border border-transparent bg-transparent shadow-none"
          )}
        >
          <Link to="/" className="shrink-0 no-underline" aria-label="Hyre — home">
            <Logo />
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main">
            {NAV.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNav(item)}
                className={cn(
                  "relative rounded-[var(--radius-sm)] px-3.5 py-2 text-[13px] font-medium transition-colors duration-200",
                  isActive(item) ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive(item) && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 -z-10 rounded-[var(--radius-sm)] bg-secondary"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                {item.label}
              </button>
            ))}
          </nav>

          {/* ── Actions ── */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              className="relative overflow-hidden"
              data-compact
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isDark ? "sun" : "moon"}
                  initial={{ y: 14, opacity: 0, rotate: -60 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: -14, opacity: 0, rotate: 60 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  className="flex"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </motion.span>
              </AnimatePresence>
            </Button>

            {isAuthenticated ? (
              <Magnetic strength={6} className="hidden sm:inline-flex">
                <Button asChild variant="hero" size="sm" pill>
                  <Link to={dashboardPath}>
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
              </Magnetic>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link to="/login">Log in</Link>
                </Button>
                <Magnetic strength={6} className="hidden sm:inline-flex">
                  <Button asChild variant="hero" size="sm" pill>
                    <Link to="/signup">
                      Get started
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </Magnetic>
              </>
            )}

            <Button
              variant="outline"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              data-compact
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </motion.header>

      {/* ── Mobile sheet — full-height, thumb-reachable, staggered in ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <button
              className="absolute inset-0 h-full w-full bg-[hsl(250_40%_6%/0.6)] backdrop-blur-md"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              tabIndex={-1}
            />

            <motion.nav
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="glass-strong absolute inset-x-0 top-0 rounded-b-[var(--radius-2xl)] px-5 pb-8 pt-24 shadow-xl"
              aria-label="Mobile"
            >
              <motion.ul
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } } }}
                className="space-y-1"
              >
                {NAV.map((item) => (
                  <motion.li
                    key={item.label}
                    variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }}
                  >
                    <button
                      onClick={() => handleNav(item)}
                      className="flex w-full items-center justify-between rounded-[var(--radius-md)] px-4 py-3.5 text-left font-display text-lg font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                      {item.label}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </motion.li>
                ))}
              </motion.ul>

              <div className="mt-6 grid gap-2.5 border-t border-border/70 pt-6">
                {isAuthenticated ? (
                  <Button asChild variant="hero" size="lg">
                    <Link to={dashboardPath}>
                      <LayoutDashboard className="h-4 w-4" />
                      Go to dashboard
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="hero" size="lg">
                      <Link to="/signup">
                        Get started free
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link to="/login">Log in</Link>
                    </Button>
                  </>
                )}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
