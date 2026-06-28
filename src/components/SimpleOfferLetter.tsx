import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

interface SimpleOfferLetterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  onComplete: () => void;
}

export const SimpleOfferLetter = ({
  open,
  onOpenChange,
  candidateName,
  candidateEmail,
  jobTitle,
  onComplete
}: SimpleOfferLetterProps) => {
  const [formData, setFormData] = useState({
    salary: '',
    joiningDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    workLocation: 'Remote',
    benefits: 'Health Insurance, PF, PTO'
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
      const response = await api.post('/offer-simple/generate-simple', {
        candidateName,
        candidateEmail,
        jobTitle,
        salary: formData.salary,
        joiningDate: formData.joiningDate,
        workLocation: formData.workLocation,
        benefits: formData.benefits
      });

      toast({
        title: 'Success',
        description: 'Offer letter generated successfully!'
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
                Generate PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};