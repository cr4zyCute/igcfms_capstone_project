import React, { useState } from "react";
import './css/cashiersidebar.css';

const CashierSidebar = ({ activeTab, setActiveTab }) => {
  const [expandedSections, setExpandedSections] = useState({
    "Transaction": true,
    "Accounts": true,
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
        { id: "override-transactions", label: "Override Transactions", icon: <i className="fas fa-exchange-alt"></i> }
      ]
    },
    {
      title: "Accounts",
      icon: "fas fa-folder",
      items: [
        { id: "recipient-account", label: "Recipient Account", icon: <i className="fas fa-address-book"></i> },
        { id: "funds-accounts", label: "Funds Accounts", icon: <i className="fas fa-university"></i> }
      ]
    },
    {
      title: "Reports",
      icon: "fas fa-chart-bar",
      items: [
        { id: "generate-reports", label: "Generate Reports", icon: <i className="fas fa-chart-line"></i> }
      ]
    },
    {
      title: "Management",
      icon: "fas fa-cogs",
      items: [
        { id: "view-transactions", label: "View All Transactions", icon: <i className="fas fa-list"></i> }
      ]
    }
  ];

  return (
    <div className="cashier-sidebar-content">
      {/* Dashboard - Special Item */}
      <div className="cashier-dashboard-section">
        <button
          className={`cashier-sidebar-item dashboard-item ${
            activeTab === "dashboard" ? "active" : ""
          }`}
          onClick={() => setActiveTab("dashboard")}
        >
          <i className="fas fa-tachometer-alt cashier-item-icon"></i>
          <span className="cashier-item-label">Dashboard</span>
        </button>
      </div>

      {/* Menu Sections */}
      <nav className="cashier-sidebar-nav">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="cashier-menu-section">
            <button 
              className="cashier-section-header"
              onClick={() => toggleSection(section.title)}
            >
              <div className="cashier-section-left">
                <span className="cashier-section-icon"><i className={section.icon}></i></span>
                <span className="cashier-section-title">{section.title}</span>
              </div>
              <div className="cashier-section-right">
                <i className={`fas fa-chevron-${expandedSections[section.title] ? 'down' : 'right'} cashier-section-arrow`}></i>
              </div>
            </button>
            <div className={`cashier-section-content ${expandedSections[section.title] ? 'expanded' : 'collapsed'}`}>
              <ul className="cashier-sidebar-menu">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <button
                      className={`cashier-sidebar-item submenu-item ${
                        activeTab === item.id ? "active" : ""
                      }`}
                      onClick={() => setActiveTab(item.id)}
                    >
                      <span className="cashier-item-icon">{item.icon}</span>
                      <span className="cashier-item-label">{item.label}</span>
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

export default CashierSidebar;
