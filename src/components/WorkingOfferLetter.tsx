import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Loader2, CheckCircle, Eye, Download, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

interface WorkingOfferLetterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  onComplete: () => void;
}

export const WorkingOfferLetter = ({
  open,
  onOpenChange,
  candidateName,
  candidateEmail,
  jobTitle,
  onComplete
}: WorkingOfferLetterProps) => {
  const [formData, setFormData] = useState({
    salary: '',
    joiningDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    workLocation: 'Remote',
    benefits: 'Health Insurance, Provident Fund, Paid Time Off'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [offerData, setOfferData] = useState<any>(null);
  const { toast } = useToast();

  const handleDownload = () => {
    if (offerData?.s3Url) {
      const link = document.createElement('a');
      link.href = offerData.s3Url;
      link.download = `${candidateName.replace(/\s+/g, '_')}_${jobTitle.replace(/\s+/g, '_')}_Offer_Letter.pdf`;
      link.click();
    }
  };

  const handleOpenExternal = () => {
    if (offerData?.s3Url) {
      window.open(offerData.s3Url, '_blank');
    }
  };

  const handlePreview = () => {
    if (offerData?.s3Url) {
      setShowPreview(true);
    }
  };

  const handleSubmit = async () => {
    if (!formData.salary || !formData.joiningDate) {
      toast({
        title: 'Error',
        description: 'Please fill in salary and joining date',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/offer-working/generate', {
        candidateName,
        candidateEmail,
        jobTitle,
        salary: formData.salary,
        joiningDate: formData.joiningDate,
        workLocation: formData.workLocation,
        benefits: formData.benefits
      });

      const result = response.data;
      
      // Store offer data for preview
      setOfferData(result);
      
      setSuccess(true);
      
      if (result.emailSent) {
        toast({
          title: 'Success!',
          description: 'Offer letter generated and sent successfully via email'
        });
      } else {
        toast({
          title: 'Partial Success',
          description: 'Offer letter generated but email failed to send',
          variant: 'destructive'
        });
      }

      setTimeout(() => {
        onComplete();
        onOpenChange(false);
        setSuccess(false);
      }, 2000);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to generate offer letter',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-md text-center">
            <div className="py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Offer Letter Sent!</h3>
              <p className="text-muted-foreground mb-4">
                Professional offer letter has been generated and sent to {candidateEmail}
              </p>
              
              {offerData?.s3Url && (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreview}
                    className="mb-2"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Offer Letter
                  </Button>
                  
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenExternal}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Preview Dialog */}
        {offerData?.s3Url && (
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Offer Letter - {candidateName} ({jobTitle})</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleOpenExternal}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </Button>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex-1 min-h-[600px]">
                <iframe
                  src={offerData.s3Url}
                  className="w-full h-[600px] border rounded"
                  title={`${candidateName} Offer Letter`}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Offer Letter</DialogTitle>
          <p className="text-sm text-muted-foreground">
            For {candidateName} - {jobTitle}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Annual Salary (₹) *</Label>
            <Input
              value={formData.salary}
              onChange={(e) => setFormData({...formData, salary: e.target.value})}
              placeholder="750000"
              required
            />
          </div>

          <div>
            <Label>Joining Date *</Label>
            <Input
              type="date"
              value={formData.joiningDate}
              onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
              required
            />
          </div>

          <div>
            <Label>Work Location</Label>
            <Select value={formData.workLocation} onValueChange={(value) => setFormData({...formData, workLocation: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Remote">Remote</SelectItem>
                <SelectItem value="On-site">On-site</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Benefits</Label>
            <Textarea
              value={formData.benefits}
              onChange={(e) => setFormData({...formData, benefits: e.target.value})}
              placeholder="Health insurance, PF, PTO..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Generate & Send
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};