// import { useState, useEffect } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   PhoneCall, Clock, X, FileQuestion,
//   Sparkles, Plus, Check, ChevronRight,
//   SkipForward, Zap,
// } from "lucide-react";
// import screeningQuestionsService from "@/services/screening-questions.service";
// import { useToast } from "@/hooks/use-toast";

// interface CallConfirmationDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   candidateName: string;
//   jobId?: string | number | null;
//   onConfirm: (option: "skip" | "now" | "1hour" | "2hours") => void;
// }

// export const CallConfirmationDialog = ({
//   open,
//   onOpenChange,
//   candidateName,
//   jobId,
//   onConfirm,
// }: CallConfirmationDialogProps) => {
//   const [selectedOption, setSelectedOption] = useState<"skip" | "now" | "1hour" | "2hours" | null>(null);
//   const [showQuestionsPanel, setShowQuestionsPanel] = useState(false);
//   const [questions, setQuestions] = useState<string[]>([]);
//   const [loadingQuestions, setLoadingQuestions] = useState(false);
//   const [savingQuestions, setSavingQuestions] = useState(false);
//   const [generating, setGenerating] = useState(false);
//   const { toast } = useToast();

//   const numericJobId = jobId != null ? parseInt(String(jobId), 10) : null;
//   const canManageQuestions = !!numericJobId && !isNaN(numericJobId);

//   useEffect(() => {
//     if (open && canManageQuestions) {
//       setLoadingQuestions(true);
//       screeningQuestionsService
//         .getForJob(numericJobId!)
//         .then((q) => setQuestions(Array.isArray(q) && q.length > 0 ? q : [""]))
//         .catch(() => setQuestions([""]))
//         .finally(() => setLoadingQuestions(false));
//     }
//   }, [open, canManageQuestions, numericJobId]);

//   const handleAddQuestion = () => setQuestions([...questions, ""]);

//   const handleQuestionChange = (index: number, value: string) => {
//     const next = [...questions];
//     next[index] = value;
//     setQuestions(next);
//   };

//   const handleRemoveQuestion = (index: number) => {
//     if (questions.length <= 1) return;
//     setQuestions(questions.filter((_, i) => i !== index));
//   };

//   const handleAiGenerate = async () => {
//     if (!numericJobId) return;
//     setGenerating(true);
//     try {
//       const generated = await screeningQuestionsService.generateForJob(numericJobId);
//       setQuestions(generated.length > 0 ? generated : [""]);
//       toast({ title: "Questions generated", description: "Edit or add more as needed." });
//     } catch (e: any) {
//       toast({
//         title: "Could not generate questions",
//         description: e.response?.data?.message || "Try again or add manually.",
//         variant: "destructive",
//       });
//     } finally {
//       setGenerating(false);
//     }
//   };

//   const handleFinishQuestions = async () => {
//     const toSave = questions.map((q) => q.trim()).filter(Boolean);
//     if (!numericJobId) { setShowQuestionsPanel(false); return; }
//     setSavingQuestions(true);
//     try {
//       await screeningQuestionsService.saveForJob(numericJobId, toSave.length ? toSave : []);
//       toast({ title: "Questions saved", description: "They will be used in this call." });
//       setShowQuestionsPanel(false);
//     } catch (e: any) {
//       toast({
//         title: "Failed to save questions",
//         description: e.response?.data?.message || "Try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setSavingQuestions(false);
//     }
//   };

//   const handleConfirm = () => {
//     if (selectedOption) {
//       onConfirm(selectedOption);
//       setSelectedOption(null);
//       onOpenChange(false);
//     }
//   };

//   const callOptions = [
//     {
//       value: "skip" as const,
//       label: "Skip the call",
//       icon: SkipForward,
//       description: "Move to Phone Screening without calling",
//       color: "text-muted-foreground",
//       activeBg: "bg-muted-foreground/8 border-border-strong/40",
//       activeIcon: "text-muted-foreground",
//     },
//     {
//       value: "now" as const,
//       label: "Call immediately",
//       icon: Zap,
//       description: "Start the AI screening call right now",
//       color: "text-success",
//       activeBg: "bg-success/8 border-success/40",
//       activeIcon: "text-success",
//     },
//     {
//       value: "1hour" as const,
//       label: "Call in 1 hour",
//       icon: Clock,
//       description: "Schedule the call for 1 hour from now",
//       color: "text-info",
//       activeBg: "bg-info/8 border-info/40",
//       activeIcon: "text-info",
//     },
//     {
//       value: "2hours" as const,
//       label: "Call in 2 hours",
//       icon: Clock,
//       description: "Schedule the call for 2 hours from now",
//       color: "text-primary",
//       activeBg: "bg-primary/8 border-primary/40",
//       activeIcon: "text-primary",
//     },
//   ];

