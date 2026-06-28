import { Loader2, Brain } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

const LoadingScreen = ({ 
  message = "Loading...", 
  showLogo = true 
}: LoadingScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
      <div className="flex flex-col items-center space-y-6">
        {showLogo && (
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-lg shadow-lg">
            <Brain className="w-9 h-9 text-primary-foreground" />
          </div>
        )}
        
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;