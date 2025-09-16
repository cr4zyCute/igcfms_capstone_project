import React from 'react';

const AdminDashboard = ({ user }) => {
  return (
    <div className="dashboard-content">
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user?.email}</p>
      <div className="stats">
        <div className="stat-card">Total Users: 42</div>
        <div className="stat-card">System Status: Active</div>
      </div>
    </div>
  );
};

export default AdminDashboard;