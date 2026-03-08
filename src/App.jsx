import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TreksPage from './pages/TreksPage';
import CitiesPage from './pages/CitiesPage';
import DeparturesPage from './pages/DeparturesPage';
import BatchDetailPage from './pages/BatchDetailPage';
import BookingsPage from './pages/BookingsPage';
import ParticipantsPage from './pages/ParticipantsPage';
import CustomersPage from './pages/CustomersPage';
import GuidesPage from './pages/GuidesPage';
import FinancePage from './pages/FinancePage';
import MarketingPage from './pages/MarketingPage';
import SettingsPage from './pages/SettingsPage';
import SupportChatPage from './pages/SupportChatPage';
import SuperAdminPage from './pages/SuperAdminPage';

function AuthRedirect({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function RequireSuperAdmin({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'superadmin') return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<AuthRedirect><LandingPage /></AuthRedirect>} />
            <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />

            {/* Protected routes */}
            <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/cities" element={<CitiesPage />} />
              <Route path="/treks" element={<TreksPage />} />
              <Route path="/departures" element={<DeparturesPage />} />
              <Route path="/departures/:id" element={<BatchDetailPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/participants" element={<ParticipantsPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/guides" element={<GuidesPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/marketing" element={<MarketingPage />} />
              <Route path="/support-chat" element={<SupportChatPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Super Admin only route */}
            <Route path="/superadmin" element={<RequireSuperAdmin><SuperAdminPage /></RequireSuperAdmin>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
