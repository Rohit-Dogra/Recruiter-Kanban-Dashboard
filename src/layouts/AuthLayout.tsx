import { type ReactNode } from "react";
import { Brain } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile top banner */}
      <div className="md:hidden bg-gradient-to-r from-primary to-info p-6 text-primary-foreground text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">HirerMind</span>
        </div>
        <p className="text-sm text-primary-foreground/80">AI-Powered Recruitment Platform</p>
      </div>

      {/* Left branding panel — hidden on mobile */}
      <div className="hidden md:flex md:w-1/2 lg:w-[45%] bg-gradient-to-br from-primary via-primary/90 to-info relative overflow-hidden items-center justify-center p-12">
        {/* Decorative circles */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/5" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full bg-white/5" />

        <div className="relative z-10 text-primary-foreground text-center max-w-md">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center justify-center w-14 h-14 bg-white/20 rounded-xl backdrop-blur-sm">
              <Brain className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">HirerMind</h1>
          <p className="text-lg text-primary-foreground/80 leading-relaxed">
            AI-Powered Recruitment Platform — hire smarter, faster, and fairer.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-background">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;
