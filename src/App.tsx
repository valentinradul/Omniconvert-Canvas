
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query/devtools';
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
                  <Route path="/hypotheses" element={<HypothesesPage />} />
                  <Route path="/experiments" element={<ExperimentsPage />} />
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
