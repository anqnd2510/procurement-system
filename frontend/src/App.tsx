import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import {
  OrganizationProvider,
  useOrganization,
} from './organizations/OrganizationContext';
import { AppShell } from './components/AppShell';
import { LoadingState, PageHeading } from './components/ui';
import { canViewAuditTrail, canViewDashboard } from './lib/access';
import { useTranslation } from 'react-i18next';
import { NotFoundPage } from './pages/NotFoundPage';

const AuthPage = lazy(() =>
  import('./pages/AuthPage').then((module) => ({ default: module.AuthPage })),
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
);
const ProductsPage = lazy(() =>
  import('./pages/ProductsPage').then((module) => ({
    default: module.ProductsPage,
  })),
);
const CategoriesPage = lazy(() =>
  import('./pages/CategoriesPage').then((module) => ({
    default: module.CategoriesPage,
  })),
);
const InventoryPage = lazy(() =>
  import('./pages/InventoryPage').then((module) => ({
    default: module.InventoryPage,
  })),
);
const RequestsPage = lazy(() =>
  import('./pages/RequestsPage').then((module) => ({
    default: module.RequestsPage,
  })),
);
const PurchaseOrdersPage = lazy(() =>
  import('./pages/PurchaseOrdersPage').then((module) => ({
    default: module.PurchaseOrdersPage,
  })),
);
const OrganizationPage = lazy(() =>
  import('./pages/OrganizationPage').then((module) => ({
    default: module.OrganizationPage,
  })),
);
const AuditPage = lazy(() =>
  import('./pages/AuditPage').then((module) => ({ default: module.AuditPage })),
);

function PageFallback() {
  return (
    <div className="full-page-loading">
      <LoadingState label="Loading workspace data…" />
    </div>
  );
}

function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading)
    return (
      <div className="full-page-loading">
        <LoadingState label="Restoring your secure session…" />
      </div>
    );
  if (!user)
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  return (
    <OrganizationProvider>
      <Outlet />
    </OrganizationProvider>
  );
}

function PublicAuthRoute({ mode }: { mode: 'login' | 'register' }) {
  const { user, isLoading } = useAuth();
  if (isLoading)
    return (
      <div className="full-page-loading">
        <LoadingState />
      </div>
    );
  if (user) return <Navigate to="/" replace />;
  return (
    <Suspense fallback={<PageFallback />}>
      <AuthPage mode={mode} />
    </Suspense>
  );
}

function ManagerOnlyRoute() {
  const { membershipRole, isLoading } = useOrganization();
  const { t } = useTranslation();
  if (isLoading) return <LoadingState />;
  if (!canViewAuditTrail(membershipRole)) {
    return (
      <div className="page-stack">
        <PageHeading
          eyebrow="ACCESS CONTROL"
          title={t('Access restricted')}
          description={t(
            'Your organization role does not allow access to this page.',
          )}
        />
        <div className="notice notice-warning">
          {t('Use an owner or manager account to open the audit trail.')}
        </div>
      </div>
    );
  }
  return <Outlet />;
}

function WorkspaceHome() {
  const { membershipRole, isLoading, activeOrganization } = useOrganization();
  if (isLoading) return <LoadingState />;
  if (!activeOrganization) return <Navigate to="/organization" replace />;
  if (!canViewDashboard(membershipRole))
    return <Navigate to="/requests" replace />;
  return (
    <Suspense fallback={<PageFallback />}>
      <DashboardPage />
    </Suspense>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicAuthRoute mode="login" />} />
      <Route path="/register" element={<PublicAuthRoute mode="register" />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<WorkspaceHome />} />
          <Route
            path="requests"
            element={
              <Suspense fallback={<PageFallback />}>
                <RequestsPage />
              </Suspense>
            }
          />
          <Route
            path="purchase-orders"
            element={
              <Suspense fallback={<PageFallback />}>
                <PurchaseOrdersPage />
              </Suspense>
            }
          />
          <Route
            path="inventory"
            element={
              <Suspense fallback={<PageFallback />}>
                <InventoryPage />
              </Suspense>
            }
          />
          <Route
            path="products"
            element={
              <Suspense fallback={<PageFallback />}>
                <ProductsPage />
              </Suspense>
            }
          />
          <Route
            path="categories"
            element={
              <Suspense fallback={<PageFallback />}>
                <CategoriesPage />
              </Suspense>
            }
          />
          <Route
            path="organization"
            element={
              <Suspense fallback={<PageFallback />}>
                <OrganizationPage />
              </Suspense>
            }
          />
          <Route element={<ManagerOnlyRoute />}>
            <Route
              path="audit"
              element={
                <Suspense fallback={<PageFallback />}>
                  <AuditPage />
                </Suspense>
              }
            />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
