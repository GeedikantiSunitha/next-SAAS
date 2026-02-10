import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Skeleton } from './components/ui/skeleton';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/admin/AdminRoute';
import { Toaster } from './components/ui/toaster';
import { NetworkErrorBanner } from './components/NetworkErrorBanner';
import { CookieConsentBanner } from './components/gdpr/CookieConsentBanner';
import { SkipToContent } from './components/accessibility/SkipToContent';

// Lazy load pages for code splitting
const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs').then(m => ({ default: m.AdminAuditLogs })));
const AdminFeatureFlags = lazy(() => import('./pages/admin/AdminFeatureFlags').then(m => ({ default: m.AdminFeatureFlags })));
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments').then(m => ({ default: m.AdminPayments })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const Notifications = lazy(() => import('./pages/Notifications').then(m => ({ default: m.Notifications })));
const GdprSettings = lazy(() => import('./pages/GdprSettings').then(m => ({ default: m.GdprSettings })));
const NewsletterSettings = lazy(() => import('./pages/NewsletterSettings').then(m => ({ default: m.NewsletterSettings })));
const AdminNewsletters = lazy(() => import('./pages/admin/AdminNewsletters').then(m => ({ default: m.AdminNewsletters })));
const AdminDataDeletions = lazy(() => import('./pages/admin/AdminDataDeletions').then(m => ({ default: m.AdminDataDeletions })));
const AdminDataRetention = lazy(() => import('./pages/admin/AdminDataRetention').then(m => ({ default: m.AdminDataRetention })));
const AdminSecurityDashboard = lazy(() => import('./pages/admin/AdminSecurityDashboard').then(m => ({ default: m.AdminSecurityDashboard })));
const AdminSecurityIncidents = lazy(() => import('./pages/admin/AdminSecurityIncidents').then(m => ({ default: m.AdminSecurityIncidents })));
const AdminVulnerabilityScanner = lazy(() => import('./pages/admin/AdminVulnerabilityScanner').then(m => ({ default: m.AdminVulnerabilityScanner })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
const PaymentSettings = lazy(() => import('./pages/PaymentSettings').then(m => ({ default: m.PaymentSettings })));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess').then(m => ({ default: m.PaymentSuccess })));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback').then(m => ({ default: m.OAuthCallback })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(m => ({ default: m.TermsOfService })));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy').then(m => ({ default: m.CookiePolicy })));
const AcceptableUse = lazy(() => import('./pages/AcceptableUse').then(m => ({ default: m.AcceptableUse })));
const DataProcessingAgreement = lazy(() => import('./pages/DataProcessingAgreement').then(m => ({ default: m.DataProcessingAgreement })));
const SecurityPolicy = lazy(() => import('./pages/SecurityPolicy').then(m => ({ default: m.SecurityPolicy })));
const PrivacyCenter = lazy(() => import('./pages/PrivacyCenter'));
const AccessibilityStatement = lazy(() => import('./pages/AccessibilityStatement').then(m => ({ default: m.AccessibilityStatement })));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
      <Skeleton className="h-4 w-32 mx-auto" />
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <SkipToContent targetId="main-content" />
            <main id="main-content" tabIndex={-1}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/oauth/:provider/callback"
                  element={<OAuthCallback />}
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
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/gdpr"
                  element={
                    <ProtectedRoute>
                      <GdprSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/newsletter"
                  element={
                    <ProtectedRoute>
                      <NewsletterSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/privacy-center"
                  element={
                    <ProtectedRoute>
                      <PrivacyCenter />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payments"
                  element={
                    <ProtectedRoute>
                      <PaymentSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payments/success"
                  element={
                    <ProtectedRoute>
                      <PaymentSuccess />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminRoute>
                      <AdminUsers />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/audit-logs"
                  element={
                    <AdminRoute>
                      <AdminAuditLogs />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/feature-flags"
                  element={
                    <AdminRoute>
                      <AdminFeatureFlags />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/payments"
                  element={
                    <AdminRoute>
                      <AdminPayments />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <AdminRoute>
                      <AdminSettings />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/data-deletions"
                  element={
                    <AdminRoute>
                      <AdminDataDeletions />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/newsletters"
                  element={
                    <AdminRoute>
                      <AdminNewsletters />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/data-retention"
                  element={
                    <AdminRoute>
                      <AdminDataRetention />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/security"
                  element={
                    <AdminRoute>
                      <AdminSecurityDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/security-incidents"
                  element={
                    <AdminRoute>
                      <AdminSecurityIncidents />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/security-testing"
                  element={
                    <AdminRoute>
                      <AdminVulnerabilityScanner />
                    </AdminRoute>
                  }
                />
                {/* Legal Pages - Public routes */}
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/acceptable-use" element={<AcceptableUse />} />
                <Route path="/dpa" element={<DataProcessingAgreement />} />
                <Route path="/security" element={<SecurityPolicy />} />
                <Route path="/accessibility" element={<AccessibilityStatement />} />
                <Route path="/gdpr-settings" element={
                  <ProtectedRoute>
                    <GdprSettings />
                  </ProtectedRoute>
                } />
                {/* 404 Catch-all route */}
                <Route
                  path="*"
                  element={<NotFound />}
                />
              </Routes>
              </Suspense>
            </main>
            <CookieConsentBanner />
            <NetworkErrorBanner />
            <Toaster />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

