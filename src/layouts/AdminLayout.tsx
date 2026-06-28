import { NavLink, Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2, LayoutDashboard, Users, CreditCard, LogOut, Shield,
  Briefcase, FileText, Building2, DollarSign, Calendar, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navGroups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Users", url: "/admin/users", icon: Users, end: false },
      { title: "Jobs", url: "/admin/jobs", icon: Briefcase, end: false },
      { title: "Applications", url: "/admin/applications", icon: FileText, end: false },
      { title: "Companies", url: "/admin/companies", icon: Building2, end: false },
      { title: "Interviews", url: "/admin/interviews", icon: Calendar, end: false },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Payments", url: "/admin/payments", icon: DollarSign, end: false },
      { title: "Plans", url: "/admin/plans", icon: CreditCard, end: false },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Broadcast", url: "/admin/broadcast", icon: Bell, end: false },
      { title: "Demo Bookings", url: "/admin/demo-bookings", icon: Calendar, end: false },
    ],
  },
];

const AdminLayout = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if ((user as any)?.userType !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
      isActive
        ? "bg-primary/10 text-primary font-medium"
        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
    }`;

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-red-500/10 rounded-lg">
              <Shield className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">HirerMind</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.url} to={item.url} end={item.end} className={getNavCls}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2 truncate">{user?.email}</p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
