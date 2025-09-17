import React, { useState, useRef, useEffect } from 'react';
import '../common/css/Navbar.css';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ userRole, user, onToggleSidebar }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsProfileOpen(false);
  };

  const getInitials = (name, email) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <div className="brand-container">
          
          <div className="brand-text">
              <h2>{user?.role} Menu</h2>

          </div>
        </div>
      </div>


      <div className="navbar-right">
        <div className="quick-actions">
          <button className="action-btn notification-btn" title="Notifications">
            <span className="action-icon"></span>
            <span className="notification-badge">3</span>
          </button>
        </div>

        {/* User Profile */}
        <div className="profile-dropdown" ref={dropdownRef}>
          <button 
            className="profile-button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            aria-expanded={isProfileOpen}
          >
            <div className="user-avatar">
              {getInitials(user?.name, user?.email)}
            </div>
            <div className="user-info">
              <span className="user-email">{user?.email}</span>
              <span className="user-role">{userRole}</span>
            </div>
            <span className={`dropdown-arrow ${isProfileOpen ? 'open' : ''}`}>▼</span>
          </button>

          {isProfileOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <div className="user-avatar-large">
                  {getInitials(user?.name, user?.email)}
                </div>
                <div className="user-details">
                  <p className="user-name">{user?.name || 'User'}</p>
                  <p className="user-email-small">{user?.email}</p>
                  <span className="user-role-badge">{userRole}</span>
                </div>
              </div>
              <div className="dropdown-section">
                <h4 className="section-title">menu</h4>
                <div className="section-items">
                  <a href="/help" className="dropdown-item">
                    <span className="item-icon"></span>
                    <span className="item-text">Profile</span>
                  </a>
                  <a href="/settings" className="dropdown-item">
                    <span className="item-icon"></span>
                    <span className="item-text">Settings</span>
                  </a>
                </div>
              </div>

              <div className="dropdown-divider"></div>
              
              <button 
                onClick={handleLogout} 
                className="dropdown-item logout-btn"
              >
                <span className="item-icon">🚪</span>
                <span className="item-text">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;