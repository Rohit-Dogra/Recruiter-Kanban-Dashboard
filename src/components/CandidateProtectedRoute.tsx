import { Navigate, useLocation } from 'react-router-dom';
import candidateAuthService from '@/services/candidate-auth.service';
import { Loader2 } from 'lucide-react';

interface CandidateProtectedRouteProps {
  children: React.ReactNode;
  requireProfileCompletion?: boolean;
}

const CandidateProtectedRoute = ({ children, requireProfileCompletion = false }: CandidateProtectedRouteProps) => {
  const location = useLocation();
  const isAuthenticated = candidateAuthService.isAuthenticated();
  const isProfileCompleted = candidateAuthService.checkProfileStatus();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/candidate/login" state={{ from: location }} replace />;
  }

  // If profile completion is required and profile is not completed, redirect to profile page
  if (requireProfileCompletion && !isProfileCompleted) {
    return <Navigate to="/candidate/profile?setup=true" replace />;
  }

  // Render protected content
  return <>{children}</>;
};

export default CandidateProtectedRoute;