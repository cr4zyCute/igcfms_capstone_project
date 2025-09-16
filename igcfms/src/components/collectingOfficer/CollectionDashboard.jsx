import React from 'react';

const CollectionDashboard = ({ user }) => {
  return (
    <div className="dashboard-content">
      <h1>Collection Dashboard</h1>
      <p>Welcome, {user?.email}</p>
      <div className="stats">
        <div className="stat-card">Collections Today: ₱12,450</div>
        <div className="stat-card">Receipts Issued: 28</div>
      </div>
    </div>
  );
};

export default CollectionDashboard;