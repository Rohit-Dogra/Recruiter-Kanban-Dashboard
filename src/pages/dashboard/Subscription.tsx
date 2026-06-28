import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check, X, Phone, Video, Zap, Crown, Loader2, ArrowRight,
  Star, Users, BarChart3, Headphones, FileText, UserCheck,
  Receipt, Calendar, CreditCard,
} from "lucide-react";
import subscriptionService, { SubscriptionPlan, SubscriptionStatus } from "@/services/subscription.service";
import { getBillingHistory, type BillingHistoryItem } from "@/services/payment.service";
import { useToast } from "@/hooks/use-toast";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";

/* ── Fallback plans ─────────────────────────────────────────── */
const FALLBACK_PLANS: SubscriptionPlan[] = [
  { id: 0, name: "Free", slug: "free", phoneScreeningsLimit: 0, technicalInterviewsLimit: 0, priceMonthly: 0, priceYearly: 0, features: ["2 Phone Screenings (Trial)", "1 Technical Interview (Trial)", "Basic Job Posting", "Email Support"] },
  { id: 1, name: "Silver", slug: "silver", phoneScreeningsLimit: 10, technicalInterviewsLimit: 5, priceMonthly: 999, priceYearly: 9990, features: ["10 Phone Screenings/month", "5 Technical Interviews/month", "3 Team Members", "Basic Analytics", "Email Support"] },
  { id: 2, name: "Gold", slug: "gold", phoneScreeningsLimit: 30, technicalInterviewsLimit: 15, priceMonthly: 2499, priceYearly: 24990, features: ["30 Phone Screenings/month", "15 Technical Interviews/month", "5 Team Members", "Advanced Analytics", "Priority Support", "AI Insights"] },
  { id: 3, name: "Diamond", slug: "diamond", phoneScreeningsLimit: 100, technicalInterviewsLimit: 50, priceMonthly: 4999, priceYearly: 49990, features: ["100 Phone Screenings/month", "50 Technical Interviews/month", "10 Team Members", "Full Analytics Dashboard", "24/7 Support", "Custom Integrations", "Dedicated Account Manager"] },
];

const planConfig: Record<string, {
  icon: React.ElementType;
  gradient: string;
  glowColor: string;
  borderColor: string;
  badgeBg: string;
  tagline: string;
}> = {
  free: {
    icon: Star,
    gradient: "from-zinc-400 via-zinc-500 to-zinc-600",
    glowColor: "rgba(161,161,170,0.12)",
    borderColor: "border-zinc-500/30",
    badgeBg: "bg-zinc-500/10 text-zinc-400 border-zinc-500/25",
    tagline: "Get started with a free trial",
  },
  silver: {
    icon: Star,
    gradient: "from-sky-400 via-blue-500 to-cyan-500",
    glowColor: "rgba(59,130,246,0.18)",
    borderColor: "border-blue-500/30",
    badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/25",
    tagline: "Perfect for small teams getting started",
  },
  gold: {
    icon: Crown,
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    glowColor: "rgba(139,92,246,0.22)",
    borderColor: "border-violet-500/40",
    badgeBg: "bg-violet-500/10 text-violet-400 border-violet-500/25",
    tagline: "Most popular for growing companies",
  },
  diamond: {
    icon: Zap,
    gradient: "from-amber-400 via-orange-500 to-rose-500",
    glowColor: "rgba(245,158,11,0.18)",
    borderColor: "border-amber-500/30",
    badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    tagline: "Enterprise-grade for large organizations",
  },
};

