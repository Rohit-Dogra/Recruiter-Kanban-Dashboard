import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ChevronDown, PhoneCall, type LucideIcon } from "lucide-react";

import { KanbanCard } from "./KanbanCard";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import callService from "@/services/call.service";
import { cn } from "@/lib/utils";

interface Candidate {
  id: string;
  name: string;
  role: string;
  score: number;
  avatar?: string;
  location?: string;
  appliedDate?: string;
  phone?: string;
}

interface KanbanColumnProps {
  id: string;
  title: string;
  candidates: Candidate[];
  color: string;
  icon: LucideIcon;
  actionType?: string;
  onCandidateClick?: (candidate: Candidate) => void;
  onCallCandidate?: (candidate: Candidate) => void;
  onBeforePhoneCall?: (candidate: Candidate, executeCall: () => void) => void;
}

/* Stage metadata. Accents are design-system tokens rather than raw hex, so the
   board stays on-palette in both themes. */
const STAGE_STEP: Record<string, string> = {
  new: "01",
  reviewed: "02",
  shortlisted: "03",
  interview: "04",
  offered: "05",
  hired: "06",
};

const STAGE_DESCRIPTION: Record<string, string> = {
  new: "Résumé uploaded — AI extracts skills and experience",
  reviewed: "Scored out of 100, skills matched, recommendation ready",
  shortlisted: "AI screening call in progress",
  interview: "Domain knowledge, problem solving, full report",
  offered: "Digital offer, e-signature, onboarding tracked",
  hired: "Onboarded — welcome aboard",
};

const STAGE_ACCENT: Record<string, string> = {
  new: "hsl(var(--brand-indigo))",
  reviewed: "hsl(var(--brand-violet))",
  shortlisted: "hsl(var(--brand-cyan))",
  interview: "hsl(var(--success))",
  offered: "hsl(var(--warning))",
  hired: "hsl(var(--success))",
};

export const KanbanColumn = ({
  id,
  title,
  candidates,
  icon: Icon,
  actionType,
  onCandidateClick,
  onCallCandidate,
  onBeforePhoneCall,
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [callingCandidateId, setCallingCandidateId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const { toast } = useToast();

  const accent = STAGE_ACCENT[id] || "hsl(var(--primary))";
  const step = STAGE_STEP[id] || "—";
  const description = STAGE_DESCRIPTION[id] || "";
  const count = candidates?.length ?? 0;
  const canCall = actionType === "call" || actionType === "ai_phone";

  const doCall = async (candidate: Candidate) => {
    if (!candidate.phone) {
      toast({
        title: "No phone number",
        description: "This candidate doesn't have a phone number on file.",
        variant: "destructive",
      });
      return;
    }
    setCallingCandidateId(candidate.id);
    try {
      await callService.makeCall(candidate.phone, undefined, {
        candidateName: candidate.name,
        candidateRole: candidate.role,
      });
      toast({ title: "Call initiated", description: `Calling ${candidate.name} at ${candidate.phone}` });
      onCallCandidate?.(candidate);
    } catch (error) {
      const err = error as { response?: { data?: { error?: { code?: string; message?: string } } } };
      if (err?.response?.data?.error?.code === "SUBSCRIPTION_REQUIRED") {
        toast({
          title: "Subscription required",
          description: err.response?.data?.error?.message || "Please subscribe to use phone screening.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Call failed",
          description: "Failed to initiate the call. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setCallingCandidateId(null);
    }
  };

  const handleCallCandidate = async (candidate: Candidate, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBeforePhoneCall) {
      onBeforePhoneCall(candidate, () => doCall(candidate));
    } else {
      await doCall(candidate);
    }
  };

  return (
    <section
      aria-label={`${title}, ${count} candidate${count === 1 ? "" : "s"}`}
      className={cn(
        // Full width when the board stacks on mobile; a fixed rail on desktop.
        "flex w-full flex-col rounded-[var(--radius-xl)] border bg-surface-2/50 lg:w-[288px] lg:shrink-0 lg:snap-start",
        "transition-all duration-200 ease-expo",
        isOver ? "border-primary/50 bg-primary/4 shadow-glow" : "border-border/70 shadow-xs"
      )}
    >
      {/* ── Header ── */}
      <header className="relative overflow-hidden rounded-t-[var(--radius-xl)] px-3.5 pb-3 pt-3.5">
        {/* Stage accent bar */}
        <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accent }} />

        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
              style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{step}</p>
              <h3 className="truncate text-[13px] font-semibold leading-tight text-foreground">{title}</h3>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            {canCall && count > 0 && (
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    data-compact
                    className="h-7 w-7"
                    disabled={!!callingCandidateId}
                    onClick={(e) => {
                      e.stopPropagation();
                      const withPhone = candidates.find((c) => c.phone);
                      if (withPhone) {
                        handleCallCandidate(withPhone, e);
                      } else {
                        toast({
                          title: "No phone numbers",
                          description: "No candidates in this stage have phone numbers.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <PhoneCall className="h-3.5 w-3.5" style={{ color: accent }} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Start AI screening call</TooltipContent>
              </Tooltip>
            )}

            <Button
              variant="ghost"
              size="icon-sm"
              data-compact
              className="h-7 w-7"
              onClick={() => setCollapsed((v) => !v)}
              aria-expanded={!collapsed}
              aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
            >
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform duration-300 ease-expo",
                  collapsed && "-rotate-90"
                )}
              />
            </Button>
          </div>
        </div>

        {description && !collapsed && (
          <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{description}</p>
        )}

        <div className="mt-2.5 flex items-center gap-1.5">
          <span
            className="rounded-full px-2 py-0.5 font-mono text-[10px] font-medium tabular-nums"
            style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}
          >
            {count}
          </span>
          <span className="text-[11px] text-muted-foreground">
            candidate{count === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      {/* ── Cards ── */}
      <div className="flex-1 px-2.5 pb-2.5">
        {collapsed ? (
          <div
            ref={setNodeRef}
            className="flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-dashed border-border/70 text-[11px] text-muted-foreground"
          >
            {count} hidden
          </div>
        ) : (
          <div
            ref={setNodeRef}
            className={cn(
              "min-h-[140px] space-y-2 rounded-[var(--radius-md)] p-0.5 transition-colors duration-200",
              isOver && "bg-primary/5"
            )}
          >
            <SortableContext items={candidates?.map((c) => c.id) || []} strategy={verticalListSortingStrategy}>
              {count === 0 ? (
                <div className="flex min-h-[132px] flex-col items-center justify-center gap-1.5 rounded-[var(--radius-lg)] border border-dashed border-border/70 px-3 text-center">
                  <Icon className="h-4 w-4 text-muted-foreground/40" />
                  <p className="text-[11px] text-muted-foreground">No one here yet</p>
                  <p className="text-[10px] text-muted-foreground/60">Drag a candidate in to advance them</p>
                </div>
              ) : (
                candidates.map((candidate) => (
                  <div key={candidate.id} className="group/row relative">
                    <KanbanCard candidate={candidate} accent={accent} onCandidateClick={onCandidateClick} />
                    {canCall && candidate.phone && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        data-compact
                        className="absolute right-8 top-1 h-6 w-6 opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 [@media(pointer:coarse)]:opacity-100"
                        onClick={(e) => handleCallCandidate(candidate, e)}
                        disabled={callingCandidateId === candidate.id}
                        aria-label={`Call ${candidate.name}`}
                      >
                        <PhoneCall className="h-3 w-3" style={{ color: accent }} />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </SortableContext>
          </div>
        )}
      </div>
    </section>
  );
};
