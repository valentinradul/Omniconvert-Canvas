
import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import './App.css';
import Dashboard from '@/pages/Dashboard';
import NotFound from '@/pages/NotFound';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import IdeasPage from '@/pages/IdeasPage';
import IdeaDetailsPage from '@/pages/IdeaDetailsPage';
import ExperimentsPage from '@/pages/ExperimentsPage';
import HypothesesPage from '@/pages/HypothesesPage';
import { AuthProvider } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import SuperAdminProtectedRoute from '@/components/SuperAdminProtectedRoute';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import CompaniesPage from '@/pages/super-admin/CompaniesPage';
import MembersPage from '@/pages/super-admin/MembersPage';
import DepartmentsPage from '@/pages/super-admin/DepartmentsPage';
import SuperAdminSettingsPage from '@/pages/SuperAdminSettingsPage';

import EnhancedIdeasPage from '@/pages/super-admin/EnhancedIdeasPage';
import EnhancedExperimentsPage from '@/pages/super-admin/EnhancedExperimentsPage';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Signup />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ideas"
                element={
                  <ProtectedRoute>
                    <IdeasPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/idea-details/:id"
                element={
                  <ProtectedRoute>
                    <IdeaDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/experiments"
                element={
                  <ProtectedRoute>
                    <ExperimentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hypotheses"
                element={
                  <ProtectedRoute>
                    <HypothesesPage />
                  </ProtectedRoute>
                }
              />

              {/* Super Admin Routes */}
              <Route
                path="/super-admin/*"
                element={
                  <SuperAdminProtectedRoute>
                    <SuperAdminLayout />
                  </SuperAdminProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/super-admin/companies" replace />} />
                <Route path="companies" element={<CompaniesPage />} />
                <Route path="members" element={<MembersPage />} />
                <Route path="departments" element={<DepartmentsPage />} />
                <Route path="enhanced-ideas" element={<EnhancedIdeasPage />} />
                <Route path="enhanced-experiments" element={<EnhancedExperimentsPage />} />
              </Route>

              <Route path="/super-admin-settings" element={<SuperAdminSettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
