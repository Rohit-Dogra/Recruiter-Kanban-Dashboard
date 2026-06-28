import { useState } from "react";
import {
  Briefcase,
  FileSearch,
  Brain,
  BarChart3,
  Phone,
  Code2,
  Shield,
  Zap,
  Star,
  CheckCircle,
  Mail,
  Eye,
  Gauge,
  MessageSquare,
  Target,
  TrendingUp,
  Award,
  Activity,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";

// ─── Main pipeline features ───────────────────────────────────────────────────
const pipelineFeatures = [
  {
    step: "01",
    icon: Briefcase,
    title: "Job Posting",
    description:
      "Company posts a job with required skills, experience, and JD. Auto-tagging + multi-platform publishing.",
    badge: "Start",
    accent: "#3b82f6",
  },
  {
    step: "02",
    icon: FileSearch,
    title: "Candidate Applies",
    description:
      "Candidate uploads resume & applies. System parses resume instantly — skills, education, experience extracted.",
    badge: "Apply",
    accent: "#6366f1",
  },
  {
    step: "03",
    icon: Gauge,
    title: "ATS Score & Match",
    description:
      "AI generates ATS score out of 100. Shows matched skills, missing skills, and a hire/no-hire recommendation for the company.",
    badge: "AI",
    accent: "#8b5cf6",
  },
  {
    step: "04",
    icon: Phone,
    title: "AI Calling Round",
    description:
      "If shortlisted, AI calls the candidate. Asks basic screening questions, evaluates communication, generates a deep report.",
    badge: "AI Call",
    accent: "#06b6d4",
  },
  {
    step: "05",
    icon: Code2,
    title: "AI Technical Interview",
    description:
      "AI conducts a full technical interview — checks domain knowledge, problem-solving, communication. Full scored report generated.",
    badge: "Tech",
    accent: "#10b981",
  },
  {
    step: "06",
    icon: Award,
    title: "Offer Letter",
    description:
      "Hired candidates receive a branded digital offer letter with e-signature and onboarding tracking built in.",
    badge: "Hire",
    accent: "#f59e0b",
  },
];

// ─── Supporting features ──────────────────────────────────────────────────────
const supportingFeatures = [
  {
    icon: Mail,
    title: "Candidate Email Alerts",
    description: "Auto email at every stage — applied, shortlisted, interview scheduled, offer sent.",
    accent: "#3b82f6",
    badge: "Auto",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Time-to-hire, source effectiveness, funnel drop-off, and performance metrics.",
    accent: "#f59e0b",
    badge: "Insights",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "GDPR compliant, JWT + OAuth 2.0, 54 audit dimensions, encrypted storage.",
    accent: "#ef4444",
    badge: "Security",
  },
  {
    icon: Zap,
    title: "Bulk Hiring Engine",
    description: "Process 1,000 candidates with same rigor as #1. Zero delay added per candidate.",
    accent: "#10b981",
    badge: "Scale",
  },
];

// ─── AI Interview dimensions ──────────────────────────────────────────────────
const scoringDimensions = [
  { icon: Brain, label: "Technical Knowledge", desc: "Depth and accuracy of domain expertise", accent: "#3b82f6" },
  { icon: MessageSquare, label: "Communication", desc: "Clarity, articulation, and coherence", accent: "#6366f1" },
  { icon: Activity, label: "Engagement", desc: "Active participation and enthusiasm", accent: "#8b5cf6" },
  { icon: Star, label: "Emotional Intelligence", desc: "Self-awareness, empathy, social skills", accent: "#06b6d4" },
  { icon: CheckCircle, label: "Professionalism", desc: "Conduct, tone, and workplace readiness", accent: "#10b981" },
  { icon: TrendingUp, label: "Confidence Level", desc: "Assurance in responses", accent: "#f59e0b" },
  { icon: Gauge, label: "Speaking Pace", desc: "Rate of speech analysis", accent: "#f97316" },
  { icon: Eye, label: "Eye Contact", desc: "Visual engagement (if video enabled)", accent: "#ec4899" },
  { icon: Target, label: "Red Flags", desc: "Inconsistencies, evasion, concerning patterns", accent: "#ef4444" },
  { icon: Award, label: "Overall Fit", desc: "Holistic assessment combining all dimensions", accent: "#22c55e" },
];

const FeatureGrid = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState<"pipeline" | "deepdive">("pipeline");

  const bg = isDark ? "bg-background" : "bg-secondary";
  const cardBg = isDark ? "bg-card" : "bg-card";
  const border = isDark ? "border-border" : "border-border";
  const textPrimary = isDark ? "text-foreground" : "text-foreground";
  const textSecondary = isDark ? "text-muted-foreground" : "text-muted-foreground";
  const textMuted = isDark ? "text-muted-foreground" : "text-muted-foreground";
  const gridBg = isDark ? "bg-muted/40" : "bg-muted/60";
  const hoverCard = isDark ? "hover:bg-secondary" : "hover:bg-secondary";

  return (
    <section className={`py-24 ${bg} relative overflow-hidden transition-colors duration-300`} id="features">
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

        {/* ── Header ── */}
        <div className="max-w-2xl mb-12">
          <div
            className={`inline-flex items-center gap-2 border text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-6 ${
              isDark ? "border-zinc-700 bg-zinc-900/60 text-zinc-400" : "border-zinc-200 bg-zinc-100 text-zinc-500"
            }`}
          >
            Core Features
          </div>
          <h2
            className={`text-4xl lg:text-5xl font-black leading-tight mb-4 ${textPrimary}`}
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Everything You Need
            <br />
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              to Hire Smarter
            </span>
          </h2>
          <p className={`text-lg ${textSecondary}`}>
            AI-first recruitment automation. No shortcuts. No fatigue. No bias.
          </p>
        </div>

        {/* ── Tab Toggle ── */}
        <div
          className={`inline-flex rounded-xl border p-1 mb-10 ${
            isDark ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-zinc-100"
          }`}
        >
          {(["pipeline", "deepdive"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200 ${
                activeTab === tab
                  ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  : isDark
                  ? "text-zinc-400 hover:text-white"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {tab === "pipeline" ? "🔄 Hiring Pipeline" : "🎤 AI Interview Deep Dive"}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════ PIPELINE TAB ═══════════════════════════════ */}
        {activeTab === "pipeline" && (
          <>
            {/* Pipeline steps - glassmorphic cards with stagger */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {pipelineFeatures.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className={`group relative backdrop-blur-md rounded-2xl p-6 cursor-default transition-shadow duration-300 border ${
                      isDark
                        ? "bg-white/5 border-white/10 hover:border-white/20 hover:shadow-[0_8px_32px_rgba(59,130,246,0.15)]"
                        : "bg-white/60 border-white/30 hover:border-white/50 hover:shadow-[0_8px_32px_rgba(59,130,246,0.1)]"
                    }`}
                  >
                    {/* Top accent on hover */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `linear-gradient(90deg, transparent, ${f.accent}, transparent)` }}
                    />

                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-[11px] font-black tracking-widest ${textMuted}`}>{f.step}</span>
                        <div
                          className="flex items-center justify-center w-10 h-10 rounded-xl"
                          style={{ background: `${f.accent}15`, border: `1px solid ${f.accent}30` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: f.accent }} />
                        </div>
                      </div>
                      <span
                        className="text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded"
                        style={{
                          color: f.accent,
                          background: `${f.accent}12`,
                          border: `1px solid ${f.accent}25`,
                        }}
                      >
                        {f.badge}
                      </span>
                    </div>

                    <h3 className={`text-sm font-bold mb-2 group-hover:text-blue-400 transition-colors ${textPrimary}`}>
                      {f.title}
                    </h3>
                    <p className={`text-xs leading-relaxed ${textMuted}`}>{f.description}</p>

                    {/* Candidate email notification badge */}
                    <div
                      className={`mt-4 flex items-center gap-1.5 text-[10px] font-medium border rounded-md px-2 py-1 w-fit ${
                        isDark
                          ? "border-zinc-700/60 text-zinc-500 bg-zinc-900/40"
                          : "border-zinc-200 text-zinc-400 bg-zinc-50"
                      }`}
                    >
                      <Mail className="w-3 h-3" />
                      Candidate notified via email
                    </div>
                    </motion.div>
                );
              })}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {supportingFeatures.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    whileHover={{ scale: 1.02 }}
                    className={`backdrop-blur-md rounded-2xl px-5 py-5 flex items-start gap-4 transition-all duration-300 group border ${
                      isDark
                        ? "bg-white/5 border-white/10 hover:border-white/20"
                        : "bg-white/60 border-white/30 hover:border-white/50"
                    }`}
                  >
                    <div
                      className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg mt-0.5"
                      style={{ background: `${f.accent}12`, border: `1px solid ${f.accent}22` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: f.accent }} />
                    </div>
                    <div>
                      <p className={`text-xs font-bold mb-1 ${textPrimary}`}>{f.title}</p>
                      <p className={`text-[11px] leading-relaxed ${textMuted}`}>{f.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* ═══════════════════════════════ DEEP DIVE TAB ═══════════════════════════════ */}
        {activeTab === "deepdive" && (
          <div className="space-y-6">

            {/* Intro card */}
            <div
              className={`rounded-2xl border p-8 relative overflow-hidden ${cardBg} ${border}`}
              style={{ boxShadow: isDark ? "0 0 60px rgba(59,130,246,0.05)" : "0 0 40px rgba(59,130,246,0.04)" }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-400" />
              <div className="max-w-3xl">
                <div
                  className={`inline-flex items-center gap-2 border text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4 ${
                    isDark ? "border-blue-500/30 bg-blue-500/10 text-blue-400" : "border-blue-200 bg-blue-50 text-blue-600"
                  }`}
                >
                  🎤 Deep Dive — AI Interviews That Actually Work
                </div>
                <h3
                  className={`text-2xl lg:text-3xl font-black mb-3 ${textPrimary}`}
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  Video or voice, premium or basic —{" "}
                  <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                    fine-tune to the job and budget.
                  </span>
                </h3>
                <p className={`text-sm leading-relaxed max-w-2xl ${textSecondary}`}>
                  Adaptive AI conversations, technical assessments, aptitude tests, and more. Not a chatbot —
                  a sophisticated evaluation engine that scores 10+ dimensions per candidate.
                </p>
              </div>
            </div>

            {/* 10 Scoring dimensions */}
            <div>
              <h4
                className={`text-xs font-bold tracking-widest uppercase mb-4 ${textMuted}`}
              >
                What We Score — 10+ Dimensions
              </h4>
              <div className={`grid grid-cols-2 lg:grid-cols-5 gap-px ${gridBg} rounded-2xl overflow-hidden border ${border}`}>
                {scoringDimensions.map((d, i) => {
                  const Icon = d.icon;
                  return (
                    <div
                      key={i}
                      className={`group ${cardBg} p-4 ${hoverCard} transition-all duration-200 relative`}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: `linear-gradient(90deg, transparent, ${d.accent}, transparent)` }}
                      />
                      <div
                        className="flex items-center justify-center w-8 h-8 rounded-lg mb-3"
                        style={{ background: `${d.accent}14`, border: `1px solid ${d.accent}28` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: d.accent }} />
                      </div>
                      <p className={`text-xs font-bold mb-1 ${textPrimary}`}>{d.label}</p>
                      <p className={`text-[11px] leading-snug ${textMuted}`}>{d.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interview tiers */}
            <div>
              <h4 className={`text-xs font-bold tracking-widest uppercase mb-4 ${textMuted}`}>
                Customizable Interview Tiers
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    tier: "Premium",
                    icon: "🎥",
                    accent: "#6366f1",
                    includes: "AI video interview + adaptive conversation + all assessments + deep behavioral analysis",
                    ideal: "Software Architects, Engineering Leads, Executives",
                  },
                  {
                    tier: "Standard",
                    icon: "🎙️",
                    accent: "#3b82f6",
                    includes: "AI voice interview + technical or aptitude assessments + scoring",
                    ideal: "Mid-level professionals, Analysts, Specialists",
                  },
                  {
                    tier: "Essential",
                    icon: "📋",
                    accent: "#10b981",
                    includes: "Voice-only + structured MCQ + typing/aptitude tests + automated scoring",
                    ideal: "Call Center Associates, Data Entry, Support Staff",
                  },
                ].map((t, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-5 transition-all duration-200 ${cardBg} ${border} hover:border-opacity-80`}
                    style={{ borderTopColor: t.accent, borderTopWidth: "2px" }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{t.icon}</span>
                      <span
                        className="text-sm font-black"
                        style={{ color: t.accent, fontFamily: "'Syne', sans-serif" }}
                      >
                        {t.tier}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed mb-3 ${textSecondary}`}>{t.includes}</p>
                    <div
                      className={`text-[10px] font-medium border rounded px-2 py-1 ${
                        isDark ? "border-zinc-700 text-zinc-500" : "border-zinc-200 text-zinc-400"
                      }`}
                    >
                      Ideal for: {t.ideal}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assessment types */}
            <div>
              <h4 className={`text-xs font-bold tracking-widest uppercase mb-4 ${textMuted}`}>
                Assessment Types — Mix & Match
              </h4>
              <div
                className={`grid grid-cols-2 lg:grid-cols-5 gap-px ${gridBg} rounded-xl overflow-hidden border ${border}`}
              >
                {[
                  { label: "Technical Questions", icon: "⚙️", desc: "Role-specific coding & domain knowledge" },
                  { label: "Aptitude Tests", icon: "🧠", desc: "Logical reasoning & problem-solving" },
                  { label: "Multiple Choice", icon: "☑️", desc: "Domain knowledge & situational judgment" },
                  { label: "Typing Speed", icon: "⌨️", desc: "WPM & accuracy for admin roles" },
                  { label: "Custom Assessments", icon: "🎯", desc: "Build your own question sets" },
                ].map((a, i) => (
                  <div key={i} className={`${cardBg} px-4 py-4 ${hoverCard} transition-colors`}>
                    <span className="text-2xl block mb-2">{a.icon}</span>
                    <p className={`text-xs font-bold mb-1 ${textPrimary}`}>{a.label}</p>
                    <p className={`text-[11px] ${textMuted}`}>{a.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeatureGrid;