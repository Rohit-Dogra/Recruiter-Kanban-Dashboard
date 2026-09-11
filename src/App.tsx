import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import CandidateProtectedRoute from "@/components/CandidateProtectedRoute";
import LoadingScreen from "@/components/LoadingScreen";

/* The landing page is the entry point for most visitors, so it stays in the
   main chunk. Everything else is route-split: the admin console, the candidate
   portal and the recruiter workspace are large and mutually exclusive, and no
   visitor needs all three. */
import Index from "./pages/Index";

/* ── Marketing / public ──────────────────────────────────────────────────── */
const FeaturesPage = lazy(() => import("./pages/FeaturesPage"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Careers = lazy(() => import("./pages/Careers"));
const JobShare = lazy(() => import("./pages/JobShare"));
const NotFound = lazy(() => import("./pages/NotFound"));

/* ── Auth ────────────────────────────────────────────────────────────────── */
const UnifiedLogin = lazy(() => import("./pages/auth/UnifiedLogin"));
const UnifiedSignup = lazy(() => import("./pages/auth/UnifiedSignup"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const CompanyDetailsPage = lazy(() => import("./pages/auth/CompanyDetailsPage"));

/* ── Recruiter workspace ─────────────────────────────────────────────────── */
const DashboardLayout = lazy(() => import("./pages/dashboard/DashboardLayout"));
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const Jobs = lazy(() => import("./pages/dashboard/Jobs"));
const Candidates = lazy(() => import("./pages/dashboard/Candidates"));
const Pipeline = lazy(() => import("./pages/dashboard/Pipeline"));
const Interviews = lazy(() => import("./pages/dashboard/Interviews"));
const Analytics = lazy(() => import("./pages/dashboard/Analytics"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const PipelineSettings = lazy(() => import("./pages/dashboard/PipelineSettings"));
const Messages = lazy(() => import("./pages/dashboard/Messages"));
const JobPipeline = lazy(() => import("./pages/dashboard/JobPipeline"));
const Subscription = lazy(() => import("./pages/dashboard/Subscription"));
const Payment = lazy(() => import("./pages/dashboard/Payment"));
const PaymentResponse = lazy(() => import("./pages/dashboard/PaymentResponse"));
const Notifications = lazy(() => import("./pages/dashboard/Notifications"));
const PhoneScreening = lazy(() => import("./pages/PhoneScreening"));
const AIVideoInterviews = lazy(() => import("./pages/dashboard/AIVideoInterviews"));
const Profile = lazy(() => import("./pages/Profile"));

/* ── Candidate portal ────────────────────────────────────────────────────── */
const CandidateDashboard = lazy(() => import("./pages/candidate/CandidateDashboard"));
const CandidateApplications = lazy(() => import("./pages/candidate/CandidateApplications"));
const CandidateProfile = lazy(() => import("./pages/candidate/CandidateProfile"));
const CandidateResume = lazy(() => import("./pages/candidate/CandidateResume"));
const CandidateNotifications = lazy(() => import("./pages/candidate/CandidateNotifications"));
const AllJobsPage = lazy(() => import("./pages/candidate/AllJobsPage"));
const AllCompaniesPage = lazy(() => import("./pages/candidate/AllCompaniesPage"));

/* ── Interview surfaces (heavy: webcam, speech, avatar) ──────────────────── */
const CandidateAIInterview = lazy(() => import("./pages/candidate/CandidateAIInterview"));
const AIInterviewDemoWrapper = lazy(() => import("./pages/AIInterviewDemoWrapper"));
const AvatarInterviewPage = lazy(() => import("./pages/AvatarInterviewPage"));
const InterviewComplete = lazy(() => import("./pages/InterviewComplete"));

/* ── Admin console ───────────────────────────────────────────────────────── */
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const PlanManagement = lazy(() => import("./pages/admin/PlanManagement"));
const JobManagement = lazy(() => import("./pages/admin/JobManagement"));
const ApplicationManagement = lazy(() => import("./pages/admin/ApplicationManagement"));
const CompanyManagement = lazy(() => import("./pages/admin/CompanyManagement"));
const PaymentManagement = lazy(() => import("./pages/admin/PaymentManagement"));
const InterviewManagement = lazy(() => import("./pages/admin/InterviewManagement"));
const BroadcastNotification = lazy(() => import("./pages/admin/BroadcastNotification"));
const DemoBookings = lazy(() => import("./pages/admin/DemoBookings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const App = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.warn("Google Client ID not configured");
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId || "fallback"}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider delayDuration={200}>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Suspense fallback={<LoadingScreen message="Loading" />}>
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
                    <Route
                      path="/candidate/profile"
                      element={
                        <CandidateProtectedRoute>
                          <CandidateProfile />
                        </CandidateProtectedRoute>
                      }
                    />
                    <Route
                      path="/candidate/resume"
                      element={
                        <CandidateProtectedRoute requireProfileCompletion>
                          <CandidateResume />
                        </CandidateProtectedRoute>
                      }
                    />
                    <Route
                      path="/candidate/dashboard"
                      element={
                        <CandidateProtectedRoute requireProfileCompletion>
                          <CandidateDashboard />
                        </CandidateProtectedRoute>
                      }
                    />
                    <Route
                      path="/candidate/applications"
                      element={
                        <CandidateProtectedRoute requireProfileCompletion>
                          <CandidateApplications />
                        </CandidateProtectedRoute>
                      }
                    />
                    <Route
                      path="/candidate/notifications"
                      element={
                        <CandidateProtectedRoute requireProfileCompletion>
                          <CandidateNotifications />
                        </CandidateProtectedRoute>
                      }
                    />
                    <Route path="/candidate/jobs" element={<AllJobsPage />} />
                    <Route path="/candidate/companies" element={<AllCompaniesPage />} />

                    <Route path="/ai-interview/:token" element={<CandidateAIInterview />} />
                    <Route path="/avatar-interview/:token" element={<AvatarInterviewPage />} />
                    <Route path="/ai-interview-demo" element={<AIInterviewDemoWrapper />} />
                    <Route path="/interview-complete" element={<InterviewComplete />} />

                    <Route path="/features" element={<FeaturesPage />} />

                    {/* Protected Dashboard Routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <DashboardLayout />
                        </ProtectedRoute>
                      }
                    >
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
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  );
};

export default App;
