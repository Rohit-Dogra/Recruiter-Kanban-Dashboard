import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KanbanCard } from "./KanbanCard";
import { LucideIcon, PhoneCall, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { useState } from "react";
import callService from "@/services/call.service";
import { useToast } from "@/hooks/use-toast";

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

const stageSteps: Record<string, string> = {
  new: "01",
  reviewed: "02",
  shortlisted: "03",
  interview: "04",
  offered: "05",
  hired: "06",
};

const stageDescriptions: Record<string, string> = {
  new: "Resume uploaded, AI extracts skills & experience",
  reviewed: "Score /100 · Skills matched · Hire recommendation",
  shortlisted: "AI calls shortlisted candidates · Basic screening",
  interview: "Domain knowledge · Problem solving · Full report",
  offered: "Digital offer · e-Signature · Onboarding tracking",
  hired: "Candidate onboarded · Welcome aboard",
};

const stageAccents: Record<string, string> = {
  new: "#3b82f6",
  reviewed: "#8b5cf6",
  shortlisted: "#06b6d4",
  interview: "#10b981",
  offered: "#f59e0b",
  hired: "#22c55e",
};

const stageFooter: Record<string, string> = {
  new: "Application received ✓",
  reviewed: "Profile under review",
  shortlisted: "Shortlisted — AI call scheduled",
  interview: "Technical interview scheduled",
  offered: "Offer letter sent!",
  hired: "Welcome aboard 🎉",
};

export const KanbanColumn = ({ id, title, candidates, color, icon: Icon, actionType, onCandidateClick, onCallCandidate, onBeforePhoneCall }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [callingCandidateId, setCallingCandidateId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const { toast } = useToast();

  const accent = stageAccents[id] || "#6366f1";
  const step = stageSteps[id] || "—";
  const description = stageDescriptions[id] || "";
  const footer = stageFooter[id] || "";

  const doCall = async (candidate: Candidate) => {
    if (!candidate.phone) {
      toast({ title: "No Phone Number", description: "This candidate doesn't have a phone number on file.", variant: "destructive" });
      return;
    }
    setCallingCandidateId(candidate.id);
    try {
      await callService.makeCall(candidate.phone, undefined, { candidateName: candidate.name, candidateRole: candidate.role });
      toast({ title: "Call Initiated", description: `Calling ${candidate.name} at ${candidate.phone}` });
      onCallCandidate?.(candidate);
    } catch (error) {
      const err = error as { response?: { data?: { error?: { code?: string; message?: string } } } };
      if (err?.response?.data?.error?.code === 'SUBSCRIPTION_REQUIRED') {
        toast({ title: "Subscription Required", description: err.response?.data?.error?.message || "Please subscribe to use phone screening.", variant: "destructive" });
      } else {
        toast({ title: "Call Failed", description: "Failed to initiate the call. Please try again.", variant: "destructive" });
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
    <div
      className={`w-72 flex-shrink-0 rounded-xl border bg-card transition-all duration-200 ${
        isOver ? "ring-2 ring-primary shadow-lg" : "border-border shadow-sm"
      }`}
      style={{ borderTop: `3px solid ${accent}` }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold tracking-widest text-muted-foreground">{step}</span>
          <div className="flex items-center gap-1.5">
            {(actionType === 'call' || actionType === 'ai_phone') && candidates && candidates.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  const candidateWithPhone = candidates.find(c => c.phone);
                  if (candidateWithPhone) {
                    handleCallCandidate(candidateWithPhone, e);
                  } else {
                    toast({ title: "No Phone Numbers", description: "No candidates in this stage have phone numbers.", variant: "destructive" });
                  }
                }}
                disabled={!!callingCandidateId}
              >
                <PhoneCall className="w-3.5 h-3.5" style={{ color: accent }} />
              </Button>
            )}
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}
            >
              <Icon className="w-4 h-4" style={{ color: accent }} />
            </div>
          </div>
        </div>

        <h3 className="text-sm font-bold text-foreground leading-tight">{title}</h3>
        {description && (
          <p className="text-[11px] text-muted-foreground leading-snug mt-1">{description}</p>
        )}

        <div className="flex items-center gap-1.5 mt-2.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
          <span className="text-[11px] text-muted-foreground font-medium">
            {candidates?.length || 0} candidate{(candidates?.length || 0) !== 1 ? "s" : ""}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 ml-auto"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand column" : "Collapse column"}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
          </Button>
        </div>
      </div>

      {/* Candidates */}
      <div className="px-3 pb-3">
        {!collapsed ? (
          <div
            ref={setNodeRef}
            className={`min-h-[120px] space-y-2 rounded-lg p-1 transition-colors ${
              isOver ? "bg-muted/40" : ""
            }`}
          >
            <SortableContext items={candidates?.map(c => c.id) || []} strategy={verticalListSortingStrategy}>
              {candidates?.map((candidate) => (
                <div key={candidate.id} className="relative group">
                  <KanbanCard candidate={candidate} accent={accent} onCandidateClick={onCandidateClick} />
                  {(actionType === 'call' || actionType === 'ai_phone') && candidate.phone && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-1.5 right-1.5 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                      onClick={(e) => handleCallCandidate(candidate, e)}
                      disabled={callingCandidateId === candidate.id}
                    >
                      <PhoneCall className="w-3 h-3" style={{ color: accent }} />
                    </Button>
                  )}
                </div>
              )) || []}
            </SortableContext>
          </div>
        ) : (
          <div
            ref={setNodeRef}
            className="min-h-[40px] flex items-center justify-center text-xs text-muted-foreground"
          >
            {candidates?.length || 0} candidate{(candidates?.length || 0) !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Footer */}
      {footer && !collapsed && (
        <div className="mx-3 mb-3 flex items-center gap-1.5 text-[10px] font-medium border rounded-lg px-3 py-2 border-border bg-muted/30 text-muted-foreground">
          <ArrowRight className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{footer}</span>
        </div>
      )}
    </div>
  );
};
