import React from 'react';

const DisbursingSidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <i className="fas fa-tachometer-alt"></i> },
    { id: 'issue-money', label: 'Issue Money', icon: <i className="fas fa-hand-holding-usd"></i> },
    { id: 'issue-cheque', label: 'Issue Cheque', icon: <i className="fas fa-receipt"></i> },
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

export default DisbursingSidebar;