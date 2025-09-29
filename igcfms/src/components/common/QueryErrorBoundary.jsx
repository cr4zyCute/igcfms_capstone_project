import React from 'react';

const QueryErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="error-container" style={{
      padding: '2rem',
      textAlign: 'center',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      margin: '1rem'
    }}>
      <div style={{ fontSize: '48px', color: '#dc2626', marginBottom: '1rem' }}>
        <i className="fas fa-exclamation-triangle"></i>
      </div>
      <h3 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>
        Something went wrong
      </h3>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        {error?.message || 'Failed to load data. Please try again.'}
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button
          onClick={resetErrorBoundary}
          className="btn btn-primary"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          <i className="fas fa-redo"></i> Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-secondary"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          <i className="fas fa-refresh"></i> Reload Page
        </button>
      </div>
    </div>
  );
};

export default QueryErrorFallback;
