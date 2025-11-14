import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@shared/components/AppShell';
import { FullScreenLoading } from '@shared/pages/Loading';
import { NotFoundPage } from '@shared/pages/Error';
import { LoginPage } from '@shared/pages/Login';
import { logout, getUserData } from '@shared/services/authService';

// Lazy load pages for code splitting
const PrescriptionDashboard = lazy(
  () => import('@apps/pharmacist/pages/PrescriptionDashboard')
);
const PrescriptionReview = lazy(
  () => import('@apps/pharmacist/pages/PrescriptionReview')
);
const InventoryManagement = lazy(
  () => import('@apps/pharmacist/pages/InventoryManagement')
);
const VideoCall = lazy(() => import('@apps/pharmacist/pages/VideoCall'));
const PharmacyProfileManager = lazy(
  () => import('@apps/pharmacist/pages/pharmacy-profile/PharmacyProfileManager')
);
const MasterAccountPage = lazy(
  () => import('@apps/pharmacist/pages/MasterAccountPage')
);

/**
 * Protected route component
 * Redirects to login if user is not authenticated
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = localStorage.getItem('auth_token') !== null;

  // Debug logging
  console.log('[ProtectedRoute] Checking authentication:', {
    hasToken: isAuthenticated,
    token: localStorage.getItem('auth_token')?.substring(0, 20) + '...',
    timestamp: new Date().toISOString()
  });

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Redirecting to login - no auth token found');
    return <Navigate to="/login" replace />;
  }

  console.log('[ProtectedRoute] Authenticated - rendering protected content');
  return <>{children}</>;
};

/**
 * Main App component with routing
 */
const App: React.FC = () => {
  // Get user data from localStorage or use mock data
  // NOTE: DO NOT use useMemo here - we need fresh user data on every render
  // to support dynamic user context changes in tests
  const getUserInfo = () => {
    const userData = getUserData();
    if (userData) {
      return {
        name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email,
        email: userData.email,
        role: userData.role,
      };
    }
    // Fallback mock user for development
    return {
      name: 'Dr. Martin Dupont',
      email: 'martin.dupont@metapharm.ch',
      role: 'pharmacist',
    };
  };

  const user = getUserInfo();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const handleProfile = () => {
    // Navigate to profile page
    console.log('Navigate to profile');
  };

  const handleSettings = () => {
    // Navigate to settings page
    console.log('Navigate to settings');
  };

  return (
    <Suspense fallback={<FullScreenLoading message="Chargement de la page..." />}>
      <Routes>
        {/* Login route (no authentication required, no AppShell) */}
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard - Default route */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell
                user={user}
                onLogout={handleLogout}
                onProfileClick={handleProfile}
                onSettingsClick={handleSettings}
              >
                <PrescriptionDashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Dashboard route - alias for root */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppShell
                user={user}
                onLogout={handleLogout}
                onProfileClick={handleProfile}
                onSettingsClick={handleSettings}
              >
                <PrescriptionDashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Prescription routes */}
        <Route
          path="/prescriptions"
          element={
            <ProtectedRoute>
              <AppShell
                user={user}
                onLogout={handleLogout}
                onProfileClick={handleProfile}
                onSettingsClick={handleSettings}
              >
                <PrescriptionDashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/prescriptions/review"
          element={
            <ProtectedRoute>
              <AppShell
                user={user}
                onLogout={handleLogout}
                onProfileClick={handleProfile}
                onSettingsClick={handleSettings}
              >
                <PrescriptionReview />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/prescriptions/review/:id"
          element={
            <ProtectedRoute>
              <AppShell
                user={user}
                onLogout={handleLogout}
                onProfileClick={handleProfile}
                onSettingsClick={handleSettings}
              >
                <PrescriptionReview />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Inventory route */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <AppShell
                user={user}
                onLogout={handleLogout}
                onProfileClick={handleProfile}
                onSettingsClick={handleSettings}
              >
                <InventoryManagement />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Teleconsultation route */}
        <Route
          path="/teleconsultation"
          element={
            <ProtectedRoute>
              <AppShell
                user={user}
                onLogout={handleLogout}
                onProfileClick={handleProfile}
                onSettingsClick={handleSettings}
              >
                <VideoCall />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teleconsultation/:sessionId"
          element={
            <ProtectedRoute>
              <AppShell
                user={user}
                onLogout={handleLogout}
                onProfileClick={handleProfile}
                onSettingsClick={handleSettings}
              >
                <VideoCall />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Master Account Management */}
        <Route
          path="/account/master"
          element={
            <ProtectedRoute>
              <AppShell
                user={user}
                onLogout={handleLogout}
                onProfileClick={handleProfile}
                onSettingsClick={handleSettings}
              >
                <MasterAccountPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Pharmacy Profile Management */}
        <Route
          path="/pharmacy/manage"
          element={
            <ProtectedRoute>
              <AppShell
                user={user}
                onLogout={handleLogout}
                onProfileClick={handleProfile}
                onSettingsClick={handleSettings}
              >
                <PharmacyProfileManager />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Analytics route (placeholder) */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AppShell
                user={user}
                onLogout={handleLogout}
                onProfileClick={handleProfile}
                onSettingsClick={handleSettings}
              >
                <div style={{ padding: '20px' }}>
                  <h2>Analyses</h2>
                  <p>Page d&apos;analyses - À implémenter</p>
                </div>
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Marketing route (placeholder) */}
        <Route
          path="/marketing"
          element={
            <ProtectedRoute>
              <AppShell
                user={user}
                onLogout={handleLogout}
                onProfileClick={handleProfile}
                onSettingsClick={handleSettings}
              >
                <div style={{ padding: '20px' }}>
                  <h2>Marketing</h2>
                  <p>Page marketing - À implémenter</p>
                </div>
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Delivery route (placeholder) */}
        <Route
          path="/delivery"
          element={
            <ProtectedRoute>
              <AppShell
                user={user}
                onLogout={handleLogout}
                onProfileClick={handleProfile}
                onSettingsClick={handleSettings}
              >
                <div style={{ padding: '20px' }}>
                  <h2>Livraisons</h2>
                  <p>Page de gestion des livraisons - À implémenter</p>
                </div>
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Settings route (placeholder) */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppShell
                user={user}
                onLogout={handleLogout}
                onProfileClick={handleProfile}
                onSettingsClick={handleSettings}
              >
                <div style={{ padding: '20px' }}>
                  <h2>Paramètres</h2>
                  <p>Page de paramètres - À implémenter</p>
                </div>
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default App;
