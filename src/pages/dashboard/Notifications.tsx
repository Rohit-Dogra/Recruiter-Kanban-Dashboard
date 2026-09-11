import { useState, useEffect } from "react";
import {
  Bell, BellOff, Check, CheckCheck, Trash2,
  Briefcase, UserCheck, Phone, FileText, Award,
  AlertCircle, Info, Clock,
} from "lucide-react";
import { notificationService, Notification as NotificationType } from "@/services/notification.service";
import { formatDistanceToNow } from "date-fns";

/* ── Types ── */
type NotifType  = "job" | "candidate" | "interview" | "offer" | "system" | "alert";
type FilterTab  = "all" | "unread" | "job" | "candidate" | "interview" | "offer" | "alert";

/* ── Notification type config ── */
const typeConfig: Record<NotifType, { icon: any; bg: string; iconColor: string; border: string }> = {
  job:       { icon: Briefcase,   bg: "bg-info/10",    iconColor: "text-info",    border: "border-info/20"   },
  candidate: { icon: UserCheck,   bg: "bg-primary/10",  iconColor: "text-primary",  border: "border-primary/20" },
  interview: { icon: Phone,       bg: "bg-brand-cyan/10",    iconColor: "text-brand-cyan",    border: "border-brand-cyan/20"   },
  offer:     { icon: Award,       bg: "bg-success/10", iconColor: "text-success", border: "border-success/20"},
  system:    { icon: Info,        bg: "bg-muted-foreground/10",    iconColor: "text-muted-foreground",    border: "border-border-strong/20"   },
  alert:     { icon: AlertCircle, bg: "bg-warning/10",  iconColor: "text-warning",  border: "border-warning/20" },
};

/* ── Stage / tag color map — each stage gets its own unique color ── */
const stageColorMap: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  // Application stages
  "applied":        { bg: "bg-info/10",     text: "text-info",     border: "border-info/20",     dot: "bg-info"     },
  "new apply":      { bg: "bg-info/10",     text: "text-info",     border: "border-info/20",     dot: "bg-info"     },
  "new":            { bg: "bg-info/10",      text: "text-info",      border: "border-info/20",      dot: "bg-info"      },
  "reviewed":       { bg: "bg-warning/10",    text: "text-warning",    border: "border-warning/20",    dot: "bg-warning"    },
  "shortlisted":    { bg: "bg-primary/10",   text: "text-primary",   border: "border-primary/20",   dot: "bg-primary"   },
  "technical":      { bg: "bg-primary/10",   text: "text-primary",   border: "border-primary/20",   dot: "bg-primary"   },
  "interview":      { bg: "bg-primary/10",   text: "text-primary",   border: "border-primary/20",   dot: "bg-primary"   },
  "scheduled":      { bg: "bg-primary/10",   text: "text-primary",   border: "border-primary/20",   dot: "bg-primary"   },
  "offer":          { bg: "bg-success/10",  text: "text-success",  border: "border-success/20",  dot: "bg-success"  },
  "offer letter":   { bg: "bg-success/10",  text: "text-success",  border: "border-success/20",  dot: "bg-success"  },
  "offered":        { bg: "bg-success/10",  text: "text-success",  border: "border-success/20",  dot: "bg-success"  },
  "hired":          { bg: "bg-success/10",     text: "text-success",     border: "border-success/20",     dot: "bg-success"     },
  "rejected":       { bg: "bg-destructive/10",      text: "text-destructive",      border: "border-destructive/20",      dot: "bg-destructive"      },
  "withdrawn":      { bg: "bg-secondary",    text: "text-muted-foreground",     border: "border-border",     dot: "bg-muted-foreground"     },
  // Generic tags
  "job":            { bg: "bg-info/10",     text: "text-info",     border: "border-info/20",     dot: "bg-info"     },
  "alert":          { bg: "bg-warning/10",   text: "text-warning",   border: "border-warning/20",   dot: "bg-warning"   },
  "system":         { bg: "bg-secondary",    text: "text-muted-foreground",     border: "border-border",     dot: "bg-muted-foreground"     },
};

const getStageColor = (tag: string) =>
  stageColorMap[tag.toLowerCase()] ?? { bg: "bg-secondary", text: "text-muted-foreground", border: "border-border", dot: "bg-muted-foreground" };

/* ── Filter tabs ── */
const filterTabs: { key: FilterTab; label: string }[] = [
  { key: "all",       label: "All"        },
  { key: "unread",    label: "Unread"     },
  { key: "candidate", label: "Candidates" },
  // { key: "interview", label: "Interviews" },
  // { key: "offer",     label: "Offers"     },
  // { key: "job",       label: "Jobs"       },
  // { key: "alert",     label: "Alerts"     },
];

