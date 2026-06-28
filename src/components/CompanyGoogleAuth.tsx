import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import authService from '@/services/auth.service';
import { jwtDecode } from 'jwt-decode';

interface CompanyGoogleAuthProps {
  mode: 'login' | 'signup';
  onSuccess?: (googleData?: any) => void;
  onNeedsMoreInfo?: (googleData: any) => void;
  className?: string;
}

const CompanyGoogleAuth = ({ mode, onSuccess, onNeedsMoreInfo, className = '' }: CompanyGoogleAuthProps) => {
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
      // For signup mode, we might want to show the form with Google data first
      if (mode === 'signup' && onNeedsMoreInfo) {
        // Decode the Google token to get user info
        const decoded: any = jwtDecode(credentialResponse.credential);
        const googleData = {
          firstName: decoded.given_name || '',
          lastName: decoded.family_name || '',
          email: decoded.email || '',
          profilePicture: decoded.picture
        };
        
        onNeedsMoreInfo(googleData);
        return;
      }

      const response = await authService.googleAuth(credentialResponse.credential, mode);
      
      toast({
        title: "Success!",
        description: mode === 'login' 
          ? "Signed in successfully" 
          : "Account created successfully",
      });

      if (onSuccess) {
        onSuccess(response);
      } else {
        // Check if profile is completed
        if (!response.profileCompleted) {
          navigate("/auth/company-details");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      console.error('Google authentication error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        toast({
          title: "Account exists",
          description: "An account with this email already exists. Please sign in instead.",
          variant: "destructive",
        });
      } else if (error.response?.status === 404 && error.response?.data?.message?.includes('No account found')) {
        toast({
          title: "No account found",
          description: "No account found with this email. Please sign up first.",
          variant: "destructive",
        });
      } else {
        toast({
          title: `${mode === 'login' ? 'Sign-in' : 'Sign-up'} failed`,
          description: error.response?.data?.message || `Failed to ${mode} with Google`,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast({
      title: `${mode === 'login' ? 'Sign-in' : 'Sign-up'} failed`,
      description: "Google authentication was cancelled or failed",
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
        text={mode === 'login' ? 'signin_with' : 'signup_with'}
        disabled={isLoading}
      />
    </div>
  );
};

export default CompanyGoogleAuth;