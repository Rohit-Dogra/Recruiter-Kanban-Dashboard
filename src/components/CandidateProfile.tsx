import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  MapPin, 
  Calendar, 
  Star, 
  Download, 
  Mail, 
  Phone,
  Briefcase,
  GraduationCap,
  Award,
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import ResumeViewer from "./ResumeViewer";
import { EmailConfirmationDialog } from "./EmailConfirmationDialog";
import { CallConfirmationDialog } from "./CallConfirmationDialog";
import { useToast } from "@/hooks/use-toast";
import emailService from "@/services/email.service";
import callService from "@/services/call.service";

interface CandidateProfileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: {
    id: string;
    applicationId?: string | number;
    name: string;
    email: string;
    phone: string;
    position: string;
    jobTitle?: string; // Add jobTitle field
    location: string;
    experience: string;
    skills: string[];
    score: number;
    avatar: string;
    resumeUrl?: string;
    coverLetter?: string;
    answers?: Array<{question: string; answer: string}>;
  } | null;
}

interface ATSDetails {
  atsScore: number;
  skillsMatchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  requiredSkillsFound: number;
  requiredSkillsTotal: number;
  experienceRelevance: string;
  certifications?: string[];
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

const CandidateProfile = ({ open, onOpenChange, candidate }: CandidateProfileProps) => {
  const { toast } = useToast();
  const [showResume, setShowResume] = useState(false);
  const [showATSDetails, setShowATSDetails] = useState(false);
  const [atsDetails, setAtsDetails] = useState<ATSDetails | null>(null);
  const [atsError, setAtsError] = useState<string | null>(null);
  const [loadingATS, setLoadingATS] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [canRunAnalysis, setCanRunAnalysis] = useState(true);
  const [emailDialog, setEmailDialog] = useState<{
    open: boolean;
    candidateName: string;
    candidateEmail: string;
  } | null>(null);
  const [callDialog, setCallDialog] = useState<{
    open: boolean;
    candidateName: string;
  } | null>(null);

  const runATSAnalysis = async () => {
    // Use applicationId if available, fallback to candidate.id
    const idToUse = candidate?.applicationId || candidate?.id;
    if (!idToUse) return;
    
    setRunningAnalysis(true);
    setAtsError(null);
    try {
      const response = await fetch(`/api/applications/${idToUse}/analyze-ats`, {
        method: 'POST'
      });

      if (!response.ok) {
        if (response.status === 404) {
          setCanRunAnalysis(false);
          setAtsError('Application not found.');
          return;
        }
        throw new Error(`Failed to run analysis: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Refetch the details after analysis completes
        await fetchATSDetails();
      } else {
        throw new Error(data.message || 'Analysis failed');
      }
    } catch (error) {
      console.error("Error running ATS analysis:", error);
      setAtsError(error instanceof Error ? error.message : 'Failed to run analysis');
    } finally {
      setRunningAnalysis(false);
    }
  };

  const fetchATSDetails = async () => {
    // Use applicationId if available, fallback to candidate.id
    const idToUse = candidate?.applicationId || candidate?.id;
    if (!idToUse) return;
    
    setLoadingATS(true);
    setAtsError(null);
    setAtsDetails(null);
    try {
      const response = await fetch(`/api/applications/${idToUse}/ats-details`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setCanRunAnalysis(false);
          setAtsError('Application not found.');
          return;
        }
        throw new Error(`Server error: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Invalid response format from server');
      }

      const data = await response.json();
      
      // Set the full response data as ATS details
      const atsData = {
        atsScore: data.atsScore ?? 0,
        skillsMatchPercentage: data.skillsMatchPercentage ?? 0,
        matchedSkills: Array.isArray(data.matchedSkills) ? data.matchedSkills : [],
        missingSkills: Array.isArray(data.missingSkills) ? data.missingSkills : [],
        requiredSkillsFound: data.requiredSkillsFound ?? 0,
        requiredSkillsTotal: data.requiredSkillsTotal ?? 0,
        experienceRelevance: data.experienceRelevance ?? 'No analysis available',
        certifications: Array.isArray(data.certifications) ? data.certifications : [],
        strengths: Array.isArray(data.strengths) ? data.strengths : [],
        weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
        recommendation: data.recommendation ?? 'PENDING'
      };
      
      setAtsDetails(atsData);
    } catch (error) {
      console.error("Error fetching ATS details:", error);
      setAtsError(error instanceof Error ? error.message : 'Failed to fetch ATS analysis. Please try again later.');
    } finally {
      setLoadingATS(false);
      setShowATSDetails(true);
    }
  };
  
  if (!candidate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Candidate Profile</DialogTitle>
          <DialogDescription>
            View detailed information about {candidate.name}'s application and qualifications.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-6">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {candidate.avatar}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              {/* Candidate Name */}
              <h2 className="text-2xl font-bold">{candidate.name}</h2>
              
              {/* AI Match Score - positioned between name and buttons */}
              <div className="flex items-center gap-2 mt-2">
                <Star className="w-5 h-5 text-warning fill-current" />
                <span className="text-xl font-bold">{candidate.score}</span>
                <span className="text-sm text-muted-foreground">AI Match Score</span>
              </div>
              
              {/* Role */}
              <p className="text-lg text-muted-foreground mt-2">{candidate.jobTitle || candidate.position}</p>
              
              {/* Location and Experience */}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {candidate.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {candidate.location}
                  </div>
                )}
                {candidate.experience && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {candidate.experience}
                  </div>
                )}
              </div>
              
              {/* Skills Chips - inline below location/experience */}
              {candidate.skills && (() => {
                const skills = Array.isArray(candidate.skills)
                  ? candidate.skills
                  : typeof candidate.skills === "string"
                    ? (() => { try { const p = JSON.parse(candidate.skills); return Array.isArray(p) ? p : []; } catch { return []; } })()
                    : [];
                return skills.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-3">
                  {skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
                ) : null;
              })()}
            </div>
            
            {/* Action Buttons - aligned right */}
            <div className="flex gap-2">
              {candidate.resumeUrl && (
                <Button variant="outline" size="sm" onClick={() => setShowResume(true)}>
                  <Download className="w-4 h-4 mr-2" />
                  View Resume
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => {
                setEmailDialog({
                  open: true,
                  candidateName: candidate.name,
                  candidateEmail: candidate.email
                });
              }}>
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button size="sm" onClick={() => {
                setCallDialog({
                  open: true,
                  candidateName: candidate.name
                });
              }}>
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
            </div>
          </div>

          {/* Cover Letter */}
          {candidate.coverLetter && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cover Letter</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{candidate.coverLetter}</p>
              </CardContent>
            </Card>
          )}

          {/* Application Answers */}
          {candidate.answers && candidate.answers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Application Responses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {candidate.answers.map((answer, index) => (
                  <div key={index} className="border-l-4 border-primary/20 pl-4">
                    <h4 className="font-medium text-sm mb-1">{answer.question}</h4>
                    <p className="text-sm text-muted-foreground">{answer.answer}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {candidate.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{candidate.email}</span>
                </div>
              )}
              {candidate.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{candidate.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
      
      <ResumeViewer 
        open={showResume}
        onOpenChange={setShowResume}
        resumeUrl={candidate.resumeUrl || null}
        candidateName={candidate.name}
      />

      {/* ATS Details Modal */}
      <Dialog open={showATSDetails} onOpenChange={setShowATSDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ATS Analysis Details</DialogTitle>
            <DialogDescription>
              Detailed AI-powered resume match analysis for {candidate.name}
            </DialogDescription>
          </DialogHeader>

          {loadingATS && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Loading ATS analysis...</p>
            </div>
          )}

          {atsError && (
            <Card className="bg-destructive/10 border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-destructive mb-1">Unable to Load ATS Analysis</h3>
                    <p className="text-sm text-destructive mb-3">{atsError}</p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchATSDetails}
                        disabled={loadingATS}
                      >
                        {loadingATS ? "Loading..." : "Try Again"}
                      </Button>
                      {canRunAnalysis ? (
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={runATSAnalysis}
                          disabled={runningAnalysis}
                          className="bg-warning hover:bg-warning/90"
                        >
                          {runningAnalysis ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Running Analysis...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              Run ATS Analysis
                            </>
                          )}
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground self-center">Cannot run analysis for this application.</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {atsDetails && !atsError && (
            <div className="space-y-6">
              {/* Score Overview */}
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">ATS Score</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-primary">{atsDetails.atsScore}</span>
                        <span className="text-sm text-muted-foreground">/10</span>
                      </div>
                      <Progress value={(atsDetails.atsScore / 10) * 100} className="mt-2" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Skills Match</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-primary">{atsDetails.skillsMatchPercentage}</span>
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                      <Progress value={atsDetails.skillsMatchPercentage} className="mt-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skills Found */}
              {atsDetails.matchedSkills && atsDetails.matchedSkills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                      Matched Skills ({atsDetails.matchedSkills.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {atsDetails.matchedSkills.map((skill, index) => (
                        <Badge key={index} variant="default" className="bg-success/10 text-success border-success/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Missing Skills */}
              {atsDetails.missingSkills && atsDetails.missingSkills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-destructive" />
                      Missing Skills ({atsDetails.missingSkills.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {atsDetails.missingSkills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                          <XCircle className="w-3 h-3 mr-1" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Experience Relevance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Experience Relevance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-relaxed">{atsDetails.experienceRelevance}</p>
                  {atsDetails.requiredSkillsTotal > 0 && (
                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        Required Skills Found: {atsDetails.requiredSkillsFound} / {atsDetails.requiredSkillsTotal}
                      </p>
                      <Progress value={(atsDetails.requiredSkillsFound / atsDetails.requiredSkillsTotal) * 100} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Strengths */}
              {atsDetails.strengths && atsDetails.strengths.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {atsDetails.strengths.map((strength, index) => (
                        <li key={index} className="flex gap-2 text-sm">
                          <span className="text-success font-bold mt-0.5">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Weaknesses */}
              {atsDetails.weaknesses && atsDetails.weaknesses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-warning" />
                      Areas for Development
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {atsDetails.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex gap-2 text-sm">
                          <span className="text-warning font-bold mt-0.5">!</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Recommendation */}
              <Card className={`border-2 ${
                atsDetails.recommendation === "RECOMMENDED" ? "bg-success/10 border-success" :
                atsDetails.recommendation === "NOT RECOMMENDED" ? "bg-destructive/10 border-destructive" :
                "bg-warning/10 border-warning"
              }`}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    {atsDetails.recommendation === "RECOMMENDED" && (
                      <CheckCircle2 className="w-8 h-8 text-success flex-shrink-0" />
                    )}
                    {atsDetails.recommendation === "NOT RECOMMENDED" && (
                      <XCircle className="w-8 h-8 text-destructive flex-shrink-0" />
                    )}
                    {atsDetails.recommendation === "MAYBE" && (
                      <AlertCircle className="w-8 h-8 text-warning flex-shrink-0" />
                    )}
                    <div>
                      <h3 className="font-bold text-lg">Overall Recommendation</h3>
                      <p className="text-sm font-medium">
                        {atsDetails.recommendation}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {emailDialog && (
        <EmailConfirmationDialog
          open={emailDialog.open}
          onOpenChange={(open) => !open && setEmailDialog(null)}
          candidateName={emailDialog.candidateName}
          fromStage="Applied"
          toStage="Contacted"
          onConfirm={async (sendEmail, emailContent) => {
            if (sendEmail && emailContent && emailDialog) {
              try {
                await emailService.sendEmail({
                  to: emailDialog.candidateEmail,
                  subject: 'Application Update',
                  content: emailContent,
                  candidateName: emailDialog.candidateName
                });
                toast({
                  title: "Email Sent",
                  description: `Email sent successfully to ${emailDialog.candidateName}`
                });
              } catch (error) {
                toast({
                  title: "Email Failed",
                  description: "Failed to send email. Please try again.",
                  variant: "destructive"
                });
              }
            }
            setEmailDialog(null);
          }}
        />
      )}
      
      {callDialog && (
        <CallConfirmationDialog
          open={callDialog.open}
          onOpenChange={(open) => !open && setCallDialog(null)}
          candidateName={callDialog.candidateName}
          onConfirm={async (option) => {
            if (!callDialog || !candidate) return;
            
            try {
              if (!candidate.phone) {
                toast({
                  title: "No Phone Number",
                  description: "This candidate doesn't have a phone number on file.",
                  variant: "destructive"
                });
                setCallDialog(null);
                return;
              }
              
              const userData = {
                candidateId: candidate.id,
                candidateName: candidate.name,
                candidateRole: candidate.position
              };
              
              if (option === 'now') {
                await callService.makeCall(candidate.phone, undefined, userData);
                toast({
                  title: "Call Initiated",
                  description: `AI call initiated to ${callDialog.candidateName}`
                });
              } else if (option === '1hour' || option === '2hours') {
                const hours = option === '1hour' ? 1 : 2;
                const scheduledTime = new Date();
                scheduledTime.setHours(scheduledTime.getHours() + hours);
                const scheduledAt = scheduledTime.toISOString();
                
                await callService.scheduleCall(candidate.phone, scheduledAt, undefined, userData);
                toast({
                  title: "Call Scheduled",
                  description: `AI call scheduled for ${callDialog.candidateName} in ${hours} hour${hours > 1 ? 's' : ''}`
                });
              } else {
                toast({
                  title: "Call Skipped",
                  description: `Call skipped for ${callDialog.candidateName}`
                });
              }
            } catch (error) {
              console.error('Call error:', error);
              toast({
                title: "Call Failed",
                description: "Failed to initiate the call. Please try again.",
                variant: "destructive"
              });
            }
            
            setCallDialog(null);
          }}
        />
      )}
    </Dialog>
  );
};

export default CandidateProfile;