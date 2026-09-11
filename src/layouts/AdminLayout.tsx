import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Shield,
  Sun,
  Users,
  Briefcase,
  X,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import LoadingScreen from "@/components/LoadingScreen";
import { PageTransition } from "@/components/motion/PageTransition";
import { cn } from "@/lib/utils";

interface AdminNavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_GROUPS: { label: string; items: AdminNavItem[] }[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true }],
  },
  {
    label: "Management",
    items: [
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "Jobs", url: "/admin/jobs", icon: Briefcase },
      { title: "Applications", url: "/admin/applications", icon: FileText },
      { title: "Companies", url: "/admin/companies", icon: Building2 },
      { title: "Interviews", url: "/admin/interviews", icon: Calendar },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Payments", url: "/admin/payments", icon: DollarSign },
      { title: "Plans", url: "/admin/plans", icon: CreditCard },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Broadcast", url: "/admin/broadcast", icon: Bell },
      { title: "Demo bookings", url: "/admin/demo-bookings", icon: Calendar },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   ADMIN CONSOLE SHELL
   Deliberately distinct from the recruiter workspace — a red-tinted operator
   badge and a darker rail — so it is never ambiguous which surface you are
   acting on. Adds the mobile drawer the console previously lacked entirely.
   ══════════════════════════════════════════════════════════════════════════ */

const AdminLayout = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  if (isLoading) return <LoadingScreen message="Verifying access" />;
  if (!isAuthenticated) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  if ((user as { userType?: string } | null)?.userType !== "admin") return <Navigate to="/dashboard" replace />;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initials = user?.email?.[0]?.toUpperCase() || "A";

  const Rail = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-4 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-destructive/12 text-destructive ring-1 ring-inset ring-destructive/20">
          <Shield className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">Admin console</p>
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-destructive/70">
            Elevated access
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-3" aria-label="Admin">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/40">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.url}
                  to={item.url}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm no-underline transition-colors duration-200",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute -left-2 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-destructive" />
                      )}
                      <item.icon
                        className={cn(
                          "h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                          isActive ? "text-destructive" : "text-sidebar-foreground/55"
                        )}
                      />
                      <span className="truncate font-medium">{item.title}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-sidebar-border p-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-destructive/12 text-destructive">{initials}</AvatarFallback>
        </Avatar>
        <p className="min-w-0 flex-1 truncate text-[12px] text-sidebar-foreground/70">{user?.email}</p>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleLogout}
          className="shrink-0 text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive"
          aria-label="Sign out"
          data-compact
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-svh w-full bg-background">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-svh w-[260px] shrink-0 border-r border-sidebar-border lg:block">
        <Rail />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="fixed inset-0 z-40 bg-[hsl(250_40%_6%/0.6)] backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 36 }}
              className="fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[290px] border-r border-sidebar-border shadow-xl"
              role="dialog"
              aria-label="Admin navigation"
            >
              <Rail onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border/60 bg-background/85 px-3 backdrop-blur-xl lg:hidden">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              data-compact
            >
              <Menu className="h-4.5 w-4.5" />
            </Button>
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <Shield className="h-4 w-4 text-destructive" />
              Admin
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            data-compact
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>

        <main className="min-w-0 flex-1">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
