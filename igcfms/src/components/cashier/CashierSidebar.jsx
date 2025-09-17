import React from 'react';

const CashierSidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'view-transactions', label: 'View All Transactions' },
    { id: 'funds-accounts', label: 'Funds Accounts' },
    { id: 'generate-reports', label: 'Generate Reports' },
    { id: 'override-transactions', label: 'Override Transactions' },
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
              <span className="sidebar-label">{item.label}</span>
            </button>
          </li>
        ))}
      </nav>
    </div>
  );
};

export default CashierSidebar;
