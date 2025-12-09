import React from 'react';
import { SkeletonLine, SkeletonCircle } from './LoadingSkeleton';

const ActivityDashboardLoading = () => {
  const tableHeadCells = ['ID', 'TYPE', 'DESCRIPTION', 'USER', 'PRIORITY', 'TIME', 'IP'];
  const tableRowCount = 8;

  return (
    <div className="activity-dashboard skeleton-activity-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header skeleton-card" style={{ 
        padding: '20px', 
        marginBottom: '12px',
        background: '#f9fafb',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '2px solid #000000'
      }}>
        <div>
          <SkeletonLine width="280px" height={32} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <SkeletonLine width="180px" height={40} />
          <SkeletonLine width="120px" height={40} />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid" style={{ gap: '8px', marginBottom: '12px' }}>
        {[0, 1, 2, 3, 4].map((item) => (
          <div className="stat-card skeleton-card" key={`stat-${item}`} style={{ 
            padding: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '10px',
            border: '1px solid #d6d6d6'
          }}>
            <div className="ad-stat-icon" style={{ width: '40px', height: '40px', borderRadius: '8px' }}>
              <SkeletonCircle size={40} />
            </div>
            <div className="stat-content" style={{ flex: 1, width: '100%', textAlign: 'center' }}>
              <div className="stat-value" style={{ marginBottom: '8px' }}>
                <SkeletonLine width="80%" height={24} style={{ margin: '0 auto' }} />
              </div>
              <div className="stat-label">
                <SkeletonLine width="70%" height={12} style={{ margin: '0 auto' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity by Role Chart Section */}
      <div className="chart-section skeleton-card" style={{ 
        padding: '20px', 
        marginBottom: '12px',
        background: '#ffffff',
        border: '1px solid #d6d6d6',
        borderRadius: '10px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', display: 'block' }}>
          <SkeletonLine width="200px" height={20} />
        </h3>
        <div className="role-chart" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[0, 1, 2, 3].map((item) => (
            <div className="role-item" key={`role-${item}`} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="role-name" style={{ minWidth: '100px' }}>
                <SkeletonLine width="100px" height={16} />
              </div>
              <div className="role-bar" style={{ flex: 1, height: '6px', background: '#e8e8e8', borderRadius: '3px', overflow: 'hidden' }}>
                <SkeletonLine height="100%" style={{ borderRadius: '0' }} />
              </div>
              <div className="role-count" style={{ minWidth: '35px' }}>
                <SkeletonLine width="35px" height={16} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className="activities-section skeleton-card" style={{ 
        padding: '0', 
        marginBottom: '12px',
        background: '#ffffff',
        border: '1px solid #d6d6d6',
        borderRadius: '10px',
        overflow: 'hidden'
      }}>
        <div className="section-header" style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f2f2f2'
        }}>
          <h3 style={{ margin: '0', display: 'block' }}>
            <SkeletonLine width="220px" height={20} />
          </h3>
          <span className="activity-count" style={{ display: 'block' }}>
            <SkeletonLine width="120px" height={16} />
          </span>
        </div>

        {/* Activities Table */}
        <div className="activities-table-container">
          <table className="activities-table skeleton-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #e9ecef' }}>
                {tableHeadCells.map((cell) => (
                  <th key={`head-${cell}`} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '12px' }}>
                    <SkeletonLine width="80%" height={16} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: tableRowCount }).map((_, rowIndex) => (
                <tr key={`row-${rowIndex}`} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  {tableHeadCells.map((cell, cellIndex) => (
                    <td key={`cell-${rowIndex}-${cellIndex}`} style={{ padding: '12px 16px', color: '#333' }}>
                      <div className="cell-content" style={{ display: 'flex', alignItems: 'center' }}>
                        {cellIndex === 3 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <SkeletonLine width="120px" height={16} />
                            <SkeletonLine width="80px" height={12} />
                          </div>
                        ) : cellIndex === 1 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <SkeletonCircle size={26} />
                            <SkeletonLine width="100px" height={16} />
                          </div>
                        ) : cellIndex === 5 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <SkeletonLine width="90px" height={16} />
                            <SkeletonLine width="110px" height={12} />
                          </div>
                        ) : (
                          <SkeletonLine width="70%" height={16} />
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="table-pagination" style={{
          marginTop: '12px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 45%, #f5f3ff 100%)',
          borderTop: '2px solid #000000',
          borderRadius: '0 0 12px 12px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)'
        }}>
          <div className="pagination-info" style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
            <SkeletonLine width="180px" height={16} />
          </div>
          <div className="pagination-controls" style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <SkeletonLine width="90px" height={36} />
            <SkeletonLine width="120px" height={16} />
            <SkeletonLine width="90px" height={36} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDashboardLoading;
