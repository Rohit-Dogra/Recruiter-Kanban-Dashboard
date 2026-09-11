import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import unifiedAuthService from "@/services/unified-auth.service";
import { BRAND } from "@/lib/brand";

const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // If already logged in as admin, redirect to admin dashboard
  if (!authLoading && isAuthenticated && (user as any)?.userType === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await unifiedAuthService.login({ email, password });

      if (response.userType !== "admin") {
        // Not an admin account — clear the stored tokens and show error
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("auth-update"));

        toast({
          title: "Access Denied",
          description: "This login is for administrators only.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Welcome, Admin",
        description: "Successfully signed in to the admin panel.",
      });

      await new Promise((resolve) => setTimeout(resolve, 100));
      navigate("/admin", { replace: true });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message;
      toast({
        title: "Login Failed",
        description: errorMessage || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-14 h-14 bg-destructive/10 rounded-2xl">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sign in to the Hyre admin panel
          </p>
        </div>

        <Card className="border shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">Administrator Access</CardTitle>
            <CardDescription>
              Enter your admin credentials to continue
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder={BRAND.email.adminExample}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                    autoComplete="current-password"
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
                className="w-full bg-destructive hover:bg-destructive/90 text-white"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Sign In as Admin
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Not an admin?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Go to regular login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          This area is restricted to authorized administrators only.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
