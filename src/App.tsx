import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import DashboardPage from './pages/Dashboard';
import IdeasPage from './pages/IdeasPage';
import HypothesesPage from './pages/HypothesesPage';
import ExperimentsPage from './pages/ExperimentsPage';
import CreateIdeaPage from './pages/CreateIdeaPage';
import CreateHypothesisPage from './pages/CreateHypothesisPage';
import CreateExperimentPage from './pages/CreateExperimentPage';
import EditIdeaPage from './pages/EditIdeaPage';
import EditHypothesisPage from './pages/EditHypothesisPage';
import EditExperimentPage from './pages/EditExperimentPage';
import DepartmentManagementPage from './pages/DepartmentManagementPage';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from "@/components/theme-provider"

// Import our new ConfettiProvider
import { ConfettiProvider } from './context/ConfettiContext';

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <ThemeProvider defaultTheme="light" storageKey="ui-theme">
            <ConfettiProvider>
              <Toaster />
              <Router>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/ideas" element={<IdeasPage />} />
                  <Route path="/ideas/create" element={<CreateIdeaPage />} />
                  <Route path="/ideas/edit/:ideaId" element={<EditIdeaPage />} />
                  <Route path="/hypotheses" element={<HypothesesPage />} />
                  <Route path="/hypotheses/create/:ideaId" element={<CreateHypothesisPage />} />
                  <Route path="/hypotheses/edit/:hypothesisId" element={<EditHypothesisPage />} />
                  <Route path="/experiments" element={<ExperimentsPage />} />
                  <Route path="/experiments/create/:hypothesisId" element={<CreateExperimentPage />} />
                  <Route path="/experiments/edit/:experimentId" element={<EditExperimentPage />} />
                  <Route path="/departments" element={<DepartmentManagementPage />} />
                  <Route path="/" element={<DashboardPage />} />
                </Routes>
              </Router>
            </ConfettiProvider>
          </ThemeProvider>
        </AppProvider>
      </AuthProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

export default App;
