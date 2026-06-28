import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import CandidateProfile from "./CandidateProfile";
import { EmailConfirmationDialog } from "./EmailConfirmationDialog";
import { CallConfirmationDialog } from "./CallConfirmationDialog";
import InterviewScheduler from "./InterviewScheduler";
import { SubscriptionPopup, SubscriptionAction } from "./SubscriptionPopup";
import applicationService from "@/services/application.service";
import emailService from "@/services/email.service";
import callService from "@/services/call.service";
import aiVideoInterviewService from "@/services/ai-video-interview.service";
import subscriptionService from "@/services/subscription.service";
import { useToast } from "@/hooks/use-toast";
import { LucideIcon, FileText, Phone, Video, Users, Award, CheckCircle, Layers, List } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { OfferLetterGenerator } from "./OfferLetterGenerator";
import { EnhancedOfferLetterGenerator } from "./EnhancedOfferLetterGenerator";
import { useMediaQuery } from "@/hooks/useMediaQuery";

// Stage transition validation map: defines which stages each stage can transition to
const allowedTransitions: Record<string, string[]> = {
  "new": ["reviewed"],
  "reviewed": ["new", "shortlisted"],
  "shortlisted": ["reviewed", "interview"],
  "interview": ["shortlisted", "offered"],
  "offered": ["interview", "hired"],
  "hired": [],
};

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
  jobId?: string;
  email?: string;
  phone?: string;
  status?: string;
  resumeUrl?: string;
  coverLetter?: string;
  answers?: Array<{question: string; answer: string}>;
  experience?: string;
  skills?: string[];
  currentCompany?: string;
  education?: string;
}

interface PipelineStage {
  id: string;
  title: string;
  icon: LucideIcon;
  color: string;
  candidates: Candidate[];
  actionType?: 'none' | 'email' | 'call' | 'interview' | 'ai_phone' | 'ai_video' | 'offer_letter';
}

interface Application {
  id?: number;
  status?: string;
  appliedDate?: string;
  createdAt?: string;
  aiScore?: number;
  atsStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  resumeUrl?: string;
  coverLetter?: string;
  answers?: Array<{question: string; answer: string}>;
  candidate?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    location?: string;
    experience?: string;
    skills?: string[];
    currentTitle?: string;
    currentCompany?: string;
    education?: string;
    avatarUrl?: string;
    resumeUrl?: string;
  };
}

interface KanbanBoardProps {
  jobId?: string;
  applications?: Application[];
  onRefresh?: () => void;
  customStages?: PipelineStage[];
}

interface ProfileCandidate {
  id: string;
  applicationId?: string | number;
  name: string;
  email: string;
  phone: string;
  position: string;
  location: string;
  experience: string;
  skills: string[];
  score: number;
  avatar: string;
  resumeUrl?: string;
  coverLetter?: string;
  answers?: Array<{question: string; answer: string}>;
}

