import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@shared/components/AppShell';
import { FullScreenLoading } from '@shared/pages/Loading';
import { NotFoundPage } from '@shared/pages/Error';
import { LoginPage } from '@shared/pages/Login';
import { logout, getUserData } from '@shared/services/authService';

/**
 * Role-based route access configuration
 */
export const ROLE_PERMISSIONS = {
  pharmacist: ['dashboard', 'prescriptions', 'inventory', 'teleconsultation', 'analytics', 'marketing', 'delivery', 'settings', 'ecommerce', 'orders', 'vip'],
  doctor: ['dashboard', 'teleconsultation', 'messages'],
  nurse: ['dashboard', 'inventory', 'deliveries', 'teleconsultation', 'messages'],
  patient: ['dashboard', 'teleconsultation', 'ecommerce', 'orders', 'messages', 'vip'],
  delivery_person: ['deliveries', 'messages'],
  admin: ['dashboard', 'prescriptions', 'inventory', 'teleconsultation', 'analytics', 'marketing', 'delivery', 'settings', 'ecommerce', 'orders', 'messages', 'vip'],
} as const;

export type UserRole = keyof typeof ROLE_PERMISSIONS;

/**
 * Lazy load pages for code splitting
 */
const Dashboard = lazy(() => import('@apps/pharmacist/pages/Dashboard'));
const PatientDashboard = lazy(() => import('@apps/patient/pages/Dashboard'));
const DoctorDashboard = lazy(() => import('@apps/doctor/components/DoctorDashboard'));
const DeliveryDashboard = lazy(() => import('@apps/driver/pages/DeliveryDashboard'));
const PrescriptionDashboard = lazy(() => import('@apps/pharmacist/pages/PrescriptionDashboard'));
const PrescriptionReview = lazy(() => import('@apps/pharmacist/pages/PrescriptionReview'));
const InventoryManagement = lazy(() => import('@apps/pharmacist/pages/InventoryManagement'));
const PharmacistVideoCall = lazy(() => import('@apps/pharmacist/pages/VideoCall'));
const PatientVideoCall = lazy(() => import('@apps/patient/pages/VideoCall'));
const DoctorVideoCall = lazy(() => import('@apps/doctor/pages/VideoCall'));
const PharmacyProfileManager = lazy(() => import('@apps/pharmacist/pages/pharmacy-profile/PharmacyProfileManager'));
const MasterAccountPage = lazy(() => import('@apps/pharmacist/pages/MasterAccountPage'));
const PatientCatalog = lazy(() => import('@apps/patient/features/ecommerce/pages/Catalog'));
const PatientOrderHistory = lazy(() => import('@apps/patient/features/ecommerce/pages/OrderHistory'));
const DeliveryManagement = lazy(() => import('@apps/pharmacist/pages/DeliveryManagement'));
const Checkout = lazy(() => import('@apps/patient/pages/checkout/Checkout'));
const OrderConfirmation = lazy(() => import('@apps/patient/pages/checkout/OrderConfirmation'));
const VIPPortal = lazy(() => import('@apps/patient/features/vip/pages/VIPPortal'));
const PatientMessagingPage = lazy(() => import('@apps/patient/features/messaging/pages/MessagingPage'));
const Analytics = lazy(() => import('@apps/pharmacist/pages/Analytics'));
const MarketingManagement = lazy(() => import('@apps/pharmacist/pages/MarketingManagement'));
const Settings = lazy(() => import('@apps/pharmacist/pages/Settings'));
const ConsultationCalendar = lazy(() => import('@apps/pharmacist/pages/ConsultationCalendar'));
const MedicalRecords = lazy(() => import('@apps/pharmacist/pages/MedicalRecords'));

// Admin components
const AdminDashboard = lazy(() => import('@apps/admin/pages/AdminDashboard'));

// Nurse components
const NurseLayout = lazy(() => import('@apps/nurse/layouts/NurseLayout'));
const NurseDashboard = lazy(() => import('@apps/nurse/components/NurseDashboard'));
const PatientList = lazy(() => import('@apps/nurse/components/PatientList'));
const PatientDetail = lazy(() => import('@apps/nurse/components/PatientDetail'));
const MedicationOrderForm = lazy(() => import('@apps/nurse/components/MedicationOrderForm'));
const OrderDetail = lazy(() => import('@apps/nurse/components/OrderDetail'));
const OrderTracking = lazy(() => import('@apps/nurse/components/OrderTracking'));
const NotificationPanel = lazy(() => import('@apps/nurse/components/NotificationPanel'));

