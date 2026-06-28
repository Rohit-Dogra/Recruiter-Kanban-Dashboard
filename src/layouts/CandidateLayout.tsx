import { type ReactNode } from "react";
import CandidateNavbar from "@/components/CandidateNavbar";
import Footer from "@/components/Footer";
import candidateAuthService from "@/services/candidate-auth.service";

interface CandidateLayoutProps {
  children: ReactNode;
  /** Hide the footer on pages that don't need it */
  hideFooter?: boolean;
}

const CandidateLayout = ({ children, hideFooter = false }: CandidateLayoutProps) => {
  const candidate = candidateAuthService.getCurrentCandidate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CandidateNavbar candidate={candidate} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default CandidateLayout;
