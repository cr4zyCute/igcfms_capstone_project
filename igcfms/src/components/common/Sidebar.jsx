import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminSidebar from '../admin/AdminSidebar';
import CashierSidebar from '../cashier/CashierSidebar';
import CollectingSidebar from '../collectingOfficer/CollectingSidebar';
import DisbursingSidebar from '../disbursingOfficer/DisbursingSidebar';
import '../common/css/Sidebar.css';


const Sidebar = ({ isOpen, onClose, activeTab, setActiveTab }) => {
  const { user } = useAuth();

  const renderSidebarContent = () => {
    switch (user?.role) {
      case 'Admin':
        return <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />;
      case 'Cashier':
        return <CashierSidebar activeTab={activeTab} setActiveTab={setActiveTab} />;
      case 'Collecting Officer':
        return <CollectingSidebar activeTab={activeTab} setActiveTab={setActiveTab} />;
      case 'Disbursing Officer':
        return <DisbursingSidebar activeTab={activeTab} setActiveTab={setActiveTab} />;
      default:
        return null;
    }
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-circle">
              <i className="fas fa-university"></i>
            </div>
            <h2 className="system-title">IGCFMS</h2>
          </div>
        </div>
        {renderSidebarContent()}
      </div>
    </>
  );
};

export default Sidebar;