/**
 * Protected route component
 * Redirects to login if user is not authenticated
 * Optionally checks role-based access
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const isAuthenticated = localStorage.getItem('auth_token') !== null;

  // Debug logging
  console.log('[ProtectedRoute] Checking authentication:', {
    hasToken: isAuthenticated,
    token: localStorage.getItem('auth_token')?.substring(0, 20) + '...',
    timestamp: new Date().toISOString(),
  });

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Redirecting to login - no auth token found');
    return <Navigate to="/login" replace />;
  }

  // Check role-based access if required roles are specified
  if (requiredRoles && requiredRoles.length > 0) {
    const userData = getUserData();
    // Normalize role to lowercase for comparison (API may return uppercase)
    const userRole = (userData?.role?.toLowerCase() || '') as UserRole;

    if (!userRole || !requiredRoles.includes(userRole)) {
      console.log('[ProtectedRoute] User does not have required role', {
        userRole,
        requiredRoles,
      });
      return <Navigate to="/dashboard" replace />;
    }
  }

  console.log('[ProtectedRoute] Authenticated - rendering protected content');
  return <>{children}</>;
};

/**
 * Get user info for AppShell
 */
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

/**
 * Layout wrapper for authenticated pages
 * Provides AppShell with header, sidebar, and footer
 */
interface LayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<LayoutProps> = ({ children }) => {
  const user = getUserInfo();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const handleProfile = () => {
    console.log('Navigate to profile');
  };

  const handleSettings = () => {
    console.log('Navigate to settings');
  };

  return (
    <AppShell
      user={user}
      onLogout={handleLogout}
      onProfileClick={handleProfile}
      onSettingsClick={handleSettings}
    >
      {children}
    </AppShell>
  );
};

/**
 * Role-aware VideoCall component
 * Renders the appropriate VideoCall page based on user role
 */
const RoleAwareVideoCall: React.FC = () => {
  const userData = getUserData();
  const userRole = userData?.role as UserRole | undefined;

  // Render role-specific VideoCall component
  switch (userRole) {
    case 'patient':
      return <PatientVideoCall />;
    case 'doctor':
      return <DoctorVideoCall />;
    case 'pharmacist':
    case 'admin':
      return <PharmacistVideoCall />;
    case 'nurse':
      // Nurses likely use pharmacist interface for consultations
      return <PharmacistVideoCall />;
    default:
      // Fallback to pharmacist version
      return <PharmacistVideoCall />;
  }
};

/**
 * Main Routes configuration
 * Defines all application routes with authentication and role-based access control
 */
