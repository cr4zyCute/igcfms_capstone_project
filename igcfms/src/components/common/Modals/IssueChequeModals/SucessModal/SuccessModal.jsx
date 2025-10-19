import React from 'react';
import './SuccessModal.css';

const SuccessModal = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="ic-success-modal-overlay" onClick={onClose}>
      <div className="ic-success-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="ic-success-modal-icon">
          <i className="fas fa-check-circle"></i>
        </div>
        <div className="ic-success-modal-body">
          <h3>Success!</h3>
          <p>{message}</p>
        </div>
        <div className="ic-success-modal-actions">
          <button className="ic-success-close-btn" onClick={onClose}>
            <i className="fas fa-check"></i> OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
