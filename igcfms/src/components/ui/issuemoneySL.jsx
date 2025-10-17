import React from 'react';
import { SkeletonLine, SkeletonCircle } from './LoadingSkeleton';
import '../admin/css/issuemoney.css';

const IssueMoneySkeletonLoader = () => {
  return (
    <div className="issue-money-page skeleton-issue-money">
      {/* Header Skeleton */}
      <div className="im-header skeleton-card" style={{ 
        padding: '20px', 
        marginBottom: '20px',
        background: '#f9fafb',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <SkeletonLine width="250px" height={20} style={{ marginBottom: '4px' }} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <SkeletonLine width="150px" height={40} />
          <SkeletonLine width="120px" height={40} />
        </div>
      </div>

      {/* Dashboard 5-Box Grid Skeleton */}
      <div className="issue-money-dashboard" style={{ gap: '20px', height: '500%'}}>
        {/* Box 1 - Total Disbursement (Top Left) */}
        <div className="issue-money-box-1">
          <div className="total-disbursement-card skeleton-card">
            <div style={{ textAlign: 'center', padding: '20px 20px 10px' }}>
              <SkeletonLine width="150px" height={16} style={{ marginBottom: '15px', margin: '0 auto' }} />
              <SkeletonLine width="200px" height={36} style={{ margin: '0 auto' }} />
            </div>
            <div className="disbursement-mini-graph" style={{ marginTop: 'auto', paddingTop: '20px' }}>
              <SkeletonLine width="100%" height={3} style={{ borderRadius: '0' }} />
            </div>
          </div>
        </div>

        {/* Box 2 - Payment Accuracy Rate (Below Box 1) */}
        <div className="issue-money-box-2" style={{ marginTop: '-37%' }}>
          <div className="payment-accuracy-card skeleton-card" >
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
              {/* Title */}
              <SkeletonLine width="180px" height={16} style={{ marginBottom: '20px' }} />
              
              {/* Gauge Circle */}
              <div style={{ marginBottom: '20px' }}>
                <SkeletonCircle size={120} />
              </div>
              
              {/* Status Label (Black rectangle) */}
              <div style={{ marginBottom: '20px' }}>
                <SkeletonLine width="110px" height={32} style={{ borderRadius: '6px', background: '#000000' }} />
              </div>
              
              {/* Correct/Total Stats */}
              <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', marginTop: 'auto' }}>
                <div style={{ textAlign: 'center' }}>
                  <SkeletonLine width="60px" height={12} style={{ marginBottom: '8px' }} />
                  <SkeletonLine width="40px" height={24} />
                </div>
                <div style={{ width: '1px', height: '50px', background: '#e5e7eb' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <SkeletonLine width="60px" height={12} style={{ marginBottom: '8px' }} />
                  <SkeletonLine width="40px" height={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Box 3 - Payment Method Pie Chart (Center, spans 2 rows) */}
        <div className="issue-money-box-3">
          <div className="payment-method-chart skeleton-card" style={{ background: '#fff', border: 'none', height: '100%', boxSizing: 'border-box', padding: '20px' }}>
            <div style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #f1f5f9' }}>
              <SkeletonLine width="220px" height={14} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '20px', paddingTop: '20px' }}>
              <SkeletonCircle size={200} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', alignItems: 'center', marginTop: '10px' }}>
                <SkeletonLine width="130px" height={12} />
                <SkeletonLine width="110px" height={12} />
                <SkeletonLine width="120px" height={12} />
              </div>
            </div>
          </div>
        </div>

        {/* Box 4 - Vendor Performance (Right, spans 2 rows) */}
        <div className="issue-money-box-4">
          <div className="vendor-performance-card skeleton-card" style={{ background: '#fff', border: 'none', height: '150%', boxSizing: 'border-box', padding: '20px' }}>
            <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SkeletonCircle size={16} />
              <div>
                <SkeletonLine width="200px" height={16} style={{ marginBottom: '4px' }} />
                <SkeletonLine width="180px" height={12} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} style={{ padding: '10px 0', borderBottom: index < 4 ? '1px solid #f3f4f6' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                    <SkeletonLine width="100px" height={14} />
                    <SkeletonLine width="50px" height={20} style={{ borderRadius: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <SkeletonLine width="90px" height={11} />
                    <SkeletonLine width="70px" height={11} />
                  </div>
                  <SkeletonLine width="100%" height={6} style={{ borderRadius: '3px' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Box 5 - DPO Chart (Bottom, spans columns 1-2) */}
        <div className="issue-money-box-5" style={{ marginTop: '-35%' }}>
          <div className="dashboard-box box-dpo skeleton-card">
            <div className="box-header">
              <div className="box-title-with-indicator">
                <SkeletonLine width="280px" height={14} />
              </div>
            </div>
            <div className="box-content">
              <div className="chart-container" style={{ 
                height: '100%', 
                width: '100%',
                position: 'relative',
                padding: '0'
              }}>
                <SkeletonLine width="100%" height="100%" style={{ borderRadius: '8px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Disbursements Table Skeleton */}
      <div className="recent-disbursements-section skeleton-card" style={{ marginTop: '-20%', background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <div className="section-header" style={{  marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #000000' }}>
          <div className="section-title-group">
            <SkeletonLine width="280px" height={18} />
          </div>
          <div className="header-controls" style={{ display: 'flex', gap: '12px' }}>
            <SkeletonLine width="240px" height={44} />
            <SkeletonLine width="180px" height={44} />
            <SkeletonLine width="44px" height={44} />
          </div>
        </div>
        
        <div className="disbursements-table-section">
          <div className="disbursements-table-container">
            <table className="disbursements-table skeleton-table">
              <thead>
                <tr>
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <th key={`head-${idx}`}>
                      <SkeletonLine height={12} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }).map((_, rowIdx) => (
                  <tr key={`row-${rowIdx}`} className="table-row">
                    {Array.from({ length: 6 }).map((_, colIdx) => (
                      <td key={`cell-${rowIdx}-${colIdx}`}>
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
          
          <div className="table-pagination">
            <SkeletonLine width="200px" height={13} />
            <div className="pagination-controls" style={{ display: 'flex', gap: '10px' }}>
              <SkeletonLine width="90px" height={36} />
              <SkeletonLine width="100px" height={13} />
              <SkeletonLine width="90px" height={36} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueMoneySkeletonLoader;
