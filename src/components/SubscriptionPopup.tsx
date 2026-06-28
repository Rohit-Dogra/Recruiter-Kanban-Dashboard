import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, Video, Loader2, Sparkles, Crown } from "lucide-react";
import subscriptionService, { SubscriptionStatus } from "@/services/subscription.service";
import { useToast } from "@/hooks/use-toast";

export type SubscriptionAction = "phone_screening" | "technical_interview";

interface SubscriptionPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: SubscriptionAction;
  onProceed: () => void;
  onCancel?: () => void;
}

export const SubscriptionPopup = ({
  open,
  onOpenChange,
  action,
  onProceed,
  onCancel,
}: SubscriptionPopupProps) => {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingTrial, setStartingTrial] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const isPhoneScreening = action === "phone_screening";
  const ActionIcon = isPhoneScreening ? Phone : Video;

  useEffect(() => {
    if (open) {
      setLoading(true);
      subscriptionService
        .getStatus()
        .then(setStatus)
        .catch(() => {
          toast({
            title: "Error",
            description: "Failed to load subscription status",
            variant: "destructive",
          });
        })
        .finally(() => setLoading(false));
    }
  }, [open, toast]);

  const canProceed =
    status &&
    (isPhoneScreening ? status.canUsePhoneScreening : status.canUseTechnicalInterview);

  const handleStartTrial = async () => {
    if (status?.trialUsed) {
      onOpenChange(false);
      navigate("/dashboard/subscription");
      return;
    }
    setStartingTrial(true);
    try {
      await subscriptionService.startTrial();
      toast({
        title: "Free Trial Started",
        description: "You have 2 phone screenings and 1 technical interview.",
      });
      onOpenChange(false);
      onProceed();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : "Failed to start trial";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setStartingTrial(false);
    }
  };

  const handleSubscribe = () => {
    onOpenChange(false);
    navigate("/dashboard/subscription");
  };

  const handleProceed = () => {
    onOpenChange(false);
    onProceed();
  };

  const handleCancel = () => {
    onOpenChange(false);
    onCancel?.();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ActionIcon className="w-5 h-5" />
            {isPhoneScreening ? "Phone Screening" : "Technical Interview"}
          </DialogTitle>
          <DialogDescription>
            {isPhoneScreening
              ? "Use AI-powered phone screening to interview candidates."
              : "Schedule a technical interview for this candidate."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : canProceed ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {isPhoneScreening
                ? `You have ${status?.phoneScreeningsRemaining ?? 0} phone screening(s) remaining.`
                : `You have ${status?.technicalInterviewsRemaining ?? 0} technical interview(s) remaining.`}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleProceed}>Continue</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {status?.trialUsed
                ? "Your free trial has been used. Subscribe to continue using this feature."
                : "Start your free trial or subscribe to use this feature."}
            </p>

            {!status?.trialUsed && (
              <div className="rounded-lg border bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="font-medium">Free Trial</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  2 Phone Screenings + 1 Technical Interview
                </p>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={handleStartTrial}
                  disabled={startingTrial}
                >
                  {startingTrial ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Start Free Trial
                </Button>
              </div>
            )}

            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                <span className="font-medium">Subscribe</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Choose Silver, Gold, or Diamond plan for more interviews.
              </p>
              <Button className="w-full" variant="outline" onClick={handleSubscribe}>
                View Plans
              </Button>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
