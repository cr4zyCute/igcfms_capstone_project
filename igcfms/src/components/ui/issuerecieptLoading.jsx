import React from 'react';
import { SkeletonLine, SkeletonCircle } from './LoadingSkeleton';

const renderStatCard = () => (
  <div className="stat-card-modern skeleton-card">
    <div className="stat-card-content">
      <SkeletonLine width="60%" height={22} />
      <SkeletonLine width="40%" height={14} />
      <SkeletonLine width="30%" height={12} />
    </div>
  </div>
);

const renderAnalyticsBox = () => (
  <div className="dashboard-box skeleton-card">
    <SkeletonLine width="50%" height={20} style={{ marginBottom: '12px' }} />
    <div className="chart-container-full" style={{ height: '260px' }}>
      <SkeletonLine height="100%" />
    </div>
  </div>
);

const IssueReceiptSkeleton = ({ showAnalytics = true } = {}) => {
  const tableHeadCells = ['#', 'Receipt No.', 'Transaction', 'Payer', 'Amount', 'Issue Date', 'Actions'];
  const tableRowCount = 8;

  return (
    <div className="issue-receipt-page skeleton-issue-receipt">
      <div className="ir-header skeleton-card">
        <div className="header-content">
          <div className="ir-title">
            <SkeletonLine width="220px" height={32} />
          </div>
          <div className="header-actions">
            <SkeletonLine width="180px" height={40} />
          </div>
        </div>
        <div className="header-stats">
          {[0, 1, 2].map((item) => (
            <div className="stat-item" key={`stat-${item}`}>
              <span className="stat-value"><SkeletonLine width="100px" height={20} /></span>
              <span className="stat-label"><SkeletonLine width="80px" height={12} /></span>
            </div>
          ))}
        </div>
      </div>

      {showAnalytics && (
        <div className="analytics-dashboard-section">
          <div className="three-box-grid">
            <div className="left-column">
              <div className="left-stats-cards">
                {renderStatCard()}
                {renderStatCard()}
              </div>
              <div className="dashboard-box box-1 skeleton-card">
                <div className="dashboard-box-header" style={{ marginBottom: '16px' }}>
                  <SkeletonLine width="45%" height={20} />
                </div>
                <div className="chart-container-full" style={{ height: '420px' }}>
                  <SkeletonLine height="100%" />
                </div>
              </div>
            </div>

            <div className="right-column">
              {renderAnalyticsBox()}
              {renderAnalyticsBox()}
            </div>
          </div>
        </div>
      )}

      <div className="section-header">
        <div className="section-title-group">
          <SkeletonLine width="200px" height={26} />
        </div>
        <div className="header-controls">
          <div className="search-filter-container">
            <div className="account-search-container">
              <SkeletonLine width="260px" height={40} />
            </div>
            <div className="filter-dropdown-container">
              <SkeletonLine width="200px" height={40} />
            </div>
          </div>
          <div className="action-buttons">
            <SkeletonLine width="140px" height={44} />
          </div>
        </div>
      </div>

      <div className="receipts-table-section">
        <div className="receipts-table-container">
          <table className="receipts-table skeleton-table">
            <thead>
              <tr>
                {tableHeadCells.map((cell) => (
                  <th key={`head-${cell}`}>
                    <SkeletonLine width="80%" height={16} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: tableRowCount }).map((_, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {tableHeadCells.map((cell, cellIndex) => (
                    <td key={`cell-${rowIndex}-${cellIndex}`}>
                      <div className="cell-content">
                        {cellIndex === 3 ? (
                          <div className="payer-info">
                            <SkeletonCircle size={32} style={{ marginRight: '10px' }} />
                            <SkeletonLine width="120px" height={16} />
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

        <div className="table-pagination">
          <div className="pagination-info">
            <SkeletonLine width="180px" height={16} />
          </div>
          <div className="pagination-controls">
            <SkeletonLine width="90px" height={36} />
            <SkeletonLine width="120px" height={16} />
            <SkeletonLine width="90px" height={36} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueReceiptSkeleton;
