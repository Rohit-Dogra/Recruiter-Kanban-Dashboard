import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  X, 
  Building, 
  MapPin, 
  Briefcase,
  BadgeDollarSign, 
  FileText,
  CheckSquare,
  Clock,
  CalendarRange,
  Users,
  Bold,
  Italic,
  Link,
  List,
  ListOrdered,
  Plus,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Sparkles,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import jobService, { JobFormData } from "@/services/job.service";
import companyService from "@/services/company.service";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ───

interface CustomQuestion {
  id: string;
  question: string;
  isExpanded: boolean;
}

interface ApplyFormConfig {
  phoneRequired: boolean;
  coverLetterRequired: boolean;
  customQuestions: CustomQuestion[];
}

interface PostJobFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated?: () => void;
}

// ─── AI Rewrite Helper (calls your backend proxy) ──

const API_BASE = (import.meta.env.VITE_API_URL).replace(/\/api\/?$/, "");


async function callAIRewrite(payload: {
  title: string;
  company: string;
  department: string;
  type: string;
  experience: string;
  location: string;
  workType: string;
  existingDescription?: string;
  existingRequirements?: string;
  existingBenefits?: string;
}): Promise<{ description: string; requirements: string; benefits: string }> {
  const res = await fetch(`${API_BASE}/api/ai/rewrite-job`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "AI rewrite failed");
  }

  return res.json();
}

async function generateCustomQuestions(payload: {
  title: string;
  department: string;
  experience: string;
}): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/ai/generate-questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to generate questions");
  }

  const data = await res.json();
  return data.questions;
}

// ─── Component ───

