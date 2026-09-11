import * as React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, ChevronsLeft, LogOut, PanelLeft, Sparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useShell } from "@/components/dashboard/ShellContext";
import { getNavGroups, type NavItem } from "@/components/dashboard/nav-config";
import type { Company } from "@/services/company.service";

/* ══════════════════════════════════════════════════════════════════════════
   RECRUITER RAIL
   A single navigation component rendered two ways: a persistent, collapsible
   rail on desktop and a slide-over drawer on mobile. The active item carries a
   shared layout pill so moving between sections animates instead of jumping.
   ══════════════════════════════════════════════════════════════════════════ */

function isCompanyProfileComplete(company: Company | null): boolean {
  if (!company) return false;
  return Boolean(company.name && company.industry && company.description && company.size && company.location);
}

function NavRow({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const active = item.end
    ? location.pathname === item.url
    : location.pathname === item.url || location.pathname.startsWith(`${item.url}/`);

  const row = (
    <NavLink
      to={item.url}
      end={item.end}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm no-underline",
        "transition-colors duration-200",
        collapsed && "justify-center px-0",
        active ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/75 hover:text-sidebar-foreground"
      )}
      aria-current={active ? "page" : undefined}
    >
      {active && (
        <motion.span
          layoutId="rail-active"
          className="absolute inset-0 -z-10 rounded-[var(--radius-md)] bg-sidebar-accent"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}

      {/* Left edge marker — reads as "you are here" even when collapsed */}
      {active && (
        <span className="absolute -left-2 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-sidebar-primary" />
      )}

      <item.icon
        className={cn(
          "h-4.5 w-4.5 shrink-0 transition-transform duration-200",
          active ? "text-sidebar-primary" : "text-sidebar-foreground/55 group-hover:text-sidebar-foreground",
          !collapsed && "group-hover:scale-110"
        )}
      />

      {!collapsed && <span className="truncate font-medium">{item.title}</span>}
    </NavLink>
  );

  if (!collapsed) return row;

  return (
    <Tooltip delayDuration={80}>
      <TooltipTrigger asChild>{row}</TooltipTrigger>
      <TooltipContent side="right">{item.title}</TooltipContent>
    </Tooltip>
  );
}

function RailBody({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { company } = useCompany();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toggleCollapsed } = useShell();

  const groups = React.useMemo(() => getNavGroups(!!user?.invitedByUserId), [user?.invitedByUserId]);
  const profileComplete = isCompanyProfileComplete(company);

  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user?.email?.[0]?.toUpperCase() || "U";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* ── Workspace identity ── */}
      <div className={cn("flex items-center gap-2 px-3 py-4", collapsed && "justify-center px-0")}>
        {collapsed ? (
          <Logo compact size="sm" />
        ) : (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <Logo compact size="sm" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-sidebar-foreground">
                    {company?.name || "Hyre"}
                  </p>
                  {profileComplete && (
                    <BadgeCheck
                      className="h-3.5 w-3.5 shrink-0 text-sidebar-primary"
                      aria-label="Verified company profile"
                    />
                  )}
                </div>
                <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/50">
                  {company?.industry || "AI Recruitment"}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleCollapsed}
              className="hidden shrink-0 text-sidebar-foreground/60 hover:text-sidebar-foreground lg:inline-flex"
              aria-label="Collapse sidebar"
              data-compact
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4" aria-label="Dashboard">
        {groups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-1.5 px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/40">
                {group.label}
              </p>
            )}
            {collapsed && <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" />}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavRow key={item.url} item={item} collapsed={collapsed} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Upgrade nudge — hidden for invited seats, who cannot buy ── */}
      {!collapsed && !user?.invitedByUserId && (
        <div className="mx-3 mb-3 overflow-hidden rounded-[var(--radius-lg)] border border-sidebar-border bg-gradient-to-br from-primary/12 to-transparent p-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-sidebar-primary" />
            <p className="text-xs font-medium text-sidebar-foreground">Unlock AI screening</p>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-sidebar-foreground/60">
            Add AI calls and video interviews to every pipeline stage.
          </p>
          <Button
            variant="hero"
            size="xs"
            className="mt-2.5 w-full"
            onClick={() => {
              onNavigate?.();
              navigate("/dashboard/subscription");
            }}
          >
            View plans
          </Button>
        </div>
      )}

      {/* ── Account ── */}
      <div className={cn("border-t border-sidebar-border p-3", collapsed && "px-2")}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <Tooltip delayDuration={80}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleLogout}
                  className="text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Sign out"
                  data-compact
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-sidebar-foreground">
                {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "User"}
              </p>
              <p className="truncate text-[11px] text-sidebar-foreground/50">{user?.email || "No email"}</p>
            </div>
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
        )}
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const { collapsed, setCollapsed, mobileNavOpen, setMobileNavOpen } = useShell();
  const location = useLocation();

  // Close the drawer whenever navigation happens.
  React.useEffect(() => setMobileNavOpen(false), [location.pathname, setMobileNavOpen]);

  React.useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  return (
    <>
      {/* ── Desktop rail ── */}
      <aside
        className={cn(
          "sticky top-0 z-30 hidden h-svh shrink-0 border-r border-sidebar-border lg:block",
          "transition-[width] duration-300 ease-expo",
          collapsed ? "w-[68px]" : "w-[264px]"
        )}
      >
        <RailBody collapsed={collapsed} />

        {/* Expand affordance, only when collapsed */}
        {collapsed && (
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCollapsed(false)}
            className="absolute -right-3 top-5 z-10 rounded-full shadow-md"
            aria-label="Expand sidebar"
            data-compact
          >
            <PanelLeft className="h-3.5 w-3.5" />
          </Button>
        )}
      </aside>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileNavOpen && (
          <div className="lg:hidden">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
              className="fixed inset-0 z-40 bg-[hsl(250_40%_6%/0.6)] backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 36 }}
              className="fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[300px] border-r border-sidebar-border shadow-xl"
              role="dialog"
              aria-label="Navigation"
            >
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMobileNavOpen(false)}
                className="absolute right-3 top-4 z-10"
                aria-label="Close navigation"
                data-compact
              >
                <X className="h-4 w-4" />
              </Button>
              <RailBody collapsed={false} onNavigate={() => setMobileNavOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default DashboardSidebar;
