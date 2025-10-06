import React from 'react';
import './css/Deletion.css';

const Deletion = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  loading, 
  title = "CONFIRM DELETION",
  message = "Are you sure you want to delete this item? This action cannot be undone and will permanently remove all associated data.",
  itemDetails = [],
  confirmText = "Delete",
  cancelText = "Cancel"
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
          <p className="delete-confirmation-text">
            {message}
          </p>
          
          {itemDetails.length > 0 && (
            <div className="receipt-details-summary">
              {itemDetails.map((detail, index) => (
                <div key={index} className="detail-row">
                  <span className="detail-label">{detail.label}:</span>
                  <span className="detail-value">{detail.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="delete-modal-footer">
          <button
            type="button"
            className="delete-btn delete-btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="delete-btn delete-btn-confirm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Deleting...
              </>
            ) : (
              <>
                <i className="fas fa-trash"></i>
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Deletion;