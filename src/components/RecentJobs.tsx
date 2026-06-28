import { Briefcase, MapPin, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { usePublicRecentJobs } from "@/hooks/useApiQuery";
import { motion } from "framer-motion";

interface Job {
  id: number;
  title: string;
  company: string;
  location: string | null;
  type: string;
  salary: string | null;
  experience: string | null;
  workType: string;
  skills: string[] | null;
  createdAt: string;
}

const typeColors: Record<string, string> = {
  "full-time": "#3b82f6",
  "part-time": "#8b5cf6",
  contract: "#f59e0b",
  internship: "#10b981",
  temporary: "#ef4444",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

const RecentJobs = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { data: jobs, isLoading } = usePublicRecentJobs();

  if (isLoading || !jobs || jobs.length === 0) return null;

  return (
    <section className={`py-20 relative overflow-hidden transition-colors duration-300 ${isDark ? "bg-background" : "bg-background"}`}>
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div
              className={`inline-flex items-center gap-2 border text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-6 ${
                isDark ? "border-zinc-700 bg-zinc-900/60 text-zinc-400" : "border-zinc-200 bg-zinc-100 text-zinc-500"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Fresh Opportunities
            </div>
            <h2
              className={`text-3xl lg:text-4xl font-black ${isDark ? "text-white" : "text-zinc-900"}`}
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Recently Posted{" "}
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">Jobs</span>
            </h2>
          </div>
          <Link
            to="/candidate/all-jobs"
            className={`hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold transition-colors ${
              isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-500"
            }`}
          >
            View all jobs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {(jobs as Job[]).slice(0, 8).map((job, i) => {
            const accent = typeColors[job.type] || "#6366f1";
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className={`group rounded-xl border p-5 transition-all duration-200 ${
                  isDark
                    ? "bg-card border-border hover:border-zinc-600"
                    : "bg-card border-border hover:border-zinc-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className={`text-base font-bold truncate ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
                      {job.title}
                    </p>
                    <p className={`text-sm mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                      {job.company}
                    </p>
                  </div>
                  <span
                    className="flex-shrink-0 text-[11px] font-bold uppercase px-2.5 py-1 rounded-md"
                    style={{ color: accent, background: `${accent}18`, border: `1px solid ${accent}30` }}
                  >
                    {job.type}
                  </span>
                </div>

                <div className={`flex flex-wrap items-center gap-3 mt-3 text-xs ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                  {job.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {job.location}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 capitalize">
                    {job.workType}
                  </span>
                  {job.salary && <span>{job.salary}</span>}
                  <span className="inline-flex items-center gap-1 ml-auto">
                    <Clock className="w-3 h-3" /> {timeAgo(job.createdAt)}
                  </span>
                </div>

                {(() => {
                  const skills = Array.isArray(job.skills)
                    ? job.skills
                    : typeof job.skills === "string"
                      ? (() => { try { const p = JSON.parse(job.skills); return Array.isArray(p) ? p : []; } catch { return []; } })()
                      : [];
                  return skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {skills.slice(0, 4).map((skill: string, si: number) => (
                      <span
                        key={si}
                        className={`text-[11px] px-2 py-0.5 rounded-md ${
                          isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                    {skills.length > 4 && (
                      <span className={`text-[11px] px-2 py-0.5 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
                        +{skills.length - 4}
                      </span>
                    )}
                  </div>
                  ) : null;
                })()}
              </motion.div>
            );
          })}
        </div>

        <div className="sm:hidden text-center mt-6">
          <Link
            to="/candidate/all-jobs"
            className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
              isDark ? "text-blue-400" : "text-blue-600"
            }`}
          >
            View all jobs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RecentJobs;
