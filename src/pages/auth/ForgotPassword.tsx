import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Mock reset process
    setTimeout(() => {
      toast({
        title: "Reset email sent!",
        description: "Check your inbox for password reset instructions.",
      });
      setIsLoading(false);
      setEmailSent(true);
    }, 1000);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <Card className="bg-gradient-card border-0 shadow-elegant">
            <CardContent className="p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              
              <h2 className="text-2xl font-bold mb-4">Check your email</h2>
              <p className="text-muted-foreground mb-6">
                We've sent password reset instructions to {email}
              </p>
              
              <div className="space-y-4">
                <Button variant="hero" size="lg" className="w-full" asChild>
                  <a href="mailto:" target="_blank" rel="noopener noreferrer">
                    <Mail className="w-4 h-4 mr-2" />
                    Open Email App
                  </a>
                </Button>
                
                <Button variant="outline" size="lg" className="w-full" asChild>
                  <Link to="/auth/login">Back to Sign In</Link>
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mt-6">
                Didn't receive the email? Check your spam folder or{" "}
                <button 
                  onClick={() => setEmailSent(false)}
                  className="text-primary hover:underline"
                >
                  try again
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/auth/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
          
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-lg">
              <Brain className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold">Forgot password?</h1>
          <p className="text-muted-foreground">No worries, we'll send you reset instructions</p>
        </div>

        <Card className="bg-gradient-card border-0 shadow-elegant">
          <CardHeader className="text-center pb-4">
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleResetRequest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="transition-all duration-200"
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Instructions"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link to="/auth/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;