import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Send, FileText, CheckCircle } from 'lucide-react';
import offerLetterService from '@/services/offer-letter-consolidated.service';
import { useToast } from '@/hooks/use-toast';

interface EnhancedOfferLetterGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  jobId?: string;
  applicationId?: number;
  onComplete: () => void;
}

export const EnhancedOfferLetterGenerator = ({
  open,
  onOpenChange,
  candidateId,
  candidateName,
  candidateEmail,
  jobTitle,
  jobId,
  applicationId,
  onComplete
}: EnhancedOfferLetterGeneratorProps) => {
  const [step, setStep] = useState<'config' | 'preview' | 'generated'>('config');
  const [templates, setTemplates] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    template: 'modern',
    salary: '',
    joiningDate: '',
    benefits: 'Health Insurance, Provident Fund, Paid Time Off, Professional Development',
    workLocation: 'Remote',
    customizations: {}
  });
  const [generatedOffer, setGeneratedOffer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadTemplates();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 14);
      setFormData(prev => ({
        ...prev,
        joiningDate: tomorrow.toISOString().split('T')[0]
      }));
      setStep('config');
      setGeneratedOffer(null);
    }
  }, [open]);

  const loadTemplates = async () => {
    try {
      const templatesData = await offerLetterService.getTemplates();
      setTemplates(templatesData);
    } catch (error) {
      setTemplates([
        { id: 'modern', name: 'Modern Professional', description: 'Clean and contemporary design' },
        { id: 'classic', name: 'Classic Corporate', description: 'Traditional business format' },
        { id: 'executive', name: 'Executive Premium', description: 'Elegant design for senior roles' }
      ]);
    }
  };

  const generateOffer = async () => {
    setLoading(true);
    try {
      const response = await offerLetterService.generateOfferLetter({
        candidateId,
        candidateName,
        candidateEmail,
        jobTitle,
        jobId,
        applicationId,
        salary: formData.salary,
        joiningDate: formData.joiningDate,
        workLocation: formData.workLocation,
        benefits: formData.benefits,
        template: formData.template,
        customizations: formData.customizations,
        sendEmail: false
      });
      
      setGeneratedOffer(response.data);
      setStep('generated');
      
      toast({
        title: 'Success',
        description: 'Offer letter generated successfully!'
      });
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate offer letter',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const sendOffer = async () => {
    if (!generatedOffer) return;
    
    setLoading(true);
    try {
      await offerLetterService.sendOfferLetter(generatedOffer.offerId);
      
      toast({
        title: 'Success',
        description: 'Offer letter sent successfully!'
      });
      
      onComplete();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send offer letter',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const viewOfferLetter = async () => {
    if (!generatedOffer) return;
    
    try {
      const pdfUrl = await offerLetterService.viewOfferLetterPDF(generatedOffer.offerId);
      window.open(pdfUrl, '_blank');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to view offer letter',
        variant: 'destructive'
      });
    }
  };

  const downloadOfferLetter = async () => {
    if (!generatedOffer) return;
    
    try {
      const { url, fileName } = await offerLetterService.downloadOfferLetterPDF(generatedOffer.offerId);
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Success',
        description: 'Offer letter download started'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to download offer letter',
        variant: 'destructive'
      });
    }
  };

  const generatePreviewContent = () => {
    const formatSalary = (salary: string) => {
      const amount = parseFloat(salary.replace(/[^\d.]/g, ''));
      return `₹${amount.toLocaleString('en-IN')}`;
    };

    return `[COMPANY LOGO]

HIRERMIND
Innovative Recruitment Solutions
contact@hirermind.com | www.hirermind.com

Date: ${new Date().toLocaleDateString('en-IN')}

To,
${candidateName}
${candidateEmail}

Subject: Offer of Employment

Dear ${candidateName},

We are pleased to offer you the position of ${jobTitle} at HirerMind, based on your performance during the interview process.

EMPLOYMENT DETAILS

Position: ${jobTitle}
Department: Engineering
Reporting To: Engineering Manager
Work Location: ${formData.workLocation}
Date of Joining: ${new Date(formData.joiningDate).toLocaleDateString('en-IN')}
Employment Type: Full-Time

COMPENSATION & BENEFITS

CTC: ${formatSalary(formData.salary)} per annum
Salary Breakdown: As per company policy
Benefits: ${formData.benefits}

TERMS & CONDITIONS

• You will be governed by the company's rules and policies in force from time to time
• This offer is subject to successful verification of documents and background checks
• Either party may terminate employment as per the notice period policy

ACCEPTANCE

Please sign and return this letter as a token of acceptance on or before ${new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}.

Warm regards,

HR Team
HirerMind

---

CANDIDATE ACCEPTANCE

I, ${candidateName}, accept the above offer and agree to the terms and conditions.

Signature: __________________
Date: __________________`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="enhanced-offer-letter-description">
        <DialogHeader>
          <DialogTitle>Generate Offer Letter - {candidateName}</DialogTitle>
          <div id="enhanced-offer-letter-description" className="text-sm text-muted-foreground">
            Create and send a professional offer letter with enhanced customization and S3 storage
          </div>
        </DialogHeader>

        <Tabs value={step} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">Configure</TabsTrigger>
            <TabsTrigger value="preview" disabled={step === 'config'}>Preview</TabsTrigger>
            <TabsTrigger value="generated" disabled={step !== 'generated'}>Generated</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Template</Label>
                <Select value={formData.template} onValueChange={(value) => setFormData({...formData, template: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          {template.description && (
                            <div className="text-xs text-muted-foreground">{template.description}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Annual Salary (₹)</Label>
                <Input
                  value={formData.salary}
                  onChange={(e) => {
                    // Allow numbers and commas
                    const value = e.target.value.replace(/[^0-9,]/g, '');
                    setFormData({...formData, salary: value});
                  }}
                  placeholder="750000 or 7,50,000"
                />
              </div>
              <div>
                <Label>Joining Date</Label>
                <Input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
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
            </div>
            <div>
              <Label>Benefits Package</Label>
              <Textarea
                value={formData.benefits}
                onChange={(e) => setFormData({...formData, benefits: e.target.value})}
                placeholder="Health insurance, 401k, PTO..."
              />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Offer Letter Preview</h3>
              <Badge variant="secondary">
                Template: {templates.find(t => t.id === formData.template)?.name}
              </Badge>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Content Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={generatePreviewContent()}
                  readOnly
                  className="min-h-[400px] font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generated" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Offer Letter Generated Successfully
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Candidate Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {candidateName}</p>
                      <p><strong>Email:</strong> {candidateEmail}</p>
                      <p><strong>Position:</strong> {jobTitle}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Offer Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Salary:</strong> ₹{formData.salary ? parseFloat(formData.salary.replace(/[^\d.]/g, '')).toLocaleString('en-IN') : '0'}</p>
                      <p><strong>Start Date:</strong> {new Date(formData.joiningDate).toLocaleDateString()}</p>
                      <p><strong>Template:</strong> {templates.find(t => t.id === formData.template)?.name}</p>
                      <p><strong>Status:</strong> <Badge variant="outline">{generatedOffer?.status || 'Generated'}</Badge></p>
                    </div>
                  </div>
                </div>
                
                {generatedOffer && (
                  <div className="mt-6 space-y-4">
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={viewOfferLetter} className="flex-1">
                        <Eye className="w-4 h-4 mr-2" />
                        View Offer Letter
                      </Button>
                      <Button variant="outline" onClick={downloadOfferLetter} className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Download Offer Letter
                      </Button>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">PDF Generated & Stored</p>
                          <p className="text-sm text-blue-700 mt-1">
                            The offer letter PDF has been generated and securely stored. 
                            {generatedOffer.s3Uploaded ? ' File is stored in S3 for reliable access.' : ' File is stored locally.'}
                          </p>
                          {generatedOffer.trackingToken && (
                            <p className="text-xs text-blue-600 mt-1">
                              Tracking ID: {generatedOffer.trackingToken.substring(0, 8)}...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {step === 'config' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={generateOffer} disabled={loading || !formData.salary}>
                {loading ? 'Generating...' : 'Generate Offer'}
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('config')}>Back</Button>
              <Button onClick={generateOffer} disabled={loading}>
                {loading ? 'Generating...' : 'Generate & Store'}
              </Button>
            </>
          )}
          {step === 'generated' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button onClick={sendOffer} disabled={loading}>
                <Send className="w-4 h-4 mr-2" />
                {loading ? 'Sending...' : 'Send Offer Letter'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};