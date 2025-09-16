// import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../common/Navbar';
import AdminDashboard from '../admin/AdminDashboard';
import CashierDashboard from '../cashier/CashierDashboard';
import CollectingDashboard from '../collectingOfficer/CollectionDashboard';
import DisbursingODashboard from '../disbursingOfficer/DisbursementDashboard';
import Loading from './Loading';

const AccessDenied = ({ role }) => (
  <div className="access-denied">
    <h2>Access Denied</h2>
    <p>Invalid user role: {role}</p>
  </div>
);

const LoginPrompt = () => (
  <div className="login-prompt">
    <h2>Please log in</h2>
    <p>You need to be logged in to access the dashboard.</p>
  </div>
);

const Dashboard = ({ onToggleSidebar }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Loading message="Checking authentication..." />;
  }
  
  if (!user) {
    return (
      <div className="dashboard-page">
        <Navbar userRole={null} user={null} onToggleSidebar={onToggleSidebar}/>
        <LoginPrompt />
      </div>
    );
  }
  
  const userRole = user?.role;
  
  const roleComponentMap = {
    'Admin': AdminDashboard,
    'Cashier': CashierDashboard,
    'Collecting Officer': CollectingDashboard,
    'Disbursing Officer': DisbursingODashboard,
  };
  
  const SelectedDashboard = roleComponentMap[userRole];
  
  if (!SelectedDashboard) {
    return (
      <div className="dashboard-page">
        <Navbar userRole={userRole} user={user} onToggleSidebar={onToggleSidebar}/>
        <AccessDenied role={userRole} />
      </div>
    );
  }
  
  return (
    <div className="dashboard-page">
      <Navbar userRole={userRole} user={user} onToggleSidebar={onToggleSidebar}/>
      <SelectedDashboard user={user} />
    </div>
  );
};

export default Dashboard;