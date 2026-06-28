import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import candidateAuthService from "@/services/candidate-auth.service";
import GoogleSignIn from "@/components/GoogleSignIn";

const CandidateLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await candidateAuthService.login({ email, password });
      
      toast({
        title: "Welcome back!",
        description: "Successfully signed in to your candidate account.",
      });
      
      // Check profile completion and redirect accordingly
      if (!response.profileCompleted) {
        toast({
          title: "Complete Your Profile",
          description: "Please finish setting up your profile to access all features.",
        });
        navigate("/candidate/profile");
      } else {
        navigate("/candidate/dashboard");
      }
    } catch (error: any) {
      // Handle specific error messages from backend
      const errorMessage = error.response?.data?.message;
      
      if (errorMessage?.includes('company account')) {
        toast({
          title: "Wrong Login Page",
          description: "You have a company account. Please use the unified login page to access your recruitment dashboard.",
          variant: "destructive",
          action: {
            label: "Go to Login",
            onClick: () => navigate("/login")
          }
        });
      } else if (errorMessage?.includes('Invalid email or password')) {
        toast({
          title: "Login Failed",
          description: "The email or password you entered is incorrect. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Failed",
          description: errorMessage || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-lg">
              <User className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold">Candidate Login</h1>
          <p className="text-muted-foreground">Access your job applications and profile</p>
        </div>

        <Card className="bg-gradient-card border-0 shadow-elegant">
          <CardHeader className="text-center pb-4">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your candidate dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <GoogleSignIn />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/candidate/signup" className="text-primary hover:underline font-medium">
                  Sign up as Candidate
                </Link>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Are you a company?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CandidateLogin;