//   return (
//     <>
//       {/* Keyframe animations */}
//       <style>{`
//         @keyframes slideRight {
//           0%, 100% { transform: translateX(0);   opacity: 0.4; }
//           50%       { transform: translateX(4px); opacity: 1;   }
//         }
//         @keyframes fadeInUp {
//           from { opacity: 0; transform: translateY(6px); }
//           to   { opacity: 1; transform: translateY(0);   }
//         }
//         .arrow-blink { animation: slideRight 1.1s ease-in-out infinite; }
//         .fade-in-up  { animation: fadeInUp 0.25s ease-out both; }
//       `}</style>

//       <Dialog open={open} onOpenChange={onOpenChange}>
//         <DialogContent
//           className={`p-0 gap-0 overflow-hidden border border-border bg-card rounded-2xl transition-all duration-300 max-h-[92vh] flex flex-col
//             ${showQuestionsPanel ? "sm:max-w-[860px]" : "sm:max-w-[480px]"}`}
//         >

//           {/* ── Header ── */}
//           <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
//             <div className="flex items-start gap-3 min-w-0">
//               {/* Icon */}
//               <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
//                 <PhoneCall className="w-5 h-5 text-primary" />
//               </div>
//               <div className="min-w-0">
//                 <h2 className="text-base font-bold text-foreground leading-tight">Phone Screening</h2>
//                 <p className="text-sm text-muted-foreground mt-0.5 truncate">
//                   {candidateName}
//                 </p>
//               </div>
//             </div>

//             {/* Close */}
//             {/* <button
//               onClick={() => onOpenChange(false)}
//               className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all flex-shrink-0 ml-3"
//             >
//               <X className="w-4 h-4" />
//             </button> */}
//           </div>

//           {/* ── Body ── */}
//           <div
//             className={`flex-1 min-h-0 overflow-hidden grid gap-0
//               ${showQuestionsPanel && canManageQuestions
//                 ? "grid-cols-1 md:grid-cols-[1fr_1px_1fr]"
//                 : "grid-cols-1"
//               }`}
//           >

//             {/* LEFT — When to call */}
//             <div className="overflow-y-auto p-6 space-y-4">

//               {/* Step label */}
//               <div className="flex items-center justify-between">
//                 <p className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">
//                   When to call
//                 </p>
//                 <span className="text-[11px] text-muted-foreground">
//                   {showQuestionsPanel ? "Step 2 of 2" : "Step 1 of 1"}
//                 </span>
//               </div>

//               {/* Options */}
//               <div className="space-y-2.5">
//                 {callOptions.map((opt) => {
//                   const Icon = opt.icon;
//                   const isSelected = selectedOption === opt.value;
//                   return (
//                     <button
//                       key={opt.value}
//                       type="button"
//                       onClick={() => setSelectedOption(opt.value)}
//                       className={`w-full text-left rounded-xl border px-4 py-3.5 transition-all duration-150 flex items-center gap-3.5 group
//                         ${isSelected
//                           ? `${opt.activeBg} ring-1 ring-inset ring-border/80`
//                           : "border-border hover:border-border/80 hover:bg-muted/30"
//                         }`}
//                     >
//                       {/* Icon circle */}
//                       <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
//                         ${isSelected ? "bg-background/80" : "bg-muted/60 group-hover:bg-muted"}`}
//                       >
//                         <Icon className={`w-4 h-4 ${isSelected ? opt.activeIcon : "text-muted-foreground"}`} />
//                       </div>

//                       {/* Text */}
//                       <div className="flex-1 min-w-0">
//                         <p className={`text-sm font-semibold leading-none mb-1 ${isSelected ? "text-foreground" : "text-foreground/80"}`}>
//                           {opt.label}
//                         </p>
//                         <p className="text-xs text-muted-foreground leading-snug">{opt.description}</p>
//                       </div>

