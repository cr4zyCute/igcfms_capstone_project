// src/components/common/Navbar.jsx
import React, { useState } from 'react';
import '../common/css/Navbar.css';

const Navbar = ({ userRole, user, onToggleSidebar }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button 
          className="menu-button" 
          onClick={onToggleSidebar}
        >
          <span>☰</span>
        </button>
        <h1 className="navbar-title">IGCFMS Dashboard</h1>
      </div>

      <div className="navbar-right">
        {/* Notifications */}
        <button className="icon-button">
          <span>🔔</span>
          <span className="notification-badge">3</span>
        </button>

        {/* User Profile */}
        <div className="profile-dropdown">
          <button 
            className="profile-button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="user-info">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role">{userRole}</span>
            </div>
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </button>

          {isProfileOpen && (
            <div className="dropdown-menu">
              <a href="/profile" className="dropdown-item">
                <span>👤</span> Profile
              </a>
              <a href="/settings" className="dropdown-item">
                <span>⚙️</span> Settings
              </a>
              <hr className="dropdown-divider" />
              <a href="/logout" className="dropdown-item">
                <span>🚪</span> Logout
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;