import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showConfirm, setShowConfirm] = useState(false);

  if (!user) return null;

  const handleLogoutClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmLogout = () => {
    logout();
    navigate('/login');
    setShowConfirm(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand Logo & Name */}
        <Link to="/" className="navbar-brand">
          <Shield className="navbar-brand-icon" size={22} />
          <span className="navbar-brand-text">IncidentHub</span>
        </Link>

        {/* Center Navigation Tabs */}
        <div className="navbar-nav-links">
          <Link
            to="/"
            className={`navbar-nav-link ${location.pathname === '/' ? 'navbar-nav-link-active' : ''}`}
          >
            <span>Dashboard</span>
          </Link>
          <Link
            to="/analytics"
            className={`navbar-nav-link ${location.pathname === '/analytics' ? 'navbar-nav-link-active' : ''}`}
          >
            <span>Analytics</span>
          </Link>
        </div>

        <div className="navbar-profile">
          <div className="navbar-user-meta">
            <span className="navbar-user-name">{user.name}</span>
            <span className="navbar-user-sub">
              {user.storeLocation} <span className="navbar-meta-dot">•</span> <span className="navbar-role-label">{user.role}</span>
            </span>
          </div>
          <div className="navbar-divider"></div>
          <button onClick={handleLogoutClick} className="navbar-logout-link">
            <LogOut size={13} />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="modal-confirm-backdrop" onClick={() => setShowConfirm(false)}>
          <div className="modal-confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm-icon-box">
              <LogOut size={22} />
            </div>
            <h3 className="modal-confirm-title">Sign Out</h3>
            <p className="modal-confirm-description">
              Are you sure you want to sign out of your account?
            </p>
            <div className="modal-confirm-actions-row">
              <button
                type="button"
                className="btn-confirm-action btn-confirm-cancel"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-confirm-action btn-confirm-logout"
                onClick={handleConfirmLogout}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
