import React from 'react';
import { SkeletonLine, SkeletonCircle } from './LoadingSkeleton';
import '../admin/css/admindashboardhome.css';

const AdminDashboardHomeSkeleton = () => {
  const dashboardCards = [
    { id: 1, color: 'card-1' },
    { id: 2, color: 'card-2' },
    { id: 3, color: 'card-3' },
    { id: 4, color: 'card-4' },
    { id: 5, color: 'card-5' },
    { id: 6, color: 'card-6' },
    { id: 7, color: 'card-7' },
    { id: 8, color: 'card-8' },
    { id: 9, color: 'card-9' }
  ];

  const renderCardContent = (cardId) => {
    switch (cardId) {
      // Card 1: Today's Collection
      case 1:
        return (
          <div className="box1-content">
            <div className="box1-header">
              <SkeletonLine width="100px" height={13} />
              <SkeletonLine width="30px" height={16} />
            </div>
            <div className="box1-amount-section">
              <SkeletonLine width="15px" height={20} />
              <SkeletonLine width="120px" height={20} />
            </div>
            <div className="box1-footer">
              <SkeletonLine width="80px" height={9} />
            </div>
          </div>
        );
      
      // Card 2: Today's Disburse
      case 2:
        return (
          <div className="box2-content">
            <div className="box2-header">
              <SkeletonLine width="100px" height={13} />
              <SkeletonLine width="30px" height={16} />
            </div>
            <div className="box2-amount-section">
              <SkeletonLine width="15px" height={20} />
              <SkeletonLine width="120px" height={20} />
            </div>
            <div className="box2-footer">
              <SkeletonLine width="80px" height={9} />
            </div>
          </div>
        );
      
      // Card 3: Trends Analysis
      case 3:
        return (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '8px' }}>
              <div>
                <SkeletonLine width="140px" height={12} style={{ marginBottom: '4px' }} />
                <SkeletonLine width="100px" height={20} />
              </div>
              <div>
                <SkeletonLine width="140px" height={12} style={{ marginBottom: '4px' }} />
                <SkeletonLine width="100px" height={20} />
              </div>
            </div>
            <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden' }}>
              <SkeletonLine height="100%" />
            </div>
          </div>
        );
      
      // Card 4: Override Request
      case 4:
        return (
          <div className="box4-content">
            <h3 className="box4-title">
              <SkeletonLine width="100px" height={12} style={{ margin: '0 auto' }} />
            </h3>
            <div className="box4-stats">
              <div className="box4-stat-item">
                <SkeletonLine width="50px" height={10} style={{ margin: '0 auto 4px' }} />
                <SkeletonLine width="40px" height={20} style={{ margin: '0 auto' }} />
              </div>
              <div className="box4-divider"></div>
              <div className="box4-stat-item">
                <SkeletonLine width="50px" height={10} style={{ margin: '0 auto 4px' }} />
                <SkeletonLine width="40px" height={20} style={{ margin: '0 auto' }} />
              </div>
              <div className="box4-divider"></div>
              <div className="box4-stat-item">
                <SkeletonLine width="50px" height={10} style={{ margin: '0 auto 4px' }} />
                <SkeletonLine width="40px" height={20} style={{ margin: '0 auto' }} />
              </div>
            </div>
          </div>
        );
      
      // Card 5: Cheques and Receipts
      case 5:
        return (
          <div className="box5-content">
            <div className="box5-stats">
              <div className="box5-stat-item">
                <SkeletonLine width="70px" height={10} style={{ margin: '0 auto 4px' }} />
                <SkeletonLine width="50px" height={20} style={{ margin: '0 auto' }} />
              </div>
              <div className="box5-divider"></div>
              <div className="box5-stat-item">
                <SkeletonLine width="70px" height={10} style={{ margin: '0 auto 4px' }} />
                <SkeletonLine width="50px" height={20} style={{ margin: '0 auto' }} />
              </div>
            </div>
          </div>
        );
      
      // Card 6: Recent Transactions
      case 6:
        return (
          <div className="box6-content">
            <div className="box6-header">
              <div className="box6-title-wrapper">
                <SkeletonCircle size={18} />
                <SkeletonLine width="150px" height={13} />
              </div>
            </div>
            <div className="box6-table-wrapper">
              <table className="box6-table">
                <thead>
                  <tr>
                    {['ID', 'DATE', 'TYPE', 'AMOUNT', 'CREATOR BY'].map((header) => (
                      <th key={header}>
                        <SkeletonLine width="50px" height={11} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx}>
                      <td><SkeletonLine width="40px" height={11} /></td>
                      <td><SkeletonLine width="60px" height={11} /></td>
                      <td><SkeletonLine width="70px" height={11} /></td>
                      <td><SkeletonLine width="60px" height={11} /></td>
                      <td>
                        <div className="creator-info">
                          <SkeletonLine width="80px" height={12} />
                          <SkeletonLine width="60px" height={10} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      // Card 7: Top 4 Funded Accounts
      case 7:
        return (
          <div className="box7-content">
            <div className="box7-header">
              <SkeletonLine width="140px" height={11} />
            </div>
            <div className="box7-accounts-grid">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="box7-account-card">
                  <SkeletonCircle size={32} />
                  <div className="box7-account-info">
                    <SkeletonLine width="80px" height={11} />
                    <SkeletonLine width="100px" height={14} />
                    <SkeletonLine width="70px" height={10} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      // Card 8: Activity by Role
      case 8:
        return (
          <div className="box8-content">
            <div className="box8-header">
              <SkeletonCircle size={18} />
              <SkeletonLine width="120px" height={12} />
            </div>
            <div className="box8-roles-list">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="box8-role-item">
                  <SkeletonLine width="70px" height={10} />
                  <div className="box8-bar-container">
                    <SkeletonLine height="100%" style={{ borderRadius: '0' }} />
                  </div>
                  <SkeletonLine width="25px" height={10} />
                </div>
              ))}
            </div>
            <div className="box8-summary">
              <div className="box8-summary-item">
                <SkeletonLine width="90px" height={8} style={{ margin: '0 auto 3px' }} />
                <SkeletonLine width="40px" height={11} style={{ margin: '0 auto' }} />
              </div>
              <div className="box8-summary-divider"></div>
              <div className="box8-summary-item">
                <SkeletonLine width="90px" height={8} style={{ margin: '0 auto 3px' }} />
                <SkeletonLine width="50px" height={11} style={{ margin: '0 auto' }} />
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="admin-dashboard-home">
      <div className="dashboard-grid">
        {dashboardCards.map((card) => (
          <div
            key={card.id}
            className={`dashboard-card ${card.color} skeleton-card`}
          >
            {renderCardContent(card.id)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboardHomeSkeleton;
