
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Remove the devtools import as it's causing issues
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import DashboardPage from './pages/Dashboard';
import IdeasPage from './pages/IdeasPage';
import HypothesesPage from './pages/HypothesesPage';
import ExperimentsPage from './pages/ExperimentsPage';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from './components/theme-provider';
import { ConfettiProvider } from './context/ConfettiContext';

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Rearrange order of providers - ConfettiProvider needs to be outside AuthProvider */}
      <ConfettiProvider>
        <AuthProvider>
          <AppProvider>
            <ThemeProvider defaultTheme="light" storageKey="ui-theme">
              <Toaster />
              <Router>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/ideas" element={<IdeasPage />} />
                  <Route path="/hypotheses" element={<HypothesesPage />} />
                  <Route path="/experiments" element={<ExperimentsPage />} />
                  <Route path="/" element={<DashboardPage />} />
                </Routes>
              </Router>
            </ThemeProvider>
          </AppProvider>
        </AuthProvider>
      </ConfettiProvider>
      {/* Removed ReactQueryDevtools since it's causing issues */}
    </QueryClientProvider>
  );
}

export default App;
