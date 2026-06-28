import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Bell, Search, Plus, Settings, User as UserIcon, LogOut, Clock } from "lucide-react";
import CommandPalette from "@/components/CommandPalette";
import { useUnreadNotificationCount } from "@/hooks/useApiQuery";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/useApiQuery";
import socketService from "@/services/socket.service";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  lastUpdated?: Date | null;
  onNotificationClick?: () => void; // optional — Dashboard.tsx se pass hota hai
}

/**
 * Formats a Date into a human-readable relative time string.
 * Returns strings like "Updated just now", "Updated 2 minutes ago", "Updated 1 hour ago", etc.
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) {
    return "Updated just now";
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `Updated ${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Updated ${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `Updated ${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
}

const DashboardHeader = ({ title, subtitle, action, lastUpdated, onNotificationClick }: DashboardHeaderProps) => {
  const { user } = useCompany();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { data: unreadData } = useUnreadNotificationCount();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [realtimeUnreadBoost, setRealtimeUnreadBoost] = useState(0);

  const polledUnreadCount = unreadData?.count ?? unreadData?.unreadCount ?? 0;
  const unreadCount = polledUnreadCount + realtimeUnreadBoost;

  // Reset the realtime boost when polled data refreshes (it already includes the new notifications)
  useEffect(() => {
    setRealtimeUnreadBoost(0);
  }, [polledUnreadCount]);

  // Listen for real-time new_notification WebSocket events
  useEffect(() => {
    const handleNewNotification = () => {
      // Immediately increment the badge count
      setRealtimeUnreadBoost((prev) => prev + 1);
      // Also invalidate the query so polling picks up the new count
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotificationCount });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    };

    socketService.connect();
    socketService.on('new_notification', handleNewNotification);

    return () => {
      socketService.off('new_notification', handleNewNotification);
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

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div>
      <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="h-8 w-8" />
        
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{title}</h1>
            {lastUpdated && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(lastUpdated)}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <Button variant="outline" size="sm" className="hidden md:flex" onClick={() => setCommandPaletteOpen(true)}>
          <Search className="w-4 h-4 mr-2" />
          Search
          <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </Button>

        {/* Command Palette */}
        <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />

        {/* Action Button */}
        {action || (
          <Button variant="default" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        )}

        {/* ── Notifications Bell — clicks to /dashboard/notifications ── */}
        <Link to="/dashboard/notifications" className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNotificationClick}
          >
            <Bell className="w-4 h-4" />
          </Button>
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs pointer-events-none"
            >
              {unreadCount}
            </Badge>
          )}
        </Link>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || 'No email'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {!(user as any)?.invitedByUserId && (
              <Link to="/dashboard/profile">
                <DropdownMenuItem>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
            )}
            <Link to="/dashboard/settings">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </Link>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>


    </div>
  );
};

export default DashboardHeader;