import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import { CompanyProvider } from "./context/company/CompanyContext";
import AppLayout from "./components/AppLayout";
import SuperAdminLayout from "./components/SuperAdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminProtectedRoute from "./components/SuperAdminProtectedRoute";
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
import DepartmentsPage from "./pages/DepartmentsPage";
import AccountSettingsPage from "./pages/AccountSettingsPage";
import TeamSettingsPage from "./pages/TeamSettingsPage";
import CategorySettingsPage from "./pages/CategorySettingsPage";
import DataRecoveryPage from "./pages/DataRecoveryPage";
import NotFound from "./pages/NotFound";
import ContentManagementPage from "./pages/ContentManagementPage";
import CompanyManagementPage from "./pages/CompanyManagementPage";
import CompanyEditPage from "./pages/CompanyEditPage";
import { GTMDashboard, GTMOutreach, GTMAdCampaigns, GTMCampaigns } from "./gtm";
import { MarketingPerformance, SalesPerformance } from "./reporting";
import IntegrationsSettingsPage from "./pages/IntegrationsSettingsPage";

// Super Admin Pages
import SuperAdminCompaniesPage from "./pages/super-admin/CompaniesPage";
import SuperAdminMembersPage from "./pages/super-admin/MembersPage";
import SuperAdminDepartmentsPage from "./pages/super-admin/DepartmentsPage";
import SuperAdminIdeasPage from "./pages/super-admin/IdeasPage";
import SuperAdminExperimentsPage from "./pages/super-admin/ExperimentsPage";
import SuperAdminHypothesesPage from "./pages/super-admin/HypothesesPage";

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
                
                {/* Protected regular app routes */}
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
                    <Route path="experiments/:experimentId" element={<ExperimentDetailsPage />} />
                    <Route path="departments" element={<DepartmentsPage />} />
                    <Route path="content-management" element={<ContentManagementPage />} />
                    <Route path="account-settings" element={<AccountSettingsPage />} />
                    <Route path="team-settings" element={<TeamSettingsPage />} />
                    <Route path="category-settings" element={<CategorySettingsPage />} />
                    <Route path="integrations" element={<IntegrationsSettingsPage />} />
                    <Route path="company-management" element={<CompanyManagementPage />} />
                    <Route path="company/:companyId/edit" element={<CompanyEditPage />} />
                    <Route path="gtm" element={<GTMDashboard />} />
                    <Route path="gtm/outreach" element={<GTMOutreach />} />
                    <Route path="gtm/ads" element={<GTMAdCampaigns />} />
                    <Route path="gtm/campaigns" element={<GTMCampaigns />} />
                    
                    {/* Reporting routes */}
                    <Route path="reporting/marketing" element={<MarketingPerformance />} />
                    <Route path="reporting/sales" element={<SalesPerformance />} />

                    {/* Redirect root path to dashboard when authenticated */}
                    <Route path="" element={<Navigate to="/dashboard" replace />} />
                  </Route>
                </Route>

                {/* Protected Super Admin routes */}
                <Route element={<SuperAdminProtectedRoute />}>
                  <Route path="super-admin" element={<SuperAdminLayout />}>
                    <Route path="companies" element={<SuperAdminCompaniesPage />} />
                    <Route path="members" element={<SuperAdminMembersPage />} />
                    <Route path="departments" element={<SuperAdminDepartmentsPage />} />
                    <Route path="ideas" element={<SuperAdminIdeasPage />} />
                    <Route path="hypotheses" element={<SuperAdminHypothesesPage />} />
                    <Route path="experiments" element={<SuperAdminExperimentsPage />} />
                    
                    {/* Redirect /super-admin to companies by default */}
                    <Route path="" element={<Navigate to="/super-admin/companies" replace />} />
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
