import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Briefcase, DollarSign, Clock, Users } from "lucide-react";

interface JobDetailsDialogProps {
  job: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extraFooter?: ReactNode;
}

function safeSkills(skills: any): string[] {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills;
  try { const p = JSON.parse(skills); return Array.isArray(p) ? p : []; } catch { return []; }
}

const JobDetailsDialog = ({ job, open, onOpenChange, extraFooter }: JobDetailsDialogProps) => {
  if (!job) return null;

  const skills = safeSkills(job.skills);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{job.title || "Untitled Job"}</DialogTitle>
          <DialogDescription className="text-lg text-muted-foreground">
            {job.company || "Company"} {job.location ? `• ${job.location}` : ""} {job.isRemote ? "(Remote)" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {job.type && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm capitalize">{job.type.replace('-', ' ')}</span>
              </div>
            )}
            {job.experience && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm capitalize">{job.experience} level</span>
              </div>
            )}
            {job.salary && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{job.salary}</span>
              </div>
            )}
            {job.deadline && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {job.status && <Badge variant="default" className="capitalize">{job.status}</Badge>}
            {job.urgency && <Badge variant="outline" className="capitalize">{job.urgency} priority</Badge>}
            {job.department && <Badge variant="secondary">{job.department}</Badge>}
            {job.workType && <Badge variant="outline" className="capitalize">{job.workType}</Badge>}
          </div>

          <Separator />

          {job.description && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Job Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.description}</p>
            </div>
          )}

          {job.requirements && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Requirements</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.requirements}</p>
              </div>
            </>
          )}

          {job.benefits && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Benefits</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.benefits}</p>
              </div>
            </>
          )}

          {skills.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {job.createdAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Posted on {new Date(job.createdAt).toLocaleDateString()}</span>
            </div>
          )}

          {extraFooter}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailsDialog;