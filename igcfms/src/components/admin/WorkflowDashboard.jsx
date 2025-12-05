import React, { useState, useEffect } from 'react';
import notificationService from '../../services/notificationService';
import balanceService from '../../services/balanceService';
import './css/WorkflowDashboard.css';

const WorkflowDashboard = () => {
  const [systemStats, setSystemStats] = useState({
    totalFunds: 0,
    totalBalance: 0,
    todayTransactions: 0,
    activeRecipients: 0,
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);

  const userRole = localStorage.getItem('userRole') || 'Admin';

  useEffect(() => {
    loadSystemStats();
    
    // Listen for balance updates
    const handleBalanceUpdate = ({ fundAccountId, newBalance, oldBalance }) => {
      setSystemStats(prev => ({
        ...prev,
        totalBalance: prev.totalBalance + (newBalance - oldBalance)
      }));
    };

    balanceService.addBalanceListener(handleBalanceUpdate);

    return () => {
      balanceService.removeBalanceListener(handleBalanceUpdate);
    };
  }, []);

  const loadSystemStats = async () => {
    try {
      setLoading(true);
      
      // Get all fund balances
      const balances = await balanceService.getAllFundBalances();
      const totalBalance = Object.values(balances).reduce((sum, balance) => sum + parseFloat(balance || 0), 0);
      
      setSystemStats({
        totalFunds: Object.keys(balances).length,
        totalBalance: totalBalance,
        todayTransactions: Math.floor(Math.random() * 50) + 10, // Mock data
        activeRecipients: Math.floor(Math.random() * 25) + 5, // Mock data
        recentActivities: notificationService.getNotifications().slice(0, 5)
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const workflowSteps = [
    {
      id: 1,
      title: "Fund Accounts",
      description: "Create and manage fund accounts with balance tracking",
      roles: ["Admin", "Cashier"],
      icon: "fas fa-university",
      color: "#667eea",
      status: "active"
    },
    {
      id: 2,
      title: "Recipient Accounts",
      description: "Create recipient accounts linked to funds",
      roles: ["Disbursing Officer"],
      icon: "fas fa-users",
      color: "#764ba2",
      status: "active"
    },
    {
      id: 3,
      title: "Collection",
      description: "Record incoming money and update fund balances",
      roles: ["Collecting Officer"],
      icon: "fas fa-money-bill-wave",
      color: "#28a745",
      status: "active"
    },
    {
      id: 4,
      title: "Issue Receipt",
      description: "Generate official receipts for collections",
      roles: ["Collecting Officer"],
      icon: "fas fa-receipt",
      color: "#17a2b8",
      status: "active"
    },
    {
      id: 5,
      title: "Disburse",
      description: "Disburse funds to recipients",
      roles: ["Disbursing Officer"],
      icon: "fas fa-hand-holding-usd",
      color: "#fd7e14",
      status: "active"
    },
    {
      id: 6,
      title: "Issue Cheque",
      description: "Issue cheques with tracking",
      roles: ["Disbursing Officer"],
      icon: "fas fa-money-check",
      color: "#6f42c1",
      status: "active"
    },
    {
      id: 7,
      title: "View Transactions",
      description: "Monitor all system transactions",
      roles: ["Cashier", "Admin"],
      icon: "fas fa-list-alt",
      color: "#20c997",
      status: "active"
    },
    {
      id: 8,
      title: "Override Transactions",
      description: "Correct or reverse transactions",
      roles: ["Admin"],
      icon: "fas fa-edit",
      color: "#dc3545",
      status: "admin-only"
    },
    {
      id: 9,
      title: "Generate Reports",
      description: "Create financial reports",
      roles: ["Cashier", "Admin"],
      icon: "fas fa-chart-bar",
      color: "#ffc107",
      status: "active"
    },
    {
      id: 10,
      title: "Manage Staff",
      description: "User and role management",
      roles: ["Admin"],
      icon: "fas fa-users-cog",
      color: "#6c757d",
      status: "admin-only"
    }
  ];

  const getRoleColor = (roles) => {
    if (roles.includes("Admin")) return "#dc3545";
    if (roles.includes("Cashier")) return "#28a745";
    if (roles.includes("Collecting Officer")) return "#17a2b8";
    if (roles.includes("Disbursing Officer")) return "#fd7e14";
    return "#6c757d";
  };

  const canAccessStep = (step) => {
    return step.roles.includes(userRole);
  };

  if (loading) {
    return (
      <div className="workflow-loading">
        <div className="spinner"></div>
        <p>Loading workflow dashboard...</p>
      </div>
    );
  }

  return (
    <div className="workflow-dashboard">
      {/* Header */}
      <div className="workflow-header">
        <div className="header-content">
          <h1 className="workflow-title">
            <i className="fas fa-sitemap"></i>
            IGCFMS Workflow Dashboard
          </h1>
          <p className="workflow-subtitle">
            Role-based financial management system workflow
          </p>
        </div>
        <div className="user-role-badge">
          <i className="fas fa-user"></i>
          {userRole}
        </div>
      </div>

      {/* System Stats */}
      <div className="system-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#667eea' }}>
            <i className="fas fa-university"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{systemStats.totalFunds}</div>
            <div className="stat-label">Fund Accounts</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#28a745' }}>
            <i className="fas fa-peso-sign"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">₱{systemStats.totalBalance.toLocaleString()}</div>
            <div className="stat-label">Total Balance</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#17a2b8' }}>
            <i className="fas fa-exchange-alt"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{systemStats.todayTransactions}</div>
            <div className="stat-label">Today's Transactions</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fd7e14' }}>
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{systemStats.activeRecipients}</div>
            <div className="stat-label">Active Recipients</div>
          </div>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="workflow-section">
        <h2 className="section-title">
          <i className="fas fa-route"></i>
          System Workflow
        </h2>
        <div className="workflow-grid">
          {workflowSteps.map((step, index) => (
            <div 
              key={step.id}
              className={`workflow-step ${canAccessStep(step) ? 'accessible' : 'restricted'} ${step.status}`}
            >
              <div className="step-number">{step.id}</div>
              <div className="step-icon" style={{ color: step.color }}>
                <i className={step.icon}></i>
              </div>
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
                <div className="step-roles">
                  {step.roles.map(role => (
                    <span 
                      key={role}
                      className="role-tag"
                      style={{ 
                        background: getRoleColor([role]),
                        opacity: canAccessStep(step) ? 1 : 0.5
                      }}
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
              {!canAccessStep(step) && (
                <div className="access-overlay">
                  <i className="fas fa-lock"></i>
                  <span>Access Restricted</span>
                </div>
              )}
              {index < workflowSteps.length - 1 && (
                <div className="workflow-arrow">
                  <i className="fas fa-arrow-down"></i>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="recent-activities">
        <h2 className="section-title">
          <i className="fas fa-clock"></i>
          Recent System Activities
        </h2>
        <div className="activities-list">
          {systemStats.recentActivities.length === 0 ? (
            <div className="no-activities">
              <i className="fas fa-inbox"></i>
              <p>No recent activities</p>
            </div>
          ) : (
            systemStats.recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  <i className={activity.type === 'success' ? 'fas fa-check-circle' : 
                              activity.type === 'warning' ? 'fas fa-exclamation-triangle' :
                              activity.type === 'error' ? 'fas fa-times-circle' : 'fas fa-info-circle'}></i>
                </div>
                <div className="activity-content">
                  <div className="activity-title">{activity.title}</div>
                  <div className="activity-message">{activity.message}</div>
                  <div className="activity-time">
                    {new Date(activity.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowDashboard;
