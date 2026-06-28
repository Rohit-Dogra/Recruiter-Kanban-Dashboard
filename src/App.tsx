import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import CandidateProtectedRoute from "@/components/CandidateProtectedRoute";
import Index from "./pages/Index";
import FeaturesPage from "./pages/FeaturesPage";
import Login from "./pages/auth/Login";
import UnifiedLogin from "./pages/auth/UnifiedLogin";
import Signup from "./pages/auth/Signup";
import UnifiedSignup from "./pages/auth/UnifiedSignup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import CompanyDetailsPage from "./pages/auth/CompanyDetailsPage";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import Jobs from "./pages/dashboard/Jobs";
import Candidates from "./pages/dashboard/Candidates";
import Pipeline from "./pages/dashboard/Pipeline";
import Interviews from "./pages/dashboard/Interviews";
import Analytics from "./pages/dashboard/Analytics";
import Settings from "./pages/dashboard/Settings";
import PipelineSettings from "./pages/dashboard/PipelineSettings";
import Messages from "./pages/dashboard/Messages";
import JobPipeline from "./pages/dashboard/JobPipeline";
import Subscription from "./pages/dashboard/Subscription";
import Payment from "./pages/dashboard/Payment";
import PaymentResponse from "./pages/dashboard/PaymentResponse";
import PhoneScreening from "./pages/PhoneScreening";
import AIVideoInterviews from "./pages/dashboard/AIVideoInterviews";
import CandidateAIInterview from "./pages/candidate/CandidateAIInterview";
import AIInterviewDemoWrapper from "./pages/AIInterviewDemoWrapper";
import AvatarInterviewPage from "./pages/AvatarInterviewPage";
import InterviewComplete from "./pages/InterviewComplete";
import CandidateLogin from "./pages/candidate/CandidateLogin";
import CandidateSignup from "./pages/candidate/CandidateSignup";
import CandidateDashboard from "./pages/candidate/CandidateDashboard";
import CandidateApplications from "./pages/candidate/CandidateApplications";
import CandidateProfile from "./pages/candidate/CandidateProfile";
import CandidateResume from "./pages/candidate/CandidateResume";
import CandidateNotifications from "./pages/candidate/CandidateNotifications";
import AllJobsPage from "./pages/candidate/AllJobsPage";
import AllCompaniesPage from "./pages/candidate/AllCompaniesPage";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Careers from "./pages/Careers";
import JobShare from "./pages/JobShare";
import Notifications from "./pages/dashboard/Notifications";
import AdminLayout from "./layouts/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import PlanManagement from "./pages/admin/PlanManagement";
import JobManagement from "./pages/admin/JobManagement";
import ApplicationManagement from "./pages/admin/ApplicationManagement";
import CompanyManagement from "./pages/admin/CompanyManagement";
import PaymentManagement from "./pages/admin/PaymentManagement";
import InterviewManagement from "./pages/admin/InterviewManagement";
import BroadcastNotification from "./pages/admin/BroadcastNotification";
import DemoBookings from "./pages/admin/DemoBookings";
// import { HelmetProvider } from 'react-helmet-async';

const queryClient = new QueryClient();

const App = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.warn('Google Client ID not configured');
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId || 'fallback'}>
      <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* Auth Routes */}
                <Route path="/login" element={<UnifiedLogin />} />
                <Route path="/auth/login" element={<Navigate to="/login" replace />} />
                <Route path="/auth/signup" element={<Navigate to="/signup" replace />} />
                <Route path="/signup" element={<UnifiedSignup />} />
                <Route path="/auth/company-details" element={<CompanyDetailsPage />} />
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                
                {/* Candidate Routes */}
                <Route path="/candidate/login" element={<Navigate to="/login" replace />} />
                <Route path="/candidate/signup" element={<Navigate to="/signup" replace />} />
                <Route path="/candidate/profile" element={
                  <CandidateProtectedRoute>
                    <CandidateProfile />
                  </CandidateProtectedRoute>
                } />
                <Route path="/candidate/resume" element={
                  <CandidateProtectedRoute requireProfileCompletion={true}>
                    <CandidateResume />
                  </CandidateProtectedRoute>
                } />
                <Route path="/candidate/dashboard" element={
                  <CandidateProtectedRoute requireProfileCompletion={true}>
                    <CandidateDashboard />
                  </CandidateProtectedRoute>
                } />
                <Route path="/candidate/applications" element={
                  <CandidateProtectedRoute requireProfileCompletion={true}>
                    <CandidateApplications />
                  </CandidateProtectedRoute>
                } />
                <Route path="/candidate/notifications" element={
                  <CandidateProtectedRoute requireProfileCompletion={true}>
                    <CandidateNotifications />
                  </CandidateProtectedRoute>
                } />
                <Route path="/candidate/jobs" element={<AllJobsPage />} />
                <Route path="/candidate/companies" element={<AllCompaniesPage />} />
                <Route path="/ai-interview/:token" element={<CandidateAIInterview />} />
                <Route path="/avatar-interview/:token" element={<AvatarInterviewPage />} />
                <Route path="/ai-interview-demo" element={<AIInterviewDemoWrapper />} />
                <Route path="/interview-complete" element={<InterviewComplete />} />
                
<Route path="/features" element={<FeaturesPage />} />


                {/* Protected Dashboard Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="jobs" element={<Jobs />} />
                  <Route path="candidates" element={<Candidates />} />
                  <Route path="pipeline" element={<Pipeline />} />
                  <Route path="interviews" element={<Interviews />} />
                  <Route path="phone-screening" element={<PhoneScreening />} />
                  <Route path="ai-video-interviews" element={<AIVideoInterviews />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="jobs/:jobId/pipeline" element={<JobPipeline />} />
                   <Route path="subscription" element={<Subscription />} />
                  <Route path="payment" element={<Payment />} />
                  <Route path="payment/response" element={<PaymentResponse />} />
                  
                  <Route path="messages" element={<Messages />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="pipeline-settings" element={<PipelineSettings />} />
                </Route>
                     
                {/* Other Routes */}
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/careers/" element={<Careers />} />
                <Route path="/careers/job/:jobId" element={<JobShare />} />
                
                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="jobs" element={<JobManagement />} />
                  <Route path="applications" element={<ApplicationManagement />} />
                  <Route path="companies" element={<CompanyManagement />} />
                  <Route path="interviews" element={<InterviewManagement />} />
                  <Route path="payments" element={<PaymentManagement />} />
                  <Route path="plans" element={<PlanManagement />} />
                  <Route path="broadcast" element={<BroadcastNotification />} />
                  <Route path="demo-bookings" element={<DemoBookings />} />
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  );
};

export default App;
