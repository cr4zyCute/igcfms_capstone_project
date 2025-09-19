import React from 'react';

const CashierSidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard',icon: <i className="fas fa-tachometer-alt"></i> },
    { id: 'view-transactions', label: 'View All Transactions', icon: <i className="fas fa-list"></i> },
    { id: 'funds-accounts', label: 'Funds Accounts', icon: <i className="fas fa-university"></i> },
    { id: 'generate-reports', label: 'Generate Reports', icon: <i className="fas fa-chart-line"></i> },
    { id: 'override-transactions', label: 'Override Transactions',icon: <i className="fas fa-exchange-alt"></i> },
  ];

  return (
    <div className="sidebar-content">
       <nav className="sidebar-nav">
        {menuItems.map(item => (
          <li key={item.id}>
            <button
              className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          </li>
        ))}
      </nav>
    </div>
  );
};

export default CashierSidebar;