export const KanbanBoard = ({ jobId, applications = [], onRefresh, customStages }: KanbanBoardProps = {}) => {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<ProfileCandidate | null>(null);
  const [swimlaneGrouping, setSwimlaneGrouping] = useState<'all' | 'byJob'>('all');
  const [emailDialog, setEmailDialog] = useState<{
    open: boolean;
    candidateId: string;
    candidateName: string;
    fromStage: string;
    toStage: string;
  } | null>(null);
  const [showInterviewScheduler, setShowInterviewScheduler] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [callDialog, setCallDialog] = useState<{
    open: boolean;
    candidateId: string;
    toStageId?: string;
  } | null>(null);
  const [aiVideoDialog, setAiVideoDialog] = useState<{
    open: boolean;
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
  } | null>(null);
  const [aiVideoFormData, setAiVideoFormData] = useState({ jobTitle: '', skills: '', experienceLevel: 'Mid-level', difficulty: 'Medium' });
  const [sendingAiVideo, setSendingAiVideo] = useState(false);
  const [offerLetterDialog, setOfferLetterDialog] = useState<{
    open: boolean;
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
    jobTitle: string;
    jobId?: string;
    applicationId?: number;
  } | null>(null);
  const [subscriptionPopup, setSubscriptionPopup] = useState<{
    open: boolean;
    action: SubscriptionAction;
    candidateId?: string;
    applicationId?: number;
  } | null>(null);
  const [pendingCallExecute, setPendingCallExecute] = useState<(() => void) | null>(null);
  const [pendingToStageId, setPendingToStageId] = useState<string | null>(null);
  const { toast } = useToast();

  const updateStagesWithApplications = useCallback(() => {
    // Get the base stages (either custom or default)
    const baseStages = customStages || getEmptyStages();
    
    // Create a map for candidates by stage ID
    const stagesMap: Record<string, Candidate[]> = {};
    baseStages.forEach(stage => {
      stagesMap[stage.id] = [];
    });

    applications.forEach((app) => {
      const status = app.status || 'new';
      
      // Find the matching stage for this status
      let targetStageId = status;
      
      // If using custom stages, find the stage that matches this status
      if (customStages && customStages.length > 0) {
        const matchingStage = customStages.find(stage => stage.id === status);
        if (matchingStage) {
          targetStageId = matchingStage.id;
        } else {
          // Fallback: try to find by title or use first stage
          const fallbackStage = customStages.find(stage => 
            stage.title.toLowerCase().includes(status.toLowerCase())
          ) || customStages[0];
          targetStageId = fallbackStage.id;
        }
      } else {
        // Default mapping for built-in stages
        if (status === 'screening') targetStageId = 'reviewed';
        if (status === 'final') targetStageId = 'interview';
      }
      
      if (stagesMap[targetStageId] !== undefined) {
        const candidateName = `${app.candidate?.firstName || ''} ${app.candidate?.lastName || ''}`.trim();
        const appliedDate = app.appliedDate || app.createdAt;
        const formattedDate = appliedDate ? new Date(appliedDate).toLocaleDateString() : '';
        
        const experienceText = app.candidate?.experience ? `${app.candidate.experience} years` : '0 years';
        const rawSkills = app.candidate?.skills;
        const skillsArray = Array.isArray(rawSkills) ? rawSkills : typeof rawSkills === "string" ? (() => { try { const p = JSON.parse(rawSkills); return Array.isArray(p) ? p : []; } catch { return []; } })() : [];
        
        stagesMap[targetStageId].push({
          id: String(app.id || Math.random()),
          applicationId: app.id,
          jobId: app.jobId != null ? String(app.jobId) : undefined,
          name: candidateName || 'Unknown Candidate',
          role: app.candidate?.currentTitle || 'Candidate',
          score: app.aiScore || 0,
          atsStatus: app.atsStatus || 'pending',
          email: app.candidate?.email || '',
          phone: app.candidate?.phone || '',
          location: app.candidate?.location || 'Not specified',
          experience: experienceText,
          skills: skillsArray,
          currentCompany: app.candidate?.currentCompany || '',
          education: app.candidate?.education || '',
          status: app.status,
          appliedDate: formattedDate,
          resumeUrl: app.resumeUrl || app.candidate?.resumeUrl || '',
          coverLetter: app.coverLetter || '',
          answers: app.answers || [],
          avatar: app.candidate?.avatarUrl || candidateName?.split(' ').map(n => n[0]).join('') || 'UC'
        });
      }
    });

    const filledStages = baseStages.map(stage => ({
      ...stage,
      candidates: stagesMap[stage.id] || []
    }));

    setStages(filledStages);
  }, [applications, customStages]);

  useEffect(() => {
    if (customStages && customStages.length > 0) {
      // Use custom stages if provided
      updateStagesWithApplications();
    } else if (applications.length > 0) {
      updateStagesWithApplications();
    } else {
      setStages(getEmptyStages());
    }
  }, [applications, customStages, updateStagesWithApplications]);

  const getEmptyStages = (): PipelineStage[] => customStages || [
    {
      id: "new",
      title: "Applied",
      icon: FileText,
      color: "bg-blue-500",
      candidates: [],
      actionType: "none"
    },
    {
      id: "reviewed",
      title: "Phone Screening",
      icon: Phone,
      color: "bg-yellow-500",
      candidates: [],
      actionType: "call"
    },
    {
      id: "shortlisted",
      title: "Technical Interview",
      icon: Video,
      color: "bg-purple-500",
      candidates: [],
      actionType: "interview"
    },
    {
      id: "interview",
      title: "Final Review",
      icon: Users,
      color: "bg-orange-500",
      candidates: [],
      actionType: "email"
    },
    {
      id: "offered",
      title: "Offer Extended",
      icon: Award,
      color: "bg-green-500",
      candidates: [],
      actionType: "email"
    },
    {
      id: "hired",
      title: "Hired",
      icon: CheckCircle,
      color: "bg-emerald-600",
      candidates: [],
      actionType: "email"
    }
  ];

  const handleCandidateClick = (candidate: Candidate, application?: Application) => {
    const profileCandidate: ProfileCandidate = {
      id: candidate.id,
      applicationId: application?.id,
      name: candidate.name || 'Unknown Candidate',
      email: candidate.email || '',
      phone: candidate.phone || '',
      position: candidate.role || 'Candidate',
      location: candidate.location || 'Not specified',
      experience: candidate.experience || '0 years',
      skills: Array.isArray(candidate.skills) ? candidate.skills : typeof candidate.skills === "string" ? (() => { try { const p = JSON.parse(candidate.skills); return Array.isArray(p) ? p : []; } catch { return []; } })() : [],
      score: candidate.score,
      avatar: candidate.avatar || candidate.name?.split(' ').map(n => n[0]).join('') || 'UC',
      resumeUrl: candidate.resumeUrl || '',
      coverLetter: candidate.coverLetter || '',
      answers: candidate.answers || []
    };
    setSelectedCandidate(profileCandidate);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const candidateId = active.id as string;
    
    const candidate = stages
      .flatMap(stage => stage.candidates)
      .find(c => c.id === candidateId);
    
    setActiveCandidate(candidate || null);
  };

  const handleDragOver = async (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const candidateId = active.id as string;
    const overId = over.id as string;

    const activeStageIndex = stages.findIndex(stage =>
      stage.candidates.some(c => c.id === candidateId)
    );

    const overStageIndex = stages.findIndex(stage => stage.id === overId);

    if (activeStageIndex === -1 || overStageIndex === -1) return;
    if (activeStageIndex === overStageIndex) return;

    // Visual feedback only - don't move candidates during drag over
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCandidate(null);
    
    const { active, over } = event;
    if (!over) return;

    const candidateId = active.id as string;
    const overId = over.id as string;

    // Find original stage positions before any UI updates
    const activeStageIndex = stages.findIndex(stage =>
      stage.candidates.some(c => c.id === candidateId)
    );
    
    // Check if dropping on a stage column or another candidate
    let newStageIndex = stages.findIndex(stage => stage.id === overId);
    
    // If dropping on a candidate, find the stage that contains that candidate
    if (newStageIndex === -1) {
      newStageIndex = stages.findIndex(stage =>
        stage.candidates.some(c => c.id === overId)
      );
    }
    
    if (activeStageIndex === -1 || newStageIndex === -1) return;
    if (activeStageIndex === newStageIndex) return;

    // Find the candidate in the original stages
    const candidate = stages[activeStageIndex].candidates.find(c => c.id === candidateId);

    if (candidate) {
      const fromStageId = stages[activeStageIndex].id;
      const toStageId = stages[newStageIndex].id;
      const toStage = stages[newStageIndex];

      // Stage transition validation: check allowedTransitions before accepting drop
      const allowed = allowedTransitions[fromStageId];
      if (allowed && !allowed.includes(toStageId)) {
        toast({
          title: "Invalid Transition",
          description: `Cannot move candidate from "${stages[activeStageIndex].title}" to "${toStage.title}". This stage transition is not allowed.`,
          variant: "destructive"
        });
        return;
      }
      
      // Check if this is a custom stage with specific action type
      const isCustomStage = customStages && customStages.length > 0;
      const stageActionType = isCustomStage ? 
        customStages.find(s => s.id === toStageId)?.actionType : 
        getDefaultActionType(toStageId);
      
      // Handle different action types
      if (stageActionType === 'call' || stageActionType === 'ai_phone' || (!isCustomStage && toStageId === 'reviewed')) {
        // Check subscription before showing call dialog
        try {
          const subscriptionStatus = await subscriptionService.getStatus();
          if (subscriptionStatus.canUsePhoneScreening) {
            setCallDialog({
              open: true,
              candidateId,
              toStageId
            });
          } else {
            setPendingToStageId(toStageId);
            setSubscriptionPopup({
              open: true,
              action: 'phone_screening',
              candidateId
            });
          }
        } catch (error) {
          setPendingToStageId(toStageId);
          setSubscriptionPopup({
            open: true,
            action: 'phone_screening',
            candidateId
          });
        }
      } else if (stageActionType === 'ai_video') {
        // Handle AI Video Interview - show AI video interview invitation dialog
        setAiVideoDialog({
          open: true,
          candidateId,
          candidateName: candidate.name,
          candidateEmail: candidate.email || ''
        });
        setAiVideoFormData({ jobTitle: candidate.role || '', skills: '', experienceLevel: 'Mid-level', difficulty: 'Medium' });
      } else if (stageActionType === 'offer_letter') {
        // Handle Offer Letter Generation
        setOfferLetterDialog({
          open: true,
          candidateId,
          candidateName: candidate.name,
          candidateEmail: candidate.email || '',
          jobTitle: candidate.role || 'Position',
          jobId: candidate.jobId || jobId,
          applicationId: candidate.applicationId
        });
      } else if (stageActionType === 'interview' || (!isCustomStage && toStageId === 'shortlisted')) {
        // Check subscription before showing interview scheduler
        if (candidate.applicationId) {
          try {
            const subscriptionStatus = await subscriptionService.getStatus();
            if (subscriptionStatus.canUseTechnicalInterview) {
              // Subscription exists, proceed directly
              setSelectedApplicationId(candidate.applicationId);
              setShowInterviewScheduler(true);
            } else {
              // No subscription, show subscription popup first
              setSubscriptionPopup({
                open: true,
                action: 'technical_interview',
                candidateId,
                applicationId: candidate.applicationId
              });
            }
          } catch (error) {
            // On error, show subscription popup to be safe
            setSubscriptionPopup({
              open: true,
              action: 'technical_interview',
              candidateId,
              applicationId: candidate.applicationId
            });
          }
        } else {
          toast({
            title: "Error",
            description: "Could not find application details for this candidate",
            variant: "destructive"
          });
        }
      } else {
        // Show email confirmation dialog for other stages
        setEmailDialog({
          open: true,
          candidateId,
          candidateName: candidate.name,
          fromStage: stages[activeStageIndex].title,
          toStage: toStage.title
        });
      }
    }
  };

  const getDefaultActionType = (stageId: string): string => {
    const actionMap: Record<string, string> = {
      'new': 'none',
      'reviewed': 'call',
      'shortlisted': 'interview',
      'interview': 'email',
      'offered': 'email',
      'hired': 'email'
    };
    return actionMap[stageId] || 'email';
  };

  const handleEmailConfirmation = async (sendEmail: boolean, emailContent?: string) => {
    if (!emailDialog) return;

    const { candidateId, toStage } = emailDialog;
    const newStageId = stages.find(s => s.title === toStage)?.id;

    if (!newStageId) return;

    // Optimistic UI update: move candidate visually before API call
    const previousStages = [...stages.map(s => ({ ...s, candidates: [...s.candidates] }))];
    setStages(prev => {
      const updated = prev.map(s => ({ ...s, candidates: [...s.candidates] }));
      const fromStage = updated.find(s => s.candidates.some(c => c.id === candidateId));
      const targetStage = updated.find(s => s.id === newStageId);
      if (fromStage && targetStage) {
        const candidate = fromStage.candidates.find(c => c.id === candidateId);
        if (candidate) {
          fromStage.candidates = fromStage.candidates.filter(c => c.id !== candidateId);
          targetStage.candidates = [...targetStage.candidates, candidate];
        }
      }
      return updated;
    });

    try {
      // Update backend status
      await applicationService.updateApplicationStatus(
        parseInt(candidateId), 
        newStageId,
        `Moved to ${toStage}${sendEmail ? ' (Email sent)' : ''}`
      );

      if (sendEmail && emailContent) {
        // Get candidate email from the candidate data
        const candidate = stages.find(stage => 
          stage.candidates.some(c => c.id === candidateId)
        )?.candidates.find(c => c.id === candidateId);
        
        if (candidate?.email) {
          await emailService.sendEmail({
            to: candidate.email,
            subject: `Application Status Update - ${toStage}`,
            content: emailContent,
            candidateName: candidate.name
          });
        }
      }

      toast({
        title: "Status Updated",
        description: `Application moved to ${toStage}${sendEmail ? '. Email sent to candidate.' : ''}`,
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive"
      });
      
      // Rollback optimistic UI update on error
      setStages(previousStages);
    }

    setEmailDialog(null);
  };

  const handleAiVideoInvite = async () => {
    if (!aiVideoDialog) return;

    try {
      setSendingAiVideo(true);
      const inviteData = {
        candidateEmail: aiVideoDialog.candidateEmail,
        candidateName: aiVideoDialog.candidateName,
        jobTitle: aiVideoFormData.jobTitle,
        role: aiVideoFormData.jobTitle,
        skills: aiVideoFormData.skills,
        experienceLevel: aiVideoFormData.experienceLevel,
        difficulty: aiVideoFormData.difficulty
      };
      
      await aiVideoInterviewService.sendInvite(inviteData);
      
      // Update application status
      const newStageId = stages.find(s => s.actionType === 'ai_video')?.id;
      if (newStageId) {
        await applicationService.updateApplicationStatus(
          parseInt(aiVideoDialog.candidateId), 
          newStageId,
          'AI Video Interview invitation sent'
        );
      }
      
      toast({
        title: "Success",
        description: "AI Video Interview invitation sent successfully",
      });
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send AI Video Interview invitation",
        variant: "destructive"
      });
    } finally {
      setSendingAiVideo(false);
      setAiVideoDialog(null);
    }
  };
  const handleOfferLetterComplete = async () => {
    try {
      const newStageId = stages.find(s => s.actionType === 'offer_letter')?.id;
      if (newStageId && offerLetterDialog) {
        await applicationService.updateApplicationStatus(
          parseInt(offerLetterDialog.candidateId), 
          newStageId,
          'Offer letter sent to candidate'
        );
      }
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive"
      });
    }
  };

  const handleCallConfirmation = async (option: 'skip' | 'now' | '1hour' | '2hours') => {
    if (!callDialog) return;

    const { candidateId, toStageId } = callDialog;
    const targetStatus = toStageId ?? 'reviewed';

    // Optimistic UI update: move candidate visually before API call
    const previousStages = [...stages.map(s => ({ ...s, candidates: [...s.candidates] }))];
    setStages(prev => {
      const updated = prev.map(s => ({ ...s, candidates: [...s.candidates] }));
      const fromStage = updated.find(s => s.candidates.some(c => c.id === candidateId));
      const targetStage = updated.find(s => s.id === targetStatus);
      if (fromStage && targetStage && fromStage.id !== targetStage.id) {
        const candidate = fromStage.candidates.find(c => c.id === candidateId);
        if (candidate) {
          fromStage.candidates = fromStage.candidates.filter(c => c.id !== candidateId);
          targetStage.candidates = [...targetStage.candidates, candidate];
        }
      }
      return updated;
    });

    try {
      await applicationService.updateApplicationStatus(
        parseInt(candidateId), 
        targetStatus,
        `Moved to stage - ${option === 'skip' ? 'Call skipped' : option === 'now' ? 'Called immediately' : `Call scheduled in ${option.replace('hours', ' hours').replace('hour', ' hour')}`}`
      );

      // Handle call scheduling/execution based on option
      if (option === 'now') {
        // Find candidate and initiate call immediately
        const candidate = stages.find(stage => 
          stage.candidates.some(c => c.id === candidateId)
        )?.candidates.find(c => c.id === candidateId);
        
        if (candidate?.phone) {
          try {
            await callService.makeCall(candidate.phone, undefined, {
              candidateId: parseInt(candidateId),
              candidateName: candidate.name,
              candidateRole: candidate.role
             }, jobId);
            
            toast({
              title: "Call Initiated",
              description: `Calling ${candidate.name} at ${candidate.phone}`,
            });
          } catch (callError) {
            toast({
              title: "Call Failed",
              description: "Failed to initiate the call. Please try again.",
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "No Phone Number",
            description: "This candidate doesn't have a phone number on file.",
            variant: "destructive"
          });
        }
      } else if (option === '1hour' || option === '2hours') {
        // Schedule call for later
        const candidate = stages.find(stage => 
          stage.candidates.some(c => c.id === candidateId)
        )?.candidates.find(c => c.id === candidateId);
        
        if (candidate?.phone) {
          try {
            const hours = option === '1hour' ? 1 : 2;
            const scheduledTime = new Date();
            scheduledTime.setHours(scheduledTime.getHours() + hours);
            const scheduledAt = scheduledTime.toISOString();
            
            await callService.scheduleCall(candidate.phone, scheduledAt, undefined, {
              candidateId: parseInt(candidateId),
              candidateName: candidate.name,
              candidateRole: candidate.role
             }, jobId);
            
            toast({
              title: "Call Scheduled",
              description: `Call scheduled for ${candidate.name} in ${hours} hour${hours > 1 ? 's' : ''}`,
            });
          } catch (callError) {
            toast({
              title: "Scheduling Failed",
              description: "Failed to schedule the call. Please try again.",
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "No Phone Number",
            description: "This candidate doesn't have a phone number on file.",
            variant: "destructive"
          });
        }
      }

      toast({
        title: "Status Updated",
        description: `Candidate moved to Phone Screening${option === 'skip' ? '' : option === 'now' ? ' and call initiated' : ` and call scheduled in ${option.replace('hours', ' hours').replace('hour', ' hour')}`}`,
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive"
      });
      
      // Rollback optimistic UI update on error
      setStages(previousStages);
    }

    setCallDialog(null);
  };

  // Compute unique job labels for swimlane grouping
  const getJobLabels = (): string[] => {
    const jobIds = new Set<string>();
    stages.forEach(stage => {
      stage.candidates.forEach(c => {
        if (c.jobId) jobIds.add(c.jobId);
      });
    });
    return Array.from(jobIds);
  };

  // Filter candidates by job for swimlane view
  const getStagesForJob = (targetJobId: string): PipelineStage[] => {
    return stages.map(stage => ({
      ...stage,
      candidates: stage.candidates.filter(c => c.jobId === targetJobId)
    }));
  };

  // Get job title from candidates (use role as proxy since we don't have job title directly)
  const getJobLabel = (targetJobId: string): string => {
    for (const stage of stages) {
      const candidate = stage.candidates.find(c => c.jobId === targetJobId);
      if (candidate) return `Job #${targetJobId}`;
    }
    return `Job #${targetJobId}`;
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Swimlane grouping toggle */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={swimlaneGrouping === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSwimlaneGrouping('all')}
        >
          <List className="w-4 h-4 mr-1" />
          All
        </Button>
        <Button
          variant={swimlaneGrouping === 'byJob' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSwimlaneGrouping('byJob')}
        >
          <Layers className="w-4 h-4 mr-1" />
          By Job
        </Button>
      </div>

      {swimlaneGrouping === 'byJob' ? (
        <div className="space-y-6">
          {getJobLabels().map(jobIdLabel => (
            <div key={jobIdLabel}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
                {getJobLabel(jobIdLabel)}
              </h3>
              <div className={isMobile ? "flex flex-col gap-4 pb-4" : "flex gap-6 overflow-x-auto pb-4"}>
                {getStagesForJob(jobIdLabel).map((stage) => (
                  <KanbanColumn
                    key={`${stage.id}-${jobIdLabel}`}
                    id={stage.id}
                    title={stage.title}
                    candidates={stage.candidates}
                    color={stage.color}
                    icon={stage.icon}
                    actionType={stage.actionType}
                    onCandidateClick={(candidate) => {
                      const application = applications.find(app => String(app.id) === candidate.id);
                      handleCandidateClick(candidate, application);
                    }}
                    onBeforePhoneCall={(candidate, executeCall) => {
                      subscriptionService.getStatus()
                        .then((subscriptionStatus) => {
                          if (subscriptionStatus.canUsePhoneScreening) {
                            executeCall();
                          } else {
                            setPendingCallExecute(() => executeCall);
                            setSubscriptionPopup({
                              open: true,
                              action: 'phone_screening',
                              candidateId: candidate.id
                            });
                          }
                        })
                        .catch(() => {
                          setPendingCallExecute(() => executeCall);
                          setSubscriptionPopup({
                            open: true,
                            action: 'phone_screening',
                            candidateId: candidate.id
                          });
                        });
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
          {getJobLabels().length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No candidates with job assignments found.
            </div>
          )}
        </div>
      ) : (
      <div className={isMobile ? "flex flex-col gap-4 pb-4" : "flex gap-6 overflow-x-auto pb-4"}>
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            id={stage.id}
            title={stage.title}
            candidates={stage.candidates}
            color={stage.color}
            icon={stage.icon}
            actionType={stage.actionType}
            onCandidateClick={(candidate) => {
              // Find the application for this candidate
              const application = applications.find(app => String(app.id) === candidate.id);
              handleCandidateClick(candidate, application);
            }}
            onBeforePhoneCall={(candidate, executeCall) => {
              // Check subscription before allowing phone call
              subscriptionService.getStatus()
                .then((subscriptionStatus) => {
                  if (subscriptionStatus.canUsePhoneScreening) {
                    // Subscription exists, proceed with call
                    executeCall();
                  } else {
                    // No subscription, show subscription popup first
                    setPendingCallExecute(() => executeCall);
                    setSubscriptionPopup({
                      open: true,
                      action: 'phone_screening',
                      candidateId: candidate.id
                    });
                  }
                })
                .catch(() => {
                  // On error, show subscription popup to be safe
                  setPendingCallExecute(() => executeCall);
                  setSubscriptionPopup({
                    open: true,
                    action: 'phone_screening',
                    candidateId: candidate.id
                  });
                });
            }}
          />
        ))}
      </div>
      )}
      
      <DragOverlay>
        {activeCandidate ? (
          <KanbanCard candidate={activeCandidate} />
        ) : null}
      </DragOverlay>
      
      <CandidateProfile 
        open={!!selectedCandidate} 
        onOpenChange={(open) => !open && setSelectedCandidate(null)}
        candidate={selectedCandidate}
      />
      
      {emailDialog && (
        <EmailConfirmationDialog
          open={emailDialog.open}
          onOpenChange={(open) => !open && setEmailDialog(null)}
          candidateName={emailDialog.candidateName}
          fromStage={emailDialog.fromStage}
          toStage={emailDialog.toStage}
          onConfirm={handleEmailConfirmation}
        />
      )}
      
      {callDialog && (
        <CallConfirmationDialog
          open={callDialog.open}
          onOpenChange={(open) => !open && setCallDialog(null)}
          candidateName={stages.find(stage =>
            stage.candidates.some(c => c.id === callDialog.candidateId)
          )?.candidates.find(c => c.id === callDialog.candidateId)?.name || 'Candidate'}
          jobId={
            (() => {
              const app = applications.find(a => String(a.id) === callDialog.candidateId);
              return app?.jobId ?? jobId;
            })()
          }
          onConfirm={handleCallConfirmation}
        />
      )}
      
      <InterviewScheduler
        open={showInterviewScheduler}
        onOpenChange={(open) => {
          setShowInterviewScheduler(open);
          if (!open) {
            setSelectedApplicationId(null);
            if (onRefresh) onRefresh();
          }
        }}
        applicationId={selectedApplicationId}
      />

      {subscriptionPopup && (
        <SubscriptionPopup
          open={subscriptionPopup.open}
          onOpenChange={(open) => {
            if (!open) {
              setSubscriptionPopup(null);
              setPendingCallExecute(null);
            }
          }}
          action={subscriptionPopup.action}
          onProceed={() => {
            if (subscriptionPopup.action === 'phone_screening') {
              if (pendingCallExecute) {
                pendingCallExecute();
                setPendingCallExecute(null);
              } else if (subscriptionPopup.candidateId) {
                setCallDialog({
                  open: true,
                  candidateId: subscriptionPopup.candidateId,
                  toStageId: pendingToStageId ?? 'reviewed'
                });
                setPendingToStageId(null);
              }
            } else if (subscriptionPopup.action === 'technical_interview' && subscriptionPopup.applicationId) {
              setSelectedApplicationId(subscriptionPopup.applicationId);
              setShowInterviewScheduler(true);
            }
            setSubscriptionPopup(null);
          }}
          onCancel={() => {
            setSubscriptionPopup(null);
            setPendingCallExecute(null);
            setPendingToStageId(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
      
      {aiVideoDialog && (
        <Dialog open={aiVideoDialog.open} onOpenChange={(open) => !open && setAiVideoDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send AI Video Interview Invitation</DialogTitle>
              <DialogDescription>Send an AI video interview invitation to {aiVideoDialog.candidateName}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input 
                  id="jobTitle" 
                  value={aiVideoFormData.jobTitle} 
                  onChange={(e) => setAiVideoFormData({ ...aiVideoFormData, jobTitle: e.target.value })} 
                  placeholder="Senior Software Engineer" 
                />
              </div>
              <div>
                <Label htmlFor="skills">Required Skills</Label>
                <Input 
                  id="skills" 
                  value={aiVideoFormData.skills} 
                  onChange={(e) => setAiVideoFormData({ ...aiVideoFormData, skills: e.target.value })} 
                  placeholder="React, TypeScript, Node.js" 
                />
              </div>
              <div>
                <Label htmlFor="experienceLevel">Experience Level</Label>
                <select 
                  id="experienceLevel" 
                  value={aiVideoFormData.experienceLevel} 
                  onChange={(e) => setAiVideoFormData({ ...aiVideoFormData, experienceLevel: e.target.value })} 
                  className="w-full p-2 border rounded"
                >
                  <option value="Entry-level">Entry-level</option>
                  <option value="Mid-level">Mid-level</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                </select>
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <select 
                  id="difficulty" 
                  value={aiVideoFormData.difficulty} 
                  onChange={(e) => setAiVideoFormData({ ...aiVideoFormData, difficulty: e.target.value })} 
                  className="w-full p-2 border rounded"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAiVideoDialog(null)}>Cancel</Button>
              <Button 
                onClick={handleAiVideoInvite} 
                disabled={sendingAiVideo || !aiVideoFormData.jobTitle}
              >
                {sendingAiVideo ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {offerLetterDialog && (
        <EnhancedOfferLetterGenerator
          open={offerLetterDialog.open}
          onOpenChange={(open) => !open && setOfferLetterDialog(null)}
          candidateId={offerLetterDialog.candidateId}
          candidateName={offerLetterDialog.candidateName}
          candidateEmail={offerLetterDialog.candidateEmail}
          jobTitle={offerLetterDialog.jobTitle}
          jobId={offerLetterDialog.jobId}
          applicationId={offerLetterDialog.applicationId}
          onComplete={handleOfferLetterComplete}
        />
      )}
    </DndContext>
  );
};
