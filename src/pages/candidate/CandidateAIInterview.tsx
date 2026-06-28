import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Loader2 } from "lucide-react";
import aiVideoInterviewService, { type AIVideoInterview } from "@/services/ai-video-interview.service";
import { useToast } from "@/hooks/use-toast";

export default function CandidateAIInterview() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState<AIVideoInterview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchInterview();
    }
  }, [token]);

  const fetchInterview = async () => {
    try {
      setLoading(true);
      const data = await aiVideoInterviewService.getInterviewByToken(token!);
      setInterview(data);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to load interview");
      toast({ title: "Error", description: error.response?.data?.message || "Failed to load interview", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = () => {
    // Navigate to demo with token in state
    navigate('/ai-interview-demo', { state: { token, interview } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-12 text-center">
            <Video className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h1 className="text-2xl font-bold mb-2">Interview Not Available</h1>
            <p className="text-muted-foreground">{error || "This interview link is invalid or has expired."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <Video className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h1 className="text-3xl font-bold mb-2">AI Video Interview</h1>
              <p className="text-muted-foreground">Welcome, {interview.candidateName}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Position</p>
                <p className="text-lg">{interview.jobTitle}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Interview Instructions:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Ensure you're in a quiet environment with good lighting</li>
                  <li>Allow camera and microphone access when prompted</li>
                  <li>Answer questions clearly and concisely</li>
                  <li>The interview will be recorded and analyzed by AI</li>
                  <li>You can take your time to think before answering</li>
                </ul>
              </div>
            </div>

            <Button onClick={handleStartInterview} className="w-full" size="lg">
              <Video className="w-5 h-5 mr-2" />
              Start Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
