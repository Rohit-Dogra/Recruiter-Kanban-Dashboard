import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardHeader from "@/components/DashboardHeader";
import InterviewScheduler from "@/components/InterviewScheduler";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Calendar, Clock, Video, MapPin, Plus, Filter, Phone, ChevronLeft, ChevronRight, List, LayoutGrid } from "lucide-react";
import interviewService, { Interview } from "@/services/interview.service";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subWeeks,
  subMonths,
  isSameDay,
  isSameMonth,
  eachDayOfInterval,
  setHours,
} from "date-fns";

// ── Types ────────────────────────────────────────────────────────────────────

interface ProcessedInterview {
  id: number;
  candidate: string;
  position: string;
  time: string;
  duration: string;
  type: string;
  interviewer: string;
  location: string;
  status: string;
  meetingUrl?: string;
  mapLink?: string;
  notes?: string;
  scheduledDate: string;
  fullInterview: Interview;
}

type CalendarMode = "week" | "month";
type ViewMode = "calendar" | "list";

// ── Constants ────────────────────────────────────────────────────────────────

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_SLOTS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

// ── Component ────────────────────────────────────────────────────────────────

const Interviews = () => {
  const { toast } = useToast();
  const [showScheduler, setShowScheduler] = useState(false);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<ProcessedInterview | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterToday, setFilterToday] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch interviews
  useEffect(() => {
    const fetchInterviews = async () => {
      setLoading(true);
      try {
        const data = await interviewService.getAllInterviews();
        setInterviews(data);
      } catch (error) {
        console.error("Error fetching interviews:", error);
        toast({
          title: "Error",
          description: "Failed to load interviews",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, [showScheduler, toast]);

  // Format date for display
  const formatInterviewDate = useCallback((dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return `Today, ${format(date, "h:mm a")}`;
    if (isTomorrow(date)) return `Tomorrow, ${format(date, "h:mm a")}`;
    return format(date, "MMM d, h:mm a");
  }, []);

  // Process interviews for display
  const processedInterviews: ProcessedInterview[] = useMemo(() => {
    return interviews
      .filter((interview) => {
        if (filterToday && !isToday(parseISO(interview.scheduledDate))) return false;
        if (filterType === "today" && !isToday(parseISO(interview.scheduledDate))) return false;
        if (filterType === "week") {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const eow = new Date(today);
          eow.setDate(today.getDate() + (7 - today.getDay()));
          const date = parseISO(interview.scheduledDate);
          if (!(date >= today && date <= eow)) return false;
        }
        if (filterType === "video" && interview.type !== "video") return false;
        if (filterType === "onsite" && interview.type !== "in-person") return false;
        return true;
      })
      .map((interview) => {
        // Backend eager-loads candidate & job on application; TS type doesn't reflect this
        const app = interview.application as any;
        const candidate = app?.candidate ?? app?.candidateProfile;
        const job = app?.job;
        return {
          id: interview.id,
          candidate: candidate ? `${candidate.firstName} ${candidate.lastName}` : "Unknown Candidate",
          position: job?.title || "Unknown Position",
          time: formatInterviewDate(interview.scheduledDate),
          duration: `${interview.duration || 60} min`,
          type: interview.type,
          interviewer: interview.interviewer
            ? `${interview.interviewer.firstName} ${interview.interviewer.lastName}`
            : "Not Assigned",
          location: interview.location || interview.meetingUrl || "No location set",
          status: interview.status,
          meetingUrl: interview.meetingUrl,
          mapLink: interview.mapLink,
          notes: interview.notes,
          scheduledDate: interview.scheduledDate,
          fullInterview: interview,
        };
      });
  }, [interviews, filterToday, filterType, formatInterviewDate]);

  // Stats
  const interviewStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eow = new Date(today);
    eow.setDate(today.getDate() + (7 - today.getDay()));

    const todayCount = interviews.filter((i) => isToday(parseISO(i.scheduledDate))).length;
    const weekCount = interviews.filter((i) => {
      const d = parseISO(i.scheduledDate);
      return d >= today && d <= eow;
    }).length;
    const videoCount = interviews.filter((i) => i.type === "video").length;
    const onsiteCount = interviews.filter((i) => i.type === "in-person").length;

    return [
      { title: "Today's Interviews", value: todayCount.toString(), icon: Calendar, filterKey: "today" as const },
      { title: "This Week", value: weekCount.toString(), icon: Clock, filterKey: "week" as const },
      { title: "Video Calls", value: videoCount.toString(), icon: Video, filterKey: "video" as const },
      { title: "On-site", value: onsiteCount.toString(), icon: MapPin, filterKey: "onsite" as const },
    ];
  }, [interviews]);

  // Calendar navigation
  const navigateCalendar = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      calendarMode === "week"
        ? direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1)
        : direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const goToToday = () => setCurrentDate(new Date());

  // Get interviews for a specific day
  const getInterviewsForDay = useCallback(
    (day: Date) =>
      processedInterviews.filter((i) => isSameDay(parseISO(i.scheduledDate), day)),
    [processedInterviews]
  );

  // Get interviews for a specific day and hour
  const getInterviewsForSlot = useCallback(
    (day: Date, hour: number) =>
      processedInterviews.filter((i) => {
        const d = parseISO(i.scheduledDate);
        return isSameDay(d, day) && d.getHours() === hour;
      }),
    [processedInterviews]
  );

  // Quick schedule: click empty slot
  const handleSlotClick = (day: Date, hour?: number) => {
    // Open scheduler dialog
    setShowScheduler(true);
  };

  // Type badge helper
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "video":
        return (
          <StatusBadge status="processing" className="gap-1">
            <Video className="h-3 w-3" /> Video
          </StatusBadge>
        );
      case "in-person":
        return (
          <StatusBadge status="active" className="gap-1">
            <MapPin className="h-3 w-3" /> In-Person
          </StatusBadge>
        );
      default:
        return (
          <StatusBadge status="pending" className="gap-1">
            <Phone className="h-3 w-3" /> Phone
          </StatusBadge>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
      case "scheduled":
        return <StatusBadge status="scheduled">{status}</StatusBadge>;
      case "completed":
        return <StatusBadge status="completed">Completed</StatusBadge>;
      case "cancelled":
        return <StatusBadge status="cancelled">Cancelled</StatusBadge>;
      case "pending":
        return <StatusBadge status="pending">Pending</StatusBadge>;
      default:
        return <StatusBadge status="pending">{status}</StatusBadge>;
    }
  };

  // ── Week days for calendar ──────────────────────────────────────────────

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  // ── Month days for calendar ─────────────────────────────────────────────

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  // Calendar title
  const calendarTitle =
    calendarMode === "week"
      ? `${format(weekDays[0], "MMM d")} – ${format(weekDays[6], "MMM d, yyyy")}`
      : format(currentDate, "MMMM yyyy");

  // ── DataTable columns for list view ─────────────────────────────────────

  const tableColumns: DataTableColumn<ProcessedInterview>[] = useMemo(
    () => [
      {
        id: "candidate",
        header: "Candidate",
        accessorFn: (row) => (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {row.candidate.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-foreground">{row.candidate}</div>
              <div className="text-xs text-muted-foreground">{row.position}</div>
            </div>
          </div>
        ),
        sortValue: (row) => row.candidate,
      },
      {
        id: "date",
        header: "Date & Time",
        accessorFn: (row) => (
          <div>
            <div className="text-sm font-medium text-foreground">{row.time}</div>
            <div className="text-xs text-muted-foreground">{row.duration}</div>
          </div>
        ),
        sortValue: (row) => row.scheduledDate,
      },
      {
        id: "type",
        header: "Type",
        accessorFn: (row) => getTypeBadge(row.type),
        sortValue: (row) => row.type,
      },
      {
        id: "interviewer",
        header: "Interviewer",
        accessorFn: (row) => <span className="text-sm text-foreground">{row.interviewer}</span>,
        sortValue: (row) => row.interviewer,
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => getStatusBadge(row.status),
        sortValue: (row) => row.status,
      },
      {
        id: "actions",
        header: "",
        sortable: false,
        accessorFn: (row) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedInterview(row);
              setShowDetails(true);
            }}
          >
            Details
          </Button>
        ),
      },
    ],
    []
  );

  // ── Render: Interview card on calendar ──────────────────────────────────

  const renderInterviewCard = (interview: ProcessedInterview, compact = false) => (
    <motion.div
      key={interview.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-md border border-border bg-card p-1.5 text-xs shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
        compact ? "" : "space-y-0.5"
      }`}
      onClick={() => {
        setSelectedInterview(interview);
        setShowDetails(true);
      }}
    >
      <div className="font-medium text-foreground truncate">{format(parseISO(interview.scheduledDate), "h:mm a")}</div>
      <div className="text-foreground truncate">{interview.candidate}</div>
      {!compact && (
        <>
          <div className="text-muted-foreground truncate">{interview.interviewer}</div>
          <div className="mt-0.5">{getTypeBadge(interview.type)}</div>
        </>
      )}
    </motion.div>
  );

  // ── Render: Week View ───────────────────────────────────────────────────

  const renderWeekView = () => (
    <div className="overflow-auto rounded-lg border border-border bg-card">
      {/* Header row */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border sticky top-0 bg-card z-10">
        <div className="p-2 text-xs text-muted-foreground border-r border-border" />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={`p-2 text-center border-r border-border last:border-r-0 ${
              isToday(day) ? "bg-primary/5" : ""
            }`}
          >
            <div className="text-xs text-muted-foreground">{format(day, "EEE")}</div>
            <div
              className={`text-sm font-semibold ${
                isToday(day)
                  ? "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center mx-auto"
                  : "text-foreground"
              }`}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Time slots */}
      <div className="max-h-[500px] overflow-y-auto">
        {HOUR_SLOTS.map((hour) => (
          <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border last:border-b-0 min-h-[60px]">
            <div className="p-1 text-xs text-muted-foreground border-r border-border flex items-start justify-end pr-2 pt-1">
              {format(setHours(new Date(), hour), "h a")}
            </div>
            {weekDays.map((day) => {
              const slotInterviews = getInterviewsForSlot(day, hour);
              return (
                <div
                  key={day.toISOString()}
                  className={`border-r border-border last:border-r-0 p-0.5 cursor-pointer hover:bg-muted/50 transition-colors ${
                    isToday(day) ? "bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    if (slotInterviews.length === 0) handleSlotClick(day, hour);
                  }}
                >
                  <div className="space-y-0.5">
                    {slotInterviews.map((interview) => renderInterviewCard(interview))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  // ── Render: Month View ──────────────────────────────────────────────────

  const renderMonthView = () => (
    <div className="rounded-lg border border-border bg-card">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground border-r border-border last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {monthDays.map((day, idx) => {
          const dayInterviews = getInterviewsForDay(day);
          const inCurrentMonth = isSameMonth(day, currentDate);
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[100px] border-r border-b border-border last:border-r-0 p-1 cursor-pointer hover:bg-muted/50 transition-colors ${
                !inCurrentMonth ? "opacity-40" : ""
              } ${isToday(day) ? "bg-primary/5" : ""}`}
              onClick={() => {
                if (dayInterviews.length === 0) handleSlotClick(day);
              }}
            >
              <div
                className={`text-xs font-medium mb-1 ${
                  isToday(day)
                    ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                    : "text-foreground p-0.5"
                }`}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {dayInterviews.slice(0, 3).map((interview) => renderInterviewCard(interview, true))}
                {dayInterviews.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{dayInterviews.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Main Render ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Interviews"
        subtitle="Manage and schedule candidate interviews"
        action={
          <Button onClick={() => setShowScheduler(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Interview
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {interviewStats.map((stat) => (
          <div
            key={stat.title}
            onClick={() => setFilterType(filterType === stat.filterKey ? null : stat.filterKey)}
            className="cursor-pointer"
          >
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              className={
                filterType === stat.filterKey
                  ? "ring-2 ring-primary bg-primary/5"
                  : ""
              }
            />
          </div>
        ))}
      </div>

      {/* View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* View mode toggle: Calendar / List */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="calendar" className="gap-1.5">
                <LayoutGrid className="h-4 w-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-1.5">
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Calendar mode toggle: Week / Month (only when calendar view) */}
          {viewMode === "calendar" && (
            <Tabs value={calendarMode} onValueChange={(v) => setCalendarMode(v as CalendarMode)}>
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        <div className="flex items-center gap-2">
          {viewMode === "calendar" && (
            <>
              <Button variant="outline" size="sm" onClick={() => navigateCalendar("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateCalendar("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-foreground ml-2">{calendarTitle}</span>
            </>
          )}

          <Button variant="outline" size="sm" onClick={() => setFilterToday(!filterToday)}>
            <Filter className="w-4 h-4 mr-2" />
            {filterToday ? "Show All" : "Today Only"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <PageSkeleton variant="table" count={6} />
      ) : processedInterviews.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No interviews found"
          description="Schedule your first interview to get started. Click an empty time slot or use the button above."
          actionLabel="Schedule Interview"
          onAction={() => setShowScheduler(true)}
        />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {viewMode === "calendar" ? (
              calendarMode === "week" ? renderWeekView() : renderMonthView()
            ) : (
              <DataTable
                columns={tableColumns}
                data={processedInterviews}
                getRowId={(row) => row.id}
                pageSize={10}
                searchPlaceholder="Search interviews…"
                filterFn={(row, search) =>
                  row.candidate.toLowerCase().includes(search) ||
                  row.position.toLowerCase().includes(search) ||
                  row.interviewer.toLowerCase().includes(search) ||
                  row.type.toLowerCase().includes(search)
                }
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Interview Scheduler */}
      <InterviewScheduler open={showScheduler} onOpenChange={setShowScheduler} />

      {/* Interview Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Interview Details</DialogTitle>
          </DialogHeader>
          {selectedInterview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Candidate</Label>
                  <p className="text-foreground">{selectedInterview.candidate}</p>
                </div>
                <div>
                  <Label className="font-semibold">Position</Label>
                  <p className="text-foreground">{selectedInterview.position}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Date & Time</Label>
                  <p className="text-foreground">{selectedInterview.time}</p>
                </div>
                <div>
                  <Label className="font-semibold">Duration</Label>
                  <p className="text-foreground">{selectedInterview.duration}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Type</Label>
                  <div className="mt-1">{getTypeBadge(selectedInterview.type)}</div>
                </div>
                <div>
                  <Label className="font-semibold">Interviewer</Label>
                  <p className="text-foreground">{selectedInterview.interviewer}</p>
                </div>
              </div>

              <div>
                <Label className="font-semibold">Meeting Information</Label>
                {selectedInterview.type === "video" && selectedInterview.meetingUrl && (
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedInterview.meetingUrl, "_blank")}
                      className="mb-2"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Join Meeting
                    </Button>
                    <p className="text-sm">
                      Meeting URL:{" "}
                      <span
                        onClick={() => window.open(selectedInterview.meetingUrl, "_blank")}
                        className="text-primary underline hover:text-primary/80 cursor-pointer font-mono break-all"
                      >
                        {selectedInterview.meetingUrl}
                      </span>
                    </p>
                  </div>
                )}

                {selectedInterview.type === "in-person" && (
                  <div className="mt-2 space-y-2">
                    {selectedInterview.fullInterview?.location && (
                      <div>
                        <p className="text-sm font-medium text-foreground">Address:</p>
                        <p className="text-sm text-muted-foreground">{selectedInterview.fullInterview.location}</p>
                      </div>
                    )}
                    {selectedInterview.mapLink && (
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(selectedInterview.mapLink, "_blank")}
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          View on Google Maps
                        </Button>
                        <p className="text-sm">
                          Map Link:{" "}
                          <span
                            onClick={() => window.open(selectedInterview.mapLink, "_blank")}
                            className="text-primary underline hover:text-primary/80 cursor-pointer font-mono break-all"
                          >
                            {selectedInterview.mapLink}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label className="font-semibold">Status</Label>
                <div className="mt-1">{getStatusBadge(selectedInterview.status)}</div>
              </div>

              {selectedInterview.notes && (
                <div>
                  <Label className="font-semibold">Notes</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedInterview.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Interviews;