/* ── Component ── */
const Notifications = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [activeFilter, setActiveFilter]   = useState<FilterTab>("all");
  const [loading, setLoading]             = useState(true);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getAll();
      setNotifications(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = notifications.filter(n => {
    if (activeFilter === "all")    return true;
    if (activeFilter === "unread") return !n.read;
    return n.type === activeFilter;
  });

  const markAllRead  = async () => {
    try { await notificationService.markAllAsRead(); setNotifications(p => p.map(n => ({ ...n, read: true }))); } catch {}
  };
  const markRead     = async (id: number) => {
    try { await notificationService.markAsRead(id); setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n)); } catch {}
  };
  const deleteNotif  = async (id: number) => {
    try { await notificationService.delete(id); setNotifications(p => p.filter(n => n.id !== id)); } catch {}
  };
  const clearAll     = async () => {
    try { await notificationService.clearAll(); setNotifications([]); } catch {}
  };

  return (
    <div className="min-h-full bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-primary/20 bg-primary/10">
                <Bell className="w-4 h-4 text-info" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-destructive px-2 text-xs font-semibold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground ml-12 hidden sm:block">
              Stay updated on candidates, interviews, and pipeline activity
            </p>
          </div>

          <div className="flex items-center gap-2 self-start">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive hover:bg-red-50 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear all</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
          {[
            { label: "Total",      value: notifications.length,                                  icon: Bell,        num: "text-foreground"   },
            { label: "Unread",     value: unreadCount,                                           icon: AlertCircle, num: "text-info"     },
            // { label: "Interviews", value: notifications.filter(n => n.type === "interview").length, icon: Phone,  num: "text-brand-cyan"     },
            // { label: "Offers",     value: notifications.filter(n => n.type === "offer").length,  icon: Award,       num: "text-success"  },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                <Icon className={`w-4 h-4 flex-shrink-0 ${s.num}`} />
                <div>
                  <p className={`text-lg font-bold leading-none ${s.num}`}>{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => {
            const count = tab.key === "all"
              ? notifications.length
              : tab.key === "unread"
              ? unreadCount
              : notifications.filter(n => n.type === tab.key).length;
            const isActive = activeFilter === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150
                  ${isActive
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                  }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                    ${isActive ? "bg-surface/25 text-white" : "bg-muted text-muted-foreground"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Notification list ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-info border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Loading notifications…</p>
            </div>
          </div>

        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-4">
              <BellOff className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">No notifications</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {activeFilter === "unread"
                ? "You're all caught up! No unread notifications."
                : "Nothing here yet. Activity will show up as it happens."}
            </p>
          </div>

        ) : (
          <div className="space-y-1.5">
            {filtered.map((notif) => {
              const cfg  = typeConfig[notif.type as NotifType] ?? typeConfig.system;
              const Icon = cfg.icon;
              const tag  = notif.tag || notif.stage || notif.type;
              const sc   = getStageColor(tag);

              return (
                <div
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  className={`group relative flex items-start gap-3 sm:gap-4 px-3 sm:px-4 py-4 rounded-xl border transition-all duration-150 cursor-default
                    ${!notif.read
                      ? "bg-info/5 border-info/15 hover:bg-info/8"
                      : "bg-card border-border hover:bg-muted/20"
                    }`}
                >
                  {/* Unread dot */}
                  {!notif.read && (
                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-info" />
                  )}

                  {/* Type icon */}
                  <div className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center ${cfg.bg} ${cfg.border}`}>
                    <Icon style={{ width: 17, height: 17 }} className={cfg.iconColor} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start flex-wrap gap-x-2 gap-y-1 mb-1">
                      <p className={`text-sm font-semibold leading-snug ${!notif.read ? "text-foreground" : "text-foreground/80"}`}>
                        {notif.title}
                      </p>

                      {/* ── Colorful stage/tag badge ── */}
                      {tag && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border flex-shrink-0 ${sc.bg} ${sc.text} ${sc.border}`}>
                          <span className={`w-1 h-1 rounded-full flex-shrink-0 ${sc.dot}`} />
                          {tag}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>

                    <div className="flex items-center gap-1.5 mt-2">
                      <Clock className="w-3 h-3 text-muted-foreground/40" />
                      <span className="text-[11px] text-muted-foreground/60">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Hover actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 self-start mt-0.5">
                    {!notif.read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markRead(notif.id); }}
                        title="Mark as read"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-info hover:bg-info/10 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                      title="Delete"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {filtered.length > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-6 pb-4">
            Showing {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
            {activeFilter !== "all" && ` · filtered by "${filterTabs.find(t => t.key === activeFilter)?.label}"`}
          </p>
        )}

      </div>
    </div>
  );
};

export default Notifications;