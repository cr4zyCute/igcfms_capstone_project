// import React from 'react';

// const Dashboard = () => {
//   return (
//     <div className="dashboard">
//       <h2>Dashboard</h2>
//       <p>Welcome to your dashboard! This page is under construction.</p>
//       <p>User role: {localStorage.getItem('userRole')}</p>
//     </div>
//   );
// };

// export default Dashboard;


// src/pages/Dashboard.jsx
import React from 'react';
import './css/Dashboard.css';

const Dashboard = ({ userRole }) => {
  // Sample data based on role
  const getDashboardData = (role) => {
    const data = {
      admin: {
        title: "Admin Dashboard",
        stats: [
          { title: 'Total Staff', value: '45', change: '+5%' },
          { title: 'Revenue', value: '₱125,000', change: '+12%' },
          { title: 'Active Users', value: '234', change: '+8%' },
          { title: 'System Health', value: '98%', change: '0%' }
        ]
      },
      cashier: {
        title: "Cashier Dashboard",
        stats: [
          { title: 'Today\'s Sales', value: '₱15,250', change: '+8%' },
          { title: 'Transactions', value: '45', change: '+12%' },
          { title: 'Pending', value: '3', change: '-2' },
          { title: 'Cash Flow', value: '₱12,800', change: '+5%' }
        ]
      },
      // Add other roles...
    };
    return data[role] || data.admin;
  };

  const dashboardData = getDashboardData(userRole);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{dashboardData.title}</h1>
        <p>Welcome back! Here's your overview for today.</p>
      </div>

      <div className="stats-grid">
        {dashboardData.stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-content">
              <h3 className="stat-value">{stat.value}</h3>
              <p className="stat-title">{stat.title}</p>
              {stat.change && (
                <span className="stat-change">
                  {stat.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-content">
        <div className="content-card">
          <h3>Recent Activity</h3>
          <p>Your recent activities will be shown here...</p>
        </div>
        
        <div className="content-card">
          <h3>Quick Actions</h3>
          <p>Role-specific quick actions will appear here...</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;