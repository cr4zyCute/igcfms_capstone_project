import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminSidebar from '../admin/AdminSidebar';
import CashierSidebar from '../cashier/CashierSidebar';
import CollectingSidebar from '../collectingOfficer/CollectingSidebar';
import DisbursingSidebar from '../disbursingOfficer/DisbursingSidebar';
import '../common/css/Sidebar.css';


const Sidebar = ({ isOpen, onClose, activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container" onClick={() => setIsCollapsed(!isCollapsed)}>
            <div className="logo-circle">
              <i className="fas fa-university"></i>
            </div>
            {!isCollapsed && <h2 className="system-title">IGCFMS</h2>}
          </div>
          <button
            className="collapse-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <i className={`fas fa-${isCollapsed ? 'angle-double-right' : 'angle-double-left'}`}></i>
          </button>
        </div>
        <div className="sidebar-content-wrapper">
          {renderSidebarContent()}
        </div>
      </div>
    </>
  );
};

export default Sidebar;