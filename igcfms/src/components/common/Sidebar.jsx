// src/components/common/Sidebar.jsx
import React from 'react';
import { getNavigationConfig } from '../../utils/navigationConfig';
import '../common/css/Sidebar.css';

const Sidebar = ({ userRole, isOpen, onClose }) => {
  const config = getNavigationConfig(userRole);
  const { sidebar } = config;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Logo Section */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <h2>IGCFMS</h2>
            <span>Management System</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <ul>
            {sidebar.map((item) => (
              <li key={item.path} className="nav-item">
                <a 
                  href={item.path} 
                  className="nav-link"
                  onClick={onClose}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-title">{item.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer with Role Badge */}
        <div className="sidebar-footer">
          <div className="role-badge">
            <span>{userRole}</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;