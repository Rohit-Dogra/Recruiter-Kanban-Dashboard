import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Mic, StopCircle, Loader2, ChevronRight } from "lucide-react";
import aiVideoInterviewService from "@/services/ai-video-interview.service";
import { useToast } from "@/hooks/use-toast";
import AvatarVideoInterview from "@/components/AvatarVideoInterview";

export default function AIInterviewDemoWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token, interview } = location.state || {};
  
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [responses, setResponses] = useState([]);
  const [stream, setStream] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [fullTranscript, setFullTranscript] = useState("");
  const [useAvatarMode, setUseAvatarMode] = useState(true);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!token || !interview) {
      toast({ title: "Error", description: "Invalid interview session", variant: "destructive" });
      navigate('/');
      return;
    }
    
    console.log('Interview data:', interview);
    console.log('Questions raw:', interview.questions);
    
    // Parse questions with better error handling
    let parsedQuestions = [];
    try {
      if (typeof interview.questions === 'string' && interview.questions.trim()) {
        parsedQuestions = JSON.parse(interview.questions);
      } else if (Array.isArray(interview.questions)) {
        parsedQuestions = interview.questions;
      } else if (interview.questions && typeof interview.questions === 'object') {
        // Handle case where questions might be an object
        parsedQuestions = Object.values(interview.questions);
      }
    } catch (error) {
      console.error('Error parsing questions:', error);
      console.log('Raw questions data:', interview.questions);
    }
    
    console.log('Parsed questions:', parsedQuestions);
    
    // Ensure we have valid questions
    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      // Use default questions if none exist (for old interviews)
      parsedQuestions = [
        { question: "Tell me about your experience with the technologies required for this role.", skill: "General", type: "technical" },
        { question: "Describe a challenging project you've worked on and how you overcame obstacles.", skill: "Problem-solving", type: "behavioral" },
        { question: "How do you stay updated with the latest industry trends and technologies?", skill: "Learning", type: "behavioral" },
        { question: "Explain your approach to debugging and troubleshooting issues.", skill: "Technical", type: "technical" },
        { question: "What are your career goals and how does this position align with them?", skill: "Career", type: "behavioral" }
      ];
      console.log('Using default questions for interview');
    }
    
    setQuestions(parsedQuestions);
    startCamera();
    initSpeechRecognition();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to access camera/microphone", variant: "destructive" });
    }
  };

  const initSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      let finalTranscriptAccumulator = '';
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptAccumulator += transcriptPiece + ' ';
            setFullTranscript(finalTranscriptAccumulator);
          } else {
            interimTranscript += transcriptPiece;
          }
        }
        
        setTranscript(finalTranscriptAccumulator + interimTranscript);
      };
      
      recognition.onstart = () => {
        finalTranscriptAccumulator = '';
        console.log('Speech recognition started');
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          console.log('No speech detected, this is normal during pauses');
        }
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
      };
      
      recognitionRef.current = recognition;
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
  };

  const startRecording = () => {
    if (!stream) return;
    
    setTranscript("");
    setFullTranscript("");
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setRecording(true);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Recognition start error:', error);
      }
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Recognition stop error:', error);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      await submitResponse();
    }
  };

  const submitResponse = async () => {
    setProcessing(true);
    
    try {
      const currentQuestion = questions[currentQuestionIndex];
      const responseText = fullTranscript.trim() || transcript.trim();
      
      if (!responseText) {
        toast({ title: "Warning", description: "No response recorded", variant: "destructive" });
        setProcessing(false);
        return;
      }
      
      await aiVideoInterviewService.submitResponse(token, {
        questionNumber: currentQuestionIndex + 1,
        question: currentQuestion.question,
        responseText: responseText,
        skill: currentQuestion.skill
      });
      
      setResponses([...responses, { question: currentQuestion.question, response: responseText }]);
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setTranscript("");
        setFullTranscript("");
      } else {
        await completeInterview();
      }
    } catch (error) {
      console.error('Submit response error:', error);
      toast({ title: "Error", description: "Failed to submit response", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const completeInterview = async () => {
    try {
      await aiVideoInterviewService.submitInterview(token, { videoDuration: 300 });
      toast({ title: "Success", description: "Interview submitted successfully" });
      setTimeout(() => {
        navigate('/interview-complete');
      }, 2000);
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit interview", variant: "destructive" });
    }
  };

  if (questions.length === 0 || currentQuestionIndex >= questions.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {questions.length === 0 ? "Loading questions..." : "Completing interview..."}
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleRecordingComplete = async (questionIndex: number, blob: Blob, transcript: string) => {
    try {
      const currentQuestion = questions[questionIndex];
      const responseText = transcript.trim();
      
      if (!responseText) {
        toast({ title: "Warning", description: "No transcript captured. Please try again.", variant: "destructive" });
        return;
      }
      
      console.log('Submitting response:', { questionIndex, responseText });
      
      await aiVideoInterviewService.submitResponse(token!, {
        questionNumber: questionIndex + 1,
        question: currentQuestion.question,
        responseText: responseText,
        skill: currentQuestion.skill
      });
      
      setResponses([...responses, { question: currentQuestion.question, response: responseText }]);
      setCurrentQuestionIndex(questionIndex + 1);
      
      toast({ title: "Success", description: `Answer ${questionIndex + 1} submitted` });
    } catch (error: any) {
      console.error('Submit response error:', error);
      toast({ title: "Error", description: "Failed to submit response", variant: "destructive" });
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="text-sm font-medium text-primary">
                  {currentQuestion.skill}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUseAvatarMode(!useAvatarMode)}
                >
                  {useAvatarMode ? "Switch to Basic" : "Switch to Avatar"}
                </Button>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all" 
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {useAvatarMode ? (
              <AvatarVideoInterview
                questions={questions}
                onRecordingComplete={handleRecordingComplete}
                onInterviewComplete={handleInterviewComplete}
              />
            ) : (
              <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {recording && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Recording
                  </div>
                )}
              </div>
            )}

            <div className="bg-muted p-4 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">{questions[currentQuestionIndex]?.question}</h3>
              <p className="text-sm text-muted-foreground">
                Type: {questions[currentQuestionIndex]?.type || "General"} | Skill: {questions[currentQuestionIndex]?.skill || "General"}
              </p>
            </div>

            {transcript && (
              <div className="bg-muted/50 p-4 rounded-lg mb-4">
                <h4 className="text-sm font-semibold mb-2">Your Response:</h4>
                <p className="text-sm">{transcript}</p>
              </div>
            )}

            {!useAvatarMode && (
              <div className="flex justify-center gap-4">
                {!recording && !processing && (
                  <Button onClick={startRecording} size="lg" className="gap-2">
                    <Mic className="w-5 h-5" />
                    Start Recording
                  </Button>
                )}
                {recording && (
                  <Button onClick={stopRecording} size="lg" variant="destructive" className="gap-2">
                    <StopCircle className="w-5 h-5" />
                    Stop & Submit
                  </Button>
                )}
                {processing && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Evaluating response...
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Interview Progress:</h3>
            <div className="space-y-2">
              {questions.map((q, idx) => (
                <div key={idx} className={`flex items-center gap-2 text-sm ${idx === currentQuestionIndex ? 'text-primary font-medium' : idx < currentQuestionIndex ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {idx < currentQuestionIndex ? '✓' : idx === currentQuestionIndex ? '→' : '○'} Question {idx + 1}: {q.skill}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
