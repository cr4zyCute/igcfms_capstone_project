import React from 'react';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <p>Welcome to your dashboard! This page is under construction.</p>
      <p>User role: {localStorage.getItem('userRole')}</p>
    </div>
  );
};

export default Dashboard;