import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import authService, { SignupData } from "@/services/auth.service";

interface SmartSignupFormProps {
  googleData?: {
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  onSuccess?: () => void;
}

const SmartSignupForm = ({ googleData, onSuccess }: SmartSignupFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: googleData?.firstName || "",
    lastName: googleData?.lastName || "",
    email: googleData?.email || "",
    password: "",
    company: "",
    role: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Auto-populate form when Google data is available
  useEffect(() => {
    if (googleData) {
      setFormData(prev => ({
        ...prev,
        firstName: googleData.firstName,
        lastName: googleData.lastName,
        email: googleData.email
      }));
    }
  }, [googleData]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const userData: SignupData = {
        ...formData,
        isGoogleUser: isGoogleUser
      } as SignupData;
      await authService.signup(userData);
      
      toast({
        title: "Account created!",
        description: "Welcome to HirerMind. Setting up your workspace...",
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/auth/company-details");
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.response?.data?.message || "An error occurred during signup",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isGoogleUser = !!googleData;

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="John"
            value={formData.firstName}
            onChange={(e) => updateFormData("firstName", e.target.value)}
            required
            disabled={isGoogleUser}
            className={isGoogleUser ? "bg-muted" : ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Doe"
            value={formData.lastName}
            onChange={(e) => updateFormData("lastName", e.target.value)}
            required
            disabled={isGoogleUser}
            className={isGoogleUser ? "bg-muted" : ""}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Work Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="john@company.com"
          value={formData.email}
          onChange={(e) => updateFormData("email", e.target.value)}
          required
          disabled={isGoogleUser}
          className={isGoogleUser ? "bg-muted" : ""}
        />
        {isGoogleUser && (
          <p className="text-xs text-muted-foreground">
            ✓ Verified with Google
          </p>
        )}
      </div>
      
      {!isGoogleUser && (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => updateFormData("password", e.target.value)}
              required
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
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="company">Company Name</Label>
        <div className="relative">
          <Building className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            id="company"
            placeholder="Your Company"
            className="pl-10"
            value={formData.company}
            onChange={(e) => updateFormData("company", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Your Role</Label>
        <Select onValueChange={(value) => updateFormData("role", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hr-manager">HR Manager</SelectItem>
            <SelectItem value="recruiter">Recruiter</SelectItem>
            <SelectItem value="talent-lead">Talent Acquisition Lead</SelectItem>
            <SelectItem value="founder">Founder/CEO</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>



      <div className="flex items-start space-x-2">
        <input 
          type="checkbox" 
          id="terms" 
          className="mt-1 rounded" 
          aria-label="Accept terms and conditions"
          required 
        />
        <Label htmlFor="terms" className="text-sm leading-relaxed">
          I agree to the{" "}
          <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
          {" "}and{" "}
          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
        </Label>
      </div>

      <Button
        type="submit"
        variant="hero"
        size="lg"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
};

export default SmartSignupForm;