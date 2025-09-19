import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  text = '', 
  overlay = false,
  inline = false 
}) => {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  };

  const colorClasses = {
    primary: 'spinner-primary',
    secondary: 'spinner-secondary',
    white: 'spinner-white',
    dark: 'spinner-dark'
  };

  if (overlay) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          <div className={`spinner ${sizeClasses[size]} ${colorClasses[color]}`}>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          {text && <p className="loading-text">{text}</p>}
        </div>
      </div>
    );
  }

  if (inline) {
    return (
      <span className="loading-inline">
        <div className={`spinner ${sizeClasses[size]} ${colorClasses[color]}`}>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        {text && <span className="loading-text-inline">{text}</span>}
      </span>
    );
  }

  return (
    <div className="loading-container">
      <div className={`spinner ${sizeClasses[size]} ${colorClasses[color]}`}>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

// Card Loading Skeleton
export const CardSkeleton = ({ height = '200px', showHeader = true }) => (
  <div className="card-skeleton" style={{ height }}>
    {showHeader && <div className="skeleton-header"></div>}
    <div className="skeleton-content">
      <div className="skeleton-line"></div>
      <div className="skeleton-line short"></div>
      <div className="skeleton-line"></div>
    </div>
  </div>
);

// Table Loading Skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="table-skeleton">
    <div className="skeleton-table-header">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="skeleton-header-cell"></div>
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="skeleton-table-row">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div key={colIndex} className="skeleton-table-cell"></div>
        ))}
      </div>
    ))}
  </div>
);

// Dashboard Stats Loading
export const StatsSkeleton = () => (
  <div className="stats-skeleton">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="stat-skeleton">
        <div className="stat-skeleton-icon"></div>
        <div className="stat-skeleton-content">
          <div className="stat-skeleton-number"></div>
          <div className="stat-skeleton-label"></div>
        </div>
      </div>
    ))}
  </div>
);

// Button Loading State
export const LoadingButton = ({ 
  loading, 
  children, 
  className = '', 
  disabled = false,
  ...props 
}) => (
  <button 
    className={`btn-loading ${className} ${loading ? 'loading' : ''}`}
    disabled={loading || disabled}
    {...props}
  >
    {loading ? (
      <>
        <LoadingSpinner size="small" color="white" inline />
        <span>Loading...</span>
      </>
    ) : (
      children
    )}
  </button>
);

export default LoadingSpinner;
