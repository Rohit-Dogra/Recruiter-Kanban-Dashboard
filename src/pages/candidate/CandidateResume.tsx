import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Upload, Eye, Edit, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import candidateAuthService from "@/services/candidate-auth.service";
import candidateService from "@/services/candidate.service";
import uploadService from "@/services/upload.service";
import CandidateLayout from "@/layouts/CandidateLayout";
import ResumeViewer from "@/components/ResumeViewer";

const CandidateResume = () => {
  const [candidate, setCandidate] = useState<any>(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showResumeViewer, setShowResumeViewer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validatingResume, setValidatingResume] = useState(false);
  const [uploadedResumeUrl, setUploadedResumeUrl] = useState<string | null>(null);
  const [resumeValidation, setResumeValidation] = useState<{
    isValid: boolean;
    message: string;
    type: 'success' | 'error' | null;
  }>({ isValid: false, message: '', type: null });
  const { toast } = useToast();

  useEffect(() => {
    const candidateData = candidateAuthService.getCurrentCandidate();
    setCandidate(candidateData);
    
    // Fetch current resume URL from candidate profile
    if (candidateData) {
      fetchCandidateProfile();
    }
  }, []);

  const fetchCandidateProfile = async () => {
    try {
      const response = await candidateService.getProfile();
      if (response.success && response.candidate) {
        setResumeUrl(response.candidate.resumeUrl || "");
      }
    } catch (error) {
      console.error("Error fetching candidate profile:", error);
      // If no profile exists, resumeUrl will remain empty
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    // File size validation (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setResumeValidation({
        isValid: false,
        message: "Please select a file smaller than 10MB.",
        type: 'error'
      });
      return;
    }

    setSelectedFile(file);
    setValidatingResume(true);

    try {
      // Validate resume content and upload to S3
      const uploadResponse = await uploadService.uploadResume(file);
      
      setUploadedResumeUrl(uploadResponse.resumeUrl); // Store the S3 URL
      setResumeValidation({
        isValid: true,
        message: "Valid resume detected! Ready to save.",
        type: 'success'
      });
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.message;
      setResumeValidation({
        isValid: false,
        message: errorMessage?.includes('Invalid resume file') 
          ? "Invalid resume file. Please upload a valid resume PDF containing professional information like experience, education, and skills."
          : errorMessage || "Failed to validate resume. Please try again.",
        type: 'error'
      });
      setSelectedFile(null);
      setUploadedResumeUrl(null);
    } finally {
      setValidatingResume(false);
    }
  };

  const handleSaveResume = async () => {
    if (!selectedFile || !uploadedResumeUrl) {
      toast({
        title: "Error",
        description: "Please select and validate a PDF file first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Use the already uploaded resume URL from validation step
      const response = await candidateService.updateProfile({ resumeUrl: uploadedResumeUrl });
      
      // Update local state
      setResumeUrl(uploadedResumeUrl);
      const updatedCandidate = { ...candidate, resumeUrl: uploadedResumeUrl };
      localStorage.setItem('candidate', JSON.stringify(updatedCandidate));
      setCandidate(updatedCandidate);
      
      toast({
        title: "Resume Updated",
        description: "Your resume has been uploaded successfully!",
      });
      
      setIsEditing(false);
      setSelectedFile(null);
      setUploadedResumeUrl(null);
      setResumeValidation({ isValid: false, message: '', type: null });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewResume = () => {
    if (resumeUrl) {
      setShowResumeViewer(true);
    } else {
      toast({
        title: "No Resume",
        description: "Please upload a resume first",
        variant: "destructive",
      });
    }
  };

  return (
    <CandidateLayout hideFooter>
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Resume</h1>
          <p className="text-gray-600 mt-2">Manage your resume and keep it up to date</p>
        </div>

        <div className="grid gap-6">
          {/* Current Resume */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Current Resume
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resumeUrl ? (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Resume Available</p>
                      <p className="text-sm text-green-700">Your resume is ready to view</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleViewResume}>
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resume Added</h3>
                  <p className="text-gray-600 mb-4">Add your resume to get started with job applications</p>
                  <Button onClick={() => setIsEditing(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Add Resume
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Resume */}
          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Edit className="w-5 h-5" />
                    {resumeUrl ? 'Update Resume' : 'Add Resume'}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resumeFile">Upload Resume (PDF only)</Label>
                  <Input
                    id="resumeFile"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="text-sm text-green-600">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    Upload a PDF file (max 10MB). Must contain professional information like experience, education, and skills.
                  </p>
                </div>
                
                {/* Real-time validation feedback */}
                {(validatingResume || resumeValidation.type) && (
                  <div className={`p-3 rounded-md text-sm ${
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
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveResume} 
                    disabled={isLoading || validatingResume || (selectedFile && !resumeValidation.isValid)}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {validatingResume ? "Validating..." : isLoading ? "Saving..." : "Save Resume"}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setIsEditing(false);
                    setSelectedFile(null);
                    setResumeValidation({ isValid: false, message: '', type: null });
                  }}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resume Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Resume Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Keep your resume updated with your latest experience and skills</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Use a professional format and ensure it's easy to read</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Make sure your resume URL is publicly accessible</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Tailor your resume for each job application when possible</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <ResumeViewer 
        open={showResumeViewer}
        onOpenChange={setShowResumeViewer}
        resumeUrl={resumeUrl}
        candidateName={candidate?.firstName + ' ' + candidate?.lastName || 'Candidate'}
      />
    </CandidateLayout>
  );
};

export default CandidateResume;