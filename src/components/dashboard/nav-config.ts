import {
  BarChart3,
  Bell,
  Briefcase,
  Calendar,
  CreditCard,
  LayoutDashboard,
  MessageSquare,
  Phone,
  Settings,
  Users,
  Video,
  Workflow,
  KanbanSquare,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  /** Short label used on the mobile tab bar where space is tight. */
  short?: string;
  url: string;
  icon: LucideIcon;
  /** Only match when the path is exactly `url`. */
  end?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Single source of truth for recruiter navigation — consumed by the desktop
 * rail, the mobile drawer and the mobile tab bar, so they can never drift.
 */
export function getNavGroups(isInvitedUser: boolean): NavGroup[] {
  return [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", short: "Home", url: "/dashboard", icon: LayoutDashboard, end: true },
        { title: "Analytics", short: "Stats", url: "/dashboard/analytics", icon: BarChart3 },
      ],
    },
    {
      label: "Recruitment",
      items: [
        { title: "Jobs", url: "/dashboard/jobs", icon: Briefcase },
        { title: "Candidates", short: "People", url: "/dashboard/candidates", icon: Users },
        { title: "Pipeline", url: "/dashboard/pipeline", icon: KanbanSquare },
        { title: "Interviews", url: "/dashboard/interviews", icon: Calendar },
        { title: "Phone screening", short: "Calls", url: "/dashboard/phone-screening", icon: Phone },
        { title: "AI video interviews", short: "Video", url: "/dashboard/ai-video-interviews", icon: Video },
      ],
    },
    {
      label: "Communication",
      items: [
        { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
        { title: "Notifications", short: "Alerts", url: "/dashboard/notifications", icon: Bell },
      ],
    },
    {
      label: "Workspace",
      items: [
        { title: "Settings", url: "/dashboard/settings", icon: Settings },
        { title: "Pipeline settings", short: "Stages", url: "/dashboard/pipeline-settings", icon: Workflow },
        ...(isInvitedUser
          ? []
          : [{ title: "Subscription", short: "Billing", url: "/dashboard/subscription", icon: CreditCard }]),
      ],
    },
  ];
}

/** The five destinations that earn a slot on the mobile tab bar. */
export const MOBILE_PRIMARY: NavItem[] = [
  { title: "Dashboard", short: "Home", url: "/dashboard", icon: LayoutDashboard, end: true },
  { title: "Jobs", url: "/dashboard/jobs", icon: Briefcase },
  { title: "Pipeline", url: "/dashboard/pipeline", icon: KanbanSquare },
  { title: "Candidates", short: "People", url: "/dashboard/candidates", icon: Users },
];
