import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import callService from '@/services/call.service';
import { useToast } from '@/hooks/use-toast';
import { PhoneCall } from 'lucide-react';

export default function CallTest() {
  const [phone, setPhone] = useState('+91');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await callService.makeCall(phone);
      toast({
        title: 'Call Initiated',
        description: `Call initiated successfully to ${phone}`,
      });
    } catch (error) {
      toast({
        title: 'Call Failed',
        description: 'Failed to initiate call. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <PhoneCall className="w-5 h-5" />
          <span>Test RecruitCall</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCall} className="space-y-4">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+918090990117"
            required
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Calling...' : 'Make Test Call'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}