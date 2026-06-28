import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import candidateAuthService from '@/services/candidate-auth.service';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface GoogleSignInProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

const GoogleSignIn = ({ onSuccess, redirectTo = '/candidate/dashboard' }: GoogleSignInProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showFallback, setShowFallback] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }

      const response = await candidateAuthService.googleAuth(credentialResponse.credential);
      
      toast({
        title: "Welcome!",
        description: "Successfully signed in with Google.",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        // Check if profile is completed
        if (!response.profileCompleted) {
          toast({
            title: "Complete Your Profile",
            description: "Please finish setting up your profile to get started.",
          });
          navigate('/candidate/profile');
        } else {
          navigate(redirectTo);
        }
      }
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Google sign-in error:', error);
      
      const errorMessage = error.response?.data?.message;
      
      if (errorMessage?.includes('company account') || errorMessage?.includes('registered as a company')) {
        toast({
          title: "Wrong Login Page",
          description: "This Google account is linked to a company. Please use the Company Login page to access your recruitment dashboard.",
          variant: "destructive",
        });
        // Navigate after showing toast
        setTimeout(() => navigate("/auth/login"), 2000);
      } else {
        toast({
          title: "Sign-in Failed",
          description: errorMessage || "Failed to sign in with Google. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleGoogleError = () => {
    toast({
      title: "Sign-in failed",
      description: "Google sign-in was cancelled or failed",
      variant: "destructive",
    });
  };

  if (showFallback) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-center text-muted-foreground">
          Google Sign-In is temporarily unavailable
        </p>
        <div className="flex flex-col gap-2">
          <Button variant="outline" asChild className="w-full">
            <Link to="/candidate/login">Sign In with Email</Link>
          </Button>
          <Button variant="ghost" asChild className="w-full">
            <Link to="/candidate/signup">Create New Account</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => {
        handleGoogleError();
        setShowFallback(true);
      }}
      theme="outline"
      size="large"
      text="continue_with"
    />
  );
};

export default GoogleSignIn;