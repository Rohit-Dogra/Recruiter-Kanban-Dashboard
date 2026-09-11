import { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { Loader2 } from "lucide-react";

interface InterviewQuestion {
  question: string;
  skill: string;
  type: string;
}

interface AvatarVideoInterviewProps {
  questions: InterviewQuestion[];
  onRecordingComplete: (questionIndex: number, blob: Blob, transcript: string) => void;
  onInterviewComplete: () => void;
}

export default function AvatarVideoInterview({
  questions,
  onRecordingComplete,
  onInterviewComplete
}: AvatarVideoInterviewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraLoaded, setCameraLoaded] = useState(false);
  const [hasAskedQuestion, setHasAskedQuestion] = useState(false);
  const [waitingForSubmit, setWaitingForSubmit] = useState(false);
  
  const webcamRef = useRef<Webcam | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const [transcript, setTranscript] = useState("");
  const recordingTimeoutRef = useRef<any>(null);
  const voicesLoadedRef = useRef(false);

  useEffect(() => {
    initSpeechRecognition();
    
    // Load voices
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesLoadedRef.current = true;
      }
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (cameraLoaded && currentQuestionIndex < questions.length && !hasAskedQuestion && !isAvatarSpeaking && !isRecording && !waitingForSubmit) {
      setHasAskedQuestion(true);
      setTimeout(() => askQuestion(currentQuestionIndex), 500);
    }
  }, [cameraLoaded, currentQuestionIndex, hasAskedQuestion, isAvatarSpeaking, isRecording, waitingForSubmit]);

  const initSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      let finalTranscript = '';
      
      recognition.onstart = () => {
        finalTranscript = '';
        setTranscript('');
      };
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece + ' ';
          } else {
            interimTranscript += transcriptPiece;
          }
        }
        
        const fullTranscript = finalTranscript + interimTranscript;
        setTranscript(fullTranscript);
        
        // Store in ref for immediate access
        recognitionRef.current.latestTranscript = fullTranscript;
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech' && isRecording) {
          setTimeout(() => {
            if (isRecording && recognition.readyState !== 'starting') {
              try {
                recognition.start();
              } catch (e) {
                console.log('Recognition restart failed:', e);
              }
            }
          }, 1000);
        }
      };
      
      recognition.latestTranscript = '';
      recognitionRef.current = recognition;
    }
  };

  const askQuestion = (index: number) => {
    const question = questions[index];
    setIsAvatarSpeaking(true);
    
    // Wait for voices to load, then select female voice
    const speakWithFemaleVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      
      // Priority order for female voices
      const femaleVoice = voices.find(voice => 
        voice.name.includes('Google UK English Female') ||
        voice.name.includes('Google US English Female')
      ) || voices.find(voice => 
        voice.name.includes('Female') ||
        voice.name.includes('Samantha') ||
        voice.name.includes('Victoria') ||
        voice.name.includes('Zira') ||
        voice.name.includes('Karen') ||
        voice.name.includes('Moira')
      ) || voices.find(voice => 
        voice.gender === 'female'
      ) || voices.find(voice => 
        voice.lang.startsWith('en') && !voice.name.includes('Male')
      );
      
      const utterance = new SpeechSynthesisUtterance(
        `Question ${index + 1}. ${question.question}`
      );
      utterance.rate = 0.85;
      utterance.pitch = 1.2;
      utterance.volume = 1;
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
        console.log('Using female voice:', femaleVoice.name);
      } else {
        console.warn('No female voice found, using default');
      }
      
      utterance.onend = () => {
        setIsAvatarSpeaking(false);
        startRecording();
      };
      
      window.speechSynthesis.speak(utterance);
    };
    
    // Ensure voices are loaded before speaking
    if (voicesLoadedRef.current) {
      speakWithFemaleVoice();
    } else {
      // Wait for voices to load
      setTimeout(speakWithFemaleVoice, 100);
    }
  };

  const startRecording = () => {
    if (!webcamRef?.current?.stream) return;
    
    setTranscript("");
    setIsRecording(true);
    setWaitingForSubmit(true);
    
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(webcamRef.current.stream, {
      mimeType: "video/webm"
    });
    
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      // Get transcript from recorder or fallback to state
      const finalTranscript = (recorder as any).finalTranscript || transcript.trim();
      
      console.log('Recording stopped. Final transcript:', finalTranscript);
      
      // Don't submit if transcript is empty or too short
      if (!finalTranscript || finalTranscript.length < 10) {
        console.warn('Empty or too short transcript, not submitting');
        setWaitingForSubmit(false);
        return;
      }
      
      onRecordingComplete(currentQuestionIndex, blob, finalTranscript);
      
      // Automatically proceed to next question after successful submission
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setHasAskedQuestion(false);
          setWaitingForSubmit(false);
          setTranscript('');
        } else {
          console.log('All questions completed, calling onInterviewComplete');
          onInterviewComplete();
        }
      }, 500);
    };
    
    mediaRecorderRef.current = recorder;
    recorder.start();
    
    // Start speech recognition with delay and check microphone
    setTimeout(() => {
      if (recognitionRef.current) {
        try {
          // Check if microphone is available
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
              recognitionRef.current.start();
            })
            .catch((error) => {
              console.error('Microphone access denied:', error);
            });
        } catch (error) {
          console.error('Recognition start error:', error);
        }
      }
    }, 1000);

    // Auto-stop after 2 minutes
    recordingTimeoutRef.current = setTimeout(() => {
      stopRecording();
    }, 120000);
  };

  const stopRecording = () => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
    
    // Get the latest transcript before stopping recognition
    const currentTranscript = recognitionRef.current?.latestTranscript || transcript || '';
    console.log('Current transcript before stopping:', currentTranscript);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Recognition stop error:', error);
      }
    }
    
    // Stop recording with current transcript
    setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        // Store transcript in recorder for access in onstop
        (mediaRecorderRef.current as any).finalTranscript = currentTranscript;
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }, 300);
  };

  const handleUserMedia = () => {
    setTimeout(() => setCameraLoaded(true), 1000);
  };

  if (currentQuestionIndex >= questions.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Completing interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#1D2B3A] rounded-lg ring-1 ring-gray-900/5 shadow-md">
        
        {!cameraLoaded && (
          <div className="text-white absolute top-1/2 left-1/2 z-20 flex items-center -translate-x-1/2 -translate-y-1/2">
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3}></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}

        <div className="relative z-10 h-full w-full rounded-lg">
          
          {/* Status Indicator - Removed Recording Icon */}
          <div className="absolute top-5 lg:top-10 left-5 lg:left-10 z-20">
            <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-sm font-medium text-foreground">
              {isAvatarSpeaking ? "🎤 Interviewer Speaking" : isRecording ? "Your Turn" : "⏸️ Ready"}
            </span>
          </div>

          {/* Question Counter */}
          <div className="absolute top-5 lg:top-10 right-5 lg:right-10 z-20">
            <span className="inline-flex items-center rounded-md bg-info/14 px-2.5 py-0.5 text-sm font-medium text-info">
              Q {currentQuestionIndex + 1}/{questions.length}
            </span>
          </div>

          {/* Enhanced Female Avatar Video Overlay - Larger and More Realistic */}
          <div className="absolute top-[10px] sm:top-[15px] lg:top-[20px] right-[10px] sm:right-[15px] md:right-[20px] w-[140px] sm:w-[200px] md:w-[280px] lg:w-[320px] h-[105px] sm:h-[150px] md:h-[210px] lg:h-[240px] rounded-lg z-20">
            <div className="h-full w-full rounded-lg lg:rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
              <video
                autoPlay={isAvatarSpeaking}
                loop={isAvatarSpeaking}
                muted
                playsInline
                className="h-full w-full object-cover scale-110"
                key={isAvatarSpeaking ? 'speaking' : 'idle'}
                style={{ filter: 'brightness(1.1) contrast(1.05)' }}
              >
                <source src="https://liftoff-public.s3.amazonaws.com/BehavioralSarah.mp4" type="video/mp4" />
              </video>
              {/* Professional overlay for more realistic appearance */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
              {/* Speaking indicator */}
              {isAvatarSpeaking && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="text-xs text-white font-medium">Speaking</span>
                </div>
              )}
            </div>
          </div>

          <Webcam
            mirrored
            audio
            muted
            ref={webcamRef}
            videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
            onUserMedia={handleUserMedia}
            className="absolute z-10 min-h-[100%] min-w-[100%] h-auto w-auto object-cover"
          />
        </div>

        {/* Enhanced Transcript Display with Better Visibility */}
        {isRecording && transcript && (
          <div className="absolute bottom-20 left-3 right-3 z-20 bg-black/80 backdrop-blur-sm p-4 rounded-xl max-h-32 overflow-y-auto border border-white/20">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-destructive rounded-full animate-pulse mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-white text-sm leading-relaxed">{transcript}</p>
                <p className="text-muted-foreground text-xs mt-1">{transcript.length} characters</p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Submit Button with Timer */}
        {isRecording && (
          <div className="absolute bottom-0 left-0 z-50 flex h-[82px] w-full items-center justify-center">
            <div className="absolute bottom-[6px] md:bottom-5 flex flex-col items-center gap-2">
              <div className="text-white text-xs bg-black/50 px-2 py-1 rounded">
                Recording... (2 min max)
              </div>
              <button
                onClick={stopRecording}
                className="flex h-12 px-6 items-center justify-center rounded-full bg-destructive text-white font-semibold hover:bg-destructive/90 ring-4 ring-white active:scale-95 scale-100 duration-75 shadow-lg"
              >
                Submit Answer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
