import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, Clock, Mail, Eye, CheckCircle, XCircle } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import aiVideoInterviewService, { type AIVideoInterview, type AIVideoInterviewStats } from "@/services/ai-video-interview.service";

export default function AIVideoInterviews() {
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<AIVideoInterview[]>([]);
  const [stats, setStats] = useState<AIVideoInterviewStats | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<AIVideoInterview | null>(null);
  const [formData, setFormData] = useState({ candidateEmail: '', candidateName: '', jobTitle: '', skills: '', experienceLevel: 'Mid-level', difficulty: 'Medium' });
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [interviewsData, statsData] = await Promise.all([
        aiVideoInterviewService.getInterviews(),
        aiVideoInterviewService.getStats()
      ]);
      setInterviews(interviewsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: "Error", description: "Failed to fetch interviews", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    try {
      setSending(true);
      const inviteData = {
        candidateEmail: formData.candidateEmail,
        candidateName: formData.candidateName,
        jobTitle: formData.jobTitle,
        role: formData.jobTitle,
        skills: formData.skills,
        experienceLevel: formData.experienceLevel,
        difficulty: formData.difficulty
      };
      console.log('Sending invite with data:', inviteData);
      await aiVideoInterviewService.sendInvite(inviteData);
      toast({ title: "Success", description: "Interview invitation sent successfully" });
      setInviteDialogOpen(false);
      setFormData({ candidateEmail: '', candidateName: '', jobTitle: '', skills: '', experienceLevel: 'Mid-level', difficulty: 'Medium' });
      fetchData();
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({ title: "Error", description: "Failed to send invitation", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleViewResult = async (interview: AIVideoInterview) => {
    try {
      const result = await aiVideoInterviewService.getInterviewResult(interview.id);
      setSelectedInterview(result);
      setResultDialogOpen(true);
    } catch (error) {
      console.error('Error fetching result:', error);
      toast({ title: "Error", description: "Failed to fetch interview result", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: "secondary", icon: Clock },
      completed: { variant: "default", icon: CheckCircle },
      expired: { variant: "destructive", icon: XCircle }
    };
    const { variant, icon: Icon } = variants[status] || variants.pending;
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="AI Video Interviews"
        subtitle="Automated video interviews and assessments"
        action={
          <Button variant="hero" onClick={() => setInviteDialogOpen(true)}>
            <Mail className="w-4 h-4 mr-2" />
            Send Interview Invite
          </Button>
        }
      />
      
      <Card className="bg-gradient-card border border-border/50 shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-primary/10">
                <Video className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">AI Video Interview System</h3>
                <p className="text-muted-foreground">Automate technical interviews with AI-powered video assessments</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-gradient-card border border-border/50 shadow-card animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          [
            { label: "Total Interviews", value: stats?.total || 0 },
            { label: "Completed", value: stats?.completed || 0 },
            { label: "Pending", value: stats?.pending || 0 },
            { label: "Avg. Score", value: `${Math.round(stats?.avgScore || 0)}/10` },
          ].map((stat) => (
            <Card key={stat.label} className="bg-gradient-card border border-border/50 shadow-card">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="bg-gradient-card border border-border/50 shadow-card">
        <CardHeader>
          <CardTitle>Interview Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div></div>
          ) : interviews.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Video className="w-8 h-8 mx-auto mb-2" />
              <p>No interviews sent yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {interviews.map((interview) => (
                <div key={interview.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium">{interview.candidateName}</h4>
                    <p className="text-sm text-muted-foreground">{interview.jobTitle}</p>
                    <p className="text-xs text-muted-foreground mt-1">{interview.candidateEmail}</p>
                    <p className="text-xs text-muted-foreground">Sent: {new Date(interview.sentAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(interview.status)}
                    {interview.status === 'completed' && (
                      <Button size="sm" variant="outline" onClick={() => handleViewResult(interview)}>
                        <Eye className="w-4 h-4 mr-1" />
                        View Result
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Interview Invitation</DialogTitle>
            <DialogDescription>Send an AI video interview invitation to a candidate</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="candidateName">Candidate Name</Label>
              <Input id="candidateName" value={formData.candidateName} onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })} placeholder="John Doe" />
            </div>
            <div>
              <Label htmlFor="candidateEmail">Candidate Email</Label>
              <Input id="candidateEmail" type="email" value={formData.candidateEmail} onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })} placeholder="john@example.com" />
            </div>
            <div>
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input id="jobTitle" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} placeholder="Senior Software Engineer" />
            </div>
            <div>
              <Label htmlFor="skills">Required Skills</Label>
              <Input id="skills" value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} placeholder="React, TypeScript, Node.js" />
            </div>
            <div>
              <Label htmlFor="experienceLevel">Experience Level</Label>
              <select id="experienceLevel" value={formData.experienceLevel} onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })} className="w-full p-2 border rounded">
                <option value="Entry-level">Entry-level</option>
                <option value="Mid-level">Mid-level</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
              </select>
            </div>
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <select id="difficulty" value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })} className="w-full p-2 border rounded">
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendInvite} disabled={sending || !formData.candidateEmail || !formData.candidateName || !formData.jobTitle}>
              {sending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Interview Result - {selectedInterview?.candidateName}</DialogTitle>
            <DialogDescription>View the candidate's interview performance and AI feedback</DialogDescription>
          </DialogHeader>
          {selectedInterview?.result && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Technical</p>
                    <p className="text-2xl font-bold">{selectedInterview.result.technicalScore}/10</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Communication</p>
                    <p className="text-2xl font-bold">{selectedInterview.result.communicationScore}/10</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Overall</p>
                    <p className="text-2xl font-bold">{selectedInterview.result.overallScore}/10</p>
                  </CardContent>
                </Card>
              </div>
              <div>
                <h4 className="font-semibold mb-2">AI Feedback</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedInterview.result.aiFeedback}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Transcript</h4>
                <div className="bg-muted p-4 rounded-lg max-h-60 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{selectedInterview.result.transcript}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
