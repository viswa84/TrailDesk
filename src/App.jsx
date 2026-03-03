import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TreksPage from './pages/TreksPage';
import CitiesPage from './pages/CitiesPage';
import DeparturesPage from './pages/DeparturesPage';
import BookingsPage from './pages/BookingsPage';
import CustomersPage from './pages/CustomersPage';
import FinancePage from './pages/FinancePage';
import MarketingPage from './pages/MarketingPage';
import SettingsPage from './pages/SettingsPage';
import SupportChatPage from './pages/SupportChatPage';

function AuthRedirect({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/cities" element={<CitiesPage />} />
            <Route path="/treks" element={<TreksPage />} />
            <Route path="/departures" element={<DeparturesPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/marketing" element={<MarketingPage />} />
            <Route path="/support-chat" element={<SupportChatPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
