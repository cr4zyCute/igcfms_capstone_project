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
      <div className="ot-dashboard-container" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        {/* Left Column - Total Requests + Status Cards */}
        <div className="ot-left-column" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Total Requests Card Skeleton */}
          <div className="ot-total-card skeleton-ot-card" style={{ 
            background: '#fff', 
            border: '2px solid #000000', 
            borderRadius: '12px', 
            padding: '20px' 
          }}>
            <div className="ot-total-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="ot-total-info" style={{ flex: 1 }}>
                <div style={{ marginBottom: '10px' }}>
                  <SkeletonLine width="140px" height={14} />
                </div>
                <SkeletonLine width="80px" height={32} />
              </div>
              <div className="ot-total-graph" style={{ width: '150px', height: '80px' }}>
                <SkeletonLine width="100%" height="100%" style={{ borderRadius: '4px' }} />
              </div>
            </div>
          </div>

          {/* Status Cards Row Skeleton */}
          <div className="ot-status-cards-row" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '15px' 
          }}>
            {/* Pending Card */}
            <div className="ot-status-card skeleton-ot-card" style={{ 
              background: '#fff', 
              border: '2px solid #000000', 
              borderRadius: '12px', 
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <SkeletonCircle size={48} />
              <div style={{ flex: 1 }}>
                <SkeletonLine width="100px" height={12} style={{ marginBottom: '8px' }} />
                <SkeletonLine width="40px" height={24} />
              </div>
            </div>

            {/* Approved Card */}
            <div className="ot-status-card skeleton-ot-card" style={{ 
              background: '#fff', 
              border: '2px solid #000000', 
              borderRadius: '12px', 
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <SkeletonCircle size={48} />
              <div style={{ flex: 1 }}>
                <SkeletonLine width="80px" height={12} style={{ marginBottom: '8px' }} />
                <SkeletonLine width="40px" height={24} />
              </div>
            </div>

            {/* Rejected Card */}
            <div className="ot-status-card skeleton-ot-card" style={{ 
              background: '#fff', 
              border: '2px solid #000000', 
              borderRadius: '12px', 
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <SkeletonCircle size={48} />
              <div style={{ flex: 1 }}>
                <SkeletonLine width="70px" height={12} style={{ marginBottom: '8px' }} />
                <SkeletonLine width="40px" height={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Pie Chart Skeleton */}
        <div className="ot-right-column">
          <div className="ot-pie-card skeleton-ot-card" style={{ 
            background: '#fff', 
            border: '2px solid #000000', 
            borderRadius: '12px', 
            padding: '20px',
            height: '100%'
          }}>
            <div className="ot-card-header" style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #f1f5f9' }}>
              <SkeletonLine width="180px" height={16} />
            </div>
            <div className="ot-pie-chart" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '20px',
              paddingTop: '20px'
            }}>
              <SkeletonCircle size={180} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', alignItems: 'center' }}>
                <SkeletonLine width="120px" height={12} />
                <SkeletonLine width="100px" height={12} />
                <SkeletonLine width="110px" height={12} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Timeline Graph Skeleton */}
      <div className="skeleton-ot-card" style={{ 
        background: '#fff', 
        border: '2px solid #000000', 
        borderRadius: '12px', 
        padding: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #f1f5f9' }}>
          <SkeletonLine width="200px" height={18} />
        </div>
        <div style={{ height: '250px' }}>
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
