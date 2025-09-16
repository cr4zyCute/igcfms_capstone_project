import React from 'react';

const CashierDashboard = ({ user }) => {
  return (
    <div className="dashboard-content">
      <h1>Cashier Dashboard</h1>
      <p>Welcome, {user?.email}</p>
      <div className="stats">
        <div className="stat-card">Today's Transactions: 15</div>
        <div className="stat-card">Total Cash: ₱5,230</div>
      </div>
    </div>
  );
};

export default CashierDashboard;