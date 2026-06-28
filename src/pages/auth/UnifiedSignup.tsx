import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Building, User, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import unifiedAuthService from "@/services/unified-auth.service";
import AuthLayout from "@/layouts/AuthLayout";

type PasswordStrength = "weak" | "medium" | "strong" | "very strong";

function getPasswordStrength(pw: string): { label: PasswordStrength; score: number } {
  if (!pw) return { label: "weak", score: 0 };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  if (s <= 1) return { label: "weak", score: 25 };
  if (s <= 2) return { label: "medium", score: 50 };
  if (s <= 3) return { label: "strong", score: 75 };
  return { label: "very strong", score: 100 };
}

const strengthColors: Record<PasswordStrength, string> = {
  weak: "bg-destructive", medium: "bg-warning", strong: "bg-info", "very strong": "bg-success",
};
const strengthTextColors: Record<PasswordStrength, string> = {
  weak: "text-destructive", medium: "text-warning", strong: "text-info", "very strong": "text-success",
};

const passwordRules = [
  { test: (p: string) => p.length >= 8, label: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { test: (p: string) => /[a-z]/.test(p), label: "One lowercase letter" },
  { test: (p: string) => /\d/.test(p), label: "One number" },
  { test: (p: string) => /[^a-zA-Z0-9]/.test(p), label: "One special character" },
];

const UnifiedSignup = () => {
  const [accountType, setAccountType] = useState<"company" | "candidate">("company");
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignup = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast({ title: "Authentication failed", description: "No credential received from Google", variant: "destructive" });
      return;
    }
    setIsGoogleLoading(true);
    try {
      const response = await unifiedAuthService.googleSignup(credentialResponse.credential, accountType);
      toast({ title: "Account created!", description: `Welcome to HirerMind!` });
      await new Promise((r) => setTimeout(r, 100));
      if (response.userType === "company") {
        navigate(response.needsCompanyDetails ? "/auth/company-details" : "/dashboard");
      } else {
        navigate(response.profileCompleted ? "/candidate/dashboard" : "/candidate/profile?setup=true");
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Something went wrong.";
      if (msg.includes("already exists")) {
        toast({ title: "Account exists", description: "An account with this email already exists. Please sign in.", variant: "destructive" });
      } else {
        toast({ title: "Google Sign-Up Failed", description: msg, variant: "destructive" });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    company: "",
    role: "",
    phone: "",
    location: "",
  });

  const strength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const canProceedStep1 = formData.email && formData.password && formData.password.length >= 8;

  const canSubmit =
    formData.firstName &&
    formData.lastName &&
    formData.email &&
    formData.password.length >= 8 &&
    (accountType === "candidate" || formData.company);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await unifiedAuthService.signup({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        accountType,
        company: formData.company || undefined,
        role: formData.role || undefined,
        phone: formData.phone || undefined,
        location: formData.location || undefined,
      });

      toast({
        title: "Account created!",
        description: accountType === "company"
          ? "Welcome to HirerMind. Let's set up your company profile."
          : "Welcome! Let's complete your candidate profile.",
      });

      await new Promise((r) => setTimeout(r, 100));

      if (response.userType === "company") {
        navigate(response.needsCompanyDetails ? "/auth/company-details" : "/dashboard");
      } else {
        navigate(response.profileCompleted ? "/candidate/dashboard" : "/candidate/profile?setup=true");
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.response?.data?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-muted-foreground">Join HirerMind — start hiring or get hired</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step >= s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
            {s < 2 && (
              <div className={`w-12 h-0.5 ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      <Card className="bg-gradient-card border-0 shadow-elegant">
        <CardHeader className="text-center pb-4">
          <CardTitle>{step === 1 ? "Get Started" : "Your Details"}</CardTitle>
          <CardDescription>
            {step === 1
              ? "Choose your account type and set your credentials"
              : accountType === "company"
              ? "Tell us about yourself and your company"
              : "Tell us a bit about yourself"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-5">
                {/* Account type toggle */}
                <div className="flex rounded-lg bg-muted p-1">
                  <button
                    type="button"
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
                      accountType === "company"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setAccountType("company")}
                  >
                    <Building className="w-4 h-4" />
                    I'm hiring
                  </button>
                  <button
                    type="button"
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
                      accountType === "candidate"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setAccountType("candidate")}
                  >
                    <User className="w-4 h-4" />
                    I'm looking for work
                  </button>
                </div>

                {/* Google signup */}
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSignup}
                    onError={() => toast({ title: "Sign-up failed", description: "Google sign-up was cancelled or failed", variant: "destructive" })}
                    theme="outline"
                    size="large"
                    text="signup_with"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or sign up with email</span>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={accountType === "company" ? "you@company.com" : "you@example.com"}
                    value={formData.email}
                    onChange={(e) => update("email", e.target.value)}
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => update("password", e.target.value)}
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

                  {/* Strength meter + rules */}
                  {formData.password.length > 0 && (
                    <div className="space-y-2">
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${strengthColors[strength.label]}`}
                          style={{ width: `${strength.score}%` }}
                        />
                      </div>
                      <p className={`text-xs font-medium capitalize ${strengthTextColors[strength.label]}`}>
                        {strength.label}
                      </p>
                      <ul className="space-y-1">
                        {passwordRules.map((rule) => (
                          <li
                            key={rule.label}
                            className={`flex items-center gap-1.5 text-xs ${
                              rule.test(formData.password)
                                ? "text-green-600 dark:text-green-400"
                                : "text-muted-foreground"
                            }`}
                          >
                            <Check className={`w-3 h-3 ${rule.test(formData.password) ? "" : "opacity-30"}`} />
                            {rule.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={!canProceedStep1}
                  onClick={() => setStep(2)}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mb-2"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>

                {/* Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => update("firstName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => update("lastName", e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Company-specific fields */}
                {accountType === "company" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company Name</Label>
                      <Input
                        id="company"
                        placeholder="Acme Inc."
                        value={formData.company}
                        onChange={(e) => update("company", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Your Role <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      <Input
                        id="role"
                        placeholder="HR Manager, CTO, Recruiter..."
                        value={formData.role}
                        onChange={(e) => update("role", e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Candidate-specific fields */}
                {accountType === "candidate" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => update("phone", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      <Input
                        id="location"
                        placeholder="Mumbai, India"
                        value={formData.location}
                        onChange={(e) => update("location", e.target.value)}
                      />
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isLoading || !canSubmit}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>

                <p className="text-xs text-center text-muted-foreground pt-1">
                  By signing up, you agree to our{" "}
                  <Link to="/privacy" className="text-primary hover:underline">Terms & Privacy Policy</Link>
                </p>
              </div>
            )}
          </form>

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

export default UnifiedSignup;