/* ── Feature comparison data ────────────────────────────────── */
const FEATURE_SECTIONS = [
  {
    section: "AI Phone Screening", icon: Phone, color: "text-blue-400",
    rows: [
      { label: "Phone Screenings / month", free: "2 (trial)", silver: "10", gold: "30", diamond: "100" },
      { label: "AI Call Report", free: true, silver: true, gold: true, diamond: true },
      { label: "Call Transcript", free: true, silver: true, gold: true, diamond: true },
      { label: "Candidate Email Notification", free: true, silver: true, gold: true, diamond: true },
    ],
  },
  {
    section: "AI Technical Interview", icon: Video, color: "text-indigo-400",
    rows: [
      { label: "Technical Interviews / month", free: "1 (trial)", silver: "5", gold: "15", diamond: "50" },
      { label: "Video Interview (Avatar AI)", free: false, silver: false, gold: true, diamond: true },
      { label: "Voice Interview", free: true, silver: true, gold: true, diamond: true },
      { label: "Technical Score & Report", free: true, silver: true, gold: true, diamond: true },
      { label: "Communication Score", free: false, silver: false, gold: true, diamond: true },
      { label: "Custom Interview Questions", free: false, silver: false, gold: true, diamond: true },
    ],
  },
  {
    section: "Job Management", icon: FileText, color: "text-cyan-400",
    rows: [
      { label: "Active Job Postings", free: "1 Job", silver: "3 Jobs", gold: "15 Jobs", diamond: "Unlimited" },
      { label: "AI Job Description Generator", free: true, silver: true, gold: true, diamond: true },
      { label: "Public Job Page", free: true, silver: true, gold: true, diamond: true },
      { label: "Custom Application Form", free: false, silver: false, gold: true, diamond: true },
    ],
  },
  {
    section: "Candidate Pipeline", icon: UserCheck, color: "text-emerald-400",
    rows: [
      { label: "ATS Resume Score", free: true, silver: true, gold: true, diamond: true },
      { label: "Resume Parsing", free: true, silver: true, gold: true, diamond: true },
      { label: "Candidate Stage Tracking", free: true, silver: true, gold: true, diamond: true },
      { label: "Bulk Candidate Actions", free: false, silver: false, gold: true, diamond: true },
    ],
  },
  {
    section: "Team & Collaboration", icon: Users, color: "text-purple-400",
    rows: [
      { label: "Team Members", free: "1", silver: "3", gold: "5", diamond: "10" },
      { label: "Role-based Access Control", free: false, silver: false, gold: true, diamond: true },
    ],
  },
  {
    section: "Analytics & Reports", icon: BarChart3, color: "text-amber-400",
    rows: [
      { label: "Basic Dashboard Analytics", free: true, silver: true, gold: true, diamond: true },
      { label: "Hiring Funnel Report", free: false, silver: false, gold: true, diamond: true },
      { label: "Export Reports (CSV)", free: false, silver: false, gold: true, diamond: true },
    ],
  },
  {
    section: "Support", icon: Headphones, color: "text-zinc-400",
    rows: [
      { label: "Email Support", free: true, silver: true, gold: true, diamond: true },
      { label: "Priority Support", free: false, silver: false, gold: true, diamond: true },
      { label: "24/7 Support", free: false, silver: false, gold: false, diamond: true },
      { label: "Dedicated Account Manager", free: false, silver: false, gold: false, diamond: true },
    ],
  },
];

/* ── Cell renderer ──────────────────────────────────────────── */
const Cell = ({ value }: { value: boolean | string }) => {
  if (value === true) return <div className="flex justify-center"><div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center"><Check className="w-3 h-3 text-emerald-400" /></div></div>;
  if (value === false) return <div className="flex justify-center"><div className="w-5 h-5 rounded-full bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center"><X className="w-3 h-3 text-zinc-600" /></div></div>;
  return <span className="text-xs font-bold text-foreground block text-center">{value}</span>;
};

/* ── Usage Meter ────────────────────────────────────────────── */
function UsageMeter({ label, used, limit, icon: Icon }: { label: string; used: number; limit: number; icon: React.ElementType }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const remaining = Math.max(0, limit - used);
  const isHigh = pct >= 80;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className={`text-sm font-semibold ${isHigh ? "text-destructive" : "text-foreground"}`}>
          {used} / {limit}
        </span>
      </div>
      <Progress value={pct} className="h-2" />
      <p className="text-xs text-muted-foreground">{remaining} remaining this period</p>
    </div>
  );
}

