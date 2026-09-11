import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronLeft, ChevronRight, Clock, Video, Globe, CheckCircle2,
  User, Mail, Building2, Loader2, ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BookDemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "select" | "details" | "confirmed";

const timeSlots = [
  "10:00am", "10:30am", "11:00am", "11:30am",
  "12:00pm", "12:30pm", "1:00pm", "1:30pm",
  "2:00pm", "2:30pm", "3:00pm", "3:30pm",
  "4:00pm", "4:30pm", "5:00pm",
];

const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const BookDemoModal = ({ open, onOpenChange }: BookDemoModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("select");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", teamSize: "" });

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const days: { day: number; currentMonth: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, currentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, currentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false });
    }
    return days;
  }, [currentMonth]);

  const isWeekday = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dow = date.getDay();
    return dow !== 0 && dow !== 6;
  };

  const isPast = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date < today;
  };

  const isAvailable = (day: number) => isWeekday(day) && !isPast(day);

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const handleDateClick = (day: number) => {
    if (!isAvailable(day)) return;
    setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    setSelectedTime("");
  };

  const prevMonthNav = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const nextMonthNav = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  const isPrevDisabled = () =>
    currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() <= today.getMonth();

  const formatDateHeading = () => {
    if (!selectedDate) return "";
    return `${dayNames[selectedDate.getDay()]}, ${monthNames[selectedDate.getMonth()]} ${selectedDate.getDate()}`;
  };

  // Parse "10:00am" / "1:30pm" → minutes since midnight
  const parseSlotMinutes = (slot: string) => {
    const match = slot.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
    if (!match) return 0;
    let hours = parseInt(match[1]);
    const mins = parseInt(match[2]);
    const period = match[3].toLowerCase();
    if (period === "pm" && hours !== 12) hours += 12;
    if (period === "am" && hours === 12) hours = 0;
    return hours * 60 + mins;
  };

  // Filter out past time slots when selected date is today
  const availableSlots = useMemo(() => {
    if (!selectedDate) return timeSlots;
    const isToday =
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear();
    if (!isToday) return timeSlots;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return timeSlots.filter((slot) => parseSlotMinutes(slot) > nowMinutes);
  }, [selectedDate, today]);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.company) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_URL}/public/book-demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          company: form.company,
          teamSize: form.teamSize || null,
          date: selectedDate?.toISOString().split("T")[0],
          time: selectedTime,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Booking failed");
      setStep("confirmed");
      toast({ title: "Demo booked successfully!" });
    } catch (err: any) {
      toast({ title: err.message || "Failed to book demo", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("select");
    setSelectedDate(null);
    setSelectedTime("");
    setForm({ name: "", email: "", company: "", teamSize: "" });
  };

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`max-h-[90vh] p-0 gap-0 overflow-hidden border-0 w-[95vw] ${step === "select" && selectedDate ? "max-w-[740px]" : step === "select" ? "max-w-[560px]" : "max-w-[480px]"} transition-[max-width] duration-300`}>
        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-info via-info to-primary" />

        {step === "confirmed" ? (
          /* ── Confirmation Screen ── */
          <div className="text-center py-10 sm:py-14 px-6 sm:px-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-success/14 flex items-center justify-center mx-auto mb-4 sm:mb-5">
              <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-success" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">You're All Set!</h2>
            <p className="text-muted-foreground text-sm mb-1">Your demo is booked for</p>
            <p className="font-semibold text-sm sm:text-base">{formatDateHeading()} at {selectedTime}</p>
            <p className="text-muted-foreground text-xs sm:text-sm mt-3">
              A confirmation email will be sent to {form.email}
            </p>
            <Button className="mt-6 sm:mt-8" variant="outline" onClick={() => handleClose(false)}>
              Close
            </Button>
          </div>
        ) : step === "details" ? (
          /* ── Details Form ── */
          <div className="p-5 sm:p-8 max-w-md mx-auto w-full overflow-y-auto max-h-[calc(90vh-10px)]">
            <button
              onClick={() => setStep("select")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h2 className="text-lg sm:text-xl font-bold mb-1">Enter Your Details</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-5 sm:mb-6">
              {formatDateHeading()} at {selectedTime} · 30 min · Google Meet
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="demo-name" className="flex items-center gap-1.5 mb-1.5 text-sm">
                  <User className="w-3.5 h-3.5" /> Full Name <span className="text-destructive">*</span>
                </Label>
                <Input id="demo-name" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="demo-email" className="flex items-center gap-1.5 mb-1.5 text-sm">
                  <Mail className="w-3.5 h-3.5" /> Work Email <span className="text-destructive">*</span>
                </Label>
                <Input id="demo-email" type="email" placeholder="john@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="demo-company" className="flex items-center gap-1.5 mb-1.5 text-sm">
                  <Building2 className="w-3.5 h-3.5" /> Company <span className="text-destructive">*</span>
                </Label>
                <Input id="demo-company" placeholder="Acme Inc." value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Team Size</Label>
                <Select value={form.teamSize} onValueChange={(v) => setForm({ ...form, teamSize: v })}>
                  <SelectTrigger><SelectValue placeholder="Select team size" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1–10 employees</SelectItem>
                    <SelectItem value="11-50">11–50 employees</SelectItem>
                    <SelectItem value="51-200">51–200 employees</SelectItem>
                    <SelectItem value="201-500">201–500 employees</SelectItem>
                    <SelectItem value="500+">500+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full mt-6" onClick={handleSubmit} disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scheduling...</> : "Schedule Event"}
            </Button>
          </div>
        ) : (

          /* ── Main Calendly-style layout ── */
          <div className="flex flex-col md:flex-row overflow-y-auto max-h-[calc(90vh-10px)]">

            {/* Left Panel — Meeting Info */}
            <div className="md:w-[200px] shrink-0 border-b md:border-b-0 md:border-r border-border p-4 sm:p-6 flex flex-row md:flex-col gap-4 md:gap-0">
              <div className="flex items-center gap-2 md:mb-4">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-info flex items-center justify-center">
                  <span className="text-white font-bold text-xs sm:text-sm">H</span>
                </div>
                <span className="font-semibold text-sm text-info">Hyre</span>
              </div>

              {/* Mobile: inline row | Desktop: stacked */}
              <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-0 flex-1">
                <div className="hidden md:flex w-10 h-10 rounded-full bg-gradient-to-br from-info to-primary items-center justify-center text-white font-bold text-sm mb-3">
                  HM
                </div>
                <div className="hidden md:block">
                  <p className="text-xs text-muted-foreground">Hyre Team</p>
                  <h3 className="font-bold text-base mt-0.5 mb-4">Product Demo</h3>
                </div>
                <h3 className="md:hidden font-bold text-sm">Product Demo</h3>

                <div className="flex md:flex-col gap-3 md:gap-2.5 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>30 min</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>Google Meet</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
                    <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="text-xs">India Standard Time</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center — Calendar */}
            <div className={`flex-1 p-4 sm:p-6 border-b md:border-b-0 min-w-0 ${selectedDate ? "md:border-r border-border" : ""}`}>
              <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Select a Date & Time</h3>

              {/* Month nav */}
              <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <button
                  onClick={prevMonthNav}
                  disabled={isPrevDisabled()}
                  className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs sm:text-sm font-semibold min-w-[120px] sm:min-w-[130px] text-center">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button onClick={nextMonthNav} className="p-1 rounded hover:bg-muted">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {daysOfWeek.map((d) => (
                  <div key={d} className="text-center text-[10px] sm:text-[11px] font-semibold text-muted-foreground py-1 tracking-wide">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((cell, i) => {
                  if (!cell.currentMonth) {
                    return (
                      <div key={i} className="flex items-center justify-center py-1">
                        <span className="text-xs text-muted-foreground/30">{cell.day}</span>
                      </div>
                    );
                  }
                  const available = isAvailable(cell.day);
                  const selected = isSelected(cell.day);
                  return (
                    <div key={i} className="flex items-center justify-center py-1">
                      <button
                        onClick={() => handleDateClick(cell.day)}
                        disabled={!available}
                        className={`w-8 h-8 rounded-full text-xs font-medium transition-all
                          ${!available ? "text-muted-foreground/30 cursor-not-allowed" : ""}
                          ${available && !selected ? "text-info font-semibold hover:bg-blue-50 dark:hover:bg-blue-950" : ""}
                          ${selected ? "bg-info text-white" : ""}
                        `}
                      >
                        {cell.day}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Timezone */}
              <div className="flex items-center gap-1.5 mt-3 sm:mt-4 text-[10px] sm:text-xs text-muted-foreground">
                <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Time zone · India Standard Time (IST)</span>
              </div>
            </div>

            {/* Right Panel — Time Slots (visible when date selected) */}
            {selectedDate && (
              <div className="md:w-[190px] shrink-0 p-4 sm:p-5 flex flex-col min-h-0">
                <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3 shrink-0">{formatDateHeading()}</h4>
                {availableSlots.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No available slots for today</p>
                ) : (
                  <div className="overflow-y-auto flex-1 min-h-0 max-h-[180px] md:max-h-[340px] pr-1 -mr-1">
                    <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-1 gap-1.5 sm:gap-2">
                      {availableSlots.map((slot) => (
                        <div key={slot} className="relative">
                          {selectedTime === slot ? (
                            <div className="flex gap-1 sm:gap-1.5">
                              <div className="flex-1 bg-muted-foreground text-white text-xs sm:text-sm font-semibold rounded-md py-1.5 sm:py-2 text-center">
                                {slot}
                              </div>
                              <button
                                onClick={() => setStep("details")}
                                className="flex-1 bg-info hover:bg-info/90 text-white text-xs sm:text-sm font-semibold rounded-md py-1.5 sm:py-2 text-center transition-colors"
                              >
                                Confirm
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedTime(slot)}
                              className="w-full border border-info text-info hover:bg-blue-50 dark:hover:bg-blue-950 text-xs sm:text-sm font-semibold rounded-md py-1.5 sm:py-2 text-center transition-colors"
                            >
                              {slot}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookDemoModal;
