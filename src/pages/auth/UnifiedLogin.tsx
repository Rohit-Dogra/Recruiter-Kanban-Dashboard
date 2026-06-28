import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, ArrowLeft, Building, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import unifiedAuthService from "@/services/unified-auth.service";
import UnifiedGoogleSignIn from "@/components/UnifiedGoogleSignIn";
import AuthLayout from "@/layouts/AuthLayout";

const UnifiedLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"hiring" | "looking">("hiring");
  const [showEmailNotFoundModal, setShowEmailNotFoundModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await unifiedAuthService.login({ email, password });

      toast({
        title: "Welcome back!",
        description: `Successfully signed in to your ${response.userType} account.`,
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      if (response.userType === 'company') {
        if (response.needsCompanyDetails) {
          toast({
            title: "Complete Your Profile",
            description: "Please finish setting up your company profile to continue.",
          });
          navigate("/auth/company-details");
        } else {
          navigate(from === "/dashboard" ? "/dashboard" : from, { replace: true });
        }
      }

      if (response.userType === 'admin') {
        navigate("/admin", { replace: true });
      }

      if (response.userType === 'candidate') {
        if (!response.profileCompleted) {
          toast({
            title: "Complete Your Profile",
            description: "Please finish setting up your profile to access all features.",
          });
          navigate("/candidate/profile");
        } else {
          navigate("/candidate/dashboard");
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message;

      if (errorMessage?.includes('No account found')) {
        setShowEmailNotFoundModal(true);
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
    <AuthLayout>
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground">Sign in to your HirerMind account</p>
      </div>

      <Card className="bg-gradient-card border-0 shadow-elegant">
        <CardHeader className="text-center pb-4">
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Role selection tabs */}
          <div className="flex rounded-lg bg-muted p-1 mb-6">
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                selectedRole === "hiring"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setSelectedRole("hiring")}
            >
              <Building className="w-4 h-4" />
              I'm hiring
            </button>
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                selectedRole === "looking"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setSelectedRole("looking")}
            >
              <User className="w-4 h-4" />
              I'm looking for work
            </button>
          </div>

          <div className="mb-6">
            <UnifiedGoogleSignIn
              className="w-full"
              onEmailNotFound={() => setShowEmailNotFoundModal(true)}
            />

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
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
                className="transition-all duration-200"
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
                  className="pr-10 transition-all duration-200"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="rounded"
                  aria-labelledby="remember-label"
                  title="Remember me"
                />
                <Label htmlFor="remember" id="remember-label" className="text-sm">Remember me</Label>
              </div>
              <Link
                to="/auth/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
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

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Button
                variant="link"
                className="text-primary hover:underline font-medium p-0 h-auto"
                onClick={() => navigate("/signup")}
              >
                Sign up
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Not Found Modal */}
      <Dialog open={showEmailNotFoundModal} onOpenChange={setShowEmailNotFoundModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">Account Not Found</DialogTitle>
          </DialogHeader>

          <div className="text-center py-4">
            <p className="text-muted-foreground mb-6">
              We couldn't find an account with the email <strong>{email}</strong>.
              Would you like to create a new account?
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowEmailNotFoundModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="hero"
                className="flex-1"
                onClick={() => {
                  setShowEmailNotFoundModal(false);
                  navigate("/signup");
                }}
              >
                Sign Up
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  );
};

export default UnifiedLogin;
