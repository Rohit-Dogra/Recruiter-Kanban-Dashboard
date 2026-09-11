import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

interface ResumeViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeUrl: string | null;
  candidateName: string;
}

const ResumeViewer = ({ open, onOpenChange, resumeUrl, candidateName }: ResumeViewerProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && resumeUrl) {
      fetchSignedUrl();
    }
  }, [open, resumeUrl]);

  const fetchSignedUrl = async () => {
    if (!resumeUrl) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Check if it's already a full URL (backward compatibility)
      if (resumeUrl.startsWith('http')) {
        setSignedUrl(resumeUrl);
        return;
      }
      
      // Handle old local paths - extract filename and treat as S3 key
      let s3Key = resumeUrl;
      if (resumeUrl.startsWith('/uploads/resumes/')) {
        s3Key = resumeUrl.replace('/uploads/resumes/', 'resumes/');
      } else if (!resumeUrl.startsWith('resumes/')) {
        s3Key = `resumes/${resumeUrl}`;
      }
      
      // For S3 keys, get signed URL
      const response = await fetch(`${import.meta.env.VITE_API_URL}/upload/resume/${encodeURIComponent(s3Key)}`);
      const data = await response.json();
      
      if (data.success) {
        setSignedUrl(data.url);
      } else {
        setError('Failed to load resume');
      }
    } catch (err) {
      console.error('Error fetching signed URL:', err);
      setError('Failed to load resume');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (signedUrl) {
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = `${candidateName}_Resume.pdf`;
      link.click();
    }
  };

  const handleOpenExternal = () => {
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    }
  };

  if (!resumeUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Resume - {candidateName}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={!signedUrl}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenExternal} disabled={!signedUrl}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 min-h-[600px]">
          {loading ? (
            <div className="flex items-center justify-center h-[600px] border rounded bg-surface-2">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-info mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading resume...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[600px] border rounded bg-surface-2">
              <p className="text-lg mb-4 text-destructive">Error Loading Resume</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchSignedUrl}>Try Again</Button>
            </div>
          ) : signedUrl ? (
            <iframe
              src={signedUrl}
              className="w-full h-[600px] border rounded"
              title={`${candidateName} Resume`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[600px] border rounded bg-surface-2">
              <p className="text-lg mb-4">Resume Preview</p>
              <p className="text-sm text-muted-foreground mb-4">
                Unable to preview resume.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResumeViewer;