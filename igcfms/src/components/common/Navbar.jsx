import React, { useState, useRef, useEffect } from 'react';
import '../common/css/Navbar.css';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../common/NotificationBell';

const Navbar = ({ userRole, user, onNavigate, isSidebarCollapsed, activeTab }) => {
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

  const handleNavigation = (tab) => {
    if (onNavigate) {
      onNavigate(tab);
    }
    setIsProfileOpen(false);
  };

  const getInitials = (name, email) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  // Map tab IDs to display names
  const getTabDisplayName = (tabId) => {
    const tabNames = {
      'dashboard': 'Dashboard',
      'notifications': 'Notifications',
      'receive-money': 'Receive Money',
      'issue-receipt': 'Receipt',
      'issue-money': 'Issue Money',
      'issue-check': 'Issue Cheque',
      'override-transactions': 'Override Transactions',
      'transaction-management': 'Transaction Management',
      'recipient-account': 'Recipient Account',
      'funds-accounts': 'Fund Accounts',
      'generate-reports': 'Reports',
      'manage-staff': 'Manage Staff',
      'view-transactions': 'View All Transactions',
      'activity-dashboard': 'Activity Monitor',
      'profile-settings': 'Profile Settings'
    };
    return tabNames[tabId] || tabId;
  };

  return (
    <header className={`navbar ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="navbar-right">
          <div className="brand-text">
              <h2>{user?.role}</h2>
              <span className="breadcrumb-separator">/</span>
              <span className="current-section">{getTabDisplayName(activeTab)}</span>
          </div>
          
          <div className="navbar-actions">
            <NotificationBell onNavigate={onNavigate} />
            
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
            <span className={`dropdown-arrow ${isProfileOpen ? 'open' : ''}`}></span>
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
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); handleNavigation('profile-settings'); }} 
                    className="dropdown-item"
                  >
                    <span className="item-icon"></span>
                    <span className="item-text">Profile</span>
                  </a>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); handleNavigation('profile-settings'); }} 
                    className="dropdown-item"
                  >
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
                <span className="item-icon"></span>
                <span className="item-text">Sign Out</span>
              </button>
            </div>
          )}
            </div>
          </div>
      </div>
    </header>
  );
};

export default Navbar;