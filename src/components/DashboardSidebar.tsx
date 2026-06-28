import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Company } from "@/services/company.service";
import type { LucideIcon } from "lucide-react";
import { 
  Brain,
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  BarChart3,
  Settings,
  FileText,
  MessageSquare,
  Bell,
  LogOut,
  Phone,
  Video,
  CreditCard,
  Workflow,
  BadgeCheck,
} from "lucide-react";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Check if company profile has key fields filled */
function isCompanyProfileComplete(company: Company | null): boolean {
  if (!company) return false;
  return Boolean(company.name && company.industry && company.description && company.size && company.location);
}

const getNavGroups = (isInvitedUser: boolean): NavGroup[] => [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Recruitment",
    items: [
      { title: "Jobs", url: "/dashboard/jobs", icon: Briefcase },
      { title: "Candidates", url: "/dashboard/candidates", icon: Users },
      { title: "Pipeline", url: "/dashboard/pipeline", icon: FileText },
      { title: "Interviews", url: "/dashboard/interviews", icon: Calendar },
      { title: "Phone Screening", url: "/dashboard/phone-screening", icon: Phone },
      { title: "AI Video Interviews", url: "/dashboard/ai-video-interviews", icon: Video },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
      { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
    ],
  },
  {
    label: "Settings",
    items: [
      { title: "Settings", url: "/dashboard/settings", icon: Settings },
      { title: "Pipeline Settings", url: "/dashboard/pipeline-settings", icon: Workflow },
      ...(isInvitedUser ? [] : [{ title: "Subscription", url: "/dashboard/subscription", icon: CreditCard }]),
    ],
  },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { company } = useCompany();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const profileComplete = isCompanyProfileComplete(company);

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" : "hover:bg-muted/50";

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
    <Sidebar className={cn("transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]", collapsed && !isMobile ? "w-16" : "w-64")} collapsible={isMobile ? "offcanvas" : "icon"}>
      <SidebarContent className="border-r border-border">
        {/* Header */}
        <div className="p-4 border-b border-border">
          {!collapsed ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-primary rounded-lg">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-semibold text-sm truncate">{company?.name || 'HirerMind'}</h2>
                  {profileComplete && (
                    <BadgeCheck className="w-4 h-4 text-primary shrink-0" aria-label="Verified company profile" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{company?.industry || 'AI Recruitment'}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-primary rounded-lg">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Groups */}
        {getNavGroups(!!user?.invitedByUserId).map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard"}
                        className={getNavCls}
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* User Profile & Logout */}
        <div className="mt-auto p-4 border-t border-border">
          {!collapsed ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || 'No email'}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Avatar className="w-8 h-8 mx-auto">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}