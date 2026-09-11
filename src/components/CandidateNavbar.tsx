import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Briefcase,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  User,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { notificationService } from "@/services/notification.service";
import { cn } from "@/lib/utils";

interface CandidateData {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface CandidateNavbarProps {
  candidate?: CandidateData | null;
}

const NAV_LINKS = [
  { to: "/candidate/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/candidate/jobs", label: "Find jobs", icon: Search },
  { to: "/candidate/companies", label: "Companies", icon: Building2 },
  { to: "/candidate/applications", label: "Applications", icon: Briefcase },
];

/**
 * Candidate-facing top navigation. Sticky glass bar on desktop; on mobile the
 * links move into a full-height sheet so tap targets are comfortable instead of
 * a cramped inline row.
 */
const CandidateNavbar = ({ candidate }: CandidateNavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!candidate?.email) return;

    const fetchUnreadCount = async () => {
      try {
        const notifications = await notificationService.getCandidateNotifications(candidate.email!);
        setUnreadCount(notifications.filter((n: { read?: boolean }) => !n.read).length);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [candidate]);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const initials =
    candidate?.firstName && candidate?.lastName
      ? `${candidate.firstName[0]}${candidate.lastName[0]}`
      : candidate?.email?.[0]?.toUpperCase() || "U";

  const fullName =
    candidate?.firstName && candidate?.lastName
      ? `${candidate.firstName} ${candidate.lastName}`
      : candidate?.email || "Candidate";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/candidate/dashboard" className="shrink-0 no-underline" aria-label="Hyre">
            <Logo tagline={null} size="sm" />
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Candidate">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "relative rounded-[var(--radius-sm)] px-3.5 py-2 text-[13px] font-medium no-underline transition-colors duration-200",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="candidate-nav"
                      className="absolute inset-0 -z-10 rounded-[var(--radius-sm)] bg-secondary"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* ── Actions ── */}
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              data-compact
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button asChild variant="ghost" size="icon-sm" className="relative" data-compact>
              <Link
                to="/candidate/notifications"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold tabular-nums text-destructive-foreground ring-2 ring-background">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="hidden rounded-full transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:block"
                  aria-label="Account menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="truncate text-sm font-medium">{fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{candidate?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/candidate/profile">
                    <User />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/candidate/resume">
                    <FileText />
                    Résumé
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              data-compact
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* ── Mobile sheet ── */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute inset-0 bg-[hsl(250_40%_6%/0.6)] backdrop-blur-md"
            />
            <motion.nav
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ type: "spring", stiffness: 330, damping: 34 }}
              className="glass-strong absolute inset-x-0 top-0 rounded-b-[var(--radius-2xl)] px-4 pb-6 pt-20 shadow-xl"
              aria-label="Mobile"
            >
              <div className="mb-4 flex items-center gap-3 rounded-[var(--radius-lg)] border border-border/60 bg-surface-2/60 p-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{candidate?.email}</p>
                </div>
              </div>

              <ul className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      data-tap
                      className={cn(
                        "flex items-center gap-3 rounded-[var(--radius-md)] px-3.5 py-3 text-[15px] font-medium no-underline transition-colors",
                        isActive(link.to)
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-secondary"
                      )}
                    >
                      <link.icon className="h-4.5 w-4.5" />
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to="/candidate/profile"
                    data-tap
                    className="flex items-center gap-3 rounded-[var(--radius-md)] px-3.5 py-3 text-[15px] font-medium text-foreground no-underline transition-colors hover:bg-secondary"
                  >
                    <User className="h-4.5 w-4.5" />
                    Profile
                  </Link>
                </li>
                <li>
                  <Link
                    to="/candidate/resume"
                    data-tap
                    className="flex items-center gap-3 rounded-[var(--radius-md)] px-3.5 py-3 text-[15px] font-medium text-foreground no-underline transition-colors hover:bg-secondary"
                  >
                    <FileText className="h-4.5 w-4.5" />
                    Résumé
                  </Link>
                </li>
              </ul>

              <Button variant="outline" size="lg" className="mt-4 w-full" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </motion.nav>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CandidateNavbar;
