import React, { useState } from "react";
import './css/adminsidebar.css';

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const [expandedSections, setExpandedSections] = useState({
    "Transaction": true,
    "Accounts": false,
    "Reports": false,
    "Management": false
  });

  const toggleSection = (sectionTitle) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };
  const menuSections = [
    {
      title: "Transaction",
      icon: "fas fa-exchange-alt",
      items: [
        // { id: "adminDashboardHome", label: "new", icon: <i className="fas fa-money-bill-wave"></i> },
        // { id: "issue-money", label: "Disburse", icon: <i className="fas fa-hand-holding-usd"></i> },
        { id: "issue-receipt", label: "Receipt", icon: <i className="fas fa-receipt"></i> },
        { id: "issue-check", label: "Cheque", icon: <i className="fas fa-money-check-alt"></i> },
        { id: "override-transactions", label: "Override Transactions", icon: <i className="fas fa-exchange-alt"></i> },
        { id: "transaction-management", label: "Transaction Management", icon: <i className="fas fa-cogs"></i> }
      ]
    },
    {
      title: "Accounts",
      icon: "fas fa-folder",
      items: [
        { id: "recipient-account", label: "Recipient Account", icon: <i className="fas fa-address-book"></i> },
        { id: "funds-accounts", label: "Fund Accounts", icon: <i className="fas fa-university"></i> }
      ]
    },
    {
      title: "Reports",
      icon: "fas fa-chart-bar",
      items: [
        { id: "generate-reports", label: "Reports", icon: <i className="fas fa-chart-bar"></i> }
      ]
    },
    {
      title: "Management",
      icon: "fas fa-cogs",
      items: [
        { id: "manage-staff", label: "Manage Staff", icon: <i className="fas fa-users"></i> },
        { id: "activity-dashboard", label: "Activity Monitor", icon: <i className="fas fa-chart-line"></i> }
      ]
    }
  ];

  return (
    <div className="admin-sidebar-content">
      {/* Dashboard - Special Item */}
      <div className="admin-dashboard-section">
        <button
          className={`admin-sidebar-item dashboard-item ${
            activeTab === "dashboard" ? "active" : ""
          }`}
          onClick={() => setActiveTab("dashboard")}
        >
          <i className="fas fa-tachometer-alt admin-item-icon"></i>
          <span className="admin-item-label">Dashboard</span>
        </button>
      </div>

      {/* Notifications - Special Item */}
      <div className="admin-notifications-section">
        <button
          className={`admin-sidebar-item notifications-item ${
            activeTab === "notifications" ? "active" : ""
          }`}
          onClick={() => setActiveTab("notifications")}
        >
          <i className="fas fa-bell admin-item-icon"></i>
          <span className="admin-item-label">Notifications</span>
        
        </button>
      </div>

      {/* Menu Sections */}
      <nav className="admin-sidebar-nav">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="admin-menu-section">
            <button 
              className="admin-section-header"
              onClick={() => toggleSection(section.title)}
            >
              <div className="admin-section-left">
                <span className="admin-section-icon"><i className={section.icon}></i></span>
                <span className="admin-section-title">{section.title}</span>
              </div>
              <div className="admin-section-right">
                <i className={`fas fa-chevron-${expandedSections[section.title] ? 'down' : 'right'} admin-section-arrow`}></i>
              </div>
            </button>
            <div className={`admin-section-content ${expandedSections[section.title] ? 'expanded' : 'collapsed'}`}>
              <ul className="admin-sidebar-menu">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <button
                      className={`admin-sidebar-item submenu-item ${
                        activeTab === item.id ? "active" : ""
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

export default AdminSidebar;
