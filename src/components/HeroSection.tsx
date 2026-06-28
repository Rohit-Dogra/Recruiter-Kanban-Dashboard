import { useState } from "react";
import { ArrowRight, Sparkles, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import BookDemoModal from "@/components/BookDemoModal";
import { useAuth } from "@/contexts/AuthContext";

const stats = [
  { value: "95%", label: "Match Accuracy" },
  { value: "18K+", label: "Risk Factors Detected" },
  { value: "10K+", label: "Transferable Skills Found" },
  { value: "3.5×", label: "Faster Hiring" },
];

const HeroSection = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [demoOpen, setDemoOpen] = useState(false);
  const { isAuthenticated, userType } = useAuth();

  const getDashboardPath = () => {
    if (userType === "admin") return "/admin";
    if (userType === "candidate") return "/candidate/dashboard";
    return "/dashboard";
  };

  return (
    <section
      className={`relative min-h-screen flex items-center justify-center overflow-hidden transition-colors duration-300 ${
        isDark ? "bg-background" : "bg-background"
      }`}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: isDark
            ? "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)"
            : "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow blobs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[160px] pointer-events-none"
        style={{ background: isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.08)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[140px] pointer-events-none"
        style={{ background: isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.07)" }}
      />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      <div className="container mx-auto px-4 py-24 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">

          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 border text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full ${
              isDark
                ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                : "border-blue-200 bg-blue-50 text-blue-600"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Recruitment Platform
          </div>

          {/* Headline */}
          <h1
            className={`text-5xl lg:text-7xl font-black leading-[1.05] tracking-tight transition-colors ${
              isDark ? "text-white" : "text-zinc-900"
            }`}
            style={{ fontFamily: "'Syne', 'Space Grotesk', sans-serif" }}
          >
            The Future of Recruitment
            <br />
            <span
              style={{
                WebkitTextStroke: isDark ? "1.5px rgba(96,165,250,0.65)" : "1.5px rgba(59,130,246,0.45)",
                color: "transparent",
              }}
            >
              Isn't Coming.
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              We're Already Using It.
            </span>
          </h1>

          {/* Subheading */}
          <p
            className={`text-lg leading-relaxed max-w-2xl mx-auto ${
              isDark ? "text-zinc-400" : "text-zinc-500"
            }`}
          >
            Every candidate screened by AI. Every resume analyzed in depth. Every interview scored on 10+ dimensions.
            Whether you're hiring 1 or 1,000 — the quality never drops.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            {isAuthenticated ? (
              <Link to={getDashboardPath()} className="no-underline">
                <motion.button
                  animate={{ boxShadow: ["0 0 20px rgba(59,130,246,0.3)", "0 0 40px rgba(59,130,246,0.5)", "0 0 20px rgba(59,130,246,0.3)"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="group inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-lg text-sm tracking-wide transition-all duration-200"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
            ) : (
              <>
                <motion.button
                  onClick={() => setDemoOpen(true)}
                  animate={{ boxShadow: ["0 0 20px rgba(59,130,246,0.3)", "0 0 40px rgba(59,130,246,0.5)", "0 0 20px rgba(59,130,246,0.3)"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="group inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-lg text-sm tracking-wide transition-all duration-200"
                >
                  Request a Demo
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <Link to="/signup" className="no-underline">
                  <button
                    className={`inline-flex items-center gap-2 border font-semibold px-8 py-4 rounded-lg text-sm tracking-wide transition-all duration-200 ${
                      isDark
                        ? "border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white bg-zinc-900/50 hover:bg-zinc-800/60"
                        : "border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100"
                    }`}
                  >
                    See How It Works
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Trust strip */}
          <p className={`text-xs tracking-widest uppercase pt-2 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
            Trusted by Banking · Technology · Operations · Enterprise
          </p>

          {/* Stats row */}
          <div
            className={`grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden border mt-12 ${
              isDark ? "bg-zinc-800/50 border-zinc-800" : "bg-zinc-200 border-zinc-200"
            }`}
          >
            {stats.map((s, i) => (
              <div
                key={i}
                className={`px-6 py-6 text-center transition-colors ${
                  isDark ? "bg-card hover:bg-secondary" : "bg-card hover:bg-secondary"
                }`}
              >
                <p
                  className={`text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-zinc-900"}`}
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {s.value}
                </p>
                <p className={`text-xs mt-1 uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent ${
          isDark ? "via-zinc-700/40" : "via-zinc-300"
        }`}
      />

      <BookDemoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </section>
  );
};

export default HeroSection;