import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, MapPin, Clock, Briefcase } from "lucide-react";
import { OfferLetterActions } from "./OfferLetterActions";

interface Candidate {
  id: string;
  applicationId?: number;
  name: string;
  role: string;
  score: number;
  atsStatus?: 'pending' | 'processing' | 'completed' | 'failed';
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
    try { const p = JSON.parse(skills); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
}

function getDaysInStage(appliedDate?: string): number | null {
  if (!appliedDate) return null;
  const d = new Date(appliedDate);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

export const KanbanCard = ({ candidate, accent = "#6366f1", onCandidateClick }: KanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const initials = candidate.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "UC";

  const isPending = !candidate.atsStatus || candidate.atsStatus === 'pending' || candidate.atsStatus === 'processing';
  const isFailed = candidate.atsStatus === 'failed';
  const skills = parseSkills(candidate.skills);
  const days = getDaysInStage(candidate.appliedDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded-lg border bg-secondary/50 px-3 py-2.5 cursor-grab active:cursor-grabbing transition-all hover:bg-secondary ${
        isDragging ? "shadow-lg border-primary/30" : "border-border"
      }`}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          onCandidateClick?.(candidate);
        }
      }}
    >
      {/* Row 1: Avatar + Name + Score */}
      <div className="flex items-center gap-2.5">
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}99)` }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate leading-tight">{candidate.name || "Unknown"}</p>
          <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
            {candidate.role || "Candidate"}
            {candidate.currentCompany ? ` · ${candidate.currentCompany}` : ""}
          </p>
        </div>
        <div className="flex-shrink-0">
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : isFailed ? (
            <AlertTriangle className="w-4 h-4 text-destructive" />
          ) : candidate.score > 0 ? (
            <span
              className="text-xs font-black min-w-[28px] text-center inline-block rounded-md px-1.5 py-0.5"
              style={{ color: accent, background: `${accent}15` }}
            >
              {candidate.score}
            </span>
          ) : null}
        </div>
      </div>

      {/* Row 2: Meta info */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2 text-[10px] text-muted-foreground">
        {candidate.location && (
          <span className="inline-flex items-center gap-0.5">
            <MapPin className="w-2.5 h-2.5" />
            <span className="truncate max-w-[80px]">{candidate.location}</span>
          </span>
        )}
        {candidate.experience && (
          <span className="inline-flex items-center gap-0.5">
            <Briefcase className="w-2.5 h-2.5" />
            {candidate.experience}
          </span>
        )}
        {days !== null && (
          <span className={`inline-flex items-center gap-0.5 ${days > 14 ? "text-destructive" : days > 7 ? "text-yellow-600" : ""}`}>
            <Clock className="w-2.5 h-2.5" />
            {days}d
          </span>
        )}
      </div>

      {/* Row 3: Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {skills.slice(0, 3).map((skill, i) => (
            <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-medium">
              {skill}
            </Badge>
          ))}
          {skills.length > 3 && (
            <span className="text-[9px] text-muted-foreground leading-4">+{skills.length - 3}</span>
          )}
        </div>
      )}

      {/* Offer letter actions */}
      {(candidate.status === 'offered' || candidate.status === 'hired') && (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
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
