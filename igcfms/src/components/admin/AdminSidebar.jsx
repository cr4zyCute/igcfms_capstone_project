import React, { useState } from "react";

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const [expandedSections, setExpandedSections] = useState({
    "Administration": true,
    "Transaction": false,
    "Accounts": false,
    "Reports": false
  });

  const toggleSection = (sectionTitle) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };
  const menuSections = [
    {
      title: "Administration",
      items: [
        { id: "manage-staff", label: "Manage Staff", icon: <i className="fas fa-users"></i> },
        { id: "activity-dashboard", label: "Activity Monitor", icon: <i className="fas fa-chart-line"></i> }
      ]
    },
    {
      title: "Transaction",
      items: [
        { id: "receive-money", label: "Receive Money", icon: <i className="fas fa-money-bill-wave"></i> },
        { id: "issue-receipt", label: "Issue Receipt", icon: <i className="fas fa-receipt"></i> },
        { id: "issue-money", label: "Issue Money", icon: <i className="fas fa-hand-holding-usd"></i> },
        { id: "issue-check", label: "Issue Cheque", icon: <i className="fas fa-money-check-alt"></i> },
        { id: "override-transactions", label: "Override Transactions", icon: <i className="fas fa-exchange-alt"></i> },
        { id: "transaction-management", label: "Transaction Management", icon: <i className="fas fa-cogs"></i> }
      ]
    },
    {
      title: "Accounts",
      items: [
        { id: "recipient-account", label: "Recipient Account", icon: <i className="fas fa-address-book"></i> },
        { id: "funds-accounts", label: "Funds Accounts", icon: <i className="fas fa-university"></i> }
      ]
    },
    {
      title: "Reports",
      items: [
        { id: "generate-reports", label: "Generate Reports", icon: <i className="fas fa-chart-bar"></i> }
      ]
    }
  ];

  return (
    <div className="sidebar-content">
      {/* Header */}
      

      {/* Dashboard - Special Item */}
      <div className="sidebar-dashboard">
        <button
          className={`sidebar-item dashboard-item ${
            activeTab === "dashboard" ? "active" : ""
          }`}
          onClick={() => setActiveTab("dashboard")}
        >
          <span className="sidebar-icon"><i className="fas fa-tachometer-alt"></i></span>
          <span className="sidebar-label">Dashboard</span>
        </button>
      </div>

      {/* Menu Sections */}
      <nav className="sidebar-nav">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="menu-section">
            <button 
              className="section-header"
              onClick={() => toggleSection(section.title)}
            >
              <h3 className="section-title">{section.title}</h3>
              <i className={`fas fa-chevron-${expandedSections[section.title] ? 'down' : 'right'} section-arrow`}></i>
            </button>
            <div className={`section-content ${expandedSections[section.title] ? 'expanded' : 'collapsed'}`}>
              <ul className="sidebar-menu">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <button
                      className={`sidebar-item ${
                        activeTab === item.id ? "active" : ""
                      }`}
                      onClick={() => setActiveTab(item.id)}
                    >
                      <span className="sidebar-icon">{item.icon}</span>
                      <span className="sidebar-label">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </nav>

      {/* View All Transactions - Special Item */}
      <div className="sidebar-footer">
        <button
          className={`sidebar-item footer-item ${
            activeTab === "view-transactions" ? "active" : ""
          }`}
          onClick={() => setActiveTab("view-transactions")}
        >
          <span className="sidebar-icon"><i className="fas fa-list"></i></span>
          <span className="sidebar-label">View All Transactions</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
