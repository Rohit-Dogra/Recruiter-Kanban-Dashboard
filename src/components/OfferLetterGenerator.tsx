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
import { Download, Eye, Send } from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { BRAND } from "@/lib/brand";

interface OfferLetterGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  jobId?: string;
  onComplete: () => void;
}

export const OfferLetterGenerator = ({
  open,
  onOpenChange,
  candidateId,
  candidateName,
  candidateEmail,
  jobTitle,
  jobId,
  onComplete
}: OfferLetterGeneratorProps) => {
  const [step, setStep] = useState<'config' | 'preview' | 'approve'>('config');
  const [templates, setTemplates] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    template: 'modern',
    salary: '',
    joiningDate: '',
    benefits: 'Health insurance, PF, PTO, Professional Development',
    workLocation: 'Remote'
  });
  const [offerContent, setOfferContent] = useState('');
  const [offerId, setOfferId] = useState('');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [candidateData, setCandidateData] = useState<any>(null);
  const [jobData, setJobData] = useState<any>(null);
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
    }
  }, [open]);

  // Real-time content update when form data changes
  useEffect(() => {
    if (step === 'preview' && formData.salary && formData.joiningDate) {
      const updatedContent = generateMockContent();
      setOfferContent(updatedContent);
    }
  }, [formData, step, candidateName, candidateEmail, jobTitle]);

  const loadTemplates = async () => {
    try {
      const response = await api.get('/offer-letters/templates');
      setTemplates(response.data);
    } catch (error) {
      // Use default templates if API fails
      setTemplates([
        { id: 'modern', name: 'Modern Professional' },
        { id: 'classic', name: 'Classic Corporate' },
        { id: 'executive', name: 'Executive Premium' }
      ]);
    }
  };

  const generateOffer = async () => {
    setLoading(true);
    try {
      const response = await api.post('/offer-test/test-generate', {
        candidateName,
        candidateEmail,
        jobTitle,
        salary: formData.salary,
        joiningDate: formData.joiningDate,
        workLocation: formData.workLocation,
        benefits: formData.benefits
      });
      
      setOfferId('generated');
      setOfferContent(generateMockContent());
      setStep('preview');
      
      toast({
        title: 'Success',
        description: 'Offer letter generated successfully!'
      });
      
    } catch (error: any) {
      console.error('Generate offer error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to generate offer letter',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOffer = async () => {
    setLoading(true);
    try {
      // Skip update step and go directly to approve
      setStep('approve');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update offer letter',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    toast({
      title: 'Info',
      description: 'PDF download will be available after generation'
    });
  };

  const sendOffer = async () => {
    setLoading(true);
    try {
      const response = await api.post('/offer-working/generate', {
        candidateName,
        candidateEmail,
        jobTitle,
        salary: formData.salary,
        joiningDate: formData.joiningDate,
        workLocation: formData.workLocation,
        benefits: formData.benefits,
        candidateId: parseInt(candidateId),
        jobId: jobId ? parseInt(jobId) : undefined
      });
      
      const result = response.data;
      
      if (result.emailSent) {
        toast({
          title: 'Success',
          description: 'Offer letter sent successfully with PDF attachment'
        });
      } else {
        toast({
          title: 'Warning',
          description: 'Offer letter generated but email failed to send',
          variant: 'destructive'
        });
      }
      
      onComplete();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send offer letter',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockContent = () => {
    const formatSalary = (salary: string) => {
      const amount = parseFloat(salary.replace(/[^\d.]/g, ''));
      return `₹${amount.toLocaleString('en-IN')}`;
    };

    return `[COMPANY LOGO]

${BRAND.nameUpper}
Innovative Recruitment Solutions
${BRAND.email.contact} | ${BRAND.domain}

Date: ${new Date().toLocaleDateString('en-IN')}

To,
${candidateName}
${candidateEmail}

Subject: Offer of Employment

Dear ${candidateName},

We are pleased to offer you the position of ${jobTitle} at Hyre, based on your performance during the interview process.

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
Hyre

---

CANDIDATE ACCEPTANCE

I, ${candidateName}, accept the above offer and agree to the terms and conditions.

Signature: __________________
Date: __________________`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="offer-letter-description">
        <DialogHeader>
          <DialogTitle>Generate Offer Letter - {candidateName}</DialogTitle>
          <div id="offer-letter-description" className="text-sm text-muted-foreground">
            Create and send a professional offer letter with PDF attachment
          </div>
        </DialogHeader>

        <Tabs value={step} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">Configure</TabsTrigger>
            <TabsTrigger value="preview" disabled={step === 'config'}>Preview</TabsTrigger>
            <TabsTrigger value="approve" disabled={step !== 'approve'}>Approve</TabsTrigger>
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
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Annual Salary (₹)</Label>
                <Input
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  placeholder="750000"
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
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={downloadPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Badge variant="secondary">
                  Template: {templates.find(t => t.id === formData.template)?.name}
                </Badge>
              </div>
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
                  value={offerContent || generateMockContent()}
                  onChange={(e) => setOfferContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approve" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Final Approval & Send
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
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Send className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Ready to Send</p>
                      <p className="text-sm text-blue-700 mt-1">
                        The professional offer letter PDF will be sent to {candidateEmail}. 
                        The email will include both the letter content and PDF attachment.
                      </p>
                    </div>
                  </div>
                </div>
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
              <Button onClick={updateOffer} disabled={loading}>
                {loading ? 'Saving...' : 'Save & Continue'}
              </Button>
            </>
          )}
          {step === 'approve' && (
            <>
              <Button variant="outline" onClick={() => setStep('preview')}>Back</Button>
              <Button onClick={sendOffer} disabled={loading}>
                {loading ? 'Sending...' : 'Send Offer Letter'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};