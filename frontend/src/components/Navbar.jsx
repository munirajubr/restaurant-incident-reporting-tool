import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, Bell, AlertTriangle, Clock, X } from 'lucide-react';
import { api } from '../services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showConfirm, setShowConfirm] = useState(false);

  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch open critical incidents
  const fetchCriticalIncidents = async () => {
    if (!user || user.role !== 'manager') return;
    try {
      const res = await api.getIncidents();
      if (res.success && res.data) {
        // Filter for unresolved (Open/In Progress) critical incidents
        const criticals = res.data.filter(
          (inc) => inc.severity === 'Critical' && inc.status !== 'Resolved' && inc.status !== 'Closed'
        );
        setNotifications(criticals);
      }
    } catch (err) {
      console.error('Navbar notification fetch error:', err);
    }
  };

  useEffect(() => {
    if (user && user.role === 'manager') {
      fetchCriticalIncidents();

      // Poll every 15 seconds to fetch new critical incidents in background
      const interval = setInterval(fetchCriticalIncidents, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (incidentId) => {
    setShowDropdown(false);
    // Navigate to Dashboard with inspect query parameter
    navigate(`/?inspect=${incidentId}`, { replace: true });
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

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
          {/* Notifications Bell (Exclusive to Managers) */}
          {user.role === 'manager' && (
            <div className="navbar-notifications-wrapper" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`navbar-bell-btn ${showDropdown ? 'active' : ''} ${
                  notifications.length > 0 ? 'has-notifications' : ''
                }`}
                title="Critical Incident Alerts"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="bell-badge-count animate-pulse-red">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Glassmorphic Dropdown Panel */}
              {showDropdown && (
                <div className="navbar-notifications-dropdown glass-morphism animate-dropdown">
                  <div className="notifications-dropdown-header">
                    <span className="dropdown-header-title">Active Critical Alerts</span>
                    {notifications.length > 0 && (
                      <span className="dropdown-header-count-tag">{notifications.length} alerts</span>
                    )}
                  </div>
                  <div className="notifications-dropdown-body">
                    {notifications.length === 0 ? (
                      <div className="notifications-empty-state">
                        <Shield className="empty-shield-success" size={24} />
                        <p className="empty-title">All Systems Secure</p>
                        <p className="empty-desc">No unresolved critical issues registered.</p>
                      </div>
                    ) : (
                      <div className="notifications-list">
                        {notifications.map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => handleNotificationClick(notif._id)}
                            className="notification-dropdown-item"
                          >
                            <div className="notification-item-icon-box">
                              <AlertTriangle size={16} />
                            </div>
                            <div className="notification-item-content">
                              <p className="notification-item-title">{notif.title}</p>
                              <div className="notification-item-meta">
                                <span className="notification-meta-store">📍 {notif.storeLocation}</span>
                                <span className="notification-meta-time">⏱️ {formatTimeAgo(notif.dateTime)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {user.role === 'manager' && <div className="navbar-divider"></div>}

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
