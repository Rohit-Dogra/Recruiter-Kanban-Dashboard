import { ArrowRight, Upload, Gauge, Phone, Code2, Award, Mail, Cpu } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

const pipelineStages = [
  {
    id: "post",
    step: "01",
    title: "Job Posted",
    subtitle: "Company posts job with JD & required skills",
    icon: Upload,
    count: 1,
    countLabel: "position",
    accent: "#3b82f6",
    footer: "Job live — applications open",
    candidates: [
      { name: "React Dev Role", role: "3 yrs exp · Remote", score: null },
    ],
  },
  {
    id: "apply",
    step: "02",
    title: "Candidate Applies",
    subtitle: "Resume uploaded, AI extracts skills & experience",
    icon: Cpu,
    count: 48,
    countLabel: "candidates",
    accent: "#6366f1",
    footer: "Application received ✓",
    candidates: [
      { name: "Rohit Dogra", role: "Frontend Dev", score: null },
      { name: "Arun Kumar", role: "Backend Dev", score: null },
    ],
  },
  {
    id: "ats",
    step: "03",
    title: "ATS Score",
    subtitle: "Score /100 · Skills matched · Hire recommendation",
    icon: Gauge,
    count: 48,
    countLabel: "candidates",
    accent: "#8b5cf6",
    footer: "Profile under review",
    candidates: [
      { name: "Rohit Dogra", role: "Frontend Dev", score: 91 },
      { name: "Eshanya Sharma", role: "Backend Dev", score: 84 },
    ],
  },
  {
    id: "aicall",
    step: "04",
    title: "AI Calling Round",
    subtitle: "AI calls shortlisted candidates · Basic screening",
    icon: Phone,
    count: 24,
    countLabel: "candidates",
    accent: "#06b6d4",
    footer: "Shortlisted — AI call scheduled",
    candidates: [
      { name: "Rohit Dogra", role: "Communication: 88", score: 88 },
      { name: "Eshanya Sharma", role: "Communication: 94", score: 94 },
    ],
  },
  {
    id: "technical",
    step: "05",
    title: "AI Technical Interview",
    subtitle: "Domain knowledge · Problem solving · Full report",
    icon: Code2,
    count: 12,
    countLabel: "candidates",
    accent: "#10b981",
    footer: "Technical interview scheduled",
    candidates: [
      { name: "Rohit Dogra", role: "Frontend Dev", score: 96 },
      { name: "Ankita Kumari", role: "Backend Dev", score: 92 },
    ],
  },
  {
    id: "offer",
    step: "06",
    title: "Offer Letter",
    subtitle: "Digital offer · e-Signature · Onboarding tracking",
    icon: Award,
    count: 4,
    countLabel: "candidates",
    accent: "#f59e0b",
    footer: "Offer letter sent!",
    candidates: [
      { name: "Rohit Dogra", role: "Frontend Dev", score: 98 },
    ],
  },
];

const PipelineVisualization = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section className={`py-24 relative overflow-hidden transition-colors duration-300 ${isDark ? "bg-background" : "bg-background"}`} id="pipeline">
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: isDark ? "rgba(59,130,246,0.06)" : "rgba(59,130,246,0.04)" }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div
            className={`inline-flex items-center gap-2 border text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-6 ${
              isDark ? "border-zinc-700 bg-zinc-900/60 text-zinc-400" : "border-zinc-200 bg-zinc-100 text-zinc-500"
            }`}
          >
            Pipeline Management
          </div>
          <h2
            className={`text-4xl lg:text-5xl font-black mb-4 ${isDark ? "text-foreground" : "text-foreground"}`}
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            From Resume to Offer,{" "}
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Powered by AI
            </span>
          </h2>
          <p className={`text-lg max-w-xl mx-auto text-muted-foreground`}>
            Every stage automated. Candidates notified at each step via email. Quality stays constant at any scale.
          </p>
        </div>

        {/* Pipeline grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {pipelineStages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <div key={stage.id} className="relative group">
                <div
                  className={`h-full rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-lg border-border`}
                  style={{ borderTop: `3px solid ${stage.accent}` }}
                >
                  {/* Step + icon */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold tracking-widest text-muted-foreground">{stage.step}</span>
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-lg"
                      style={{ background: `${stage.accent}15`, border: `1px solid ${stage.accent}30` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: stage.accent }} />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xs font-bold text-foreground mb-1">{stage.title}</h3>
                  <p className="text-[10px] leading-snug text-muted-foreground mb-2">{stage.subtitle}</p>

                  {/* Count */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: stage.accent }} />
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {stage.count} {stage.countLabel}
                    </span>
                  </div>

                  {/* Candidates */}
                  <div className="space-y-1.5">
                    {stage.candidates.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-2.5 py-2"
                      >
                        <div
                          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ background: `linear-gradient(135deg, ${stage.accent}, ${stage.accent}99)` }}
                        >
                          {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold truncate text-foreground">{c.name}</p>
                          <p className="text-[9px] truncate text-muted-foreground">{c.role}</p>
                        </div>
                        {c.score !== null && (
                          <span
                            className="text-[10px] font-black flex-shrink-0 rounded px-1.5 py-0.5"
                            style={{ color: stage.accent, background: `${stage.accent}15` }}
                          >
                            {c.score}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="mt-3 flex items-center gap-1.5 text-[9px] font-medium border rounded-lg px-2.5 py-1.5 border-border bg-muted/30 text-muted-foreground">
                    <ArrowRight className="w-2.5 h-2.5 flex-shrink-0" />
                    {stage.footer}
                  </div>
                </div>

                {/* Arrow connector */}
                {index < pipelineStages.length - 1 && (
                  <div className="hidden xl:flex absolute top-[40%] -right-2.5 z-20">
                    <div className="border rounded-full p-0.5 bg-background border-border">
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/signup" className="no-underline">
            <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-lg text-sm tracking-wide transition-all duration-200 shadow-[0_0_30px_rgba(59,130,246,0.25)] hover:shadow-[0_0_40px_rgba(59,130,246,0.4)]">
              View Full Pipeline
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PipelineVisualization;
