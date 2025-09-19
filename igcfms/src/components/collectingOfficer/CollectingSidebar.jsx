import React from 'react';

const CollectingSidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <i className="fas fa-tachometer-alt"></i> },
    { id: 'receive-money', label: 'Receive Money', icon: <i className="fas fa-money-bill-wave"></i>  },
    { id: 'issue-receipt', label: 'Issue Receipt', icon: <i className="fas fa-receipt"></i>  },
    { id: 'view-transactions', label: 'View Transactions', icon: '' },
    { id: 'daily-summary', label: 'Daily Summary', icon: '' }
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

export default CollectingSidebar;