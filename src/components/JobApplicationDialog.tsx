import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Job } from "@/services/job.service";
import { Upload, FileText, User, ArrowLeft, ArrowRight, CheckCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import applicationService from "@/services/application.service";
import uploadService from "@/services/upload.service";
import candidateAuthService from "@/services/candidate-auth.service";
import GoogleSignIn from "@/components/GoogleSignIn";
import { Link } from "react-router-dom";

interface CustomQuestion {
  question?: string;
  text?: string;
  type?: string;
  options?: string[];
  required?: boolean;
  id?: string;
  isExpanded?: boolean;
}

interface JobApplicationDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplicationSubmitted?: () => void;
}

interface ApplicationData {
  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  
  // Documents
  resumeFile: File | null;
  coverLetter: string;
  
  // Additional Questions
  answers: Record<string, string>;
}

interface ATSAnalysis {
  atsScore: number;
  skillsMatchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceRelevance: string;
  recommendation: string;
}

const JobApplicationDialog = ({ job, open, onOpenChange, onApplicationSubmitted }: JobApplicationDialogProps) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFirstTimeApplicant, setIsFirstTimeApplicant] = useState(true);
  const [savedAnswers, setSavedAnswers] = useState<Array<{question: string, answer: string}>>([]);
  const [atsAnalysis, setAtsAnalysis] = useState<ATSAnalysis | null>(null);
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [validatingResume, setValidatingResume] = useState(false);
  const [resumeValidation, setResumeValidation] = useState<{
    isValid: boolean;
    message: string;
    type: 'success' | 'error' | null;
  }>({ isValid: false, message: '', type: null });
  const { toast } = useToast();
  
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    countryCode: "+91",
    resumeFile: null,
    coverLetter: "",
    answers: {}
  });
  const [existingResumeUrl, setExistingResumeUrl] = useState<string | null>(null);
  const [useExistingResume, setUseExistingResume] = useState(true);

  // Check if candidate is logged in and pre-fill data
  useEffect(() => {
    const checkCandidateStatus = async () => {
      // Reset to step 1 when dialog opens
      setStep(1);
      
      // Reset form data first
      setApplicationData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        countryCode: "+91",
        resumeFile: null,
        coverLetter: "",
        answers: {}
      });
      
      // Reset validation states
      setResumeValidation({ isValid: false, message: '', type: null });
      setAtsAnalysis(null);
      setExistingResumeUrl(null);
      setUseExistingResume(true);
      setExistingResumeUrl(null);
      setUseExistingResume(true);
      
      const candidate = candidateAuthService.getCurrentCandidate();
      if (candidate) {
        setIsLoggedIn(true);
        
        // Fetch candidate profile to get existing resume
        try {
          const profileResponse = await candidateAuthService.getProfile();
          const profile = profileResponse.candidate;
          
          // Fill with current logged-in candidate's data
          setApplicationData(prev => ({
            ...prev,
            firstName: profile.firstName || "",
            lastName: profile.lastName || "",
            email: profile.email || "",
            phone: profile.phone?.replace(/^\+\d+\s/, "") || "",
            countryCode: profile.phone?.match(/^\+\d+/)?.[0] || "+91"
          }));
          
          // Set existing resume if available
          if (profile.resumeUrl) {
            setExistingResumeUrl(profile.resumeUrl);
            setUseExistingResume(true);
            setResumeValidation({
              isValid: true,
              message: "Using your existing resume from profile",
              type: 'success'
            });
          }
        } catch (error) {
          console.error('Error fetching candidate profile:', error);
          // Fallback to basic candidate data
          setApplicationData(prev => ({
            ...prev,
            firstName: candidate.firstName || "",
            lastName: candidate.lastName || "",
            email: candidate.email || "",
            phone: candidate.phone?.replace(/^\+\d+\s/, "") || "",
            countryCode: candidate.phone?.match(/^\+\d+/)?.[0] || "+91"
          }));
        }

        // Check if candidate has previous applications
        if (job?.id) {
          try {
            const response = await applicationService.checkPreviousApplication(job.id, candidate.email);
            setIsFirstTimeApplicant(response.isFirstTime);
            setSavedAnswers(response.savedAnswers || []);
            
            // Pre-fill answers if returning user
            if (!response.isFirstTime && response.savedAnswers) {
              const answersMap: Record<string, string> = {};
              response.savedAnswers.forEach((item: {question: string, answer: string}) => {
                // Map saved answers to question IDs based on question text
                const customQuestions = getJobQuestions(job);
                const matchingQuestion = customQuestions.find(q => q.question === item.question);
                if (matchingQuestion) {
                  answersMap[matchingQuestion.id] = item.answer;
                }
              });
              setApplicationData(prev => ({
                ...prev,
                answers: answersMap
              }));
            }
          } catch (error) {
            console.error('Error checking previous applications:', error);
            setIsFirstTimeApplicant(true);
          }
        }
      } else {
        setIsLoggedIn(false);
        setIsFirstTimeApplicant(true);
      }
    };

    if (open) {
      checkCandidateStatus();
    }
  }, [open, job]);

