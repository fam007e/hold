import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Plus, LayoutDashboard, List, Settings } from 'lucide-react';
import { HoldsProvider } from '@/lib/HoldsContext';
import { Dashboard, HoldDetail, NewHold } from '@/pages';
import './App.css';

function Navigation() {
  const location = useLocation();

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

        <Link to="/new" className="nav__add">
          <Plus size={20} />
          <span>New Hold</span>
        </Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <HoldsProvider>
        <div className="app-layout">
          <Navigation />
          <main className="app-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/hold/:id" element={<HoldDetail />} />
              <Route path="/new" element={<NewHold />} />
            </Routes>
          </main>
        </div>
      </HoldsProvider>
    </BrowserRouter>
  );
}

export default App;
