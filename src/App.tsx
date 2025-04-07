
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

// Layout & Common Components
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';
import Index from './pages/Index';
import ResetPassword from './pages/ResetPassword';

// Main Pages
import Dashboard from './pages/Dashboard';
import IdeasPage from './pages/IdeasPage';
import IdeaDetailsPage from './pages/IdeaDetailsPage';
import HypothesesPage from './pages/HypothesesPage';
import HypothesisDetailsPage from './pages/HypothesisDetailsPage';
import CreateHypothesisPage from './pages/CreateHypothesisPage';
import ExperimentsPage from './pages/ExperimentsPage';
import ExperimentDetailsPage from './pages/ExperimentDetailsPage';
import CreateExperimentPage from './pages/CreateExperimentPage';
import AccountSettingsPage from './pages/AccountSettingsPage';

// Auth Context
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/app';
import { ThemeProvider } from './components/ui/theme-provider';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <AppProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/ideas" element={<IdeasPage />} />
                  <Route path="/idea-details/:id" element={<IdeaDetailsPage />} />
                  <Route path="/hypotheses" element={<HypothesesPage />} />
                  <Route path="/hypothesis-details/:id" element={<HypothesisDetailsPage />} />
                  <Route path="/create-hypothesis" element={<CreateHypothesisPage />} />
                  <Route path="/create-hypothesis/:ideaId" element={<CreateHypothesisPage />} />
                  <Route path="/experiments" element={<ExperimentsPage />} />
                  <Route path="/experiment-details/:id" element={<ExperimentDetailsPage />} />
                  <Route path="/create-experiment" element={<CreateExperimentPage />} />
                  <Route path="/create-experiment/:hypothesisId" element={<CreateExperimentPage />} />
                  <Route path="/account-settings" element={<AccountSettingsPage />} />
                </Route>
              </Route>
              
              {/* Not found */}
              <Route path="*" element={<NotFound />} />
            </Routes>

            <Toaster position="top-right" />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