// Job-specific questions from job.applyFormConfig
const getJobQuestions = (job: Job) => {
  const questions = [];

  // Add location question (always included)
  questions.push({
    id: "location",
    question: "Your location",
    type: "text",
    required: true  // Always required!
  });

  // Add relevant experience question (always included)
  questions.push({
    id: "relevant_experience",
    question: "How many years of experience in this relevant job?",
    type: "select",
    options: ["Less than 1 year", "1-2 years", "3-5 years", "5+ years"],
    required: false
  });

  // Add custom questions from job.applyFormConfig
  if (job.applyFormConfig?.customQuestions && Array.isArray(job.applyFormConfig.customQuestions)) {
    job.applyFormConfig.customQuestions.forEach((customQuestion: CustomQuestion, index: number) => {
      questions.push({
        id: `custom_${index}`,
        question: customQuestion.question || customQuestion.text || '',
        type: customQuestion.type || "text",
        options: customQuestion.options || undefined,
        required: customQuestion.required || false
      });
    });
  }

  return questions;
};


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Reset validation state
      setResumeValidation({ isValid: false, message: '', type: null });
      setUseExistingResume(false); // Switch to new resume
      
      // Basic file type validation - PDF only
      if (file.type !== 'application/pdf') {
        setResumeValidation({
          isValid: false,
          message: "Please select a PDF file only.",
          type: 'error'
        });
        return;
      }

      // File size validation
      if (file.size > 10 * 1024 * 1024) {
        setResumeValidation({
          isValid: false,
          message: "Please select a file smaller than 10MB.",
          type: 'error'
        });
        return;
      }

      setValidatingResume(true);
      
      try {
        // Validate resume content in real-time
        const uploadResponse = await uploadService.uploadResume(file);
        
        setApplicationData({ ...applicationData, resumeFile: file });
        setResumeValidation({
          isValid: true,
          message: "Valid resume detected! This will be used for this application only.",
          type: 'success'
        });
        
        setAtsAnalysis(null);
        
        // Analyze resume for job matching in background
        if (job) {
          setIsAnalyzingResume(true);
          try {
            const jobDescription = `${job.title}\n${job.description}\n${job.requirements}`;
            const result = await uploadService.uploadAndAnalyzeResume(file, jobDescription, job.skills);
            
            if (result.analysis && result.analysis.matchedSkills && result.analysis.matchedSkills.length > 0) {
              setAtsAnalysis(result.analysis);
            } else {
              setAtsAnalysis({
                atsScore: 0,
                skillsMatchPercentage: 0,
                matchedSkills: [],
                missingSkills: Array.isArray(job.skills) ? job.skills : typeof job.skills === "string" ? (() => { try { const p = JSON.parse(job.skills); return Array.isArray(p) ? p : []; } catch { return []; } })() : [],
                experienceRelevance: '',
                recommendation: 'NOT RECOMMENDED'
              });
            }
          } catch (error) {
            console.error('Resume analysis error:', error);
            setAtsAnalysis({
              atsScore: 0,
              skillsMatchPercentage: 0,
              matchedSkills: [],
              missingSkills: Array.isArray(job.skills) ? job.skills : typeof job.skills === "string" ? (() => { try { const p = JSON.parse(job.skills); return Array.isArray(p) ? p : []; } catch { return []; } })() : [],
              experienceRelevance: '',
              recommendation: 'NOT RECOMMENDED'
            });
          } finally {
            setIsAnalyzingResume(false);
          }
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message;
        setResumeValidation({
          isValid: false,
          message: errorMessage?.includes('Invalid resume file') 
            ? "Invalid resume file. Please upload a valid resume PDF containing professional information like experience, education, and skills."
            : "Failed to validate resume. Please try again.",
          type: 'error'
        });
        setApplicationData({ ...applicationData, resumeFile: null });
      } finally {
        setValidatingResume(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!job) return;
    
    // Dynamic validation based on job configuration
    const jobConfig = job.applyFormConfig || {};
    
    if (jobConfig.coverLetterRequired && (!applicationData.coverLetter || applicationData.coverLetter.trim() === '')) {
      toast({
        title: "Cover Letter Required",
        description: "Cover Letter is required for this job.",
        variant: "destructive",
      });
      return;
    }
    
    if (jobConfig.phoneRequired && (!applicationData.phone || applicationData.phone.trim() === '')) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a valid phone number.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      let resumeUrl = '';

      // Use existing resume or upload new one
      if (useExistingResume && existingResumeUrl) {
        resumeUrl = existingResumeUrl;
      } else if (applicationData.resumeFile) {
        try {
          setIsUploadingResume(true);
          const uploadResponse = await uploadService.uploadResume(applicationData.resumeFile);
          resumeUrl = uploadResponse.resumeUrl;
        } catch (error) {
          console.error('Resume upload error:', error);
          toast({
            title: "Resume Upload Failed",
            description: "Please try uploading your resume again.",
            variant: "destructive",
          });
          return;
        } finally {
          setIsUploadingResume(false);
        }
      }

      // Convert answers object to array format
      const answersArray = Object.entries(applicationData.answers).map(([questionId, answer]) => {
        const question = getJobQuestions(job).find(q => q.id === questionId);
        return {
          question: question?.question || questionId,
          answer
        };
      });

      const submitData = {
        jobId: job.id,
        firstName: applicationData.firstName,
        lastName: applicationData.lastName,
        email: applicationData.email,
        phone: applicationData.phone,
        countryCode: applicationData.countryCode,
        resumeUrl: resumeUrl || undefined,
        coverLetter: applicationData.coverLetter,
        answers: answersArray
      };

      await applicationService.submitApplication(submitData);
      
      toast({
        title: "Application Submitted!",
        description: "Thank you for your interest. We'll review your application and get back to you soon.",
      });
      
      onApplicationSubmitted?.();
      onOpenChange(false);
      // Reset form
      setStep(1);
      setApplicationData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        countryCode: "+91",
        resumeFile: null,
        coverLetter: "",
        answers: {}
      });
      setResumeValidation({ isValid: false, message: '', type: null });
      setAtsAnalysis(null);
      setExistingResumeUrl(null);
      setUseExistingResume(true);
    } catch (error: any) {
      console.error('Application submission error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0]?.msg || 
                          "Failed to submit application. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

//  const canProceedToStep2 = () => {
//     const phoneRequired = job?.applyFormConfig?.phoneRequired ?? false;
//     const phoneValid = phoneRequired ? !!applicationData.phone : true;
    
//     return applicationData.firstName && 
//            applicationData.lastName && 
//            applicationData.email && 
//            phoneValid && 
//            applicationData.resumeFile &&
//            !isAnalyzingResume && 
//            (!atsAnalysis || atsAnalysis.matchedSkills.length > 0);
//   };
  const canProceedToStep2 = applicationData.firstName && applicationData.lastName && 
                           applicationData.email && 
                           (job?.applyFormConfig?.phoneRequired ? applicationData.phone : true) &&
                           (job?.applyFormConfig?.coverLetterRequired ? applicationData.coverLetter.trim() : true) &&
                           (useExistingResume ? existingResumeUrl : (applicationData.resumeFile && resumeValidation.isValid)) && 
                           !validatingResume && 
                           (!atsAnalysis || atsAnalysis.matchedSkills.length > 0);
  

  const canProceedToReview = canProceedToStep2;

  const canProceedToStep3 = job ? (() => {
    const requiredQuestions = getJobQuestions(job).filter(q => q.required);
    return requiredQuestions.every(q => applicationData.answers[q.id] && applicationData.answers[q.id].trim() !== '');
  })() : false;

  if (!job) return null;

  const questions = getJobQuestions(job);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Apply for {job.title}</DialogTitle>
          <DialogDescription className="text-lg">
            {job.company} • {job.location} {job.isRemote && "(Remote)"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        {isLoggedIn && (
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              {isFirstTimeApplicant && (
                <>
                  <div className={`w-12 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    {step > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
                  </div>
                </>
              )}
              <div className={`w-12 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {step > 3 ? <CheckCircle className="w-5 h-5" /> : isFirstTimeApplicant ? '3' : '2'}
              </div>
            </div>
          </div>
        )}

        {/* Step 0: Authentication (if not logged in) */}
        {step === 1 && !isLoggedIn && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Sign in to Apply</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Please sign in or create an account to apply for this position
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <GoogleSignIn 
                  onSuccess={() => {
                    setIsLoggedIn(true);
                    const candidate = candidateAuthService.getCurrentCandidate();
                    if (candidate) {
                      setApplicationData(prev => ({
                        ...prev,
                        firstName: candidate.firstName || "",
                        lastName: candidate.lastName || "",
                        email: candidate.email || "",
                        phone: candidate.phone?.replace(/^\+\d+\s/, "") || "",
                        countryCode: candidate.phone?.match(/^\+\d+/)?.[0] || "+91"
                      }));
                    }
                  }}
                 //  redirectTo="" 
                  redirectTo={undefined}
                />
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                {/* <div className="text-center space-y-2">
                  <Link to="/candidate/login" className="text-primary hover:underline text-sm">
                    Sign in with email
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Don't have an account? <Link to="/candidate/signup" className="text-primary hover:underline">Sign up</Link>
                  </p>
                </div> */}
                
                <div className="text-center space-y-2">
                   <Link to={`/candidate/login?returnTo=${encodeURIComponent(window.location.href)}`} className="text-primary hover:underline text-sm">
                   Sign in with email
                  </Link>
                  <p className="text-xs text-muted-foreground">
                  Don't have an account? <Link to={`/candidate/signup?returnTo=${encodeURIComponent(window.location.href)}`} className="text-primary hover:underline">Sign up</Link>
                    </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 1: Personal Info & Documents */}
        {step === 1 && isLoggedIn && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={applicationData.firstName}
                      onChange={(e) => setApplicationData({...applicationData, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={applicationData.lastName}
                      onChange={(e) => setApplicationData({...applicationData, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={applicationData.email}
                    onChange={(e) => setApplicationData({...applicationData, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="countryCode">Country Code *</Label>
                    <Select value={applicationData.countryCode} onValueChange={(value) => setApplicationData({...applicationData, countryCode: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+91">India (+91)</SelectItem>
                        <SelectItem value="+1">USA (+1)</SelectItem>
                        <SelectItem value="+44">UK (+44)</SelectItem>
                        <SelectItem value="+61">Australia (+61)</SelectItem>
                        <SelectItem value="+1">Canada (+1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="phone">
                      Mobile Phone Number {job.applyFormConfig?.phoneRequired && "*"}
                    </Label>
                    <Input
                      id="phone"
                      value={applicationData.phone}
                      onChange={(e) => setApplicationData({...applicationData, phone: e.target.value})}
                      required={job.applyFormConfig?.phoneRequired}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="resume">Resume/CV *</Label>
                  <div className="mt-2">
                    {/* Show existing resume option */}
                    {existingResumeUrl && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="useExisting"
                              name="resumeChoice"
                              checked={useExistingResume}
                              onChange={() => {
                                setUseExistingResume(true);
                                setApplicationData({...applicationData, resumeFile: null});
                                setResumeValidation({
                                  isValid: true,
                                  message: "Using your existing resume from profile",
                                  type: 'success'
                                });
                              }}
                            />
                            <Label htmlFor="useExisting" className="text-sm font-medium text-blue-800">
                              Use existing resume from profile
                            </Label>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Upload new resume option */}
                    <div className="mb-2">
                      {existingResumeUrl && (
                        <div className="flex items-center space-x-2 mb-2">
                          <input
                            type="radio"
                            id="uploadNew"
                            name="resumeChoice"
                            checked={!useExistingResume}
                            onChange={() => setUseExistingResume(false)}
                          />
                          <Label htmlFor="uploadNew" className="text-sm font-medium">
                            Upload a different resume for this application
                          </Label>
                        </div>
                      )}
                    </div>
                    <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${useExistingResume && existingResumeUrl ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          {applicationData.resumeFile ? (
                            <span className="font-semibold text-green-600">{applicationData.resumeFile.name}</span>
                          ) : (
                            <>
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">PDF files only (MAX. 10MB). Must contain professional information like experience, education, and skills.</p>
                      </div>
                      <input
                        id="resume"
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        disabled={validatingResume || isAnalyzingResume || (useExistingResume && existingResumeUrl)}
                      />
                    </label>
                  </div>
                  
                  {/* Real-time validation feedback */}
                  {(validatingResume || resumeValidation.type) && (
                    <div className={`mt-2 p-3 rounded-md text-sm ${
                      validatingResume ? 'bg-blue-50 text-blue-700' :
                      resumeValidation.type === 'success' ? 'bg-green-50 text-green-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {validatingResume ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>Validating resume content...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          {resumeValidation.type === 'success' ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-red-600">✗</span>
                          )}
                          <span>{resumeValidation.message}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Warning message when resume doesn't match */}
                {atsAnalysis && atsAnalysis.matchedSkills.length === 0 && (
                  <Card className="border-red-300 bg-red-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-red-800 mb-1">Resume Does Not Meet Job Requirements</h4>
                          <p className="text-sm text-red-700">
                            Your resume does not match the required skills and experience for this position. Please update your resume or consider applying for a different role.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <div>
                  <Label htmlFor="coverLetter">
                    Cover Letter {job.applyFormConfig?.coverLetterRequired && "*"}
                  </Label>
                  <Textarea
                    id="coverLetter"
                    placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                    rows={4}
                    value={applicationData.coverLetter}
                    onChange={(e) => setApplicationData({...applicationData, coverLetter: e.target.value})}
                    required={job.applyFormConfig?.coverLetterRequired}
                  />
                  {job.applyFormConfig?.coverLetterRequired && !applicationData.coverLetter.trim() && (
                    <p className="text-sm text-red-600 mt-1">Cover Letter is required to proceed.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                onClick={() => setStep(isFirstTimeApplicant ? 2 : 3)} 
                disabled={isFirstTimeApplicant ? !canProceedToStep2 : !canProceedToReview}
                className="px-8"
              >
                {validatingResume ? 'Validating...' : isAnalyzingResume ? 'Analyzing...' : (isFirstTimeApplicant ? 'Next' : 'Review')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
{/* Step 2: Additional Questions */}
{step === 2 && (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Additional Questions</CardTitle>
        <p className="text-sm text-muted-foreground">
          Please answer these questions to help us better understand your qualifications.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((question) => (
          <div key={question.id}>
            <Label className="text-sm font-medium">
              {question.question} {question.required && "*"}
            </Label>

            {question.type === "select" ? (
              <Select
                value={applicationData.answers[question.id] || ""}
                onValueChange={(value) =>
                  setApplicationData({
                    ...applicationData,
                    answers: { ...applicationData.answers, [question.id]: value },
                  })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {question.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                className="mt-2"
                type="text"
                placeholder="Enter your answer"
                value={applicationData.answers[question.id] || ""}
                onChange={(e) =>
                  setApplicationData({
                    ...applicationData,
                    answers: { ...applicationData.answers, [question.id]: e.target.value },
                  })
                }
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>

    <div className="flex justify-between">
      <Button variant="outline" onClick={() => setStep(1)}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>
      <Button
        onClick={() => setStep(3)}
        disabled={!canProceedToStep3}
        className="px-8"
      >
        Review <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  </div>
)}


        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Your Application</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Please review your information before submitting.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Personal Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Name:</strong> {applicationData.firstName} {applicationData.lastName}</p>
                    <p><strong>Email:</strong> {applicationData.email}</p>
                    <p><strong>Phone:</strong> {applicationData.countryCode} {applicationData.phone}</p>
                    <p><strong>Resume:</strong> {applicationData.resumeFile?.name}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Additional Questions</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {questions.map((question) => (
                      <div key={question.id}>
                        <p className="text-sm font-medium">{question.question}</p>
                        <p className="text-sm text-gray-600">{applicationData.answers[question.id]}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {applicationData.coverLetter && (
                  <div>
                    <h4 className="font-semibold mb-2">Cover Letter</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm">{applicationData.coverLetter}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="px-8 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default JobApplicationDialog;