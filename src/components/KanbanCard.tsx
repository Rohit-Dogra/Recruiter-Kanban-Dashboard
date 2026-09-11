import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, Briefcase, Clock, GripVertical, Loader2, MapPin } from "lucide-react";

import { OfferLetterActions } from "./OfferLetterActions";
import { cn } from "@/lib/utils";

interface Candidate {
  id: string;
  applicationId?: number;
  name: string;
  role: string;
  score: number;
  atsStatus?: "pending" | "processing" | "completed" | "failed";
  avatar?: string;
  location?: string;
  appliedDate?: string;
  experience?: string;
  skills?: string[];
  currentCompany?: string;
  status?: string;
}

interface KanbanCardProps {
  candidate: Candidate;
  accent?: string;
  onCandidateClick?: (candidate: Candidate) => void;
}

function parseSkills(skills: unknown): string[] {
  if (Array.isArray(skills)) return skills;
  if (typeof skills === "string") {
    try {
      const p = JSON.parse(skills);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

function getDaysInStage(appliedDate?: string): number | null {
  if (!appliedDate) return null;
  const d = new Date(appliedDate);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

/** Score → semantic colour, matching ScoreRing's thresholds. */
function scoreClasses(score: number): string {
  if (score >= 80) return "bg-success/12 text-success";
  if (score >= 60) return "bg-warning/14 text-warning";
  if (score >= 40) return "bg-primary/12 text-primary";
  return "bg-destructive/12 text-destructive";
}

/**
 * Candidate card on the pipeline board.
 *
 * The whole card used to be the drag handle, which made it impossible to
 * select text or tap reliably on touch. Dragging now lives on an explicit
 * handle that appears on hover (and is always present on touch), so clicking
 * the card opens the candidate — the thing recruiters actually do most.
 */
export const KanbanCard = ({ candidate, accent = "hsl(var(--primary))", onCandidateClick }: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: candidate.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const initials =
    candidate.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "UC";

  const isPending = !candidate.atsStatus || candidate.atsStatus === "pending" || candidate.atsStatus === "processing";
  const isFailed = candidate.atsStatus === "failed";
  const skills = parseSkills(candidate.skills);
  const days = getDaysInStage(candidate.appliedDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onCandidateClick?.(candidate)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onCandidateClick?.(candidate);
      }}
      role="button"
      tabIndex={0}
      className={cn(
        "group relative cursor-pointer rounded-[var(--radius-lg)] border bg-surface p-3 text-left",
        "transition-all duration-200 ease-expo",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isDragging ? "z-10 rotate-1 border-primary/50 opacity-90 shadow-xl" : "border-border/70 shadow-xs"
      )}
    >
      {/* Drag handle — keyboard reachable, and the only drag surface */}
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        data-compact
        aria-label={`Reorder ${candidate.name}`}
        className={cn(
          "absolute right-1 top-1 flex h-6 w-6 cursor-grab items-center justify-center rounded-[var(--radius-xs)]",
          "text-muted-foreground/50 opacity-0 transition-opacity duration-200",
          "hover:bg-secondary hover:text-foreground active:cursor-grabbing",
          "group-hover:opacity-100 focus-visible:opacity-100 [@media(pointer:coarse)]:opacity-100"
        )}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {/* Identity */}
      <div className="flex items-start gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-inset ring-white/15"
          style={{ background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 60%, transparent))` }}
        >
          {initials}
        </span>

        <div className="min-w-0 flex-1 pr-5">
          <p className="truncate text-[13px] font-semibold leading-tight text-foreground">
            {candidate.name || "Unknown"}
          </p>
          <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
            {candidate.role || "Candidate"}
            {candidate.currentCompany ? ` · ${candidate.currentCompany}` : ""}
          </p>
        </div>
      </div>

      {/* Score / ATS state */}
      <div className="mt-2.5 flex items-center gap-2">
        {isPending ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
            Scoring…
          </span>
        ) : isFailed ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
            <AlertTriangle className="h-2.5 w-2.5" />
            Scoring failed
          </span>
        ) : candidate.score > 0 ? (
          <span
            className={cn(
              "inline-flex items-baseline gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
              scoreClasses(candidate.score)
            )}
          >
            {candidate.score}
            <span className="text-[9px] font-normal opacity-70">/100</span>
          </span>
        ) : null}

        {days !== null && (
          <span
            className={cn(
              "ml-auto inline-flex items-center gap-1 text-[10px] tabular-nums",
              days > 14 ? "font-medium text-destructive" : days > 7 ? "text-warning" : "text-muted-foreground"
            )}
            title={`${days} days in this stage`}
          >
            <Clock className="h-2.5 w-2.5" />
            {days}d
          </span>
        )}
      </div>

      {/* Meta */}
      {(candidate.location || candidate.experience) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          {candidate.location && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{candidate.location}</span>
            </span>
          )}
          {candidate.experience && (
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-2.5 w-2.5" />
              {candidate.experience}
            </span>
          )}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {skills.slice(0, 3).map((skill, i) => (
            <span
              key={i}
              className="rounded-[var(--radius-xs)] bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-secondary-foreground"
            >
              {skill}
            </span>
          ))}
          {skills.length > 3 && (
            <span className="px-0.5 text-[9px] leading-4 text-muted-foreground">+{skills.length - 3}</span>
          )}
        </div>
      )}

      {/* Offer actions */}
      {(candidate.status === "offered" || candidate.status === "hired") && (
        <div className="mt-2.5 border-t border-border/60 pt-2.5" onClick={(e) => e.stopPropagation()}>
          <OfferLetterActions
            candidateId={candidate.id}
            candidateName={candidate.name}
            applicationId={candidate.applicationId}
            onComplete={() => {}}
          />
        </div>
      )}
    </div>
  );
};
