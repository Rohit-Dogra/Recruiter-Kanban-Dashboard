import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from "lucide-react";

import AuthLayout from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { EASE } from "@/lib/motion";

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
        title: "Reset email sent",
        description: "Check your inbox for password reset instructions.",
      });
      setIsLoading(false);
      setEmailSent(true);
    }, 1000);
  };

  if (emailSent) {
    return (
      <AuthLayout headline="Check your inbox">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: EASE.expo }}
          className="text-center"
        >
          <div className="relative mx-auto w-fit">
            <span aria-hidden className="absolute inset-0 rounded-full bg-success/25 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-success/25 bg-success/10 text-success">
              <CheckCircle2 className="h-7 w-7" />
            </div>
          </div>

          <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight text-foreground">
            Check your email
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            We've sent password reset instructions to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>

          <div className="mt-7 space-y-2.5">
            <Button asChild variant="hero" size="lg" className="w-full">
              <a href="mailto:" target="_blank" rel="noopener noreferrer">
                <Mail className="h-4 w-4" />
                Open email app
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link to="/login">Back to sign in</Link>
            </Button>
          </div>

          <p className="mt-6 text-[13px] text-muted-foreground">
            Didn't receive it? Check your spam folder, or{" "}
            <button onClick={() => setEmailSent(false)} className="font-medium text-primary hover:underline">
              try a different address
            </button>
            .
          </p>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout headline="Get back into your account">
      <div className="mb-7">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-primary/10 text-primary">
          <KeyRound className="h-5 w-5" />
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Forgot password?</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          No problem — enter your email and we'll send a reset link.
        </p>
      </div>

      <form onSubmit={handleResetRequest} className="space-y-4" noValidate>
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
            startAdornment={<Mail />}
          />
        </div>

        <Button
          type="submit"
          variant="hero"
          size="lg"
          className="w-full"
          loading={isLoading}
          loadingText="Sending…"
        >
          Send reset instructions
        </Button>
      </form>

      <Link
        to="/login"
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to sign in
      </Link>
    </AuthLayout>
  );
};

export default ForgotPassword;
