
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";

import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

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
import TeamSettingsPage from "./pages/TeamSettingsPage";
import AccountSettingsPage from "./pages/AccountSettingsPage";
import NotFound from "./pages/NotFound";
import CategoriesPage from "./pages/CategoriesPage";

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppProvider>
            <ThemeProvider defaultTheme="light" storageKey="ui-theme">
              <Toaster />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/ideas" element={<IdeasPage />} />
                    <Route path="/idea-details/:ideaId" element={<IdeaDetailsPage />} />
                    <Route path="/create-hypothesis/:ideaId" element={<CreateHypothesisPage />} />
                    <Route path="/hypotheses" element={<HypothesesPage />} />
                    <Route path="/hypothesis-details/:hypothesisId" element={<HypothesisDetailsPage />} />
                    <Route path="/create-experiment/:hypothesisId" element={<CreateExperimentPage />} />
                    <Route path="/experiments" element={<ExperimentsPage />} />
                    <Route path="/experiment-details/:experimentId" element={<ExperimentDetailsPage />} />
                    <Route path="/departments" element={<DepartmentsPage />} />
                    <Route path="/categories" element={<CategoriesPage />} />
                    <Route path="/team-settings" element={<TeamSettingsPage />} />
                    <Route path="/account-settings" element={<AccountSettingsPage />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </ThemeProvider>
          </AppProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
