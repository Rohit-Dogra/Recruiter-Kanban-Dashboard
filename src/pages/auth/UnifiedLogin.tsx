import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Eye, EyeOff, Lock, Mail, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import unifiedAuthService from "@/services/unified-auth.service";
import UnifiedGoogleSignIn from "@/components/UnifiedGoogleSignIn";
import AuthLayout from "@/layouts/AuthLayout";
import { cn } from "@/lib/utils";

const ROLES = [
  { key: "hiring", label: "I'm hiring", icon: Building2 },
  { key: "looking", label: "I'm job hunting", icon: UserRound },
] as const;

const UnifiedLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"hiring" | "looking">("hiring");
  const [showEmailNotFoundModal, setShowEmailNotFoundModal] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFieldError(null);

    try {
      const response = await unifiedAuthService.login({ email, password });

      toast({
        title: "Welcome back",
        description: `Signed in to your ${response.userType} account.`,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      if (response.userType === "company") {
        if (response.needsCompanyDetails) {
          toast({
            title: "Complete your profile",
            description: "Finish setting up your company profile to continue.",
          });
          navigate("/auth/company-details");
        } else {
          navigate(from === "/dashboard" ? "/dashboard" : from, { replace: true });
        }
      }

      if (response.userType === "admin") {
        navigate("/admin", { replace: true });
      }

      if (response.userType === "candidate") {
        if (!response.profileCompleted) {
          toast({
            title: "Complete your profile",
            description: "Finish setting up your profile to access all features.",
          });
          navigate("/candidate/profile");
        } else {
          navigate("/candidate/dashboard");
        }
      }
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;

      if (errorMessage?.includes("No account found")) {
        setShowEmailNotFoundModal(true);
      } else {
        // Inline error keeps the cause next to the fields that caused it;
        // the toast alone was easy to miss on a long form.
        setFieldError(errorMessage || "Those credentials didn't work. Check them and try again.");
        toast({
          title: "Sign-in failed",
          description: errorMessage || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout headline="Welcome back to Hyre">
      <div className="mb-7">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Sign in</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Pick up where you left off — your pipeline is waiting.
        </p>
      </div>

      {/* ── Role segmented control ── */}
      <div
        role="tablist"
        aria-label="Account type"
        className="mb-6 grid grid-cols-2 gap-1 rounded-[var(--radius-lg)] border border-border/60 bg-surface-2 p-1 shadow-inset"
      >
        {ROLES.map((role) => {
          const active = selectedRole === role.key;
          return (
            <button
              key={role.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedRole(role.key)}
              className={cn(
                "relative flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-[13px] font-medium transition-colors duration-200",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="role-pill"
                  className="absolute inset-0 -z-10 rounded-[var(--radius-md)] bg-surface shadow-sm"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <role.icon className="h-4 w-4" />
              {role.label}
            </button>
          );
        })}
      </div>

      {/* ── Google ── */}
      <UnifiedGoogleSignIn className="w-full" onEmailNotFound={() => setShowEmailNotFoundModal(true)} />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            or with email
          </span>
        </div>
      </div>

      {/* ── Credentials ── */}
      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email" required>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            error={!!fieldError}
            startAdornment={<Mail />}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" required>
              Password
            </Label>
            <Link
              to="/auth/forgot-password"
              className="text-xs font-medium text-primary no-underline hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            error={!!fieldError}
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
        </div>

        {fieldError && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="rounded-[var(--radius-sm)] border border-destructive/25 bg-destructive/8 px-3 py-2 text-[13px] text-destructive"
          >
            {fieldError}
          </motion.p>
        )}

        <label className="flex cursor-pointer items-center gap-2.5 pt-0.5">
          <Checkbox id="remember" />
          <span className="text-[13px] text-muted-foreground">Keep me signed in</span>
        </label>

        <Button
          type="submit"
          variant="hero"
          size="lg"
          className="w-full"
          loading={isLoading}
          loadingText="Signing you in…"
        >
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link to="/signup" className="font-medium text-primary no-underline hover:underline">
          Create an account
        </Link>
      </p>

      {/* ── Account-not-found recovery ── */}
      <Dialog open={showEmailNotFoundModal} onOpenChange={setShowEmailNotFoundModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>No account found</DialogTitle>
            <DialogDescription>
              We couldn't find an account for <span className="font-medium text-foreground">{email}</span>. Would
              you like to create one?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailNotFoundModal(false)}>
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={() => {
                setShowEmailNotFoundModal(false);
                navigate("/signup");
              }}
            >
              Create account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  );
};

export default UnifiedLogin;
