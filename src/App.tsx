import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Plus, LayoutDashboard, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { HoldsProvider } from '@/lib/HoldsContext';
import { NotificationProvider } from '@/lib/NotificationContext';
import { useOverdueCheck } from '@/hooks/useOverdueCheck';
import { Dashboard, HoldDetail, NewHold, Login, Signup } from '@/pages';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function Navigation() {
  const location = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="nav">
      <div className="nav__inner">
        <Link to="/" className="nav__logo">
          <span className="nav__logo-icon">⏳</span>
          <span className="nav__logo-text">HOLD</span>
        </Link>

        <div className="nav__links">
          <Link
            to="/"
            className={`nav__link ${location.pathname === '/' ? 'nav__link--active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
        </div>

        <div className="nav__right">
          <Link to="/new" className="nav__add">
            <Plus size={20} />
            <span>New Hold</span>
          </Link>

          <button onClick={handleLogout} className="nav__logout" title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}


function AppRoutes() {
  // Activate background overdue check
  useOverdueCheck();

  return (
    <div className="app-layout">
      <Navigation />
      <main className="app-content">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/hold/:id" element={
            <ProtectedRoute>
              <HoldDetail />
            </ProtectedRoute>
          } />
          <Route path="/new" element={
            <ProtectedRoute>
              <NewHold />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <HoldsProvider>
            <AppRoutes />
          </HoldsProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
