import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import CompanyGoogleAuth from "@/components/CompanyGoogleAuth";
import SmartSignupForm from "@/components/SmartSignupForm";
import AuthLayout from "@/layouts/AuthLayout";

type PasswordStrength = "weak" | "medium" | "strong" | "very strong";

function getPasswordStrength(password: string): { label: PasswordStrength; score: number } {
  if (!password) return { label: "weak", score: 0 };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { label: "weak", score: 25 };
  if (score <= 2) return { label: "medium", score: 50 };
  if (score <= 3) return { label: "strong", score: 75 };
  return { label: "very strong", score: 100 };
}

const strengthColors: Record<PasswordStrength, string> = {
  weak: "bg-destructive",
  medium: "bg-warning",
  strong: "bg-info",
  "very strong": "bg-success",
};

const strengthTextColors: Record<PasswordStrength, string> = {
  weak: "text-destructive",
  medium: "text-warning",
  strong: "text-info",
  "very strong": "text-success",
};

const Signup = () => {
  const [step, setStep] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [googleData, setGoogleData] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleGoogleData = (data: any) => {
    setGoogleData(data);
    setShowForm(true);
    setStep(2);
  };

  const handleContinueToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-muted-foreground">Join thousands of companies hiring smarter</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}>
          1
        </div>
        <div className={`w-12 h-0.5 ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}>
          2
        </div>
      </div>

      <Card className="bg-gradient-card border-0 shadow-elegant">
        <CardHeader className="text-center pb-4">
          <CardTitle>{step === 1 ? "Sign Up" : "Complete Your Profile"}</CardTitle>
          <CardDescription>
            {step === 1
              ? "Start your 14-day free trial — no credit card required"
              : "Tell us a bit more about yourself"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 && !showForm && (
            <>
              <div className="mb-6">
                <CompanyGoogleAuth
                  mode="signup"
                  className="w-full"
                  onNeedsMoreInfo={handleGoogleData}
                />

                <div className="relative mt-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or sign up with email</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleContinueToStep2} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
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

                  {/* Password strength meter */}
                  {password.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${strengthColors[strength.label]}`}
                          style={{ width: `${strength.score}%` }}
                        />
                      </div>
                      <p className={`text-xs font-medium capitalize ${strengthTextColors[strength.label]}`}>
                        {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </>
          )}

          {(step === 2 || showForm) && (
            <div>
              {googleData && (
                <div className="mb-4 p-3 bg-success/10 dark:bg-green-950/30 border border-success/20 dark:border-success rounded-lg">
                  <p className="text-sm text-success dark:text-success">
                    ✓ Google account verified. Please complete your company details below.
                  </p>
                </div>
              )}

              {!googleData && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-4"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}

              <SmartSignupForm googleData={googleData} />
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default Signup;