//                       {/* Selected indicator */}
//                       {isSelected && (
//                         <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
//                           <Check className="w-3 h-3 text-white" />
//                         </div>
//                       )}
//                     </button>
//                   );
//                 })}
//               </div>

//               {/* Prepare questions CTA — when panel is hidden */}
//               {canManageQuestions && !showQuestionsPanel && (
//                 <div className="pt-2">
//                   <div className="rounded-xl border border-dashed border-primary/30 bg-primary/4 p-4">
//                     {/* Heading */}
//                     <div className="flex items-start gap-3 mb-3">
//                       <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
//                         <FileQuestion className="w-4 h-4 text-primary" />
//                       </div>
//                       <div>
//                         <p className="text-sm font-semibold text-foreground">Prepare screening questions</p>
//                         <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
//                           Set custom questions the AI will ask during the call. You can also let AI generate them for you.
//                         </p>
//                       </div>
//                     </div>

//                     {/* CTA button with blinking arrow */}
//                     <button
//                       onClick={() => setShowQuestionsPanel(true)}
//                       className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/15 border border-primary/25 hover:border-primary/40 text-primary text-sm font-semibold transition-all duration-200 group"
//                     >
//                       <span className="flex items-center gap-2">
//                         <FileQuestion className="w-4 h-4" />
//                         Open question editor
//                       </span>
//                       <span className="arrow-blink">
//                         <ChevronRight className="w-4 h-4" />
//                       </span>
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Divider */}
//             {showQuestionsPanel && canManageQuestions && (
//               <div className="hidden md:block bg-border w-px" />
//             )}

//             {/* RIGHT — Questions panel */}
//             {showQuestionsPanel && canManageQuestions && (
//               <div className="flex flex-col overflow-hidden fade-in-up border-t md:border-t-0">

//                 {/* Panel header */}
//                 <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0 bg-muted/20">
//                   <div className="flex items-center gap-2">
//                     <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
//                       <FileQuestion className="w-3.5 h-3.5 text-primary" />
//                     </div>
//                     <div>
//                       <p className="text-sm font-bold text-foreground leading-none">Screening Questions</p>
//                       <p className="text-[11px] text-muted-foreground mt-0.5">AI will ask these during the call</p>
//                     </div>
//                   </div>
//                   <button
//                     onClick={() => setShowQuestionsPanel(false)}
//                     className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
//                   >
//                     <X className="w-3.5 h-3.5" />
//                   </button>
//                 </div>

//                 {/* AI generate bar */}
//                 <div className="px-5 py-3 border-b border-border/60 flex-shrink-0 bg-muted/10">
//                   <button
//                     type="button"
//                     onClick={handleAiGenerate}
//                     disabled={generating}
//                     className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-primary/40 bg-primary/6 hover:bg-primary/10 text-primary text-sm font-semibold transition-all disabled:opacity-50"
//                   >
//                     <Sparkles className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
//                     {generating ? "Generating questions…" : "Auto-generate with AI"}
//                   </button>
//                 </div>

//                 {/* Questions list */}
//                 <div className="flex-1 overflow-y-auto p-5 space-y-2.5 min-h-0">
//                   {loadingQuestions ? (
//                     <div className="space-y-2">
//                       {[1, 2, 3].map(i => (
//                         <div key={i} className="h-9 bg-muted/50 rounded-lg animate-pulse" />
//                       ))}
//                     </div>
//                   ) : (
//                     questions.map((q, index) => (
//                       <div key={index} className="flex gap-2 items-center group">
//                         <span className="text-[11px] font-black text-muted-foreground/50 w-5 text-right flex-shrink-0">
//                           {index + 1}
//                         </span>
//                         <Input
//                           placeholder={`Question ${index + 1}`}
//                           value={q}
//                           onChange={(e) => handleQuestionChange(index, e.target.value)}
//                           className="flex-1 min-w-0 h-9 text-sm bg-background border-border focus:border-primary/50"
//                         />
//                         <button
//                           type="button"
//                           onClick={() => handleRemoveQuestion(index)}
//                           disabled={questions.length <= 1}
//                           className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all disabled:opacity-30 flex-shrink-0"
//                         >
//                           <X className="w-3.5 h-3.5" />
//                         </button>
//                       </div>
//                     ))
//                   )}
//                 </div>

