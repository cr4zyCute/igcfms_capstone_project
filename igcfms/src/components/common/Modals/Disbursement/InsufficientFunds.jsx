import React from 'react';
import '../../css/Disbursement/InsufficientFunds.css';

const InsufficientFunds = ({
  isOpen,
  onClose,
  message,
  title = "Insufficient Funds Ammount!! "
}) => {
  if (!isOpen) return null;

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-header">
          <i className="fas fa-exclamation-triangle delete-warning-icon"></i>
          <h3 className="delete-modal-title">{title}</h3>
        </div>
        <div className="delete-modal-body">
          <p className="delete-confirmation-text">{message}</p>
        </div>
        <div className="delete-modal-footer">
          <button 
            className="modal-confirm-btn" 
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsufficientFunds;
