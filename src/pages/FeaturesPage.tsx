import { useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Building, User, ArrowRight, Check, Phone, Video, FileText,
  BarChart3, Users, Zap, Star, Crown, ChevronRight, Play, Sparkles, CheckCircle2,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const FeaturesPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [showSignupModal, setShowSignupModal] = useState(false);
  const isDark = theme === "dark";

  const bg   = isDark ? "bg-[#07070c]"                   : "bg-white";
  const border = isDark ? "border-zinc-800"              : "border-zinc-200";
  const text = isDark ? "text-white"                     : "text-zinc-900";
  const muted = isDark ? "text-zinc-400"                 : "text-zinc-500";
  const card = isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-zinc-200";

  const features = [
    { icon: Phone,     color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",     title: "AI Phone Screening",     desc: "AI calls candidates automatically, generates full report with scores, transcripts, and hire/no-hire recommendation." },
    { icon: Video,     color: "text-indigo-400",  bg: "bg-indigo-500/10 border-indigo-500/20",  title: "AI Technical Interview", desc: "Avatar-based video + voice interviews with MCQ assessments. Technical and communication scores in real-time." },
    { icon: FileText,  color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/20",      title: "ATS Resume Scoring",     desc: "Every resume parsed and scored /100 automatically. Skill match analysis and hire/no-hire AI recommendation." },
    { icon: BarChart3, color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",    title: "Hiring Analytics",       desc: "Funnel reports, candidate source tracking, time-to-hire metrics, and custom date filters." },
    { icon: Users,     color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/20",  title: "Team Collaboration",     desc: "Role-based access, team activity log, unlimited members on Diamond. Everyone aligned, nothing lost." },
    { icon: Sparkles,  color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20",title: "AI Job Description",     desc: "Generate complete JDs, screening questions, and interview criteria with one click from the job role." },
  ];

  const pipeline = [
    { step: "01", label: "Post Job",          desc: "AI generates JD + screening questions. Published in 2 minutes.",      color: "blue"    },
    { step: "02", label: "Candidates Apply",  desc: "Resume parsed, ATS scored, skill-matched automatically on apply.",    color: "indigo"  },
    { step: "03", label: "AI Phone Screen",   desc: "AI calls candidates, scores communication, generates report.",         color: "violet"  },
    { step: "04", label: "AI Tech Interview", desc: "Avatar AI conducts technical interview. Full score report generated.", color: "purple"  },
    { step: "05", label: "Send Offer",        desc: "Digital offer letter with e-signature sent directly from pipeline.",   color: "emerald" },
  ];

  const stats = [
    { value: "95%",     label: "Resume match accuracy"      },
    { value: "14 days", label: "Average time-to-hire"       },
    { value: "3.5×",    label: "Faster than manual process" },
    { value: "500+",    label: "Companies using HirerMind"  },
  ];

  const plans = [
    { name: "Silver",  price: "₹999",   duration: "1 Month",  icon: Star,  gradient: "from-blue-500 to-cyan-500",     popular: false, features: ["10 Phone Screenings", "5 Technical Interviews", "3 Team Members", "Basic Analytics", "Email Support"] },
    { name: "Gold",    price: "₹2,499", duration: "3 Months", icon: Crown, gradient: "from-violet-500 to-purple-600", popular: true,  features: ["30 Phone Screenings", "15 Technical Interviews", "10 Team Members", "Advanced Analytics", "Priority Support", "AI Insights"] },
    { name: "Diamond", price: "₹4,999", duration: "6 Months", icon: Zap,   gradient: "from-amber-500 to-orange-500",  popular: false, features: ["100 Phone Screenings", "50 Technical Interviews", "Unlimited Members", "Full Analytics", "24/7 Support", "Dedicated Manager"] },
  ];

  const testimonials = [
    { name: "Rohit Dogra",   role: "CTO, Driffle",      text: "HirerMind cut our hiring time from 6 weeks to 12 days. The AI phone screening alone saves us 15+ hours a week.",    score: "60% faster" },
    { name: "Priya Sharma",  role: "HR Lead, NexTech",  text: "The ATS scoring and AI interview reports are incredibly accurate. We hired 3 engineers in 10 days using HirerMind.", score: "10 days"    },
    { name: "Rahul Agarwal", role: "Founder, DevHouse", text: "Best investment for our startup. The offer letter feature alone is worth it. Everything is in one place.",           score: "3.5× ROI"   },
  ];

  const pipelineColors: Record<string, { bg: string; num: string; text: string }> = {
    blue:    { bg: "bg-blue-500/10 border-blue-500/20",    num: "text-blue-500",    text: "text-blue-400"    },
    indigo:  { bg: "bg-indigo-500/10 border-indigo-500/20",num: "text-indigo-500",  text: "text-indigo-400"  },
    violet:  { bg: "bg-violet-500/10 border-violet-500/20",num: "text-violet-500",  text: "text-violet-400"  },
    purple:  { bg: "bg-purple-500/10 border-purple-500/20",num: "text-purple-500",  text: "text-purple-400"  },
    emerald: { bg: "bg-emerald-500/10 border-emerald-500/20",num:"text-emerald-500",text: "text-emerald-400" },
  };

  const sectionTag = (label: string) => (
    <div className={`inline-flex items-center gap-2 border px-3 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase mb-5 ${isDark ? "border-zinc-700 text-zinc-400" : "border-zinc-200 text-zinc-500"}`}>
      {label}
    </div>
  );

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>

      {/* ── Header (same as rest of site) ── */}
      <Header />

      {/* ════════ HERO ════════ */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <div className={`inline-flex items-center gap-2 border px-4 py-2 rounded-full text-[11px] font-bold tracking-widest uppercase mb-7 ${isDark ? "border-blue-500/25 bg-blue-500/8 text-blue-400" : "border-blue-200 bg-blue-50 text-blue-600"}`}>
            <Sparkles className="w-3 h-3" />
            AI-Powered Recruitment Platform
          </div>
          <h1 className={`text-5xl md:text-7xl font-black leading-[1.0] tracking-tight mb-6 ${text}`} style={{ fontFamily: "'Syne', sans-serif" }}>
            Hire Smarter.<br />
            <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">Move Faster.</span>
          </h1>
          <p className={`text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed ${muted}`}>
            From job posting to offer letter — HirerMind automates your entire hiring pipeline with AI phone screening, technical interviews, and ATS scoring.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <button onClick={() => setShowSignupModal(true)}
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-[0_0_28px_rgba(59,130,246,0.35)]">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </button>
            <Link to="/login">
              <button className={`flex items-center gap-2 px-7 py-3.5 rounded-xl border font-bold text-sm transition-all ${isDark ? "border-zinc-700 text-zinc-300 hover:text-white" : "border-zinc-300 text-zinc-700"}`}>
                <Play className="w-4 h-4" /> See Demo
              </button>
            </Link>
          </div>
          <div className={`flex flex-wrap items-center justify-center gap-5 text-xs ${muted}`}>
            {["No credit card required", "14-day free trial", "Setup in 5 minutes", "500+ companies"].map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />{t}
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline mockup */}
        <div className="container mx-auto max-w-4xl mt-16 px-4">
          <div className={`rounded-2xl border ${isDark ? "bg-[#0d0d14] border-zinc-800" : "bg-zinc-50 border-zinc-200"} p-6 shadow-2xl`}>
            <div className={`flex items-center gap-2 mb-5 pb-4 border-b ${border}`}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" /><div className="w-3 h-3 rounded-full bg-amber-500/70" /><div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <span className={`text-xs ${muted}`}>HirerMind — Recruitment Pipeline</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Applied",     count: 48, c: "bg-blue-500/10 border-blue-500/20 text-blue-400"    },
                { label: "AI Screened", count: 32, c: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" },
                { label: "Interviewed", count: 18, c: "bg-violet-500/10 border-violet-500/20 text-violet-400" },
                { label: "Hired",       count: 6,  c: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
              ].map(({ label, count, c }) => (
                <div key={label} className={`rounded-xl border p-4 ${c}`}>
                  <p className="text-2xl font-black mb-0.5" style={{ fontFamily: "'Syne', sans-serif" }}>{count}</p>
                  <p className="text-xs font-semibold opacity-80">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════ STATS ════════ */}
      <section className={`border-y ${border} py-10`} id="analytics">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <p className={`text-3xl font-black mb-1 ${text}`} style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</p>
                <p className={`text-sm ${muted}`}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ FEATURES ════════ */}
      <section id="features" className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            {sectionTag("Platform Features")}
            <h2 className={`text-4xl md:text-5xl font-black mb-4 ${text}`} style={{ fontFamily: "'Syne', sans-serif" }}>
              Everything Google Forms{" "}
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">can't do</span>
            </h2>
            <p className={`text-lg max-w-xl mx-auto ${muted}`}>HirerMind automates the parts that eat your time — so you focus on the right candidates.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className={`rounded-2xl border p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${card}`}>
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${f.bg}`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className={`text-base font-bold mb-2 ${text}`}>{f.title}</h3>
                  <p className={`text-sm leading-relaxed ${muted}`}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════ PIPELINE ════════ */}
      <section id="pipeline" className={`py-24 px-4 border-y ${border} ${isDark ? "bg-[#0a0a0f]" : "bg-zinc-50/60"}`}>
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            {sectionTag("Hiring Pipeline")}
            <h2 className={`text-4xl md:text-5xl font-black mb-4 ${text}`} style={{ fontFamily: "'Syne', sans-serif" }}>
              From job post to offer{" "}
              <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">in 5 steps</span>
            </h2>
            <p className={`text-lg max-w-xl mx-auto ${muted}`}>Your entire recruitment pipeline, automated end-to-end.</p>
          </div>
          <div className="space-y-4">
            {pipeline.map((p, i) => {
              const c = pipelineColors[p.color];
              return (
                <div key={i} className={`flex items-center gap-5 rounded-2xl border p-5 transition-all hover:shadow-md ${card}`}>
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${c.bg}`}>
                    <span className={`text-lg font-black ${c.num}`} style={{ fontFamily: "'Syne', sans-serif" }}>{p.step}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-bold mb-0.5 ${text}`}>{p.label}</h3>
                    <p className={`text-xs leading-relaxed ${muted}`}>{p.desc}</p>
                  </div>
                  <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${c.text}`} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════ TESTIMONIALS ════════ */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            {sectionTag("Customer Stories")}
            <h2 className={`text-4xl font-black mb-4 ${text}`} style={{ fontFamily: "'Syne', sans-serif" }}>
              500+ teams hire faster with HirerMind
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div key={i} className={`rounded-2xl border p-5 ${card}`}>
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className={`text-sm leading-relaxed mb-4 ${muted}`}>"{t.text}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-bold ${text}`}>{t.name}</p>
                    <p className={`text-xs ${muted}`}>{t.role}</p>
                  </div>
                  <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">{t.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ PRICING ════════ */}
      <section id="pricing" className={`py-24 px-4 border-y ${border} ${isDark ? "bg-[#0a0a0f]" : "bg-zinc-50/60"}`}>
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            {sectionTag("Pricing")}
            <h2 className={`text-4xl md:text-5xl font-black mb-4 ${text}`} style={{ fontFamily: "'Syne', sans-serif" }}>
              Simple,{" "}
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">transparent</span>{" "}
              pricing
            </h2>
            <p className={`text-lg ${muted}`}>All plans include a free trial. No hidden fees.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div key={plan.name} className={`relative rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl
                  ${plan.popular
                    ? (isDark ? "border-violet-500/40 shadow-[0_0_30px_rgba(139,92,246,0.15)]" : "border-violet-400 shadow-lg")
                    : (isDark ? "border-zinc-800" : "border-zinc-200")
                  } ${isDark ? "bg-[#0d0d14]" : "bg-white"}`}
                >
                  {plan.popular && <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${plan.gradient}`} />}
                  <div className="p-6">
                    <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${plan.gradient} text-white mb-4 shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {plan.popular && (
                      <span className="float-right text-[10px] font-black px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">Most Popular</span>
                    )}
                    <h3 className={`text-lg font-black mb-0.5 ${text}`} style={{ fontFamily: "'Syne', sans-serif" }}>{plan.name}</h3>
                    <p className={`text-xs mb-5 ${muted}`}>{plan.duration}</p>
                    <div className="flex items-end gap-1 mb-6">
                      <span className={`text-4xl font-black ${text}`} style={{ fontFamily: "'Syne', sans-serif" }}>{plan.price}</span>
                      <span className={`text-sm mb-1.5 ${muted}`}>/mo</span>
                    </div>
                    <ul className="space-y-2.5 mb-7">
                      {plan.features.map((f, fi) => (
                        <li key={fi} className={`flex items-center gap-2.5 text-sm ${muted}`}>
                          <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                    <Link to="/dashboard/subscription">
                      <button className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all
                        ${plan.popular
                          ? `bg-gradient-to-r ${plan.gradient} text-white shadow-lg hover:opacity-90`
                          : (isDark ? "border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white" : "border border-zinc-300 text-zinc-700 hover:border-zinc-400")
                        }`}>
                        Get {plan.name}
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════ FINAL CTA ════════ */}
      <section className="py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
          <div className="w-[500px] h-[300px] bg-blue-600/8 blur-[100px] rounded-full" />
        </div>
        <div className="container mx-auto max-w-2xl relative z-10">
          <h2 className={`text-4xl md:text-5xl font-black mb-5 ${text}`} style={{ fontFamily: "'Syne', sans-serif" }}>
            Ready to hire{" "}
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">3× faster?</span>
          </h2>
          <p className={`text-lg mb-8 ${muted}`}>Join 500+ companies who automated their hiring pipeline with HirerMind.</p>
          <button onClick={() => setShowSignupModal(true)}
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-all mx-auto shadow-[0_0_32px_rgba(59,130,246,0.4)]">
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </button>
          <p className={`text-xs mt-4 ${muted}`}>No credit card required · 14-day free trial · Cancel anytime</p>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <Footer />

      {/* ════════ SIGNUP MODAL ════════ */}
      <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
        <DialogContent className={`max-w-md p-0 gap-0 rounded-2xl border overflow-hidden ${isDark ? "bg-[#0d0d14] border-zinc-800" : "bg-white border-zinc-200"}`}>
          <div className="h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
          <div className="p-6">
            <DialogHeader className="mb-5">
              <DialogTitle className={`text-center text-xl font-black ${text}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                Choose Your Account Type
              </DialogTitle>
              <p className={`text-center text-sm mt-1 ${muted}`}>Get started for free — no credit card needed</p>
            </DialogHeader>
            <div className="space-y-3">
              <Link to="/auth/signup" className="no-underline" onClick={() => setShowSignupModal(false)}>
                <div className={`group cursor-pointer rounded-xl border p-5 transition-all duration-200 ${isDark ? "border-zinc-800 hover:border-blue-500/50 bg-zinc-900/40" : "border-zinc-200 hover:border-blue-400 bg-zinc-50 hover:bg-blue-50/20"}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Building className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-base mb-0.5 ${text}`}>Company Signup</p>
                      <p className={`text-xs ${muted}`}>Post jobs, manage candidates, streamline hiring</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${muted} group-hover:text-blue-400 transition-colors`} />
                  </div>
                </div>
              </Link>
              <Link to="/candidate/signup" className="no-underline" onClick={() => setShowSignupModal(false)}>
                <div className={`group cursor-pointer rounded-xl border p-5 transition-all duration-200 ${isDark ? "border-zinc-800 hover:border-indigo-500/50 bg-zinc-900/40" : "border-zinc-200 hover:border-indigo-400 bg-zinc-50 hover:bg-indigo-50/20"}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-base mb-0.5 ${text}`}>Candidate Signup</p>
                      <p className={`text-xs ${muted}`}>Apply for jobs, track applications, manage career</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${muted} group-hover:text-indigo-400 transition-colors`} />
                  </div>
                </div>
              </Link>
            </div>
            <p className={`text-center text-xs mt-5 ${muted}`}>
              Already have an account?{" "}
              <Link to="/login" className="text-blue-500 hover:text-blue-400 font-semibold" onClick={() => setShowSignupModal(false)}>Login</Link>
            </p>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default FeaturesPage;