//                 {/* Panel footer */}
//                 <div className="px-5 py-4 border-t border-border flex items-center justify-between gap-2 flex-shrink-0 bg-muted/10">
//                   <button
//                     type="button"
//                     onClick={handleAddQuestion}
//                     className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
//                   >
//                     <Plus className="w-4 h-4" />
//                     Add question
//                   </button>
//                   <Button
//                     type="button"
//                     size="sm"
//                     onClick={handleFinishQuestions}
//                     disabled={savingQuestions}
//                     className="bg-primary hover:bg-primary/90"
//                   >
//                     <Check className="w-3.5 h-3.5 mr-1.5" />
//                     {savingQuestions ? "Saving…" : "Save & close"}
//                   </Button>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* ── Footer ── */}
//           <div className="flex items-center justify-between px-6 py-4 border-t border-border flex-shrink-0 bg-muted/10">
//             <p className="text-xs text-muted-foreground">
//               {selectedOption
//                 ? `Selected: ${callOptions.find(o => o.value === selectedOption)?.label}`
//                 : "Select a call option to continue"
//               }
//             </p>
//             <div className="flex gap-2">
//               <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
//                 Cancel
//               </Button>
//               <Button
//                 size="sm"
//                 onClick={handleConfirm}
//                 disabled={!selectedOption}
//                 className="min-w-[90px]"
//               >
//                 <PhoneCall className="w-3.5 h-3.5 mr-1.5" />
//                 Confirm
//               </Button>
//             </div>
//           </div>

//         </DialogContent>
//       </Dialog>
//     </>
//   );
// };




import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PhoneCall, Clock, X, Sparkles, Plus, Check,
  SkipForward, Zap, Loader2, ChevronDown, ChevronUp,
  Bot, Mic,
} from "lucide-react";
import screeningQuestionsService from "@/services/screening-questions.service";
import { useToast } from "@/hooks/use-toast";

interface CallConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName: string;
  jobId?: string | number | null;
  onConfirm: (option: "skip" | "now" | "1hour" | "2hours") => void;
}

