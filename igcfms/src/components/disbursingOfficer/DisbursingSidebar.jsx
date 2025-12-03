import React, { useState } from 'react';
import '../admin/css/adminsidebar.css';

const DisbursingSidebar = ({ activeTab, setActiveTab }) => {
  const [expandedSections, setExpandedSections] = useState({
    Disbursement: true,
    Transactions: false,
    Reports: false
  });

  const toggleSection = (sectionTitle) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  const menuSections = [
    {
      title: 'Disbursement',
      icon: 'fas fa-hand-holding-usd',
      items: [
        { id: 'issue-money', label: 'Disburse', icon: <i className="fas fa-hand-holding-usd"></i> },
        { id: 'issue-cheque', label: 'Cheque', icon: <i className="fas fa-money-check-alt"></i> },
        { id: 'override-transactions', label: 'Override Transactions', icon: <i className="fas fa-edit"></i> }
      ]
    },
   
    {
      title: 'Reports',
      icon: 'fas fa-chart-line',
      items: [
        { id: 'generate-reports', label: 'Generate Reports', icon: <i className="fas fa-chart-line"></i> }
      ]
    }
  ];

  return (
    <div className="admin-sidebar-content">
      <div className="admin-dashboard-section">
        <button
          className={`admin-sidebar-item dashboard-item ${
            activeTab === 'dashboard' ? 'active' : ''
          }`}
          onClick={() => setActiveTab('dashboard')}
        >
          <i className="fas fa-tachometer-alt admin-item-icon"></i>
          <span className="admin-item-label">Dashboard</span>
        </button>
      </div>

      <div className="admin-notifications-section">
        <button
          className={`admin-sidebar-item notifications-item ${
            activeTab === 'notifications' ? 'active' : ''
          }`}
          onClick={() => setActiveTab('notifications')}
        >
          <i className="fas fa-bell admin-item-icon"></i>
          <span className="admin-item-label">Notifications</span>
        </button>
      </div>

      <nav className="admin-sidebar-nav">
        {menuSections.map((section, index) => (
          <div key={index} className="admin-menu-section">
            <button
              className="admin-section-header"
              onClick={() => toggleSection(section.title)}
            >
              <div className="admin-section-left">
                <span className="admin-section-icon">
                  <i className={section.icon}></i>
                </span>
                <span className="admin-section-title">{section.title}</span>
              </div>
              <div className="admin-section-right">
                <i
                  className={`fas fa-chevron-${
                    expandedSections[section.title] ? 'down' : 'right'
                  } admin-section-arrow`}
                ></i>
              </div>
            </button>
            <div
              className={`admin-section-content ${
                expandedSections[section.title] ? 'expanded' : 'collapsed'
              }`}
            >
              <ul className="admin-sidebar-menu">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <button
                      className={`admin-sidebar-item submenu-item ${
                        activeTab === item.id ? 'active' : ''
                      }`}
                      onClick={() => setActiveTab(item.id)}
                    >
                      <span className="admin-item-icon">{item.icon}</span>
                      <span className="admin-item-label">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default DisbursingSidebar;