import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Brain, Search, User, LogOut, Settings, FileText, Bell, Menu } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import candidateAuthService from "@/services/candidate-auth.service";
import { useAuth } from "@/contexts/AuthContext";
import { notificationService } from "@/services/notification.service";

interface CandidateData {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface CandidateNavbarProps {
  candidate?: CandidateData | null;
}

const navLinks = [
  { to: "/candidate/dashboard", label: "Dashboard" },
  { to: "/candidate/jobs", label: "Find Jobs", icon: Search },
  { to: "/candidate/applications", label: "My Applications" },
];

const CandidateNavbar = ({ candidate }: CandidateNavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (candidate?.email) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [candidate]);

  const fetchUnreadCount = async () => {
    try {
      if (candidate?.email) {
        const notifications = await notificationService.getCandidateNotifications(candidate.email);
        const unread = notifications.filter((n: any) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/candidate/dashboard" className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">HirerMind</h1>
              <p className="text-xs text-muted-foreground -mt-1">Candidate Portal</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side: notification + user menu + mobile hamburger */}
          <div className="flex items-center space-x-4">
            {/* Notification Icon */}
            <Link to="/candidate/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground text-xs">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Desktop User Dropdown */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {candidate?.firstName?.[0] || "U"}
                        {candidate?.lastName?.[0] || ""}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">
                      {candidate
                        ? `${candidate.firstName} ${candidate.lastName}`
                        : "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {candidate?.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/candidate/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/candidate/resume" className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Resume</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/candidate/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Hamburger Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Sheet Menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              HirerMind
            </SheetTitle>
            <SheetDescription>Candidate Portal</SheetDescription>
          </SheetHeader>

          {/* Candidate info */}
          {candidate && (
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {candidate.firstName?.[0] || "U"}
                  {candidate.lastName?.[0] || ""}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {candidate.firstName} {candidate.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {candidate.email}
                </p>
              </div>
            </div>
          )}

          {/* Nav links */}
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="mt-auto pt-6 border-t border-border space-y-1">
            <Link
              to="/candidate/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
            <Link
              to="/candidate/resume"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <FileText className="w-4 h-4" />
              Resume
            </Link>
            <Link
              to="/candidate/settings"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <button
              onClick={() => {
                setMobileOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
};

export default CandidateNavbar;