export const CallConfirmationDialog = ({
  open, onOpenChange, candidateName, jobId, onConfirm,
}: CallConfirmationDialogProps) => {
  const [selectedOption, setSelectedOption] = useState<"skip"|"now"|"1hour"|"2hours"|null>(null);
  const [questionsOpen, setQuestionsOpen]   = useState(false);
  const [questions, setQuestions]           = useState<string[]>([""]);
  const [loadingQ, setLoadingQ]             = useState(false);
  const [savingQ, setSavingQ]               = useState(false);
  const [generating, setGenerating]         = useState(false);
  const { toast } = useToast();

  const numericJobId = jobId != null ? parseInt(String(jobId), 10) : null;
  const canManageQ   = !!numericJobId && !isNaN(numericJobId);
  const savedCount   = questions.filter(q => q.trim()).length;

  useEffect(() => {
    if (open && canManageQ) {
      setLoadingQ(true);
      screeningQuestionsService
        .getForJob(numericJobId!)
        .then(q => setQuestions(Array.isArray(q) && q.length > 0 ? q : [""]))
        .catch(() => setQuestions([""]))
        .finally(() => setLoadingQ(false));
    }
  }, [open, canManageQ, numericJobId]);

  const changeQ  = (i: number, v: string) => { const n = [...questions]; n[i] = v; setQuestions(n); };
  const removeQ  = (i: number) => { if (questions.length > 1) setQuestions(questions.filter((_, x) => x !== i)); };

  const generate = async () => {
    if (!numericJobId) return;
    setGenerating(true);
    try {
      const g = await screeningQuestionsService.generateForJob(numericJobId);
      setQuestions(g.length > 0 ? g : [""]);
      toast({ title: "Questions generated", description: "Edit or add more as needed." });
    } catch (e: any) {
      toast({ title: "Could not generate", description: e.response?.data?.message || "Try again.", variant: "destructive" });
    } finally { setGenerating(false); }
  };

  const saveQ = async () => {
    const toSave = questions.map(q => q.trim()).filter(Boolean);
    if (!numericJobId) { setQuestionsOpen(false); return; }
    setSavingQ(true);
    try {
      await screeningQuestionsService.saveForJob(numericJobId, toSave);
      toast({ title: "Questions saved", description: "AI will ask these during the call." });
      setQuestionsOpen(false);
    } catch (e: any) {
      toast({ title: "Failed to save", description: e.response?.data?.message || "Try again.", variant: "destructive" });
    } finally { setSavingQ(false); }
  };

  const handleConfirm = () => {
    if (!selectedOption) return;
    onConfirm(selectedOption);
    setSelectedOption(null);
    onOpenChange(false);
  };

  const callOptions = [
    { value: "skip"   as const, label: "Skip the call",    icon: SkipForward, desc: "Move without an AI call",      active: "bg-surface-2 border-border ring-zinc-200",    icon_: "text-muted-foreground",    dot: "bg-muted-foreground"    },
    { value: "now"    as const, label: "Call immediately", icon: Zap,         desc: "Start AI screening right now", active: "bg-success/10 border-success ring-emerald-200", icon_: "text-success", dot: "bg-success" },
    { value: "1hour"  as const, label: "In 1 hour",        icon: Clock,       desc: "Schedule 1 hr from now",       active: "bg-info/10 border-info ring-blue-200",    icon_: "text-info",    dot: "bg-info"    },
    { value: "2hours" as const, label: "In 2 hours",       icon: Clock,       desc: "Schedule 2 hrs from now",      active: "bg-primary/10 border-primary ring-indigo-200", icon_: "text-primary",  dot: "bg-primary"  },
  ];

  return (
    <>
      <style>{`
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .anim-down { animation: slideDown 0.18s ease-out both; }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="p-0 gap-0 overflow-hidden border border-border bg-background rounded-2xl sm:max-w-[560px] max-h-[92vh] flex flex-col">

          {/* ─── Header ─── */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <PhoneCall className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-foreground leading-none">Phone Screening Call</h2>
              <p className="text-xs text-muted-foreground mt-1 truncate">{candidateName}</p>
            </div>
          </div>

          {/* ─── Scrollable body ─── */}
          <div className="flex-1 overflow-y-auto min-h-0">

            {/* ── When to call ── */}
            <div className="px-5 pt-5 pb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                When to call
              </p>
              <div className="grid grid-cols-2 gap-2">
                {callOptions.map(opt => {
                  const Icon   = opt.icon;
                  const isActive = selectedOption === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedOption(opt.value)}
                      className={`relative text-center p-3.5 rounded-xl border transition-all duration-150
                        ${isActive ? `${opt.active} ring-1` : "bg-card border-border hover:bg-muted/30 hover:border-border/70"}`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2.5 mx-auto
                        ${isActive ? "bg-surface/90 border border-current/10" : "bg-muted/60"}`}>
                        <Icon className={`w-3.5 h-3.5 ${isActive ? opt.icon_ : "text-muted-foreground"}`} />
                      </div>
                      <p className={`text-xs font-bold leading-tight ${isActive ? "text-foreground" : "text-foreground/80"}`}>
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{opt.desc}</p>
                      {isActive && (
                        <div className={`absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center ${opt.dot}`}>
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Divider ── */}
            {canManageQ && <div className="mx-5 border-t border-dashed border-border/60" />}

            {/* ── Screening Questions Accordion ── */}
            {canManageQ && (
              <div className="px-5 py-4 space-y-2.5">

                {/* Toggle button */}
                <button
                  onClick={() => setQuestionsOpen(v => !v)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-150
                    ${questionsOpen
                      ? "bg-primary/10 border-primary/20"
                      : "bg-card border-border hover:bg-muted/20 hover:border-border/70"
                    }`}
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                    ${questionsOpen ? "bg-primary/14 border border-primary/20" : "bg-muted/60"}`}>
                    <Bot className={`w-4 h-4 ${questionsOpen ? "text-primary" : "text-muted-foreground"}`} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-bold leading-none ${questionsOpen ? "text-primary" : "text-foreground"}`}>
                        Screening Questions
                      </p>
                      {savedCount > 0 && !questionsOpen && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/14 text-primary border border-primary/20">
                          {savedCount} saved
                        </span>
                      )}
                      {savedCount === 0 && !questionsOpen && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20">
                          optional
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-1 leading-snug ${questionsOpen ? "text-primary" : "text-muted-foreground"}`}>
                      {questionsOpen
                        ? "AI will ask these questions verbatim during the call"
                        : "Customize what AI asks · tap to edit"
                      }
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-colors
                    ${questionsOpen ? "bg-primary/14 text-primary" : "bg-muted/50 text-muted-foreground"}`}>
                    {questionsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {/* Collapsed chips preview */}
                {!questionsOpen && savedCount > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {questions.filter(q => q.trim()).slice(0, 3).map((q, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-muted/50 border border-border rounded-lg px-2.5 py-1 text-muted-foreground max-w-[200px]">
                        <span className="text-[10px] font-bold text-muted-foreground/40">{i + 1}.</span>
                        <span className="truncate">{q}</span>
                      </span>
                    ))}
                    {savedCount > 3 && (
                      <span className="text-[11px] bg-muted/50 border border-border rounded-lg px-2 py-1 text-muted-foreground">
                        +{savedCount - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Collapsed empty nudge */}
                {!questionsOpen && savedCount === 0 && (
                  <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-muted/20 border border-dashed border-border/70">
                    <Mic className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      No questions set. Add custom questions or let <span className="font-semibold text-foreground">AI generate them</span> based on the job — the AI will ask these during the call.
                    </p>
                  </div>
                )}

                {/* ── Expanded editor ── */}
                {questionsOpen && (
                  <div className="rounded-xl border border-primary/20 bg-primary/10/20 overflow-hidden anim-down">

                    {/* AI generate */}
                    <div className="px-4 pt-4 pb-3 border-b border-primary/14/80">
                      <button
                        onClick={generate}
                        disabled={generating}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-primary/20 bg-surface hover:bg-violet-50 text-primary text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
                      >
                        {generating
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Sparkles className="w-3.5 h-3.5" />
                        }
                        {generating ? "Generating with AI…" : "✨ Auto-generate with AI"}
                      </button>
                    </div>

                    {/* Questions list */}
                    <div className="px-4 py-3.5 space-y-2 max-h-[200px] overflow-y-auto">
                      {loadingQ ? (
                        <div className="space-y-2">
                          {[1,2,3].map(i => <div key={i} className="h-8 bg-primary/14/80 rounded-lg animate-pulse" />)}
                        </div>
                      ) : questions.map((q, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-primary w-4 text-center flex-shrink-0 select-none">
                            {i + 1}
                          </span>
                          <Input
                            placeholder={`Question ${i + 1}…`}
                            value={q}
                            onChange={e => changeQ(i, e.target.value)}
                            className="flex-1 h-8 text-xs bg-surface border-primary/20 focus:border-primary placeholder:text-muted-foreground/40"
                          />
                          <button
                            onClick={() => removeQ(i)}
                            disabled={questions.length <= 1}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-red-50 transition-all disabled:opacity-25 flex-shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Editor footer */}
                    <div className="px-4 py-3 border-t border-primary/14/80 flex items-center justify-between gap-3 bg-surface/40">
                      <button
                        onClick={() => setQuestions([...questions, ""])}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add question
                      </button>
                      <Button
                        size="sm"
                        onClick={saveQ}
                        disabled={savingQ}
                        className="h-7 text-xs px-3 bg-primary hover:bg-primary/90 text-white"
                      >
                        {savingQ
                          ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                          : <Check className="w-3 h-3 mr-1.5" />
                        }
                        {savingQ ? "Saving…" : "Save & close"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* ─── Footer ─── */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-border flex-shrink-0 bg-muted/10">
            <p className="text-xs text-muted-foreground truncate mr-3">
              {selectedOption
                ? `✓ ${callOptions.find(o => o.value === selectedOption)?.label}`
                : "Select an option to continue"
              }
            </p>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs min-w-[88px]"
                onClick={handleConfirm}
                disabled={!selectedOption}
              >
                <PhoneCall className="w-3 h-3 mr-1.5" />
                Confirm
              </Button>
            </div>
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
};
