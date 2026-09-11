import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import unifiedAuthService from "@/services/unified-auth.service";
import AuthLayout from "@/layouts/AuthLayout";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

/* ══════════════════════════════════════════════════════════════════════════
   SIGN UP
   Same two-step flow and the same submitted payload as before — the change is
   in how it's presented: a real progress rail, account type as a pair of
   choice cards rather than a toggle, and live password feedback that explains
   what's still missing instead of only colouring a bar.
   ══════════════════════════════════════════════════════════════════════════ */

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

const STRENGTH_BAR: Record<PasswordStrength, string> = {
  weak: "bg-destructive",
  medium: "bg-warning",
  strong: "bg-info",
  "very strong": "bg-success",
};

const STRENGTH_TEXT: Record<PasswordStrength, string> = {
  weak: "text-destructive",
  medium: "text-warning",
  strong: "text-info",
  "very strong": "text-success",
};

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: "8+ characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "Uppercase" },
  { test: (p: string) => /[a-z]/.test(p), label: "Lowercase" },
  { test: (p: string) => /\d/.test(p), label: "Number" },
  { test: (p: string) => /[^a-zA-Z0-9]/.test(p), label: "Symbol" },
];

const ACCOUNT_TYPES = [
  {
    key: "company" as const,
    title: "I'm hiring",
    description: "Post roles, screen candidates, run interviews.",
    icon: Building2,
  },
  {
    key: "candidate" as const,
    title: "I'm job hunting",
    description: "Build a profile, apply once, get matched.",
    icon: UserRound,
  },
];