const PostJobForm = ({ open, onOpenChange, onJobCreated }: PostJobFormProps) => {
  const [activeTab, setActiveTab] = useState("basics");
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
    skills: [] as string[],
    status: "active",
    urgency: "medium"
  });

  const [workType, setWorkType] = useState<'remote' | 'onsite' | 'hybrid'>('onsite');
  const [expiresIn, setExpiresIn] = useState('30days');

  const [applyFormConfig, setApplyFormConfig] = useState<ApplyFormConfig>({
    phoneRequired: false,
    coverLetterRequired: false,
    customQuestions: []
  });

  const [newSkill, setNewSkill] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // ── AI Rewrite state ───
  const [isRewriting, setIsRewriting] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  // Track which fields were last AI-generated so user knows
  const [aiGenerated, setAiGenerated] = useState({
    description: false,
    requirements: false,
    benefits: false,
  });

  const { toast } = useToast();

  useEffect(() => {
    const autoFillCompanyName = async () => {
      if (!open) return;

      try {
        const company = await companyService.getCompany();
        const companyName = company?.name || user?.company || "";
        if (!companyName) return;

        setFormData((prev) => ({
          ...prev,
          company: companyName,
        }));
      } catch {
        // Fallback to user profile company if company API is unavailable
        if (user?.company) {
          setFormData((prev) => ({
            ...prev,
            company: user.company as string,
          }));
        }
      }
    };

    autoFillCompanyName();
  }, [open, user?.company]);

  // ── AI Generate Questions handler ──
  const handleGenerateQuestions = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Job Title Required",
        description: "Please enter a Job Title first to generate relevant questions.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingQuestions(true);
    try {
      const questions = await generateCustomQuestions({
        title: formData.title,
        department: formData.department || "",
        experience: formData.experience || "entry",
      });

      const newQuestions: CustomQuestion[] = questions.map((q, idx) => ({
        id: Date.now().toString() + idx,
        question: q,
        isExpanded: false,
      }));

      setApplyFormConfig((prev) => ({
        ...prev,
        customQuestions: newQuestions,
      }));

      toast({
        title: "Questions Generated ✨",
        description: `${questions.length} role-specific questions have been created.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to Generate Questions",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // ── AI Rewrite handler ──
  const handleAIRewrite = async () => {
    // Validation: title is minimum required
    if (!formData.title.trim()) {
      toast({
        title: "Job Title Required",
        description: "Please enter a Job Title first so AI can generate content based on the role.",
        variant: "destructive",
      });
      return;
    }

    setIsRewriting(true);
    setAiGenerated({ description: false, requirements: false, benefits: false });

    try {
      const result = await callAIRewrite({
        title: formData.title,
        company: formData.company || "the company",
        department: formData.department || "",
        type: formData.type || "full-time",
        experience: formData.experience || "entry",
        location: formData.location || "",
        workType,
        existingDescription: formData.description?.trim() || undefined,
        existingRequirements: formData.requirements?.trim() || undefined,
        existingBenefits: formData.benefits?.trim() || undefined,
      });

      setFormData((prev) => ({
        ...prev,
        description: result.description,
        requirements: result.requirements,
        benefits: result.benefits,
      }));

      setAiGenerated({ description: true, requirements: true, benefits: true });

      const hadExisting = formData.description?.trim() || formData.requirements?.trim() || formData.benefits?.trim();
      toast({
        title: "AI Rewrite Complete ✨",
        description: hadExisting
          ? "Your content has been improved and enhanced."
          : "Description, Requirements & Benefits have been generated based on your job role.",
      });
    } catch (error: any) {
      toast({
        title: "AI Rewrite Failed",
        description: error.message || "Something went wrong. Check your backend / API key.",
        variant: "destructive",
      });
    } finally {
      setIsRewriting(false);
    }
  };

  // ── Form Submit --
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const jobData = {
        ...formData,
        workType,
        expiresIn,
        applyFormConfig: {
          phoneRequired: applyFormConfig.phoneRequired,
          coverLetterRequired: applyFormConfig.coverLetterRequired,
          customQuestions: applyFormConfig.customQuestions.map(q => ({ id: q.id, question: q.question }))
        }
      };
      console.log('Submitting job data:', jobData);
      await jobService.createJob(jobData);
      
      toast({
        title: "Success!",
        description: "Job posted successfully.",
      });
      
      onOpenChange(false);
      
      if (onJobCreated) {
        onJobCreated();
      }
      
      // Reset
      setFormData({
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
        status: "active",
        urgency: "medium"
      });
      setWorkType('onsite');
      setExpiresIn('30days');
      setAiGenerated({ description: false, requirements: false, benefits: false });
    } catch (error: any) {
      console.error('Job creation error:', error.response?.data);
      toast({
        title: "Error posting job",
        description: error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "An error occurred while posting the job",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render 
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl font-semibold">Create Job Posting</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Create a compelling job description to attract the best talent
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="basics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Job Basics
              </TabsTrigger>
              <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Job Details
              </TabsTrigger>
              <TabsTrigger value="description" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Description
              </TabsTrigger>
              <TabsTrigger value="apply-form" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Apply Form
              </TabsTrigger>
            </TabsList>

            {/* ════════════════════════════════════════════ TAB: BASICS ═════ */}
            <TabsContent value="basics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title*</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Senior Frontend Developer"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company" className="flex items-center gap-1">
                        <Building className="w-4 h-4" /> Company*
                      </Label>
                      <Input
                        id="company"
                        placeholder="Your company name"
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        placeholder="e.g., Engineering"
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Location & Work Type
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge 
                      variant={workType === 'remote' ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setWorkType('remote');
                        setFormData({...formData, isRemote: true});
                      }}
                    >
                      Remote
                    </Badge>
                    <Badge 
                      variant={workType === 'onsite' ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setWorkType('onsite');
                        setFormData({...formData, isRemote: false});
                      }}
                    >
                      On-site
                    </Badge>
                    <Badge 
                      variant={workType === 'hybrid' ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setWorkType('hybrid');
                        setFormData({...formData, isRemote: false});
                      }}
                    >
                      Hybrid
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder={workType === 'remote' ? "e.g., Remote (Worldwide)" : "e.g., New York, NY"}
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Job Type*</Label>
                      <Select 
                        value={formData.type} 
                        onValueChange={(value) => setFormData({...formData, type: value})}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select job type" />
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
                </CardContent>
              </Card>

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="button" onClick={() => setActiveTab("details")}>Continue</Button>
              </div>
            </TabsContent>

            {/* ════════════════════════════════════════════ TAB: DETAILS ════ */}
            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BadgeDollarSign className="w-5 h-5 text-primary" />
                    Compensation & Level
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salary">Salary Range</Label>
                      <Input
                        id="salary"
                        placeholder="e.g., $80,000 - $120,000"
                        value={formData.salary}
                        onChange={(e) => setFormData({...formData, salary: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Transparent salary ranges attract 50% more candidates
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience">Experience Level</Label>
                      <Select 
                        value={formData.experience} 
                        onValueChange={(value) => setFormData({...formData, experience: value})}
                      >
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

                  <div className="space-y-2">
                    <Label htmlFor="urgency">Urgency Level</Label>
                    <Select 
                      value={formData.urgency || "medium"} 
                      onValueChange={(value) => setFormData({...formData, urgency: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                </CardContent>
              </Card>

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={() => setActiveTab("basics")}>Back</Button>
                <Button type="button" onClick={() => setActiveTab("description")}>Continue</Button>
              </div>
            </TabsContent>

            {/*  TAB: DESCRIPTION ═══ */}
            <TabsContent value="description" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Job Information
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Craft the role! Provide detailed job specifics to attract the perfect candidate for your organization.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">

                  {/* ── AI Rewrite Button (top of section) ── */}
                  <div className="flex items-center justify-between bg-gradient-to-r from-violet-50 to-indigo-50 border border-primary/20 rounded-lg px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-primary">
                        ✨ AI Rewrite
                      </span>
                      <span className="text-xs text-primary">
                        Auto-generate Description, Requirements & Benefits based on your job role
                      </span>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAIRewrite}
                      disabled={isRewriting || !formData.title.trim()}
                      className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 shrink-0 ml-4"
                    >
                      {isRewriting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Rewriting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Rewrite with AI
                        </>
                      )}
                    </Button>
                  </div>

                  {/* ── Description ── */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description" className="font-medium text-base">Description *</Label>
                      {aiGenerated.description && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-primary/14 text-primary">
                          <Sparkles className="h-3 w-3" /> AI Generated
                        </Badge>
                      )}
                    </div>
                    <div className="border rounded-md p-1">
                      <div className="flex items-center gap-1 border-b p-1">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                          <Bold className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                          <Italic className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                          <Link className="h-4 w-4" />
                        </Button>
                        <Separator orientation="vertical" className="h-6 mx-2" />
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                          <ListOrdered className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea
                        id="description"
                        placeholder="We are dedicated to crafting digital experience for small businesses. We believe in innovation, creativity, and the power of teamwork..."
                        rows={6}
                        value={formData.description}
                        onChange={(e) => {
                          setFormData({...formData, description: e.target.value});
                          if (aiGenerated.description) setAiGenerated(prev => ({...prev, description: false}));
                        }}
                        required
                        className="border-0 focus-visible:ring-0 focus-visible:ring-transparent"
                      />
                    </div>
                  </div>

                  {/* ── Requirements ── */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requirements" className="font-medium text-base">Requirements *</Label>
                      {aiGenerated.requirements && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-primary/14 text-primary">
                          <Sparkles className="h-3 w-3" /> AI Generated
                        </Badge>
                      )}
                    </div>
                    <Textarea
                      id="requirements"
                      placeholder="• Bachelor's degree in Computer Science or related field&#10;• 3+ years of experience with React and TypeScript&#10;• Strong understanding of modern web development practices&#10;• Experience with REST APIs and state management"
                      rows={6}
                      value={formData.requirements}
                      onChange={(e) => {
                        setFormData({...formData, requirements: e.target.value});
                        if (aiGenerated.requirements) setAiGenerated(prev => ({...prev, requirements: false}));
                      }}
                      required
                    />
                  </div>

                  {/* ── Benefits ── */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="benefits" className="font-medium text-base">Benefits</Label>
                      {aiGenerated.benefits && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-primary/14 text-primary">
                          <Sparkles className="h-3 w-3" /> AI Generated
                        </Badge>
                      )}
                    </div>
                    <Textarea
                      id="benefits"
                      placeholder="• Competitive salary and equity package&#10;• Health, dental, and vision insurance&#10;• Flexible working hours and remote work options&#10;• Professional development opportunities"
                      rows={4}
                      value={formData.benefits}
                      onChange={(e) => {
                        setFormData({...formData, benefits: e.target.value});
                        if (aiGenerated.benefits) setAiGenerated(prev => ({...prev, benefits: false}));
                      }}
                    />
                  </div>

                  {/* ── Skills ── */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="skills" className="font-medium text-base">Required Skills</Label>
                      <span className="text-xs text-muted-foreground">(Max 10 skills)</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.skills.map((skill, index) => (
                        <Badge key={index} className="px-3 py-1 bg-primary text-primary-foreground">
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
                        id="skills"
                        placeholder="Type or select skills"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        className="flex-grow"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newSkill.trim() && formData.skills.length < 10) {
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
                          if (newSkill.trim() && formData.skills.length < 10) {
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
                  
                  {/* ── Expires In + Deadline ── */}
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label className="font-medium text-base">Expires in</Label>
                      <RadioGroup 
                        value={expiresIn}
                        onValueChange={setExpiresIn}
                        className="flex flex-wrap gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="10days" id="10days" />
                          <Label htmlFor="10days" className="cursor-pointer">10 days</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="15days" id="15days" />
                          <Label htmlFor="15days" className="cursor-pointer">15 days</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="20days" id="20days" />
                          <Label htmlFor="20days" className="cursor-pointer">20 days</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="30days" id="30days" />
                          <Label htmlFor="30days" className="cursor-pointer">30 days</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deadline" className="font-medium text-base">Deadline *</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={() => setActiveTab("details")}>Back</Button>
                <Button type="button" onClick={() => setActiveTab("apply-form")}>Continue</Button>
              </div>
            </TabsContent>

            {/* ══════════════════════════════════════════ TAB: APPLY FORM ════ */}
            <TabsContent value="apply-form" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-primary" />
                    Candidate Information
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Configure what information candidates need to provide when applying
                  </p>  
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Name</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Required</Badge>
                        <span className="text-sm text-muted-foreground">Always required</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Email</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Required</Badge>
                        <span className="text-sm text-muted-foreground">Always required</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Phone</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="phone-required"
                          checked={applyFormConfig.phoneRequired}
                          onCheckedChange={(checked) => 
                            setApplyFormConfig({...applyFormConfig, phoneRequired: !!checked})
                          }
                        />
                        <Label htmlFor="phone-required" className="text-sm cursor-pointer">
                          Make required
                        </Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Cover Letter Upload</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="cover-letter-required"
                          checked={applyFormConfig.coverLetterRequired}
                          onCheckedChange={(checked) => 
                            setApplyFormConfig({...applyFormConfig, coverLetterRequired: !!checked})
                          }
                        />
                        <Label htmlFor="cover-letter-required" className="text-sm cursor-pointer">
                          Make required
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">CV or Resume Upload</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Required</Badge>
                      <span className="text-sm text-muted-foreground">Always required</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-primary" />
                    Custom Questions
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Add custom questions to better evaluate candidates
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* ── AI Generate Questions Button ── */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-info/20 rounded-lg px-4 py-3">
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-semibold text-info">
                        ✨ AI Generate Questions
                      </span>
                      <span className="text-xs text-info">
                        Auto-generate 5 role-specific screening questions
                      </span>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      {applyFormConfig.customQuestions.length > 0 && (
                        <Button
                          type="button"
                          onClick={() => setApplyFormConfig({...applyFormConfig, customQuestions: []})}
                          variant="outline"
                          className="flex items-center gap-2 flex-1 sm:flex-initial"
                        >
                          <X className="h-4 w-4" />
                          Clear All
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={handleGenerateQuestions}
                        disabled={isGeneratingQuestions || !formData.title.trim()}
                        className="bg-info hover:bg-info/90 text-white flex items-center gap-2 flex-1 sm:flex-initial"
                      >
                        {isGeneratingQuestions ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            {applyFormConfig.customQuestions.length > 0 ? 'Regenerate' : 'Generate'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {applyFormConfig.customQuestions.map((question, index) => (
                      <Collapsible 
                        key={question.id}
                        open={question.isExpanded}
                        onOpenChange={(isOpen) => {
                          const updatedQuestions = [...applyFormConfig.customQuestions];
                          updatedQuestions[index].isExpanded = isOpen;
                          setApplyFormConfig({...applyFormConfig, customQuestions: updatedQuestions});
                        }}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-secondary">
                            <span className="text-sm font-medium flex-1 mr-2 break-words">{question.question}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updatedQuestions = applyFormConfig.customQuestions.filter(q => q.id !== question.id);
                                  setApplyFormConfig({...applyFormConfig, customQuestions: updatedQuestions});
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              {question.isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-3 pb-3">
                          <Textarea
                            value={question.question}
                            onChange={(e) => {
                              const updatedQuestions = [...applyFormConfig.customQuestions];
                              updatedQuestions[index].question = e.target.value;
                              setApplyFormConfig({...applyFormConfig, customQuestions: updatedQuestions});
                            }}
                            placeholder="Enter your custom question..."
                            rows={3}
                          />
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a new custom question..."
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newQuestion.trim()) {
                            e.preventDefault();
                            const newId = Date.now().toString();
                            setApplyFormConfig({
                              ...applyFormConfig,
                              customQuestions: [...applyFormConfig.customQuestions, {
                                id: newId,
                                question: newQuestion.trim(),
                                isExpanded: false
                              }]
                            });
                            setNewQuestion('');
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (newQuestion.trim()) {
                            const newId = Date.now().toString();
                            setApplyFormConfig({
                              ...applyFormConfig,
                              customQuestions: [...applyFormConfig.customQuestions, {
                                id: newId,
                                question: newQuestion.trim(),
                                isExpanded: false
                              }]
                            });
                            setNewQuestion('');
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Question
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between mt-6">
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("description")}>Prev Page</Button>
                  <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Save Draft</Button>
                </div>
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? "Publishing..." : "Save & Next"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PostJobForm;
