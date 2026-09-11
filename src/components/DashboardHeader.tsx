import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Clock, LogOut, Menu, Moon, Plus, Search, Settings, Sun, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

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
import CommandPalette from "@/components/CommandPalette";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useShell } from "@/components/dashboard/ShellContext";
import { queryKeys, useUnreadNotificationCount } from "@/hooks/useApiQuery";
import socketService from "@/services/socket.service";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  lastUpdated?: Date | null;
  /** Optional side-effect when the bell is clicked. */
  onNotificationClick?: () => void;
}

/**
 * Formats a Date into a human-readable relative time string.
 * Returns strings like "Updated just now", "Updated 2 minutes ago", etc.
 */
export function formatRelativeTime(date: Date): string {
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffSeconds < 60) return "Updated just now";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `Updated ${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Updated ${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `Updated ${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
}

/**
 * Sticky page header rendered by each dashboard route. Props are unchanged from
 * the previous implementation so every page keeps working; the chrome around
 * them is new — glass surface, live search affordance, theme control, and a
 * mobile layout that puts the primary action on its own full-width row instead
 * of squeezing it into the bar.
 */
const DashboardHeader = ({ title, subtitle, action, lastUpdated, onNotificationClick }: DashboardHeaderProps) => {
  const { user } = useCompany();
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { setMobileNavOpen } = useShell();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [realtimeUnreadBoost, setRealtimeUnreadBoost] = useState(0);

  const { data: unreadData } = useUnreadNotificationCount();
  const polledUnreadCount = unreadData?.count ?? unreadData?.unreadCount ?? 0;
  const unreadCount = polledUnreadCount + realtimeUnreadBoost;

  // Reset the realtime boost when polled data refreshes (it already includes the new notifications)
  useEffect(() => {
    setRealtimeUnreadBoost(0);
  }, [polledUnreadCount]);

  // Listen for real-time new_notification WebSocket events
  useEffect(() => {
    const handleNewNotification = () => {
      setRealtimeUnreadBoost((prev) => prev + 1);
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotificationCount });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    };

    socketService.connect();
    socketService.on("new_notification", handleNewNotification);

    return () => {
      socketService.off("new_notification", handleNewNotification);
    };
  }, [queryClient]);

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <>
      <header className="sticky top-0 z-30 -mx-4 mb-6 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:-mx-6 md:px-6">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* ── Identity ── */}
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0 lg:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              data-compact
            >
              <Menu className="h-4.5 w-4.5" />
            </Button>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="truncate font-display text-[17px] font-semibold tracking-tight text-foreground sm:text-xl">
                  {title}
                </h1>
                {lastUpdated && (
                  <span className="hidden shrink-0 items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground lg:inline-flex">
                    <Clock className="h-2.5 w-2.5" />
                    {formatRelativeTime(lastUpdated)}
                  </span>
                )}
              </div>
              {subtitle && <p className="truncate text-[13px] text-muted-foreground">{subtitle}</p>}
            </div>
          </div>

          {/* ── Controls ── */}
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Search: a real affordance on desktop, an icon on mobile */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className={cn(
                "hidden items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface-2/60 py-2 pl-3 pr-2 text-sm text-muted-foreground md:flex",
                "transition-colors duration-200 hover:border-border-strong hover:bg-surface-2 hover:text-foreground"
              )}
            >
              <Search className="h-4 w-4" />
              <span className="mr-6">Search…</span>
              <kbd className="pointer-events-none rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </button>

            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setCommandPaletteOpen(true)}
              aria-label="Search"
              data-compact
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Theme lives in the account menu on phones — the bar is too tight
                for five controls next to a page title. */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="hidden sm:inline-flex"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              data-compact
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isDark ? "sun" : "moon"}
                  initial={{ y: 12, opacity: 0, rotate: -50 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: -12, opacity: 0, rotate: 50 }}
                  transition={{ duration: 0.22 }}
                  className="flex"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </motion.span>
              </AnimatePresence>
            </Button>

            <Button
              asChild
              variant="ghost"
              size="icon-sm"
              className="relative"
              onClick={onNotificationClick}
              data-compact
            >
              <Link to="/dashboard/notifications" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}>
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold tabular-nums text-destructive-foreground ring-2 ring-background">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </Button>

            {/* Primary action — collapses off the bar on small screens */}
            <div className="hidden sm:block">
              {action ?? (
                <Button variant="hero" size="sm" icon={<Plus className="h-4 w-4" />}>
                  Add new
                </Button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="ml-0.5 rounded-full ring-offset-background transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Account menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-60" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium leading-tight">
                        {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "User"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{user?.email || "No email"}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {!(user as { invitedByUserId?: number } | null)?.invitedByUserId && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/profile">
                      <UserIcon />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings">
                    <Settings />
                    Settings
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={toggleTheme} className="sm:hidden">
                  {isDark ? <Sun /> : <Moon />}
                  {isDark ? "Light theme" : "Dark theme"}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile action row — full-width tap target below the bar */}
        {action && <div className="flex gap-2 pb-3 [&>*]:flex-1 sm:hidden">{action}</div>}
      </header>

      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </>
  );
};

export default DashboardHeader;
