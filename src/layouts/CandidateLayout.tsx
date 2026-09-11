import { type ReactNode } from "react";
import CandidateNavbar from "@/components/CandidateNavbar";
import Footer from "@/components/Footer";
import { PageTransition } from "@/components/motion/PageTransition";
import candidateAuthService from "@/services/candidate-auth.service";

interface CandidateLayoutProps {
  children: ReactNode;
  /** Hide the footer on pages that don't need it */
  hideFooter?: boolean;
}

const CandidateLayout = ({ children, hideFooter = false }: CandidateLayoutProps) => {
  const candidate = candidateAuthService.getCurrentCandidate();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Ambient wash keeps candidate pages from reading as a plain form stack */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 [background:radial-gradient(70%_45%_at_50%_0%,hsl(var(--primary)/0.07),transparent_70%)]"
      />

      <CandidateNavbar candidate={candidate} />

      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageTransition>{children}</PageTransition>
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
};

export default CandidateLayout;
