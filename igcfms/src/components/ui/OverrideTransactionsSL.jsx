import React from 'react';
import { SkeletonLine, SkeletonCircle } from './LoadingSkeleton';
import '../admin/css/overridetransactions.css';

const OverrideTransactionsSL = () => {
  return (
    <div className="override-transactions-page skeleton-override-transactions">
      {/* Header Skeleton */}
      <div className="ot-header skeleton-ot-card" style={{ 
        padding: '20px', 
        marginBottom: '20px',
        background: '#f9fafb',
        borderRadius: '12px',
        border: '2px solid #000000'
      }}>
        <div className="ot-header-content" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div>
            <SkeletonLine width="280px" height={24} style={{ marginBottom: '4px' }} />
          </div>
          <div className="ot-header-actions">
            <SkeletonLine width="200px" height={40} />
          </div>
        </div>
      </div>

      {/* Dashboard Container Skeleton */}
      <div className="ot-dashboard-container">
        {/* Left Column - Total Requests + Status Cards */}
        <div className="ot-left-column">
          {/* Total Requests Card Skeleton */}
          <div className="ot-total-card">
            <div className="ot-total-wrapper">
              <div className="ot-total-info">
                <div className="ot-card-header-inline" style={{ marginBottom: '12px' }}>
                  <SkeletonLine width="140px" height={14} />
                </div>
                <SkeletonLine width="60px" height={36} style={{ marginBottom: '6px' }} />
                <SkeletonLine width="120px" height={11} />
              </div>
              <div className="ot-total-graph">
                <SkeletonLine width="100%" height="100%" style={{ borderRadius: '4px' }} />
              </div>
            </div>
          </div>

          {/* Status Cards Row Skeleton */}
          <div className="ot-status-cards-row">
            {/* Pending Card */}
            <div className="ot-status-card">
              <div className="ot-status-icon">
                <SkeletonCircle size={48} />
              </div>
              <div className="ot-status-content">
                <SkeletonLine width="110px" height={12} style={{ marginBottom: '8px' }} />
                <SkeletonLine width="40px" height={28} style={{ marginBottom: '6px' }} />
                <SkeletonLine width="100px" height={10} />
              </div>
            </div>

            {/* Approved Card */}
            <div className="ot-status-card">
              <div className="ot-status-icon">
                <SkeletonCircle size={48} />
              </div>
              <div className="ot-status-content">
                <SkeletonLine width="80px" height={12} style={{ marginBottom: '8px' }} />
                <SkeletonLine width="40px" height={28} style={{ marginBottom: '6px' }} />
                <SkeletonLine width="90px" height={10} />
              </div>
            </div>

            {/* Rejected Card */}
            <div className="ot-status-card">
              <div className="ot-status-icon">
                <SkeletonCircle size={48} />
              </div>
              <div className="ot-status-content">
                <SkeletonLine width="70px" height={12} style={{ marginBottom: '8px' }} />
                <SkeletonLine width="40px" height={28} style={{ marginBottom: '6px' }} />
                <SkeletonLine width="95px" height={10} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Pie Chart Skeleton */}
        <div className="ot-right-column">
          <div className="ot-pie-card">
            <div className="ot-card-header">
              <SkeletonLine width="180px" height={16} />
            </div>
            <div className="ot-pie-chart">
              {/* Pie chart with legend skeleton */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'flex-start',
                gap: '40px',
                padding: '24px 20px',
                minHeight: '220px'
              }}>
                {/* Pie */}
                <div style={{ flex: '0 0 180px' }}>
                  <SkeletonCircle size={180} />
                </div>
                {/* Legend */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <SkeletonLine width="100px" height={14} />
                        <SkeletonLine width="50px" height={14} />
                      </div>
                      <SkeletonLine width="100%" height={6} style={{ borderRadius: '3px' }} />
                      <SkeletonLine width="70px" height={12} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Timeline Graph Skeleton */}
      <div className="ot-timeline-box" style={{ 
        background: '#fff', 
        border: '2px solid #000000', 
        borderRadius: '12px', 
        padding: '20px',
        marginBottom: '30px'
      }}>
        <div className="ot-timeline-header" style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #f1f5f9' }}>
          <div className="ot-timeline-title-group">
            <SkeletonLine width="320px" height={18} style={{ marginBottom: '8px' }} />
            <SkeletonLine width="280px" height={12} />
          </div>
          <div className="ot-timeline-controls">
            <SkeletonLine width="280px" height={36} style={{ borderRadius: '8px' }} />
          </div>
        </div>
        <div className="ot-timeline-content" style={{ height: '250px' }}>
          <SkeletonLine width="100%" height="100%" style={{ borderRadius: '8px' }} />
        </div>
      </div>

      {/* Override Requests Section Header Skeleton */}
      <div className="section-header skeleton-ot-section" style={{ 
        marginBottom: '20px', 
        paddingBottom: '15px', 
        borderBottom: '2px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div className="section-title-group">
          <SkeletonLine width="280px" height={18} />
        </div>
        <div className="header-controls" style={{ display: 'flex', gap: '12px' }}>
          <SkeletonLine width="240px" height={44} />
          <SkeletonLine width="180px" height={44} />
        </div>
      </div>

      {/* Override Requests Table Skeleton */}
      <div className="ot-requests-section skeleton-ot-card" style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '12px', 
        border: '2px solid #000000' 
      }}>
        <div className="requests-table-container">
          <table className="requests-table skeleton-ot-table">
            <thead>
              <tr>
                {Array.from({ length: 8 }).map((_, idx) => (
                  <th key={`ot-head-${idx}`}>
                    <SkeletonLine height={12} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, rowIdx) => (
                <tr key={`ot-row-${rowIdx}`} className="table-row">
                  {Array.from({ length: 8 }).map((_, colIdx) => (
                    <td key={`ot-cell-${rowIdx}-${colIdx}`}>
                      <div className="cell-content">
                        <SkeletonLine height={14} />
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

export default OverrideTransactionsSL;
