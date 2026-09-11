import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import candidateService from "@/services/candidate.service";
import candidateAuthService from "@/services/candidate-auth.service";
import uploadService from "@/services/upload.service";
import CandidateLayout from "@/layouts/CandidateLayout";
import Footer from "@/components/Footer";
import { Upload, FileText, X } from "lucide-react";

const CandidateProfile = () => {
  const [candidate, setCandidate] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isInitialSetup, setIsInitialSetup] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    location: "",
    currentTitle: "",
    currentCompany: "",
    experience: "",
    education: "",
    skills: [] as string[],
    resumeUrl: ""
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [validatingResume, setValidatingResume] = useState(false);
  const [resumeValidation, setResumeValidation] = useState<{
    isValid: boolean;
    message: string;
    type: 'success' | 'error' | null;
  }>({ isValid: false, message: '', type: null });
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const candidateData = candidateAuthService.getCurrentCandidate();
    setCandidate(candidateData);
    
    // Check if this is initial setup (coming from signup or incomplete profile)
    const urlParams = new URLSearchParams(window.location.search);
    const setup = urlParams.get('setup') === 'true';
    const isProfileCompleted = candidateAuthService.checkProfileStatus();
    
    // Force initial setup mode if profile is not completed
    setIsInitialSetup(setup || !isProfileCompleted);
    
    if (setup || !isProfileCompleted) {
      setIsEditing(true);
    }
    
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setFetchingProfile(true);
      const response = await candidateService.getProfile();
      if (response.success && response.candidate) {
        const profile = response.candidate;
        setFormData({
          phone: profile.phone || "",
          location: profile.location || "",
          currentTitle: profile.currentTitle || "",
          currentCompany: profile.currentCompany || "",
          experience: profile.experience || "",
          education: profile.education || "",
          skills: Array.isArray(profile.skills) ? profile.skills : (() => { try { const p = JSON.parse(profile.skills); return Array.isArray(p) ? p : []; } catch { return []; } })(),
          resumeUrl: profile.resumeUrl || ""
        });
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      // If profile doesn't exist, start in editing mode
      setIsEditing(true);
    } finally {
      setFetchingProfile(false);
    }
  };

  const experienceLevels = [
    { value: "0", label: "Fresh Graduate" },
    { value: "1", label: "1 Year" },
    { value: "2", label: "2 Years" },
    { value: "3", label: "3 Years" },
    { value: "4", label: "4 Years" },
    { value: "5", label: "5+ Years" },
    { value: "10", label: "10+ Years" }
  ];

  const skillOptions = [
    "JavaScript", "Python", "Java", "React", "Node.js", "SQL", "HTML/CSS",
    "TypeScript", "Angular", "Vue.js", "PHP", "C#", "Ruby", "Go", "Rust",
    "Project Management", "Marketing", "Sales", "Design", "Data Analysis"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if resume is valid before proceeding
      if (resumeFile && !resumeValidation.isValid) {
        toast({
          title: "Invalid Resume",
          description: "Please upload a valid resume before submitting.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Update profile (resume URL is already set during validation)
      console.log('Submitting profile data:', formData); // Debug log
      await candidateService.updateProfile(formData);
      
      // Mark profile as completed
      localStorage.setItem('profileCompleted', 'true');
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      });
      
      setIsEditing(false);
      setResumeFile(null);
      setResumeValidation({ isValid: false, message: '', type: null });
      
      // If this was initial setup, redirect to dashboard
      if (isInitialSetup) {
        navigate("/candidate/dashboard");
      } else {
        // Refresh profile data
        await fetchProfile();
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Reset validation state
      setResumeValidation({ isValid: false, message: '', type: null });
      
      // Basic file type validation
      if (file.type !== 'application/pdf') {
        setResumeValidation({
          isValid: false,
          message: "Please select a PDF file only.",
          type: 'error'
        });
        return;
      }
      
      // File size validation (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setResumeValidation({
          isValid: false,
          message: "Please select a file smaller than 10MB.",
          type: 'error'
        });
        return;
      }
      
      setResumeFile(file);
      setValidatingResume(true);
      
      try {
        // Validate resume content in real-time
        const uploadResponse = await uploadService.uploadResume(file);
        // Update form data with the uploaded resume URL
        setFormData(prev => ({ ...prev, resumeUrl: uploadResponse.resumeUrl }));
        setResumeValidation({
          isValid: true,
          message: "Valid resume detected! Ready to upload.",
          type: 'success'
        });
      } catch (error: any) {
        const errorMessage = error.response?.data?.message;
        setResumeValidation({
          isValid: false,
          message: errorMessage?.includes('Invalid resume file') 
            ? "Invalid resume file. Please upload a valid resume PDF containing professional information like experience, education, and skills."
            : "Failed to validate resume. Please try again.",
          type: 'error'
        });
        setResumeFile(null);
      } finally {
        setValidatingResume(false);
      }
    }
  };

  const removeResumeFile = () => {
    setResumeFile(null);
    setResumeValidation({ isValid: false, message: '', type: null });
    // Clear the resume URL from form data
    setFormData(prev => ({ ...prev, resumeUrl: '' }));
  };

  return (
    <CandidateLayout hideFooter>
      <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground mt-2">Manage your professional information</p>
          </div>

          {fetchingProfile ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info mx-auto mb-4"></div>
              <p className="text-lg text-muted-foreground">Loading your profile...</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {!isEditing ? (
                // Display Mode
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Profile Information</CardTitle>
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                        <p className="text-foreground">{formData.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                        <p className="text-foreground">{formData.location || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Current Title</Label>
                        <p className="text-foreground">{formData.currentTitle || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Current Company</Label>
                        <p className="text-foreground">{formData.currentCompany || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Years of Experience</Label>
                      <p className="text-foreground">{formData.experience ? `${formData.experience} years` : 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Education</Label>
                      <p className="text-foreground">{formData.education || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Skills</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.skills.length > 0 ? (
                          formData.skills.map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-info/14 text-info rounded-md text-sm">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <p className="text-foreground">No skills added</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Resume</Label>
                      <p className="text-foreground">{formData.resumeUrl ? 'Resume uploaded' : 'No resume uploaded'}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // Edit Mode
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="City, State"
                      value={formData.location}
                      onChange={(e) => updateFormData("location", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentTitle">Current Title</Label>
                    <Input
                      id="currentTitle"
                      placeholder="Software Engineer"
                      value={formData.currentTitle}
                      onChange={(e) => updateFormData("currentTitle", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentCompany">Current Company</Label>
                    <Input
                      id="currentCompany"
                      placeholder="Company Name"
                      value={formData.currentCompany}
                      onChange={(e) => updateFormData("currentCompany", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Select onValueChange={(value) => updateFormData("experience", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceLevels.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education">Education</Label>
                  <Textarea
                    id="education"
                    placeholder="Your educational background..."
                    value={formData.education}
                    onChange={(e) => updateFormData("education", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Skills</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {skillOptions.map(skill => (
                      <label key={skill} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.skills.includes(skill)}
                          onChange={() => toggleSkill(skill)}
                          className="rounded"
                        />
                        <span className="text-sm">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Resume (PDF only)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6">
                    {!resumeFile && !formData.resumeUrl ? (
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="mt-4">
                          <label htmlFor="resume-upload" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-foreground">
                              Upload your professional resume
                            </span>
                            <span className="mt-1 block text-sm text-muted-foreground">
                              PDF files only, max 10MB. Must contain professional information like experience, education, and skills.
                            </span>
                          </label>
                          <input
                            id="resume-upload"
                            type="file"
                            accept=".pdf"
                            onChange={handleResumeFileChange}
                            className="hidden"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-info" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {resumeFile ? resumeFile.name : 'Current Resume'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {resumeFile ? `${(resumeFile.size / 1024 / 1024).toFixed(2)} MB` : 'Uploaded'}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeResumeFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Real-time validation feedback */}
                  {(validatingResume || resumeValidation.type) && (
                    <div className={`mt-2 p-3 rounded-md text-sm ${
                      validatingResume ? 'bg-info/10 text-info' :
                      resumeValidation.type === 'success' ? 'bg-success/10 text-success' :
                      'bg-destructive/10 text-destructive'
                    }`}>
                      {validatingResume ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-info"></div>
                          <span>Validating resume content...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          {resumeValidation.type === 'success' ? (
                            <span className="text-success">✓</span>
                          ) : (
                            <span className="text-destructive">✗</span>
                          )}
                          <span>{resumeValidation.message}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || validatingResume || (resumeFile && !resumeValidation.isValid)}
                >
                  {validatingResume ? "Validating Resume..." : isLoading ? "Saving..." : isInitialSetup ? "Complete Profile" : "Save Changes"}
                </Button>
                {!isInitialSetup && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    )}
  </div>
    </CandidateLayout>
  );
};

export default CandidateProfile;