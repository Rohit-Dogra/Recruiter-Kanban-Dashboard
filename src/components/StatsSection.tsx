import { useRef, useEffect, useState } from "react";
import { TrendingUp, Clock, Target, Users, Shield, Brain, BarChart2, Zap, ArrowRight, FileText, Briefcase, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { usePublicStats } from "@/hooks/useApiQuery";
import { motion, useInView } from "framer-motion";

/** Animated counter that counts up from 0 to `end` when in view */
function AnimatedCount({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 1500;
    const startTime = performance.now();
    let raf: number;
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * end));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isInView, end]);

  return <span ref={ref}>{prefix}{display.toLocaleString()}{suffix}</span>;
}

const fallbackMetrics = [
  { icon: Brain, value: "18K+", label: "Risk Factors Detected", accent: "#ef4444" },
  { icon: Zap, value: "10K+", label: "Transferable Skills Found", accent: "#6366f1" },
  { icon: BarChart2, value: "51K+", label: "Learnable Skills Mapped", accent: "#3b82f6" },
  { icon: Shield, value: "85%", label: "Similarity Detection Rate", accent: "#10b981" },
];

const StatsSection = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { data: publicStats } = usePublicStats();

  const bg = isDark ? "bg-background" : "bg-secondary";
  const cardBg = isDark ? "bg-card" : "bg-card";
  const border = isDark ? "border-border" : "border-border";
  const gridBg = isDark ? "bg-muted/40" : "bg-muted/60";
  const textPrimary = isDark ? "text-foreground" : "text-foreground";
  const textSecondary = isDark ? "text-muted-foreground" : "text-muted-foreground";
  const textMuted = isDark ? "text-muted-foreground" : "text-muted-foreground";
  const hoverCard = isDark ? "hover:bg-secondary" : "hover:bg-secondary";

  // Build real stats from API data, with sensible fallbacks
  const realStats = [
    {
      icon: FileText,
      numericValue: publicStats?.totalResumesScreened ?? 10000,
      suffix: "+",
      label: "Resumes Screened",
      description: "AI-analyzed resumes across all companies",
      trend: "+32%",
      accent: "#3b82f6",
    },
    {
      icon: Users,
      numericValue: publicStats?.totalCompanies ?? 500,
      suffix: "+",
      label: "Active Companies",
      description: "Organizations powered by HirerMind",
      trend: "+25%",
      accent: "#10b981",
    },
    {
      icon: Briefcase,
      numericValue: publicStats?.totalJobsPosted ?? 2500,
      suffix: "+",
      label: "Jobs Posted",
      description: "Open positions across all industries",
      trend: "+48%",
      accent: "#6366f1",
    },
    {
      icon: Video,
      numericValue: publicStats?.totalInterviews ?? 8000,
      suffix: "+",
      label: "Interviews Conducted",
      description: "AI-powered interviews completed",
      trend: "+180%",
      accent: "#f59e0b",
    },
  ];

  return (
    <section className={`py-24 ${bg} relative overflow-hidden transition-colors duration-300`} id="analytics">
      {/* Background glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: isDark ? "rgba(99,102,241,0.07)" : "rgba(99,102,241,0.04)" }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: isDark
            ? "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)"
            : "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">

        {/* Header */}
        <div className="text-center mb-16">
          <div
            className={`inline-flex items-center gap-2 border text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-6 ${
              isDark ? "border-zinc-700 bg-zinc-900/60 text-zinc-400" : "border-zinc-200 bg-zinc-100 text-zinc-500"
            }`}
          >
            Proven Results
          </div>
          <h2
            className={`text-4xl lg:text-5xl font-black mb-4 ${textPrimary}`}
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Numbers That{" "}
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Speak for Themselves
            </span>
          </h2>
          <p className={`text-lg max-w-xl mx-auto ${textSecondary}`}>
            See how HirerMind helps companies hire faster, smarter, and more efficiently — at any scale.
          </p>
        </div>

        {/* Main stats with animated count-up */}
        <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-px ${gridBg} rounded-2xl overflow-hidden border ${border} mb-4`}>
          {realStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`group ${cardBg} p-8 ${hoverCard} transition-all duration-300 relative overflow-hidden`}
              >
                {/* Bottom accent on hover */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, transparent, ${stat.accent}, transparent)` }}
                />

                <div className="flex items-start justify-between mb-6">
                  <div
                    className="flex items-center justify-center w-11 h-11 rounded-xl"
                    style={{ background: `${stat.accent}14`, border: `1px solid ${stat.accent}28` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: stat.accent }} />
                  </div>
                  <span
                    className="text-xs font-black px-2 py-1 rounded"
                    style={{
                      color: stat.accent,
                      background: `${stat.accent}14`,
                      border: `1px solid ${stat.accent}22`,
                    }}
                  >
                    {stat.trend}
                  </span>
                </div>

                <p
                  className={`text-4xl font-black mb-1 tracking-tight ${textPrimary}`}
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  <AnimatedCount end={stat.numericValue} suffix={stat.suffix} />
                </p>
                <p className={`text-sm font-semibold mb-1 ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>{stat.label}</p>
                <p className={`text-xs ${textMuted}`}>{stat.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Secondary metrics row */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-px ${gridBg} rounded-xl overflow-hidden border ${border} mb-8`}>
          {fallbackMetrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className={`${cardBg} px-6 py-5 flex items-center gap-4 ${hoverCard} transition-colors`}>
                <div
                  className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg"
                  style={{ background: `${m.accent}12`, border: `1px solid ${m.accent}22` }}
                >
                  <Icon className="w-4 h-4" style={{ color: m.accent }} />
                </div>
                <div>
                  <p
                    className={`text-lg font-black leading-none ${textPrimary}`}
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    {m.value}
                  </p>
                  <p className={`text-[11px] mt-0.5 ${textMuted}`}>{m.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA strip */}
        <div
          className={`border ${border} rounded-xl ${cardBg} p-6 flex flex-col md:flex-row items-center justify-between gap-4`}
        >
          <div>
            <p className={`font-black text-lg ${textPrimary}`} style={{ fontFamily: "'Syne', sans-serif" }}>
              Ready to transform your hiring process?
            </p>
            <p className={`text-sm mt-1 ${textMuted}`}>Join 500+ companies already hiring smarter with AI.</p>
          </div>
          <Link to="/signup" className="no-underline flex-shrink-0">
            <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg text-sm tracking-wide transition-all duration-200 shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]">
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
