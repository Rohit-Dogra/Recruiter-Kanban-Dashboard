import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

interface AutoOfferLetterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  onComplete: () => void;
}

export const AutoOfferLetter = ({
  open,
  onOpenChange,
  applicationId,
  candidateName,
  candidateEmail,
  jobTitle,
  onComplete
}: AutoOfferLetterProps) => {
  const [formData, setFormData] = useState({
    salary: '',
    joiningDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    workLocation: 'Remote',
    benefits: 'Health Insurance, Provident Fund, Paid Time Off, Professional Development'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!formData.salary || !formData.joiningDate) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/offer-letters-auto/generate-and-send', {
        applicationId: parseInt(applicationId),
        salary: formData.salary,
        joiningDate: formData.joiningDate,
        workLocation: formData.workLocation,
        benefits: formData.benefits
      });

      toast({
        title: 'Success',
        description: 'Offer letter generated and sent successfully!'
      });

      onComplete();
      onOpenChange(false);
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
            <Label htmlFor="salary">Annual Salary (₹) *</Label>
            <Input
              id="salary"
              value={formData.salary}
              onChange={(e) => setFormData({...formData, salary: e.target.value})}
              placeholder="750000"
              required
            />
          </div>

          <div>
            <Label htmlFor="joiningDate">Joining Date *</Label>
            <Input
              id="joiningDate"
              type="date"
              value={formData.joiningDate}
              onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="workLocation">Work Location</Label>
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
            <Label htmlFor="benefits">Benefits Package</Label>
            <Textarea
              id="benefits"
              value={formData.benefits}
              onChange={(e) => setFormData({...formData, benefits: e.target.value})}
              placeholder="Health insurance, PF, PTO..."
              rows={3}
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