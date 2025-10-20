import React from 'react';
import './SuccessModal.css';

const SuccessModal = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="ot-success-modal-overlay" onClick={onClose}>
      <div className="ot-success-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="ot-success-modal-icon">
          <i className="fas fa-check-circle"></i>
        </div>
        <div className="ot-success-modal-body">
          <h3>Success!</h3>
          <p>{message}</p>
        </div>
        <div className="ot-success-modal-actions">
          <button className="ot-success-close-btn" onClick={onClose}>
            <i className="fas fa-check"></i> OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
