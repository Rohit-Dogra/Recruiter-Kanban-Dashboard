import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Job, JobFormData } from "@/services/job.service";
import jobService from "@/services/job.service";
import { useToast } from "@/hooks/use-toast";

interface EditJobDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobUpdated: () => void;
}

const EditJobDialog = ({ job, open, onOpenChange, onJobUpdated }: EditJobDialogProps) => {
  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    company: "",
    location: "",
    type: "",
    salary: "",
    department: "",
    experience: "entry",
    description: "",
    requirements: "",
    benefits: "",
    deadline: "",
    isRemote: false,
    skills: [],
    status: "active"
  });
  const [newSkill, setNewSkill] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title,
        company: job.company,
        location: job.location || "",
        type: job.type,
        salary: job.salary || "",
        department: job.department || "",
        experience: job.experience || "entry",
        description: job.description,
        requirements: job.requirements,
        benefits: job.benefits || "",
        deadline: job.deadline ? job.deadline.split('T')[0] : "",
        isRemote: job.isRemote,
        skills: Array.isArray(job.skills) ? job.skills : typeof job.skills === "string" ? (() => { try { const p = JSON.parse(job.skills); return Array.isArray(p) ? p : []; } catch { return []; } })() : [],
        status: job.status
      });
    }
  }, [job]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    
    setIsSubmitting(true);
    try {
      await jobService.updateJob(job.id, formData);
      toast({
        title: "Success!",
        description: "Job updated successfully.",
      });
      onOpenChange(false);
      onJobUpdated();
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast({
        title: "Error updating job",
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
          <DialogDescription>Update job details</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Job Title*</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="company">Company*</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="type">Job Type*</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salary">Salary</Label>
              <Input
                id="salary"
                value={formData.salary}
                onChange={(e) => setFormData({...formData, salary: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="experience">Experience Level</Label>
              <Select value={formData.experience} onValueChange={(value) => setFormData({...formData, experience: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Level</SelectItem>
                  <SelectItem value="mid">Mid Level</SelectItem>
                  <SelectItem value="senior">Senior Level</SelectItem>
                  <SelectItem value="lead">Lead / Manager</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description*</Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="requirements">Requirements*</Label>
            <Textarea
              id="requirements"
              rows={4}
              value={formData.requirements}
              onChange={(e) => setFormData({...formData, requirements: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="skills">Skills</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.skills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                  <X 
                    className="ml-1 h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      setFormData({
                        ...formData, 
                        skills: formData.skills.filter((_, i) => i !== index)
                      });
                    }}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add skill"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSkill.trim()) {
                    e.preventDefault();
                    setFormData({
                      ...formData, 
                      skills: [...formData.skills, newSkill.trim()]
                    });
                    setNewSkill('');
                  }
                }}
              />
              <Button 
                type="button" 
                onClick={() => {
                  if (newSkill.trim()) {
                    setFormData({
                      ...formData, 
                      skills: [...formData.skills, newSkill.trim()]
                    });
                    setNewSkill('');
                  }
                }}
              >
                Add
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Job"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditJobDialog;