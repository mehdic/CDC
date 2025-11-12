import React, { Suspense, lazy, useMemo } from 'react';
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
const MasterAccountPage = lazy(() => import('@apps/pharmacist/pages/master-account/MasterAccountPage'));
const PharmacyProfileManager = lazy(() => import('@apps/pharmacist/pages/pharmacy-profile/PharmacyProfileManager'));

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
  const user = useMemo(() => {
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
  }, []);

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

  const ProtectedLayout: React.FC = () => {
    return (
      <AppShell
        user={user}
        onLogout={handleLogout}
        onProfileClick={handleProfile}
        onSettingsClick={handleSettings}
      >
        <Routes>
          {/* Dashboard - Default route */}
          <Route path="/" element={<PrescriptionDashboard />} />

          {/* Prescription routes */}
          <Route path="/prescriptions" element={<PrescriptionDashboard />} />
          <Route path="/prescriptions/review" element={<PrescriptionReview />} />
          <Route path="/prescriptions/review/:id" element={<PrescriptionReview />} />

          {/* Inventory route */}
          <Route path="/inventory" element={<InventoryManagement />} />

          {/* Teleconsultation route */}
          <Route path="/teleconsultation" element={<VideoCall />} />
          <Route path="/teleconsultation/:sessionId" element={<VideoCall />} />

          {/* Analytics route (placeholder) */}
          <Route
            path="/analytics"
            element={
              <div style={{ padding: '20px' }}>
                <h2>Analyses</h2>
                <p>Page d'analyses - À implémenter</p>
              </div>
            }
          />

          {/* Marketing route (placeholder) */}
          <Route
            path="/marketing"
            element={
              <div style={{ padding: '20px' }}>
                <h2>Marketing</h2>
                <p>Page marketing - À implémenter</p>
              </div>
            }
          />

          {/* Delivery route (placeholder) */}
          <Route
            path="/delivery"
            element={
              <div style={{ padding: '20px' }}>
                <h2>Livraisons</h2>
                <p>Page de gestion des livraisons - À implémenter</p>
              </div>
            }
          />

          {/* Settings route (placeholder) */}
          <Route
            path="/settings"
            element={
              <div style={{ padding: '20px' }}>
                <h2>Paramètres</h2>
                <p>Page de paramètres - À implémenter</p>
              </div>
            }
          />

          {/* Master Account Management */}
          <Route path="/account/master" element={<MasterAccountPage />} />

          {/* Pharmacy Profile Management */}
          <Route path="/pharmacy/manage" element={<PharmacyProfileManager />} />

          {/* Dashboard route - alias for root */}
          <Route path="/dashboard" element={<PrescriptionDashboard />} />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppShell>
    );
  };

  return (
    <Suspense fallback={<FullScreenLoading message="Chargement de la page..." />}>
      <Routes>
        {/* Login route (no authentication required, no AppShell) */}
        <Route path="/login" element={<LoginPage />} />

        {/* All other routes wrapped in AppShell and ProtectedRoute */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <ProtectedLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
};

export default App;
