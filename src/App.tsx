
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import { CompanyProvider } from "./context/CompanyContext";
import { useEffect, useState } from "react";
import { runDataMigration } from "./utils/migrateData";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [dataMigrated, setDataMigrated] = useState(
    localStorage.getItem('dataMigrationComplete') === 'true'
  );

  useEffect(() => {
    const performOneTimeMigration = async () => {
      if (!dataMigrated) {
        try {
          // Clean up any old non-user-specific data
          const result = await runDataMigration();
          if (result.success) {
            console.log("Data migration completed successfully:", result);
            localStorage.setItem('dataMigrationComplete', 'true');
            setDataMigrated(true);
            
            // Remove non-user-specific data to prevent leakage
            localStorage.removeItem('ideas');
            localStorage.removeItem('hypotheses');
            localStorage.removeItem('experiments');
            localStorage.removeItem('departments');
            localStorage.removeItem('currentCompanyId');
          } else {
            console.error("Data migration failed:", result.message);
          }
        } catch (error) {
          console.error("Error during data migration:", error);
        }
      }
    };

    performOneTimeMigration();
  }, [dataMigrated]);

  return (
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
};

export default App;
