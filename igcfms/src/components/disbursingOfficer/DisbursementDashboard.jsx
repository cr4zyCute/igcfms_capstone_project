import React from 'react';

const DisbursementDashboard = ({ user }) => {
  return (
    <div className="dashboard-content">
      <h1>Disbursement Dashboard</h1>
      <p>Welcome, {user?.email}</p>
      <div className="stats">
        <div className="stat-card">Disbursements Today: ₱8,720</div>
        <div className="stat-card">Cheques Issued: 12</div>
      </div>
    </div>
  );
};

export default DisbursementDashboard;