import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";
import subscriptionService, { SubscriptionPlan } from "@/services/subscription.service";
import {
  initiatePayment,
  verifyRazorpayPayment,
  type PaymentGateway,
  type BillingCycle,
} from "@/services/payment.service";
import { useToast } from "@/hooks/use-toast";

type PaymentStatus = "idle" | "initiating" | "processing" | "success" | "failed" | "timeout";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Payment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const planId = searchParams.get("planId");

  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [gateway, setGateway] = useState<PaymentGateway>("razorpay");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");

  useEffect(() => {
    if (!planId) { navigate("/dashboard/subscription"); return; }
    subscriptionService.getPlans().then((res) => {
      const p = (res.plans || []).find((x) => x.id === parseInt(planId));
      setPlan(p || null);
      if (!p) navigate("/dashboard/subscription");
    }).catch(() => navigate("/dashboard/subscription"))
      .finally(() => setLoading(false));
  }, [planId, navigate]);

  const getAmount = useCallback(() => {
    if (!plan) return 0;
    if (billingCycle === "yearly" && plan.priceYearly) return plan.priceYearly;
    if (billingCycle === "yearly") return plan.priceMonthly * 12;
    return plan.priceMonthly;
  }, [plan, billingCycle]);

  const handleRazorpayFlow = async () => {
    if (!plan) return;
    setPaymentStatus("initiating");

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast({ title: "Error", description: "Failed to load Razorpay SDK", variant: "destructive" });
        setPaymentStatus("failed");
        return;
      }

      const res = await initiatePayment({ planId: plan.id, gateway: "razorpay", billingCycle });

      if (!res.checkoutOptions) {
        toast({ title: "Error", description: "Failed to create Razorpay order", variant: "destructive" });
        setPaymentStatus("failed");
        return;
      }

      setPaymentStatus("processing");

      const options = {
        ...res.checkoutOptions,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              transactionId: res.transactionId,
            });
            setPaymentStatus("success");
            toast({ title: "Payment Successful!", description: "Your subscription is now active." });
            setTimeout(() => navigate(`/dashboard/payment/response?code=PAYMENT_SUCCESS&transactionId=${res.transactionId}&planId=${plan.id}`), 1500);
          } catch {
            setPaymentStatus("failed");
            toast({ title: "Verification Failed", description: "Payment could not be verified", variant: "destructive" });
          }
        },
        modal: {
          ondismiss: () => setPaymentStatus("idle"),
        },
        theme: { color: "#6366f1" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setPaymentStatus("failed");
      toast({ title: "Error", description: "Payment initiation failed", variant: "destructive" });
    }
  };

  const handlePhonePeFlow = async () => {
    if (!plan) return;
    setPaymentStatus("initiating");

    try {
      const res = await initiatePayment({ planId: plan.id, gateway: "phonepe", billingCycle });

      if (res.redirectUrl) {
        setPaymentStatus("processing");
        window.location.href = res.redirectUrl;
      } else {
        setPaymentStatus("failed");
        toast({ title: "Error", description: "Failed to get PhonePe redirect URL", variant: "destructive" });
      }
    } catch {
      setPaymentStatus("failed");
      toast({ title: "Error", description: "Payment initiation failed", variant: "destructive" });
    }
  };

  const handlePay = () => {
    if (gateway === "razorpay") handleRazorpayFlow();
    else handlePhonePeFlow();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }
  if (!plan) return null;

  const amount = getAmount();

  return (
    <div className="p-6 max-w-lg mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Complete Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan info */}
          <div>
            <p className="text-sm text-muted-foreground">Plan</p>
            <p className="font-semibold">{plan.name} Plan</p>
          </div>

          {/* Billing cycle selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Billing Cycle</p>
            <RadioGroup
              value={billingCycle}
              onValueChange={(v) => setBillingCycle(v as BillingCycle)}
              className="flex gap-4"
              disabled={paymentStatus !== "idle"}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly">Monthly — ₹{plan.priceMonthly.toLocaleString()}/mo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yearly" id="yearly" />
                <Label htmlFor="yearly">
                  Yearly — ₹{(plan.priceYearly || plan.priceMonthly * 12).toLocaleString()}/yr
                  {plan.priceYearly && plan.priceYearly < plan.priceMonthly * 12 && (
                    <span className="ml-1 text-xs text-success font-medium">Save {Math.round((1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100)}%</span>
                  )}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Gateway selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Payment Method</p>
            <RadioGroup
              value={gateway}
              onValueChange={(v) => setGateway(v as PaymentGateway)}
              className="flex gap-4"
              disabled={paymentStatus !== "idle"}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="razorpay" id="razorpay" />
                <Label htmlFor="razorpay">Razorpay</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phonepe" id="phonepe" />
                <Label htmlFor="phonepe">PhonePe</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Amount */}
          <div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold">₹{amount.toLocaleString()}</p>
          </div>

          {/* Payment status indicator */}
          {paymentStatus === "processing" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              Payment processing...
            </div>
          )}
          {paymentStatus === "success" && (
            <div className="flex items-center gap-2 text-sm text-success p-3 bg-success/10 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              Payment successful! Redirecting...
            </div>
          )}
          {paymentStatus === "failed" && (
            <div className="flex items-center gap-2 text-sm text-destructive p-3 bg-destructive/10 rounded-lg">
              <XCircle className="w-4 h-4" />
              Payment failed. Please try again.
            </div>
          )}
          {paymentStatus === "timeout" && (
            <div className="flex items-center gap-2 text-sm text-warning p-3 bg-warning/10 rounded-lg">
              <Clock className="w-4 h-4" />
              Payment processing is taking longer than expected. Please wait or try again.
            </div>
          )}

          {/* Pay button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handlePay}
            disabled={paymentStatus === "initiating" || paymentStatus === "processing" || paymentStatus === "success"}
          >
            {paymentStatus === "initiating" && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {paymentStatus === "failed" ? "Retry Payment" : `Pay ₹${amount.toLocaleString()}`}
          </Button>

          <Button variant="ghost" className="w-full" onClick={() => navigate("/dashboard/subscription")}>
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
