import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@shared/components/AppShell';
import { FullScreenLoading } from '@shared/pages/Loading';
import { NotFoundPage } from '@shared/pages/Error';

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

/**
 * Protected route component
 * Redirects to login if user is not authenticated
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // TODO: Replace with actual auth check
  const isAuthenticated = localStorage.getItem('auth_token') !== null;

  if (!isAuthenticated) {
    // Redirect to login page (to be implemented)
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * Main App component with routing
 */
const App: React.FC = () => {
  // TODO: Replace with actual user data from auth context
  const mockUser = {
    name: 'Dr. Martin Dupont',
    email: 'martin.dupont@metapharm.ch',
    role: 'pharmacist',
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
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
    <AppShell
      user={mockUser}
      onLogout={handleLogout}
      onProfileClick={handleProfile}
      onSettingsClick={handleSettings}
    >
      <Suspense fallback={<FullScreenLoading message="Chargement de la page..." />}>
        <Routes>
          {/* Dashboard - Default route */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <PrescriptionDashboard />
              </ProtectedRoute>
            }
          />

          {/* Prescription routes */}
          <Route
            path="/prescriptions"
            element={
              <ProtectedRoute>
                <PrescriptionDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prescriptions/review"
            element={
              <ProtectedRoute>
                <PrescriptionReview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prescriptions/review/:id"
            element={
              <ProtectedRoute>
                <PrescriptionReview />
              </ProtectedRoute>
            }
          />

          {/* Inventory route */}
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <InventoryManagement />
              </ProtectedRoute>
            }
          />

          {/* Teleconsultation route */}
          <Route
            path="/teleconsultation"
            element={
              <ProtectedRoute>
                <VideoCall />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teleconsultation/:sessionId"
            element={
              <ProtectedRoute>
                <VideoCall />
              </ProtectedRoute>
            }
          />

          {/* Analytics route (placeholder) */}
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <div style={{ padding: '20px' }}>
                  <h2>Analyses</h2>
                  <p>Page d'analyses - À implémenter</p>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Marketing route (placeholder) */}
          <Route
            path="/marketing"
            element={
              <ProtectedRoute>
                <div style={{ padding: '20px' }}>
                  <h2>Marketing</h2>
                  <p>Page marketing - À implémenter</p>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Delivery route (placeholder) */}
          <Route
            path="/delivery"
            element={
              <ProtectedRoute>
                <div style={{ padding: '20px' }}>
                  <h2>Livraisons</h2>
                  <p>Page de gestion des livraisons - À implémenter</p>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Settings route (placeholder) */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <div style={{ padding: '20px' }}>
                  <h2>Paramètres</h2>
                  <p>Page de paramètres - À implémenter</p>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Login route (placeholder - no authentication required) */}
          <Route
            path="/login"
            element={
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Connexion</h2>
                <p>Page de connexion - À implémenter</p>
              </div>
            }
          />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
};

export default App;
