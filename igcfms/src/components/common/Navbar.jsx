import React, { useState, useRef, useEffect } from 'react';
import '../common/css/Navbar.css';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../common/NotificationBell';
import NotificationBellCO from '../collectingOfficer/NotificationBellCO';

const Navbar = ({ userRole, user, onNavigate, isSidebarCollapsed, activeTab, selectedYear, onYearChange, years }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const yearDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
        setShowYearDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleYearSelect = (year) => {
    if (onYearChange) {
      onYearChange(year);
    }
    setShowYearDropdown(false);
  };

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
      'receive-money': 'Collection',
      'issue-receipt': 'Receipt',
      'issue-money': 'Disburse',
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
            {userRole === 'Admin' && selectedYear && years && (activeTab === 'adminDashboardHome' || activeTab === 'dashboard') && (
              <div className="year-selector-navbar" ref={yearDropdownRef}>
                <button 
                  className="year-selector-btn-navbar"
                  onClick={() => setShowYearDropdown(!showYearDropdown)}
                >
                  <span className="year-label-navbar">SELECT YEAR:</span>
                  <span className="year-value-navbar">{selectedYear}</span>
                  <i className={`fas fa-chevron-${showYearDropdown ? 'up' : 'down'}`}></i>
                </button>
                {showYearDropdown && (
                  <div className="year-dropdown-menu-navbar">
                    {years.map(year => (
                      <button
                        key={year}
                        className={`year-option-navbar ${selectedYear === year ? 'active' : ''}`}
                        onClick={() => handleYearSelect(year)}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
          
          <div className="navbar-actions">
            {userRole === 'Disbursing Officer' ? (
              <NotificationBell onNavigate={onNavigate} />
            ) : userRole === 'Collecting Officer' ? (
              <NotificationBellCO onNavigate={onNavigate} />
            ) : (
              <NotificationBell onNavigate={onNavigate} />
            )}
            
          
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
                  {userRole === 'Admin' && (
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); handleNavigation('manage-staff'); }} 
                      className="dropdown-item"
                    >
                      <span className="item-icon"></span>
                      <span className="item-text">Manage Staff</span>
                    </a>
                  )}
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