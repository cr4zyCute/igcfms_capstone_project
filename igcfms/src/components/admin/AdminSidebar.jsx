import React from "react";


const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "" },
    { id: "receive-money", label: "Receive Money", icon: "" },
    { id: "issue-receipt", label: "Issue-Receipt", icon: "" },
    { id: "issue-money", label: "Issue Money", icon: "" },
    { id: "issue-check", label: "Issue Check", icon: "" },
    { id: "view-transactions", label: "View All Transactions", icon: "" },
    { id: "funds-accounts", label: "Funds Accounts", icon: "" },
    { id: "generate-reports", label: "Generate Reports", icon: "" },
    { id: "override-transactions", label: "Override Transactions", icon: "" },
    { id: "manage-staff", label: "Manage Staff", icon: "" },
  ];

  return (
    <div className="sidebar-content">
      <nav className="sidebar-nav">
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
