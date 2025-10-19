import React from 'react';
import './ErrorModal.css';

const ErrorModal = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="ic-error-modal-overlay" onClick={onClose}>
      <div className="ic-error-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="ic-error-modal-icon">
          <i className="fas fa-exclamation-circle"></i>
        </div>
        <div className="ic-error-modal-body">
          <h3>Error</h3>
          <p>{message}</p>
        </div>
        <div className="ic-error-modal-actions">
          <button className="ic-error-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i> Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
