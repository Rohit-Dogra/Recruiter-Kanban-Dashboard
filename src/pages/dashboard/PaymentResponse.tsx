import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Phone, Video } from "lucide-react";
import { activateAfterPayment } from "@/services/payment.service";
import subscriptionService from "@/services/subscription.service";
import { useToast } from "@/hooks/use-toast";

export default function PaymentResponse() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const code = searchParams.get("code");
  const transactionId = searchParams.get("transactionId");
  const planId = searchParams.get("planId");
  const [status, setStatus] = useState<"processing" | "success" | "failed">("processing");
  const [planDetails, setPlanDetails] = useState<{ name: string; phoneScreeningsLimit: number; technicalInterviewsLimit: number } | null>(null);

  useEffect(() => {
    const isSuccess = code === "PAYMENT_SUCCESS" || code === "SUCCESS" || code === "COMPLETED";
    if (isSuccess && transactionId) {
      activateAfterPayment(transactionId)
        .then(async (res) => {
          setStatus("success");
          // Use plan details from response or fetch by planId
          if (res?.plan) {
            setPlanDetails(res.plan);
          } else if (planId) {
            try {
              const plansRes = await subscriptionService.getPlans();
              const plan = plansRes.plans.find((p) => p.id === parseInt(planId));
              if (plan) {
                setPlanDetails({ name: plan.name, phoneScreeningsLimit: plan.phoneScreeningsLimit, technicalInterviewsLimit: plan.technicalInterviewsLimit });
              }
            } catch (err) {
              console.error("Failed to fetch plan details:", err);
            }
          }
          toast({ title: "Subscription Activated!", description: "Your plan is now active." });
        })
        .catch(() => {
          setStatus("failed");
          toast({ title: "Error", description: "Activation failed", variant: "destructive" });
        });
    } else if (code === "PAYMENT_FAILED" || code === "FAILED") {
      setStatus("failed");
    } else {
      setStatus(isSuccess ? "success" : "failed");
    }
  }, [code, transactionId, planId, toast]);

  return (
    <div className="p-6 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === "processing" && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === "success" && <CheckCircle className="w-5 h-5 text-green-600" />}
            {status === "failed" && <XCircle className="w-5 h-5 text-destructive" />}
            {status === "processing" && "Processing..."}
            {status === "success" && "Payment Successful!"}
            {status === "failed" && "Payment Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" && (
            <>
              <p className="text-muted-foreground">Your subscription is now active.</p>
              {planDetails && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <p className="font-semibold">{planDetails.name} Plan Activated</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-primary" />
                    <span>{planDetails.phoneScreeningsLimit} Phone Screenings/month</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Video className="w-4 h-4 text-primary" />
                    <span>{planDetails.technicalInterviewsLimit} Technical Interviews/month</span>
                  </div>
                </div>
              )}
            </>
          )}
          {status === "failed" && <p className="text-muted-foreground">Your payment could not be processed.</p>}
          <Button className="w-full" onClick={() => navigate("/dashboard/subscription")}>
            Back to Subscription
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
