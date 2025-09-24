import React from 'react';
import './css/cashiersidebar.css';

const CashierSidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'view-transactions', label: 'View All Transactions', icon: <i className="fas fa-list"></i> },
    { id: 'funds-accounts', label: 'Funds Accounts', icon: <i className="fas fa-university"></i> },
    { id: 'generate-reports', label: 'Generate Reports', icon: <i className="fas fa-chart-line"></i> },
    { id: 'override-transactions', label: 'Override Transactions', icon: <i className="fas fa-exchange-alt"></i> },
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

      {/* Menu Items */}
      <nav className="cashier-sidebar-nav">
        <ul className="cashier-sidebar-menu">
          {menuItems.map(item => (
            <li key={item.id}>
              <button
                className={`cashier-sidebar-item menu-item ${
                  activeTab === item.id ? 'active' : ''
                }`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="cashier-item-icon">{item.icon}</span>
                <span className="cashier-item-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default CashierSidebar;
