import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import aiVideoInterviewService from "@/services/ai-video-interview.service";
import { useToast } from "@/hooks/use-toast";
import AvatarVideoInterview from "@/components/AvatarVideoInterview";

export default function AvatarInterviewPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);

  useEffect(() => {
    if (!token) {
      toast({ title: "Error", description: "Invalid interview link", variant: "destructive" });
      navigate('/');
      return;
    }

    loadInterview();
  }, [token]);

  const loadInterview = async () => {
    try {
      const data = await aiVideoInterviewService.getInterviewByToken(token!);
      setInterview(data);
      setLoading(false);
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to load interview", 
        variant: "destructive" 
      });
      navigate('/');
    }
  };

  const handleRecordingComplete = async (questionIndex: number, blob: Blob, transcript: string) => {
    try {
      if (!interview || !interview.questions) return;

      const questions = typeof interview.questions === 'string' 
        ? JSON.parse(interview.questions) 
        : interview.questions;

      const currentQuestion = questions[questionIndex];
      const responseText = transcript.trim();
      
      if (!responseText) {
        toast({ title: "Warning", description: "No transcript captured. Please try again.", variant: "destructive" });
        return;
      }
      
      console.log('Submitting response:', { questionIndex, responseText });

      // Submit response
      await aiVideoInterviewService.submitResponse(token!, {
        questionNumber: questionIndex + 1,
        question: currentQuestion.question,
        responseText: responseText,
        skill: currentQuestion.skill
      });

      setResponses([...responses, { question: currentQuestion.question, response: responseText }]);
      setCurrentQuestionIndex(questionIndex + 1);
      
      toast({ title: "Success", description: "Response submitted" });
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to submit response", 
        variant: "destructive" 
      });
    }
  };

  const handleInterviewComplete = async () => {
    try {
      await aiVideoInterviewService.submitInterview(token!, { videoDuration: 300 });
      toast({ title: "Success", description: "Interview completed successfully!" });
      setTimeout(() => {
        navigate('/interview-complete');
      }, 2000);
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to complete interview", 
        variant: "destructive" 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Interview not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = typeof interview.questions === 'string' 
    ? JSON.parse(interview.questions) 
    : interview.questions;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">{interview.jobTitle}</h1>
              <p className="text-muted-foreground">Candidate: {interview.candidateName}</p>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="text-sm font-medium text-primary">
                  {questions[currentQuestionIndex]?.skill || "General"}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all" 
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">{questions[currentQuestionIndex]?.question}</h3>
              <p className="text-sm text-muted-foreground">
                Type: {questions[currentQuestionIndex]?.type || "General"}
              </p>
            </div>

            <AvatarVideoInterview
              questions={questions}
              onRecordingComplete={handleRecordingComplete}
              onInterviewComplete={handleInterviewComplete}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Interview Progress:</h3>
            <div className="space-y-2">
              {questions.map((q: any, idx: number) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-2 text-sm ${
                    idx === currentQuestionIndex 
                      ? 'text-primary font-medium' 
                      : idx < currentQuestionIndex 
                      ? 'text-success' 
                      : 'text-muted-foreground'
                  }`}
                >
                  {idx < currentQuestionIndex ? '✓' : idx === currentQuestionIndex ? '→' : '○'} 
                  Question {idx + 1}: {q.skill || "General"}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
