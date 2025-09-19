import React from "react";
import NotificationBell from '../common/NotificationBell';

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <i className="fas fa-tachometer-alt"></i> },
    { id: "receive-money", label: "Receive Money", icon: <i className="fas fa-money-bill-wave"></i> },
    { id: "issue-receipt", label: "Issue-Receipt",  icon: <i className="fas fa-receipt"></i> },
    { id: "issue-money", label: "Issue Money", icon: <i className="fas fa-hand-holding-usd"></i>},
    { id: "issue-check", label: "Issue Check", icon: <i className="fas fa-money-check-alt"></i> },
    { id: "view-transactions", label: "View All Transactions", icon: <i className="fas fa-list"></i> },
    { id: "funds-accounts", label: "Funds Accounts", icon: <i className="fas fa-university"></i> },
    { id: "generate-reports", label: "Generate Reports", icon: <i className="fas fa-chart-line"></i> },
    { id: "override-transactions", label: "Override Transactions", icon: <i className="fas fa-exchange-alt"></i> },
    { id: "manage-staff", label: "Manage Staff", icon: <i className="fas fa-user-cog"></i> },
  ];

  return (
    <div className="sidebar-content">
      <nav className="sidebar-nav">
        <NotificationBell />
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
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
      </nav>
    </div>
  );
};

export default AdminSidebar;
