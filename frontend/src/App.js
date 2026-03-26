import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import Sidebar from './components/shared/Sidebar';
import Header from './components/shared/Header';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AssetInventoryPage from './pages/AssetInventoryPage';
import PurchasesPage from './pages/PurchasesPage';
import TransfersPage from './pages/TransfersPage';
import ExpendituresPage from './pages/ExpendituresPage';
import AssignmentsPage from './pages/AssignmentsPage';
import AIInsightsPage from './pages/AIInsightsPage';
import AuditLogPage from './pages/AuditLogPage';

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <Header />
      <main className="main-content" role="main" aria-label="Main content">
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppShell><DashboardPage /></AppShell>
        </ProtectedRoute>
      } />

      <Route path="/assets" element={
        <ProtectedRoute>
          <AppShell><AssetInventoryPage /></AppShell>
        </ProtectedRoute>
      } />

      <Route path="/purchases" element={
        <ProtectedRoute>
          <AppShell><PurchasesPage /></AppShell>
        </ProtectedRoute>
      } />

      <Route path="/transfers" element={
        <ProtectedRoute>
          <AppShell><TransfersPage /></AppShell>
        </ProtectedRoute>
      } />

      <Route path="/expenditures" element={
        <ProtectedRoute>
          <AppShell><ExpendituresPage /></AppShell>
        </ProtectedRoute>
      } />

      <Route path="/assignments" element={
        <ProtectedRoute>
          <AppShell><AssignmentsPage /></AppShell>
        </ProtectedRoute>
      } />

      <Route path="/ai" element={
        <ProtectedRoute>
          <AppShell><AIInsightsPage /></AppShell>
        </ProtectedRoute>
      } />

      <Route path="/audit-log" element={
        <ProtectedRoute roles={['Admin']}>
          <AppShell><AuditLogPage /></AppShell>
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