const UnifiedSignup = () => {
  const [accountType, setAccountType] = useState<"company" | "candidate">("company");
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
  const update = (field: string, value: string) => setFormData((prev) => ({ ...prev, [field]: value }));

  const canProceedStep1 = Boolean(formData.email && formData.password && formData.password.length >= 8);
  const canSubmit = Boolean(
    formData.firstName &&
      formData.lastName &&
      formData.email &&
      formData.password.length >= 8 &&
      (accountType === "candidate" || formData.company)
  );

  const routeAfterAuth = (response: { userType: string; needsCompanyDetails?: boolean; profileCompleted?: boolean }) => {
    if (response.userType === "company") {
      navigate(response.needsCompanyDetails ? "/auth/company-details" : "/dashboard");
    } else {
      navigate(response.profileCompleted ? "/candidate/dashboard" : "/candidate/profile?setup=true");
    }
  };

  const handleGoogleSignup = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast({
        title: "Authentication failed",
        description: "No credential received from Google",
        variant: "destructive",
      });
      return;
    }
    setIsGoogleLoading(true);
    try {
      const response = await unifiedAuthService.googleSignup(credentialResponse.credential, accountType);
      toast({ title: "Account created", description: "Welcome to Hyre." });
      await new Promise((r) => setTimeout(r, 100));
      routeAfterAuth(response);
    } catch (error) {
      const msg =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Something went wrong.";
      toast({
        title: msg.includes("already exists") ? "Account exists" : "Google sign-up failed",
        description: msg.includes("already exists")
          ? "An account with this email already exists. Please sign in instead."
          : msg,
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (canProceedStep1) setStep(2);
      return;
    }

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
        title: "Account created",
        description:
          accountType === "company"
            ? "Welcome to Hyre. Let's set up your company profile."
            : "Welcome. Let's complete your candidate profile.",
      });

      await new Promise((r) => setTimeout(r, 100));
      routeAfterAuth(response);
    } catch (error) {
      toast({
        title: "Registration failed",
        description:
          (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
          "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout headline="Start hiring in minutes">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Create your account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {step === 1 ? "Choose how you'll use Hyre." : "A few details and you're in."}
        </p>
      </div>

      {/* ── Progress rail ── */}
      <div className="mb-7 flex items-center gap-3" role="group" aria-label="Signup progress">
        {[1, 2].map((s) => (
          <div key={s} className="flex flex-1 items-center gap-3">
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                step > s
                  ? "bg-success text-success-foreground"
                  : step === s
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-secondary text-muted-foreground"
              )}
            >
              {step > s ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : s}
            </span>
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
              <motion.span
                className="block h-full rounded-full bg-gradient-primary"
                initial={false}
                animate={{ width: step > s ? "100%" : step === s ? "45%" : "0%" }}
                transition={{ duration: 0.5, ease: EASE.expo }}
              />
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait" initial={false}>
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28, ease: EASE.expo }}
              className="space-y-5"
            >
              {/* Account type as choice cards */}
              <fieldset className="space-y-2">
                <legend className="sr-only">Account type</legend>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {ACCOUNT_TYPES.map((t) => {
                    const active = accountType === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setAccountType(t.key)}
                        aria-pressed={active}
                        className={cn(
                          "group relative rounded-[var(--radius-lg)] border p-3.5 text-left transition-all duration-300 ease-expo",
                          active
                            ? "border-primary/45 bg-primary/6 shadow-glow"
                            : "border-border bg-surface-2/50 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-sm"
                        )}
                      >
                        <span className="flex items-center justify-between">
                          <span
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] transition-colors",
                              active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                            )}
                          >
                            <t.icon className="h-4 w-4" />
                          </span>
                          <span
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors",
                              active ? "border-primary bg-primary" : "border-border-strong"
                            )}
                          >
                            {active && <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={4} />}
                          </span>
                        </span>
                        <span className="mt-3 block text-[13px] font-semibold text-foreground">{t.title}</span>
                        <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                          {t.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Google */}
              <div className="flex justify-center [&>div]:w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSignup}
                  onError={() =>
                    toast({ title: "Google sign-up failed", description: "Please try again.", variant: "destructive" })
                  }
                  theme="outline"
                  size="large"
                  text="signup_with"
                  width="100%"
                />
              </div>
              {isGoogleLoading && (
                <p className="text-center text-xs text-muted-foreground">Creating your account…</p>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    or with email
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" required>
                  Work email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                  startAdornment={<Mail />}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" required>
                  Password
                </Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => update("password", e.target.value)}
                  required
                  startAdornment={<Lock />}
                  endAdornment={
                    <button
                      type="button"
                      data-compact
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-xs)] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />

                {formData.password && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-2">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                        <motion.span
                          className={cn("block h-full rounded-full", STRENGTH_BAR[strength.label])}
                          initial={false}
                          animate={{ width: `${strength.score}%` }}
                          transition={{ duration: 0.35, ease: EASE.expo }}
                        />
                      </span>
                      <span className={cn("font-mono text-[10px] uppercase tracking-wider", STRENGTH_TEXT[strength.label])}>
                        {strength.label}
                      </span>
                    </div>

                    <ul className="mt-2.5 flex flex-wrap gap-1.5">
                      {PASSWORD_RULES.map((rule) => {
                        const ok = rule.test(formData.password);
                        return (
                          <li
                            key={rule.label}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-colors duration-200",
                              ok
                                ? "border-success/25 bg-success/10 text-success"
                                : "border-border bg-secondary text-muted-foreground"
                            )}
                          >
                            <Check className={cn("h-2.5 w-2.5", !ok && "opacity-30")} strokeWidth={3} />
                            {rule.label}
                          </li>
                        );
                      })}
                    </ul>
                  </motion.div>
                )}
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={!canProceedStep1}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28, ease: EASE.expo }}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" required>
                    First name
                  </Label>
                  <Input
                    id="firstName"
                    autoComplete="given-name"
                    placeholder="Ada"
                    value={formData.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" required>
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    autoComplete="family-name"
                    placeholder="Lovelace"
                    value={formData.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                    required
                  />
                </div>
              </div>

              {accountType === "company" ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="company" required>
                      Company
                    </Label>
                    <Input
                      id="company"
                      autoComplete="organization"
                      placeholder="Acme Inc."
                      value={formData.company}
                      onChange={(e) => update("company", e.target.value)}
                      required
                      startAdornment={<Building2 />}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="role">Your role</Label>
                    <Input
                      id="role"
                      autoComplete="organization-title"
                      placeholder="Head of Talent"
                      value={formData.role}
                      onChange={(e) => update("role", e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="role">Current title</Label>
                    <Input
                      id="role"
                      placeholder="Frontend Developer"
                      value={formData.role}
                      onChange={(e) => update("role", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+1 555 0100"
                        value={formData.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        startAdornment={<Phone />}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="Berlin"
                        value={formData.location}
                        onChange={(e) => update("location", e.target.value)}
                        startAdornment={<MapPin />}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(1)}
                  icon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="flex-1"
                  disabled={!canSubmit}
                  loading={isLoading}
                  loadingText="Creating account…"
                >
                  Create account
                </Button>
              </div>

              <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                By creating an account you agree to our{" "}
                <Link to="/privacy" className="text-foreground no-underline hover:underline">
                  terms and privacy policy
                </Link>
                .
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary no-underline hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default UnifiedSignup;
