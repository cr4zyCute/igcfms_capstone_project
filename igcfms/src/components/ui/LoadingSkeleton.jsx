import React from 'react';

export const SkeletonLine = ({ width = '100%', height = 12, style = {} }) => (
  <span
    className="skeleton skeleton-line"
    style={{ width, height: typeof height === 'number' ? `${height}px` : height, ...style }}
  />
);

export const SkeletonCircle = ({ size = 40, style = {} }) => (
  <span
    className="skeleton skeleton-circle"
    style={{ width: typeof size === 'number' ? `${size}px` : size, height: typeof size === 'number' ? `${size}px` : size, ...style }}
  />
);

export const SkeletonSectionHeader = () => (
  <div className="section-header skeleton-section">
    <div className="section-title-group">
      <SkeletonLine width="280px" height={32} />
    </div>
    <div className="header-controls">
      <SkeletonLine width="260px" height={44} />
      <SkeletonLine width="180px" height={44} />
    </div>
  </div>
);

export const SkeletonAccountCard = () => (
  <div className="account-card-new skeleton-card">
    <div className="card-header">
      <div className="card-header-left">
        <SkeletonLine width="70%" height={20} />
        <SkeletonLine width="45%" height={14} />
      </div>
      <div className="card-header-center">
        <SkeletonLine width="90px" height={18} />
      </div>
      <div className="card-header-right">
        <SkeletonCircle size={32} />
      </div>
    </div>
    <div className="card-balance">
      <SkeletonLine width="55%" height={28} />
      <SkeletonLine width="34%" height={14} />
    </div>
    <div className="card-graph skeleton-graph">
      <SkeletonLine height="100%" />
    </div>
    <div className="card-actions-new">
      <SkeletonLine height={42} />
    </div>
  </div>
);

export const SkeletonAccountGrid = ({ count = 4 }) => (
  <div className="account-cards skeleton-account-grid">
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonAccountCard key={index} />
    ))}
  </div>
);

export const SkeletonTransactionTable = () => (
  <div className="transaction-history-table-container skeleton-transaction-table">
    <div className="skeleton-table-head">
      {Array.from({ length: 6 }).map((_, idx) => (
        <SkeletonLine key={`head-${idx}`} height={18} />
      ))}
    </div>
    <div className="skeleton-table-body">
      {Array.from({ length: 6 }).map((_, rowIdx) => (
        <div className="skeleton-table-row" key={`row-${rowIdx}`}>
          {Array.from({ length: 6 }).map((_, colIdx) => (
            <SkeletonLine key={`cell-${rowIdx}-${colIdx}`} height={16} />
          ))}
        </div>
      ))}
    </div>
  </div>
);
