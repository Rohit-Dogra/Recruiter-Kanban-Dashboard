import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import unifiedAuthService from '@/services/unified-auth.service';

interface UnifiedGoogleSignInProps {
  className?: string;
  onEmailNotFound?: () => void;
}

const UnifiedGoogleSignIn = ({ className, onEmailNotFound }: UnifiedGoogleSignInProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast({
        title: "Authentication failed",
        description: "No credential received from Google",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await unifiedAuthService.googleAuth(credentialResponse.credential);
      
      toast({
        title: "Welcome back!",
        description: `Successfully signed in to your ${response.userType} account.`,
      });

      // Small delay to allow AuthContext to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Handle company user
      if (response.userType === 'company') {
        if (response.needsCompanyDetails) {
          navigate("/auth/company-details");
        } else {
          navigate("/dashboard");
        }
      }
      
      // Handle candidate user
      if (response.userType === 'candidate') {
        if (!response.profileCompleted) {
          navigate("/candidate/profile?setup=true");
        } else {
          navigate("/candidate/dashboard");
        }
      }
      
    } catch (error: any) {
      console.error('Google authentication error:', error);
      
      const errorMessage = error.response?.data?.message;
      
      if (errorMessage?.includes('No account found')) {
        if (onEmailNotFound) {
          onEmailNotFound();
        } else {
          toast({
            title: "Account Not Found",
            description: "No account found with this Google email. Please sign up first.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Google Sign-In Failed",
          description: errorMessage || "Failed to sign in with Google. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast({
      title: "Sign-in failed",
      description: "Google sign-in was cancelled or failed",
      variant: "destructive",
    });
  };

  return (
    <div className={`flex justify-center ${className}`}>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        theme="outline"
        size="large"
        text="continue_with"
        disabled={isLoading}
      />
    </div>
  );
};

export default UnifiedGoogleSignIn;