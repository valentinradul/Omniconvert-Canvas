
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import { CompanyProvider } from "./context/company/CompanyContext";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import IdeasPage from "./pages/IdeasPage";
import IdeaDetailsPage from "./pages/IdeaDetailsPage";
import CreateHypothesisPage from "./pages/CreateHypothesisPage";
import HypothesesPage from "./pages/HypothesesPage";
import HypothesisDetailsPage from "./pages/HypothesisDetailsPage";
import CreateExperimentPage from "./pages/CreateExperimentPage";
import ExperimentsPage from "./pages/ExperimentsPage";
import ExperimentDetailsPage from "./pages/ExperimentDetailsPage";
import EditExperimentPage from "./pages/EditExperimentPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import AccountSettingsPage from "./pages/AccountSettingsPage";
import TeamSettingsPage from "./pages/TeamSettingsPage";
import DataRecoveryPage from "./pages/DataRecoveryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CompanyProvider>
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route index element={<Index />} />
                <Route path="login" element={<Login />} />
                <Route path="signup" element={<Signup />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password" element={<ResetPassword />} />
                <Route path="data-recovery" element={<DataRecoveryPage />} />
                
                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="ideas" element={<IdeasPage />} />
                    <Route path="idea-details/:ideaId" element={<IdeaDetailsPage />} />
                    <Route path="create-hypothesis/:ideaId" element={<CreateHypothesisPage />} />
                    <Route path="hypotheses" element={<HypothesesPage />} />
                    <Route path="hypothesis-details/:hypothesisId" element={<HypothesisDetailsPage />} />
                    <Route path="create-experiment/:hypothesisId" element={<CreateExperimentPage />} />
                    <Route path="experiments" element={<ExperimentsPage />} />
                    <Route path="experiment-details/:experimentId" element={<ExperimentDetailsPage />} />
                    <Route path="edit-experiment/:experimentId" element={<EditExperimentPage />} />
                    <Route path="departments" element={<DepartmentsPage />} />
                    <Route path="account-settings" element={<AccountSettingsPage />} />
                    <Route path="team-settings" element={<TeamSettingsPage />} />

                    {/* Redirect root path to dashboard when authenticated */}
                    <Route path="" element={<Navigate to="/dashboard" replace />} />
                  </Route>
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppProvider>
      </CompanyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
