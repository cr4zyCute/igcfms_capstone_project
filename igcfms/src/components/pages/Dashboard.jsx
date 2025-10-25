import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../common/Navbar';
import NotificationBell from '../common/NotificationBell';
import AdminDashboard from '../admin/AdminDashboard';
import CashierDashboard from '../cashier/CashierDashboard';
import CollectingDashboard from '../collectingOfficer/CollectiingDashboard';
import DisbursingODashboard from '../disbursingOfficer/DisbursementDashboard';
import Sidebar from '../common/Sidebar';
import Loading from './Loading';
import '../pages/css/Dashboard.css';
  
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

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTabState] = useState(() => {
    // Get the saved active tab from localStorage, default to 'dashboard'
    return localStorage.getItem('igcfms_activeTab') || 'dashboard';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Wrapper function to save to localStorage when tab changes
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    localStorage.setItem('igcfms_activeTab', tab);
  };

  if (loading) {
    return <Loading message="Checking authentication..." />;
  }
  
  if (!user) {
    return (
      <div className="dashboard-page">
        <Navbar userRole={null} user={null} />
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
        <Navbar userRole={userRole} user={user} onNavigate={setActiveTab} />
        <AccessDenied role={userRole} />
      </div>
    );
  }
  
  return (
    <div className="dashboard-page">
      <Navbar 
        userRole={userRole} 
        user={user} 
        onNavigate={setActiveTab}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onCollapseChange={setIsSidebarCollapsed}
      />

      <main className={`dashboard-main ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <SelectedDashboard user={user} activeTab={activeTab} />
      </main>
    </div>
  );
};

export default Dashboard;