import { useState } from "react";
import { Brain, Sun, Moon, Menu, X, Home, LayoutDashboard } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, userType } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const isDark    = theme === "dark";

  const getDashboardPath = () => {
    if (userType === "admin") return "/admin";
    if (userType === "candidate") return "/candidate/dashboard";
    return "/dashboard";
  };

  // Navigate to / and scroll to section (for Pipeline & Analytics)
  const goToIndexSection = (hash: string) => {
    setMobileMenuOpen(false);
    if (location.pathname === "/") {
      // Already on landing page — just scroll
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      // Navigate to landing page then scroll
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  };

  const navLinks = [
    {
      label: "Features",
      action: () => { setMobileMenuOpen(false); navigate("/features"); },
    },
    {
      label: "Pipeline",
      action: () => goToIndexSection("pipeline"),
    },
    {
      label: "Analytics",
      action: () => goToIndexSection("analytics"),
    },
    {
      label: "Pricing",
      // Opens FeaturesPage and scrolls to pricing section
      action: () => {
        setMobileMenuOpen(false);
        if (location.pathname === "/features") {
          const el = document.getElementById("pricing");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        } else {
          navigate("/features");
          setTimeout(() => {
            const el = document.getElementById("pricing");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }, 300);
        }
      },
    },
  ];

  return (
      <header
        className={`w-full backdrop-blur-xl border-b sticky top-0 z-50 transition-colors duration-300 ${
          isDark ? "bg-background/80 border-border" : "bg-background/80 border-border"
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">

            {/* ── Logo → Landing page ── */}
            <Link to="/" className="no-underline">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl shadow-[0_0_16px_rgba(59,130,246,0.25)]">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1
                    className={`text-lg font-black tracking-tight transition-colors ${isDark ? "text-white" : "text-zinc-900"}`}
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    HirerMind
                  </h1>
                  <p className={`text-[10px] tracking-widest uppercase ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                    AI Recruitment
                  </p>
                </div>
              </div>
            </Link>

            {/* ── Desktop Nav ── */}
            <nav className="hidden md:flex items-center space-x-1">

              {/* Home button → Landing page */}
              <Link
                to="/"
                title="Home — Landing Page"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all no-underline ${
                  location.pathname === "/"
                    ? (isDark ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-900")
                    : (isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-800/60" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/60")
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </Link>

              {/* Divider */}
              <div className={`w-px h-4 mx-1 ${isDark ? "bg-zinc-700" : "bg-zinc-200"}`} />

              {/* Nav links */}
              {navLinks.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isDark
                      ? "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/60"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-3">

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-all duration-200 ${
                  isDark
                    ? "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-500"
                    : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300"
                }`}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Login / Dashboard */}
              {isAuthenticated ? (
                <Link to={getDashboardPath()} className="no-underline">
                  <button
                    className="text-sm font-semibold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all duration-200 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_28px_rgba(59,130,246,0.5)] inline-flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </button>
                </Link>
              ) : (
                <>
                  <Link to="/login" className="no-underline hidden sm:block">
                    <button
                      className={`text-sm font-semibold px-4 py-2 rounded-lg border transition-all duration-200 ${
                        isDark
                          ? "border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 bg-transparent"
                          : "border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 bg-transparent"
                      }`}
                    >
                      Login
                    </button>
                  </Link>
                  <Link to="/signup" className="no-underline">
                    <button
                      className="text-sm font-semibold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all duration-200 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_28px_rgba(59,130,246,0.5)]"
                    >
                      Get Started
                    </button>
                  </Link>
                </>
              )}

              {/* Mobile toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden flex items-center justify-center w-9 h-9 rounded-lg ${isDark ? "text-zinc-400" : "text-zinc-500"}`}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* ── Mobile Nav ── */}
          {mobileMenuOpen && (
            <div className={`md:hidden mt-4 pt-4 border-t space-y-1 ${isDark ? "border-zinc-800" : "border-zinc-100"}`}>

              {/* Home */}
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 text-sm font-medium py-2 px-2 rounded-lg no-underline transition-colors ${
                  isDark ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <Home className="w-4 h-4" />
                Home
              </Link>

              {/* Other nav */}
              {navLinks.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`block w-full text-left text-sm font-medium py-2 px-2 rounded-lg transition-colors ${
                    isDark ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {item.label}
                </button>
              ))}

              {/* Mobile Login / Dashboard */}
              {isAuthenticated ? (
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 text-sm font-medium py-2 px-2 rounded-lg no-underline transition-colors ${
                    isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block text-sm font-medium py-2 px-2 no-underline transition-colors ${
                    isDark ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  Login
                </Link>
              )}
            </div>
          )}
        </div>
      </header>
  );
};

export default Header;