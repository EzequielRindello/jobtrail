import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../api/authApi';

import '../styles/AppLayout.css';

export default function AppLayout() {
  const navigate = useNavigate();
  useLocation();

  const isLoggedIn = Boolean(localStorage.getItem('token'));

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch {
      alert('Logout failed. Please try again.');
    }
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-logo">JobTrail</h1>

          <nav className="app-nav">
            <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
              Dashboard
            </Link>
            <Link to="/privacy" className={location.pathname === '/privacy' ? 'active' : ''}>
              Privacy
            </Link>
          </nav>
        </div>

        <div className="header-right">
          <input
            className="header-search"
            type="search"
            placeholder="Search"
            aria-label="Search"
            disabled
          />

          {isLoggedIn ? (
            <button type="button" className="logout-button" onClick={handleLogout}>
              Log Out
            </button>
          ) : (
            <Link to="/login" className="logout-button">
              Log In
            </Link>
          )}
        </div>
        <nav className="mobile-nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/privacy">Privacy</Link>
        </nav>
      </header>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
