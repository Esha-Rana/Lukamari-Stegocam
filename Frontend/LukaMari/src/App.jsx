import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth pages
import LoginPage from './Components/auth/LoginPage';
import SignupPage from './Components/auth/SignupPage';
import ForgotPassword from './Components/ForgotPass';

// Layout
import AppShell from './Components/layout/AppShell';

// Pages (authenticated)
import DashboardPage from './pages/DashboardPage';
import NewSecretPage from './pages/NewSecretPage';
import InboxPage from './pages/InboxPage';
import SentPage from './pages/SentPage';
import DecodePage from './pages/DecodePage';
import ActiveTransferPage from './pages/ActiveTransferPage';
import MessageDetailsPage from './pages/MessageDetailsPage';
import ProfilePage from './pages/ProfilePage';

import './index.css';

/* ── Protected route wrapper ── */
function PrivateRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">Loading Lukamari...</p>
        </div>
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

/* ── Public route wrapper (redirect if already logged in) ── */
function PublicRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* ── Public routes ── */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
      <Route path="/forgotpass" element={<ForgotPassword />} />

      {/* ── Authenticated routes (inside AppShell with sidebar) ── */}
      <Route
        element={
          <PrivateRoute>
            <AppShell />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/new-secret" element={<NewSecretPage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/sent" element={<SentPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/message/:id" element={<MessageDetailsPage />} />
      </Route>

      {/* ── Full-screen authenticated routes (no sidebar) ── */}
      <Route
        path="/transfer/:roomId"
        element={
          <PrivateRoute>
            <div className="min-h-screen bg-[#0a0b14] text-white">
              <ActiveTransferPage />
            </div>
          </PrivateRoute>
        }
      />
      <Route
        path="/decode/:roomId"
        element={
          <PrivateRoute>
            <div className="min-h-screen bg-[#0a0b14] text-white">
              <div className="ml-0">
                <DecodePage />
              </div>
            </div>
          </PrivateRoute>
        }
      />

      {/* ── 404 ── */}
      <Route path="*" element={
        <div className="min-h-screen bg-[#0a0b14] text-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-8xl font-bold text-cyan-600/30">404</p>
            <p className="text-gray-400 mt-4">Page not found</p>
          </div>
        </div>
      } />
    </Routes>
  );
}