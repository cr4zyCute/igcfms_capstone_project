import React from 'react';
import { SkeletonLine, SkeletonCircle } from './LoadingSkeleton';
import '../admin/css/transactionmanagement.css';

const Card = ({ children, style = {} }) => (
  <div style={{ background: '#fff', border: '2px solid #000', borderRadius: 8, padding: 16, ...style }}>
    {children}
  </div>
);

const TableSkeleton = ({ cols = 5, rows = 8 }) => (
  <div className="tm-table-section receipts-table-section" style={{ marginTop: 18 }}>
    <div className="tm-table-container receipts-table-container">
      <table className="tm-table receipts-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={`th-${i}`}>
                <SkeletonLine height={12} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={`row-${r}`} className="table-row">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={`cell-${r}-${c}`}>
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
);

const TransactionManagementSL = () => {
  return (
    <div className="transaction-management-page skeleton-tm">
      {/* Header */}
      <div className="tm-header" style={{ padding: 12 }}>
        <div className="tm-header-content">
          <SkeletonLine width="260px" height={24} />
          <SkeletonLine width="160px" height={36} />
        </div>
      </div>

      <div className="tm-main-layout">
        <div className="tm-left-content">
          {/* Trends & Analysis box */}
          <Card>
            <div className="trends-header" style={{ marginBottom: 12 }}>
              <SkeletonLine width="240px" height={18} />
            </div>
            <div className="trends-grid">
              <div className="trend-chart-container">
                <SkeletonLine height={250} style={{ borderRadius: 8 }} />
              </div>
            </div>
          </Card>

          {/* Primary KPIs (2 cards) */}
          <div className="tm-primary-kpis" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[0, 1].map((i) => (
              <Card key={`kpi-1-${i}`}>
                <div className="kpi-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="kpi-icon"><SkeletonCircle size={40} /></div>
                  <div className="kpi-info" style={{ flex: 1 }}>
                    <SkeletonLine width="140px" height={12} style={{ marginBottom: 6 }} />
                    <SkeletonLine width="110px" height={20} style={{ marginBottom: 6 }} />
                    <SkeletonLine width="120px" height={10} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Performance KPIs (4 cards) */}
          <div className="tm-performance-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[0, 1, 2, 3].map((i) => (
              <Card key={`kpi-2-${i}`}>
                <div className="kpi-icon-small"><SkeletonCircle size={32} /></div>
                <div className="kpi-content">
                  <SkeletonLine width="120px" height={12} style={{ marginBottom: 6 }} />
                  <SkeletonLine width="80px" height={20} style={{ marginBottom: 6 }} />
                  <SkeletonLine width="100px" height={10} />
                </div>
              </Card>
            ))}
          </div>

          {/* Section header (search, dates, filter, export) */}
          <div className="tm-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px', background: '#f8f9fa', border: '2px solid #000', borderRadius: 8 }}>
            <div className="tm-section-title-group">
              <SkeletonLine width="220px" height={20} />
            </div>
            <div className="tm-header-controls" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <SkeletonLine width="280px" height={40} />
              <SkeletonLine width="180px" height={40} />
              <SkeletonLine width="160px" height={40} />
              <SkeletonCircle size={40} />
            </div>
          </div>

          {/* Table */}
          <TableSkeleton cols={5} rows={8} />

          {/* Pagination */}
          <div className="table-pagination" style={{ marginTop: 12, padding: '16px 20px', borderTop: '2px solid #000', background: '#f8f9fa', borderRadius: '0 0 12px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <SkeletonLine width="220px" height={14} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <SkeletonLine width="90px" height={36} />
              <SkeletonLine width="120px" height={16} />
              <SkeletonLine width="90px" height={36} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionManagementSL;
