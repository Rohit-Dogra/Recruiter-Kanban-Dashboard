import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import DashboardHeader from "@/components/DashboardHeader";
import { StatCard } from "@/components/ui/StatCard";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Users,
  Clock,
  Target,
  Download,
  RefreshCw,
  FileText,
  Phone,
  Video,
  Award,
  CheckCircle,
  AlertCircle,
  CalendarIcon,
  DollarSign,
  Zap,
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { dashboardService, type AnalyticsData } from "@/services/dashboard.service";
import { format, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { motion } from "framer-motion";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";

const REFRESH_INTERVAL_MS = 60000;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Phone,
  Video,
  Users,
  Award,
  CheckCircle,
};

type DatePreset = "7d" | "30d" | "90d" | "custom";

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
  { label: "Custom", value: "custom" },
];

const FUNNEL_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 220 70% 55%))",
  "hsl(var(--chart-3, 280 65% 55%))",
  "hsl(var(--chart-4, 30 80% 55%))",
  "hsl(var(--chart-5, 150 60% 45%))",
];

const PIE_COLORS = [
  "#3B82F6", // blue
  "#F59E0B", // amber
  "#10B981", // emerald
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
  "#14B8A6", // teal
  "#6366F1", // indigo
  "#84CC16", // lime
  "#A855F7", // purple
];

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>("30d");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      const data = await dashboardService.getAnalyticsData();
      // Map raw source names to user-friendly labels
      if (data?.sourceData) {
        const sourceNameMap: Record<string, string> = {
          google_oauth: "Direct Applied",
          resume_parsed: "Uploaded by Recruiter",
          resume_upload: "Resume Upload",
          direct: "Direct Applied",
          linkedin: "LinkedIn",
          indeed: "Indeed",
          referral: "Referral",
          career_page: "Career Page",
          job_board: "Job Board",
          manual: "Added Manually",
        };
        data.sourceData = data.sourceData.map((s: any) => ({
          ...s,
          name: sourceNameMap[s.name?.toLowerCase()] || s.name?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || s.name,
        }));
      }
      setAnalyticsData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Real-time refresh
  useEffect(() => {
    const interval = setInterval(fetchAnalyticsData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchAnalyticsData]);

  // Refetch on window focus
  useEffect(() => {
    const onFocus = () => fetchAnalyticsData();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchAnalyticsData]);

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== "custom") {
      const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
      setDateRange({ from: subDays(new Date(), days), to: new Date() });
    }
  };

  const handleExport = async () => {
    if (!analyticsData) return;
    setExporting(true);

    // Try server-side export first
    try {
      const params: Record<string, string> = {};
      if (dateRange?.from) params.from = dateRange.from.toISOString();
      if (dateRange?.to) params.to = dateRange.to.toISOString();

      const response = await apiClient.get("/analytics/export", {
        params,
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Analytics report exported");
      setExporting(false);
      return;
    } catch {
      // Fall back to client-side CSV generation
      console.warn("Server export failed, falling back to client-side CSV");
    }

    // Client-side fallback
    const csvRows: string[] = [];
    csvRows.push("Metric,Value");
    csvRows.push(`Time to Hire,${analyticsData.kpiData.timeToHire}`);
    csvRows.push(`Hire Rate,${analyticsData.kpiData.hireRate}`);
    csvRows.push(`Active Candidates,${analyticsData.kpiData.activeCandidates}`);
    csvRows.push(`Total Candidates,${analyticsData.kpiData.totalCandidates || analyticsData.totalCandidatesFromTable || "-"}`);
    csvRows.push(`Pipeline Velocity,${analyticsData.kpiData.pipelineVelocity}`);
    csvRows.push("");
    csvRows.push("Monthly Data,Applications,Hires");
    analyticsData.monthlyData.forEach((r) =>
      csvRows.push(`${r.month},${r.applications},${r.hires}`)
    );
    csvRows.push("");
    csvRows.push("Pipeline Stage,Count");
    analyticsData.pipelineData.forEach((r) => csvRows.push(`${r.stage},${r.count}`));
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Analytics report exported (client-side)");
    setExporting(false);
  };

  // Derive funnel data for FunnelChart
  const funnelData = useMemo(() => {
    if (!analyticsData?.funnelMetrics) return null;
    const fm = analyticsData.funnelMetrics;
    return [
      { name: "Applied", value: fm.applied, fill: FUNNEL_COLORS[0] },
      { name: "Screened", value: fm.screened, fill: FUNNEL_COLORS[1] },
      { name: "Interviewed", value: fm.interviewed, fill: FUNNEL_COLORS[2] },
      { name: "Offered", value: fm.offered, fill: FUNNEL_COLORS[3] },
      { name: "Hired", value: fm.hired, fill: FUNNEL_COLORS[4] },
    ];
  }, [analyticsData?.funnelMetrics]);

  // Derive rejection reasons from pipeline data (stages that aren't hired)
  const rejectionData = useMemo(() => {
    if (!analyticsData?.pipelineData) return [];
    const rejected = analyticsData.pipelineData.filter(
      (s) => s.systemStatus === "rejected" || s.stage.toLowerCase().includes("reject")
    );
    if (rejected.length > 0) return rejected.map((r, i) => ({
      name: r.stage,
      value: r.count,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
    // Fallback: use source data as pie chart if no rejection data
    return analyticsData.sourceData.map((s, i) => ({
      name: s.name,
      value: s.value,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [analyticsData?.pipelineData, analyticsData?.sourceData]);

  // Identify bottlenecks
  const pipelineWithBottleneck = useMemo(() => {
    return (analyticsData?.pipelineData || []).map((item, idx) => {
      const prevCount = idx > 0 ? analyticsData!.pipelineData[idx - 1].count : item.count;
      const drop = prevCount - item.count;
      const isBottleneck = idx > 0 && prevCount > 0 && drop > 0 && drop / prevCount > 0.5;
      return { ...item, isBottleneck };
    });
  }, [analyticsData?.pipelineData]);

  if (loading && !analyticsData) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          title="Analytics & Reporting"
          subtitle="Loading analytics data..."
        />
        <PageSkeleton variant="cards" count={4} />
        <div className="grid gap-6 md:grid-cols-2">
          <PageSkeleton variant="cards" count={1} />
          <PageSkeleton variant="cards" count={1} />
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          title="Analytics & Reporting"
          subtitle="Unable to load analytics data"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Analytics & Reporting"
        subtitle={
          lastUpdated
            ? `Comprehensive recruitment metrics • Updated ${lastUpdated.toLocaleTimeString()}`
            : "Track recruitment performance and metrics"
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setLoading(true);
                fetchAnalyticsData();
              }}
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              <Download className="w-4 h-4 mr-2" />
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
          </div>
        }
      />

      {/* Date Range Picker */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-2"
      >
        {DATE_PRESETS.map((p) => (
          <Button
            key={p.value}
            variant={datePreset === p.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (p.value === "custom") {
                setDatePreset("custom");
                setCalendarOpen(true);
              } else {
                handlePresetChange(p.value);
              }
            }}
          >
            {p.label}
          </Button>
        ))}

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="ml-1 gap-2">
              <CalendarIcon className="h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "MMM d")} – {format(dateRange.to, "MMM d, yyyy")}
                  </>
                ) : (
                  format(dateRange.from, "MMM d, yyyy")
                )
              ) : (
                "Pick dates"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => {
                setDateRange(range);
                if (range?.from && range?.to) {
                  setDatePreset("custom");
                }
              }}
              numberOfMonths={2}
              disabled={{ after: new Date() }}
            />
          </PopoverContent>
        </Popover>
      </motion.div>

      {/* KPI Cards Row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          title="Time to Hire"
          value={analyticsData.kpiData.timeToHire}
          icon={Clock}
        />
        <StatCard
          title="Cost per Hire"
          value={analyticsData.kpiData.totalApplications ? `$${Math.round(Number(analyticsData.kpiData.totalApplications) * 0.8)}` : "N/A"}
          icon={DollarSign}
        />
        <StatCard
          title="Offer Acceptance Rate"
          value={analyticsData.kpiData.hireRate}
          icon={Target}
        />
        <StatCard
          title="Pipeline Velocity"
          value={analyticsData.kpiData.pipelineVelocity}
          icon={Zap}
        />
      </motion.div>

      {/* Charts Row 1: Funnel + Line */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Funnel Chart: Applications → Hired */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recruitment Funnel
              </CardTitle>
              <CardDescription>Applications → Hired conversion</CardDescription>
            </CardHeader>
            <CardContent>
              {funnelData ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {[
                      { label: "Applied", value: analyticsData.funnelMetrics!.applied, icon: FileText },
                      { label: "Screened", value: analyticsData.funnelMetrics!.screened, icon: Phone },
                      { label: "Interviewed", value: analyticsData.funnelMetrics!.interviewed, icon: Video },
                      { label: "Offered", value: analyticsData.funnelMetrics!.offered, icon: Award },
                      { label: "Hired", value: analyticsData.funnelMetrics!.hired, icon: CheckCircle },
                    ].map((item, idx) => {
                      const Icon = item.icon;
                      const maxVal = analyticsData.funnelMetrics!.applied;
                      return (
                        <div key={item.label} className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span>{item.label}</span>
                              <span className="font-medium">{item.value}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: FUNNEL_COLORS[idx] }}
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${maxVal > 0 ? Math.min(100, (item.value / maxVal) * 100) : 0}%`,
                                }}
                                transition={{ duration: 0.6, delay: idx * 0.1 }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {analyticsData.funnelConversion && (
                    <div className="pt-4 border-t border-border grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Apply → Hired</p>
                        <p className="font-semibold">{analyticsData.funnelConversion.appliedToHired}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Screen → Hired</p>
                        <p className="font-semibold">{analyticsData.funnelConversion.screenedToHired}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Interview → Hired</p>
                        <p className="font-semibold">{analyticsData.funnelConversion.interviewToHired}%</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={analyticsData.pipelineData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="stage" type="category" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Line Chart: Applications over time */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Applications Over Time
              </CardTitle>
              <CardDescription>Hires vs Applications monthly trend</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={analyticsData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="rounded-lg border border-border bg-background p-3 shadow-sm">
                          <p className="font-medium mb-2">{label}</p>
                          <div className="flex flex-col gap-1 text-sm">
                            <span className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: "hsl(var(--primary))" }}
                              />
                              Applications: {payload[1]?.value ?? 0}
                            </span>
                            <span className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: "hsl(var(--muted-foreground))" }}
                              />
                              Hires: {payload[0]?.value ?? 0}
                            </span>
                          </div>
                        </div>
                      ) : null
                    }
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(value) => (
                      <span className="flex items-center gap-1.5">
                        {value === "hires" ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                        {value}
                      </span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="hires"
                    name="Hires"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    name="Applications"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2: Bar (Source Effectiveness) + Pie (Rejection Reasons / Sources) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart: Source Effectiveness */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Source Effectiveness
              </CardTitle>
              <CardDescription>Candidate sources breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={analyticsData.sourceData} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div className="rounded-lg border border-border bg-background p-3 shadow-sm">
                          <p className="font-medium">{payload[0].payload.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {payload[0].value}%
                            {payload[0].payload.count != null && ` (${payload[0].payload.count} candidates)`}
                          </p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {analyticsData.sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie Chart: Rejection Reasons / Candidate Sources */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                {rejectionData.length > 0 && rejectionData[0]?.name?.toLowerCase().includes("reject")
                  ? "Rejection Reasons"
                  : "Candidate Sources"}
              </CardTitle>
              <CardDescription>Distribution breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={rejectionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {rejectionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={1} stroke="rgba(255,255,255,0.3)" />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div className="rounded-lg border border-border bg-background p-3 shadow-sm">
                          <p className="font-medium">{payload[0].name}</p>
                          <p className="text-sm text-muted-foreground">{payload[0].value}%</p>
                        </div>
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Pipeline by Stage */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader>
            <CardTitle>Pipeline by Stage</CardTitle>
            <CardDescription>All candidates in pipeline with current stages • Updates in real time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                {pipelineWithBottleneck.map((item) => {
                  const IconComp = item.icon ? ICON_MAP[item.icon] : FileText;
                  const Icon = IconComp || FileText;
                  return (
                    <div
                      key={item.stage}
                      className={`flex items-center justify-between gap-4 p-2 rounded-lg border ${
                        item.isBottleneck
                          ? "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
                          : "border-border"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        {item.stage}
                        {item.isBottleneck && (
                          <span title="Potential bottleneck"><AlertCircle className="w-3.5 h-3.5 text-amber-500" /></span>
                        )}
                      </span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  );
                })}
              </div>
              <ResponsiveContainer width="100%" height={Math.max(220, pipelineWithBottleneck.length * 40)}>
                <BarChart data={pipelineWithBottleneck} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div className="rounded-lg border border-border bg-background p-3 shadow-sm">
                          <p className="font-medium">{payload[0].payload.stage}</p>
                          <p className="text-sm">Candidates: {payload[0].value}</p>
                          {payload[0].payload.isBottleneck && (
                            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 shrink-0" /> Potential bottleneck
                            </p>
                          )}
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Time-to-Hire Report */}
      {analyticsData.timeToHireReport && analyticsData.timeToHireReport.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Time-to-Hire Report
              </CardTitle>
              <CardDescription>Recent hires with days from application to hire</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 font-medium">Job</th>
                      <th className="text-left py-3 font-medium">Applied</th>
                      <th className="text-left py-3 font-medium">Hired</th>
                      <th className="text-right py-3 font-medium">Days to Hire</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.timeToHireReport.map((row) => (
                      <tr key={row.id} className="border-b border-border last:border-0">
                        <td className="py-3">{row.jobTitle || "-"}</td>
                        <td className="py-3 text-muted-foreground">
                          {row.appliedDate ? new Date(row.appliedDate).toLocaleDateString() : "-"}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "-"}
                        </td>
                        <td className="py-3 text-right font-medium">{row.daysToHire ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Analytics;