export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<FullScreenLoading message="Chargement de la page..." />}>
      <Routes>
        {/* Public routes - no authentication required, no AppShell */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes - authentication required, with AppShell */}

        {/* Dashboard - Default route */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Dashboard route - alias for root */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Role-specific dashboard routes - all route to same Dashboard component */}
        {/* Dashboard handles role-based rendering internally */}
        <Route
          path="/pharmacist/dashboard"
          element={
            <ProtectedRoute requiredRoles={['pharmacist', 'admin']}>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute requiredRoles={['patient', 'admin']}>
              <AppLayout>
                <PatientDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute requiredRoles={['doctor', 'admin']}>
              <AppLayout>
                <DoctorDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/delivery/dashboard"
          element={
            <ProtectedRoute requiredRoles={['delivery_person', 'admin']}>
              <AppLayout>
                <DeliveryDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Prescription routes - Pharmacist only */}
        <Route
          path="/prescriptions"
          element={
            <ProtectedRoute requiredRoles={['pharmacist', 'admin']}>
              <AppLayout>
                <PrescriptionDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        {/* Redirect /prescriptions/review to dashboard - review requires an ID */}
        <Route
          path="/prescriptions/review"
          element={<Navigate to="/prescriptions" replace />}
        />
        <Route
          path="/prescriptions/review/:id"
          element={
            <ProtectedRoute requiredRoles={['pharmacist', 'admin']}>
              <AppLayout>
                <PrescriptionReview />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Inventory route - Pharmacist and Nurses */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute requiredRoles={['pharmacist', 'nurse', 'admin']}>
              <AppLayout>
                <InventoryManagement />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Teleconsultation route - All authenticated users (role-aware) */}
        <Route
          path="/teleconsultation"
          element={
            <ProtectedRoute>
              <AppLayout>
                <RoleAwareVideoCall />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teleconsultation/:consultationId"
          element={
            <ProtectedRoute>
              <AppLayout>
                <RoleAwareVideoCall />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Consultation Calendar - Pharmacist and Admin only */}
        <Route
          path="/consultation-calendar"
          element={
            <ProtectedRoute requiredRoles={['pharmacist', 'admin']}>
              <AppLayout>
                <ConsultationCalendar />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Medical Records - Pharmacist and Admin only */}
        <Route
          path="/medical-records"
          element={
            <ProtectedRoute requiredRoles={['pharmacist', 'admin']}>
              <AppLayout>
                <MedicalRecords />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Master Account Management - Pharmacist and Admin only */}
        <Route
          path="/account/master"
          element={
            <ProtectedRoute requiredRoles={['pharmacist', 'admin']}>
              <AppLayout>
                <MasterAccountPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Pharmacy Profile Management - Pharmacist and Admin only */}
        <Route
          path="/pharmacy/manage"
          element={
            <ProtectedRoute requiredRoles={['pharmacist', 'admin']}>
              <AppLayout>
                <PharmacyProfileManager />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Analytics route - Pharmacist and Admin only */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute requiredRoles={['pharmacist', 'admin']}>
              <AppLayout>
                <Analytics />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Marketing route - Pharmacist and Admin only */}
        <Route
          path="/marketing"
          element={
            <ProtectedRoute requiredRoles={['pharmacist', 'admin']}>
              <AppLayout>
                <MarketingManagement />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* E-commerce - Product Catalog */}
        <Route
          path="/ecommerce"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PatientCatalog />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* E-commerce - Order Management */}
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PatientOrderHistory />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Checkout - Patient and Pharmacist */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute requiredRoles={['patient', 'pharmacist', 'admin']}>
              <AppLayout>
                <Checkout />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Order Confirmation - Patient and Pharmacist */}
        <Route
          path="/checkout/confirmation"
          element={
            <ProtectedRoute requiredRoles={['patient', 'pharmacist', 'admin']}>
              <AppLayout>
                <OrderConfirmation />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* VIP Program - Patient */}
        <Route
          path="/vip-program"
          element={
            <ProtectedRoute requiredRoles={['patient', 'pharmacist', 'admin']}>
              <AppLayout>
                <VIPPortal />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Delivery route - Pharmacist, Delivery Personnel, and Admin */}
        <Route
          path="/delivery"
          element={
            <ProtectedRoute requiredRoles={['pharmacist', 'delivery_person', 'admin']}>
              <AppLayout>
                <DeliveryManagement />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Deliveries route - alias */}
        <Route
          path="/deliveries"
          element={
            <ProtectedRoute requiredRoles={['pharmacist', 'delivery_person', 'admin']}>
              <AppLayout>
                <DeliveryManagement />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Nurse routes - uses NurseLayout with nested routing */}
        <Route
          path="/nurse"
          element={
            <ProtectedRoute requiredRoles={['nurse', 'admin']}>
              <NurseLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<NurseDashboard />} />
          <Route path="dashboard" element={<NurseDashboard />} />
          <Route path="patients" element={<PatientList />} />
          <Route path="patients/:patientId" element={<PatientDetail />} />
          <Route path="orders" element={<MedicationOrderForm />} />
          <Route path="orders/new" element={<MedicationOrderForm />} />
          <Route path="orders/:orderId" element={<OrderDetail />} />
          <Route path="tracking" element={<OrderTracking />} />
          <Route path="notifications" element={<NotificationPanel />} />
        </Route>

        {/* Messages route - All authenticated users */}
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PatientMessagingPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Settings route - All authenticated users */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Settings />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin routes - Admin only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <AppLayout>
                <AdminDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <AppLayout>
                <AdminDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <AppLayout>
                <AdminDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/system"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <AppLayout>
                <AdminDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/config"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <AppLayout>
                <AdminDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <AppLayout>
                <AdminDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 Not Found - catch all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