export default function Subscription() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>(FALLBACK_PLANS);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingPlanId, setActivatingPlanId] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.invitedByUserId) navigate("/dashboard", { replace: true });
  }, [user?.invitedByUserId, navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, statusRes, historyRes] = await Promise.allSettled([
        subscriptionService.getPlans(),
        subscriptionService.getStatus(),
        getBillingHistory(),
      ]);

      if (plansRes.status === "fulfilled" && plansRes.value?.plans?.length) {
        // Include free plan placeholder + paid plans
        const freePlan = FALLBACK_PLANS[0];
        const paidPlans = plansRes.value.plans
          .filter((p) => p.slug !== "free")
          .map((p) => ({
            ...p,
            features: typeof p.features === "string" ? JSON.parse(p.features) : (p.features || []),
          }));
        setPlans(paidPlans.length ? [freePlan, ...paidPlans] : FALLBACK_PLANS);
      }
      if (statusRes.status === "fulfilled") setStatus(statusRes.value);
      if (historyRes.status === "fulfilled") setBillingHistory(historyRes.value.history || []);
    } catch {
      setPlans(FALLBACK_PLANS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePlanClick = async (plan: SubscriptionPlan) => {
    if (plan.slug === "free") return; // Free plan has no action
    if (plan.slug === "silver" && status && !status.trialUsed) {
      setActivatingPlanId(plan.id);
      try {
        await subscriptionService.startTrial();
        toast({ title: "Free Trial Started", description: "2 phone screenings + 1 technical interview." });
        fetchData();
      } catch {
        toast({ title: "Error", description: "Failed to start trial", variant: "destructive" });
      } finally { setActivatingPlanId(null); }
      return;
    }
    navigate(`/dashboard/payment?planId=${plan.id}`);
  };

  const currentPlanSlug = status?.subscription?.planSlug || (status?.source === "trial" ? "free" : null);

  if (loading) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        <PageSkeleton variant="cards" count={4} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 md:p-10 max-w-7xl mx-auto">

        {/* ══════════════ HERO HEADER ══════════════ */}
        <div className="text-center mb-12 relative">
          <div className="absolute inset-0 -z-10 flex justify-center">
            <div className="w-96 h-32 rounded-full bg-primary/8 blur-3xl" />
          </div>
          <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/8 text-primary text-[11px] font-bold tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-5">
            <Zap className="w-3 h-3" />
            AI-Powered Hiring Plans
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-foreground" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em" }}>
            Choose Your{" "}
            <span className="bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">Perfect Plan</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
            Transform hiring with AI Phone Screening and Technical Interviews. Pick the plan that fits your team's growth.
          </p>
        </div>

        <Tabs defaultValue="plans" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="billing">Billing History</TabsTrigger>
          </TabsList>

          {/* ══════════════ PLANS TAB ══════════════ */}
          <TabsContent value="plans" className="space-y-10">
            {/* Plan Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {plans.map((plan) => {
                const cfg = planConfig[plan.slug] || planConfig.silver;
                const Icon = cfg.icon;
                const isPopular = plan.slug === "gold";
                const isCurrent = currentPlanSlug === plan.slug;
                const isFree = plan.slug === "free";
                const isSilverWithTrial = plan.slug === "silver" && status && !status.trialUsed;

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl border overflow-hidden transition-all duration-300 group
                      ${isCurrent ? "ring-2 ring-primary border-primary/40" : ""}
                      ${isPopular && !isCurrent ? `${cfg.borderColor}` : "border-border hover:border-border/80"}
                      hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:-translate-y-1`}
                    style={isPopular ? { boxShadow: `0 0 40px ${cfg.glowColor}` } : undefined}
                  >
                    {isPopular && (
                      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${cfg.gradient}`} />
                    )}
                    {isCurrent && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="default" className="text-[10px] font-bold">Current Plan</Badge>
                      </div>
                    )}
                    {isPopular && !isCurrent && (
                      <div className="absolute top-3 right-3">
                        <div className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full border ${cfg.badgeBg}`}>
                          Most Popular
                        </div>
                      </div>
                    )}

                    <div className="p-6">
                      <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${cfg.gradient} text-white mb-4 shadow-lg`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-black text-foreground mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mb-4">{cfg.tagline}</p>

                      <div className="mb-5">
                        {isFree ? (
                          <div className="flex items-end gap-1">
                            <span className="text-3xl font-black text-foreground" style={{ fontFamily: "'Syne', sans-serif" }}>Free</span>
                          </div>
                        ) : (
                          <div className="flex items-end gap-1">
                            <span className="text-3xl font-black text-foreground" style={{ fontFamily: "'Syne', sans-serif" }}>₹{plan.priceMonthly.toLocaleString()}</span>
                            <span className="text-muted-foreground text-sm mb-1">/mo</span>
                          </div>
                        )}
                        {!isFree && plan.priceYearly && (
                          <p className="text-xs text-muted-foreground mt-1">₹{plan.priceYearly.toLocaleString()}/yr (save {Math.round((1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100)}%)</p>
                        )}
                      </div>

                      <div className="h-px bg-border mb-4" />

                      <ul className="space-y-2 mb-6">
                        {(plan.features || []).map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                            <div className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            </div>
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {isFree ? (
                        status && !status.trialUsed ? (
                          <button
                            onClick={() => handlePlanClick(plans.find(p => p.slug === "silver") || plan)}
                            disabled={!!activatingPlanId}
                            className="w-full h-10 rounded-xl font-bold text-sm border border-border bg-muted/40 hover:bg-muted text-foreground transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <ArrowRight className="w-4 h-4" /> Start Free Trial
                          </button>
                        ) : (
                          <button disabled className="w-full h-10 rounded-xl font-bold text-sm border border-border bg-muted/20 text-muted-foreground cursor-not-allowed flex items-center justify-center gap-2">
                            {status?.trialUsed ? "Trial Used" : "Current"}
                          </button>
                        )
                      ) : isCurrent ? (
                        <button disabled className="w-full h-10 rounded-xl font-bold text-sm border border-primary/30 bg-primary/10 text-primary cursor-default flex items-center justify-center gap-2">
                          <Check className="w-4 h-4" /> Active Plan
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePlanClick(plan)}
                          disabled={!!activatingPlanId}
                          className={`w-full h-10 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                            ${isPopular
                              ? `bg-gradient-to-r ${cfg.gradient} text-white hover:opacity-90`
                              : "border border-border bg-muted/40 hover:bg-muted text-foreground"
                            }`}
                        >
                          {activatingPlanId === plan.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : isSilverWithTrial
                              ? <><ArrowRight className="w-4 h-4" /> Start Free Trial</>
                              : <><ArrowRight className="w-4 h-4" /> Get {plan.name}</>
                          }
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Feature Comparison Table */}
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-foreground mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Full Feature Breakdown
                </h2>
                <p className="text-muted-foreground text-sm">Compare every feature across all plans.</p>
              </div>

              <div className="rounded-2xl border border-border overflow-hidden">
                {/* Sticky header */}
                <div className="grid grid-cols-[1fr_90px_90px_90px_90px] bg-muted/50 border-b border-border">
                  <div className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">Feature</div>
                  {(["free", "silver", "gold", "diamond"] as const).map((slug) => {
                    const cfg = planConfig[slug];
                    const Icon = cfg.icon;
                    const names: Record<string, string> = { free: "Free", silver: "Silver", gold: "Gold", diamond: "Diamond" };
                    const isCurrent = currentPlanSlug === slug;
                    return (
                      <div key={slug} className={`px-2 py-3 text-center ${slug === "gold" ? "bg-violet-500/6" : ""} ${isCurrent ? "bg-primary/5" : ""}`}>
                        <div className={`inline-flex p-1.5 rounded-lg bg-gradient-to-br ${cfg.gradient} text-white mb-1 shadow-sm`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <p className="text-[11px] font-black text-foreground">{names[slug]}</p>
                        {isCurrent && <p className="text-[9px] text-primary font-bold">Current</p>}
                      </div>
                    );
                  })}
                </div>

                {FEATURE_SECTIONS.map((section, si) => {
                  const SectionIcon = section.icon;
                  return (
                    <div key={si}>
                      <div className="flex items-center gap-2 px-5 py-2.5 bg-muted/25 border-b border-border/60">
                        <SectionIcon className={`w-4 h-4 ${section.color}`} />
                        <span className="text-xs font-black text-foreground uppercase tracking-widest">{section.section}</span>
                      </div>
                      {section.rows.map((row, ri) => (
                        <div
                          key={ri}
                          className={`grid grid-cols-[1fr_90px_90px_90px_90px] border-b border-border/30 hover:bg-muted/15 transition-colors ${ri % 2 !== 0 ? "bg-muted/5" : ""}`}
                        >
                          <div className="px-5 py-3">
                            <p className="text-sm font-medium text-foreground">{row.label}</p>
                          </div>
                          <div className="flex items-center justify-center px-2 py-3"><Cell value={row.free} /></div>
                          <div className="flex items-center justify-center px-2 py-3"><Cell value={row.silver} /></div>
                          <div className="flex items-center justify-center px-2 py-3 bg-violet-500/4"><Cell value={row.gold} /></div>
                          <div className="flex items-center justify-center px-2 py-3"><Cell value={row.diamond} /></div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-6 mt-4">
                {[
                  { icon: <div className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-emerald-400" /></div>, label: "Included" },
                  { icon: <div className="w-4 h-4 rounded-full bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center"><X className="w-2.5 h-2.5 text-zinc-600" /></div>, label: "Not included" },
                  { icon: <span className="text-xs font-bold text-foreground">10</span>, label: "Plan limit" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ══════════════ USAGE TAB ══════════════ */}
          <TabsContent value="usage" className="space-y-6">
            {status && (status.source === "trial" || status.source === "subscription") ? (
              <>
                {/* Current plan banner */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                          <Crown className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {status.source === "trial" ? "Free Trial" : (status.subscription?.plan ?? "Subscription")}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {status.source === "trial"
                              ? "Using your free trial limits"
                              : status.subscription?.periodEnd
                                ? `Renews ${new Date(status.subscription.periodEnd).toLocaleDateString()}`
                                : "Active subscription"}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status="active" dot>Active</StatusBadge>
                    </div>
                  </CardHeader>
                </Card>

                {/* Usage meters */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <Card>
                    <CardContent className="pt-6">
                      {status.source === "trial" && status.trial ? (
                        <UsageMeter
                          label="Phone Screenings"
                          used={status.trial.phoneScreeningsUsed}
                          limit={status.trial.phoneScreeningsLimit}
                          icon={Phone}
                        />
                      ) : status.subscription ? (
                        <UsageMeter
                          label="Phone Screenings"
                          used={status.subscription.phoneScreeningsUsed}
                          limit={status.subscription.phoneScreeningsLimit}
                          icon={Phone}
                        />
                      ) : null}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      {status.source === "trial" && status.trial ? (
                        <UsageMeter
                          label="Technical Interviews"
                          used={status.trial.technicalInterviewsUsed}
                          limit={status.trial.technicalInterviewsLimit}
                          icon={Video}
                        />
                      ) : status.subscription ? (
                        <UsageMeter
                          label="Technical Interviews"
                          used={status.subscription.technicalInterviewsUsed}
                          limit={status.subscription.technicalInterviewsLimit}
                          icon={Video}
                        />
                      ) : null}
                    </CardContent>
                  </Card>
                </div>

                {/* Upgrade prompt if on trial or lower plan */}
                {(status.source === "trial" || (status.subscription?.planSlug && status.subscription.planSlug !== "diamond")) && (
                  <Card className="border-dashed">
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        {status.source === "trial"
                          ? "Upgrade to a paid plan for more screenings and interviews."
                          : "Need more capacity? Upgrade your plan."}
                      </p>
                      <Button variant="outline" onClick={() => {
                        const tabTrigger = document.querySelector('[data-state="inactive"][value="plans"]') as HTMLElement;
                        tabTrigger?.click();
                      }}>
                        View Plans <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Active Plan</h3>
                  <p className="text-sm text-muted-foreground mb-4">Start a free trial or subscribe to a plan to begin using AI features.</p>
                  <Button onClick={() => {
                    const tabTrigger = document.querySelector('[data-state="inactive"][value="plans"]') as HTMLElement;
                    tabTrigger?.click();
                  }}>
                    View Plans <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ══════════════ BILLING HISTORY TAB ══════════════ */}
          <TabsContent value="billing" className="space-y-6">
            {billingHistory.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Receipt className="w-5 h-5" />
                    Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="grid grid-cols-[1fr_100px_100px_100px_100px] bg-muted/50 border-b border-border px-4 py-3">
                      <span className="text-xs font-bold text-muted-foreground uppercase">Date</span>
                      <span className="text-xs font-bold text-muted-foreground uppercase">Plan</span>
                      <span className="text-xs font-bold text-muted-foreground uppercase">Cycle</span>
                      <span className="text-xs font-bold text-muted-foreground uppercase text-right">Amount</span>
                      <span className="text-xs font-bold text-muted-foreground uppercase text-center">Status</span>
                    </div>
                    {billingHistory.map((item) => (
                      <div key={item.id} className="grid grid-cols-[1fr_100px_100px_100px_100px] border-b border-border/30 px-4 py-3 hover:bg-muted/10 transition-colors items-center">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-foreground">{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                        <span className="text-sm text-foreground">{item.planName}</span>
                        <span className="text-xs text-muted-foreground capitalize">{item.billingCycle}</span>
                        <span className="text-sm font-semibold text-foreground text-right">₹{item.amount.toLocaleString()}</span>
                        <div className="flex justify-center">
                          <StatusBadge status={item.status === "COMPLETED" ? "completed" : item.status === "FAILED" ? "failed" : "pending"}>
                            {item.status === "COMPLETED" ? "Paid" : item.status === "FAILED" ? "Failed" : "Timeout"}
                          </StatusBadge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Billing History</h3>
                  <p className="text-sm text-muted-foreground">Your payment history will appear here once you subscribe to a plan.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
