import React from 'react';
import { SkeletonLine, SkeletonCircle } from './LoadingSkeleton';

const renderSummaryCard = () => (
  <div className="ic-summary-card skeleton-card" style={{ border: '2px solid #000000', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    <div className="ic-card-title" style={{ marginBottom: '12px' }}>
      <SkeletonLine width="120px" height={16} />
    </div>
    <div className="ic-card-value" style={{ marginBottom: '8px' }}>
      <SkeletonLine width="150px" height={32} />
    </div>
    <div className="ic-card-subtitle">
      <SkeletonLine width="100px" height={12} />
    </div>
  </div>
);

const renderAnalyticsCard1 = () => (
  <div className="ic-analytics-wrapper skeleton-card" style={{  borderRadius: '8px'}}>
    <div className="ic-analytics-title">
      <SkeletonLine width="70%" height={18} />
    </div>
    <div style={{ padding: '20px', border: '2px solid #000000', borderRadius: '8px', background: '#ffffff', minHeight: '150px' }}>
      {/* Main content - percentage on left, legend on right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        {/* Left side - Large percentage */}
        <div>
          <SkeletonLine width="120px" height={48} style={{ marginBottom: '8px' }} />
          <SkeletonLine width="80px" height={12} style={{ marginBottom: '8px' }} />
          <SkeletonLine width="70px" height={10} />
        </div>
        {/* Right side - Legend items */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '8px', gap: '8px' }}>
            <SkeletonLine width="60px" height={12} />
            <SkeletonLine width="20px" height={20} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
            <SkeletonLine width="60px" height={12} />
            <SkeletonLine width="20px" height={20} />
          </div>
        </div>
      </div>
      {/* Circular chart */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <SkeletonCircle size={140} />
      </div>
    </div>
  </div>
);

const renderAnalyticsCard2 = () => (
  <div className="ic-analytics-wrapper skeleton-card" style={{  borderRadius: '8px'}}>
    <div className="ic-analytics-title">
      <SkeletonLine width="70%" height={18} />
    </div>
    <div style={{ padding: '20px', border: '2px solid #000000', borderRadius: '8px', background: '#ffffff', minHeight: '150px' }}>
      {/* Main content - percentage on left, legend on right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        {/* Left side - Large percentage */}
        <div>
          <SkeletonLine width="120px" height={48} style={{ marginBottom: '8px' }} />
          <SkeletonLine width="80px" height={12} style={{ marginBottom: '8px' }} />
          <SkeletonLine width="70px" height={10} />
        </div>
        {/* Right side - Legend items */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '8px', gap: '8px' }}>
            <SkeletonLine width="60px" height={12} />
            <SkeletonLine width="20px" height={20} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
            <SkeletonLine width="60px" height={12} />
            <SkeletonLine width="20px" height={20} />
          </div>
        </div>
      </div>
      {/* Circular chart */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <SkeletonCircle size={140} />
      </div>
    </div>
  </div>
);

const renderAnalyticsCard3 = () => (
  <div className="ic-analytics-wrapper skeleton-card" style={{ borderRadius: '8px' }}>
    <div className="ic-analytics-title">
      <SkeletonLine width="70%" height={18} />
    </div>
    <div style={{ padding: '20px', border: '2px solid #000000', borderRadius: '8px', background: '#ffffff', minHeight: '150px' }}>
      {/* Main content - percentage on left, legend on right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        {/* Left side - Large percentage */}
        <div>
          <SkeletonLine width="120px" height={48} style={{ marginBottom: '8px' }} />
          <SkeletonLine width="90px" height={12} style={{ marginBottom: '8px' }} />
          <SkeletonLine width="70px" height={10} />
        </div>
        {/* Right side - Legend items */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '8px', gap: '8px' }}>
            <SkeletonLine width="60px" height={12} />
            <SkeletonLine width="20px" height={20} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '8px', gap: '8px' }}>
            <SkeletonLine width="70px" height={12} />
            <SkeletonLine width="20px" height={20} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
            <SkeletonLine width="60px" height={12} />
            <SkeletonLine width="20px" height={20} />
          </div>
        </div>
      </div>
      {/* Bar chart placeholder */}
      <div style={{ marginTop: '20px' }}>
        <div style={{ height: '120px', marginBottom: '8px' }}>
          <SkeletonLine height="100%" />
        </div>
        {/* X-axis labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px' }}>
          <SkeletonLine width="60px" height={10} />
          <SkeletonLine width="60px" height={10} />
          <SkeletonLine width="60px" height={10} />
          <SkeletonLine width="60px" height={10} />
        </div>
      </div>
    </div>
  </div>
);

const IssueChequeSkeleton = ({ showKpiSections = true }) => {
  const tableHeadCells = ['Cheque ID', 'Cheque Number', 'Disbursement', 'Payee Name', 'Bank', 'Amount', 'Issue Date', 'Actions'];
  const tableRowCount = 8;

  return (
    <div className="issue-cheque-page skeleton-issue-cheque">
      {/* Header */}
      <div className="ic-header" style={{ border: '2px solid #000000', borderRadius: '8px' }}>
        <div className="ic-header-content">
          <h1 className="ic-title">
            <SkeletonLine width="250px" height={32} />
          </h1>
          <div className="ic-header-actions">
            <SkeletonLine width="180px" height={44} />
          </div>
        </div>
      </div>

      {showKpiSections && (
        <>
          {/* Dashboard Grid */}
          <div className="ic-dashboard-grid">
            {/* Left Column */}
            <div className="ic-left-column">
              {/* Combined Card with Graph */}
              <div className="ic-summary-card ic-combined-card skeleton-card" style={{ border: '2px solid #000000', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="ic-card-title" style={{ marginBottom: '8px' }}>
                  <SkeletonLine width="60px" height={14} />
                </div>
                <div className="ic-card-value" style={{ marginBottom: '6px' }}>
                  <SkeletonLine width="140px" height={28} />
                </div>
                <div className="ic-card-subtitle" style={{ marginBottom: '12px' }}>
                  <SkeletonLine width="110px" height={12} />
                </div>
                <div className="ic-cheque-mini-graph" style={{ width: '100%', height: '50px' }}>
                  <SkeletonLine height="100%" />
                </div>
              </div>
              
              {/* Average Cheque Card */}
              {renderSummaryCard()}
            </div>

            {/* Right Column */}
            <div className="ic-right-column skeleton-card" style={{ border: '2px solid #000000', borderRadius: '8px', height: '100%', background: '#ffffff' }}>
              <div style={{ padding: '20px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Title */}
                <SkeletonLine width="50%" height={20} style={{ marginBottom: '20px' }} />
                
                {/* Content with stats and chart */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flex: 1 }}>
                  {/* Left side - Stats */}
                  <div style={{ minWidth: '120px' }}>
                    <div style={{ marginBottom: '24px' }}>
                      <SkeletonLine width="80px" height={14} style={{ marginBottom: '8px' }} />
                      <SkeletonLine width="60px" height={32} />
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <SkeletonLine width="80px" height={14} style={{ marginBottom: '8px' }} />
                      <SkeletonLine width="40px" height={32} />
                    </div>
                    <div>
                      <SkeletonLine width="80px" height={14} style={{ marginBottom: '8px' }} />
                      <SkeletonLine width="40px" height={32} />
                    </div>
                  </div>
                  
                  {/* Right side - Chart */}
                  <div style={{ flex: 1, height: '100%' }}>
                    <SkeletonLine height="100%" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Row */}
          <div className="ic-analytics-row">
            {renderAnalyticsCard1()}
            {renderAnalyticsCard2()}
            {renderAnalyticsCard3()}
          </div>
        </>
      )}

      {/* Table Header */}
      <div className="ic-table-header">
        <div className="section-title-group">
          <h3>
            <SkeletonLine width="220px" height={24} />
          </h3>
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
        </div>
      </div>

      {/* Cheques Table */}
      <div className="ic-cheques-section">
        <div className="ic-cheques-table-container">
          <table className="ic-cheques-table">
            <thead>
              <tr>
                {tableHeadCells.map((cell) => (
                  <th key={`head-${cell}`}>
                    <SkeletonLine width="80%" height={14} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: tableRowCount }).map((_, rowIndex) => (
                <tr key={`row-${rowIndex}`} className="table-row">
                  {tableHeadCells.map((cell, cellIndex) => (
                    <td key={`cell-${rowIndex}-${cellIndex}`}>
                      <div className="cell-content">
                        {cellIndex === 3 ? (
                          <div className="payer-info">
                            <span className="payer-name">
                              <SkeletonLine width="140px" height={16} />
                            </span>
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
      </div>
    </div>
  );
};

export default IssueChequeSkeleton;
