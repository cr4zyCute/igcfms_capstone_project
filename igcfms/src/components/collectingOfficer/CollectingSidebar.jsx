import React, { useState } from "react";
import './css/collectingsidebar.css';

const CollectingSidebar = ({ activeTab, setActiveTab }) => {
  const [expandedSections, setExpandedSections] = useState({
    "Transaction": true,
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
      title: "Transaction",
      icon: "fas fa-exchange-alt",
      items: [
        { id: "receive-money", label: "Collection", icon: <i className="fas fa-money-bill-wave"></i> },
        { id: "issue-receipt", label: "Issue Receipt", icon: <i className="fas fa-receipt"></i> },
        { id: "view-transactions", label: "View Transactions", icon: <i className="fas fa-list"></i> }
      ]
    },
    {
      title: "Reports",
      icon: "fas fa-chart-bar",
      items: [
        { id: "generate-reports", label: "Generate Reports", icon: <i className="fas fa-chart-line"></i> },
        { id: "daily-summary", label: "Daily Summary", icon: <i className="fas fa-calendar-day"></i> }
      ]
    }
  ];

  return (
    <div className="collecting-sidebar-content">
      {/* Dashboard - Special Item */}
      <div className="collecting-dashboard-section">
        <button
          className={`collecting-sidebar-item dashboard-item ${
            activeTab === "dashboard" ? "active" : ""
          }`}
          onClick={() => setActiveTab("dashboard")}
        >
          <i className="fas fa-tachometer-alt collecting-item-icon"></i>
          <span className="collecting-item-label">Dashboard</span>
        </button>
      </div>

      {/* Menu Sections */}
      <nav className="collecting-sidebar-nav">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="collecting-menu-section">
            <button 
              className="collecting-section-header"
              onClick={() => toggleSection(section.title)}
            >
              <div className="collecting-section-left">
                <span className="collecting-section-icon"><i className={section.icon}></i></span>
                <span className="collecting-section-title">{section.title}</span>
              </div>
              <div className="collecting-section-right">
                <i className={`fas fa-chevron-${expandedSections[section.title] ? 'down' : 'right'} collecting-section-arrow`}></i>
              </div>
            </button>
            <div className={`collecting-section-content ${expandedSections[section.title] ? 'expanded' : 'collapsed'}`}>
              <ul className="collecting-sidebar-menu">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <button
                      className={`collecting-sidebar-item submenu-item ${
                        activeTab === item.id ? "active" : ""
                      }`}
                      onClick={() => setActiveTab(item.id)}
                    >
                      <span className="collecting-item-icon">{item.icon}</span>
                      <span className="collecting-item-label">{item.label}</span>
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

export default CollectingSidebar;