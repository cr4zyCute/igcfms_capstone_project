import React from 'react';
import '../../css/Disbursement/ConfirmDisbursement.css';

const ConfirmDisbursement = ({
  isOpen,
  onClose,
  onConfirm,
  submitting,
  disbursementDetails = {},
}) => {
  if (!isOpen) return null;

  const {
    recipientName = 'Unknown',
    payeeName,
    fundName = 'Unknown',
    amount = 0,
    referenceNo,
    modeOfPayment,
    chequeNumber,
  } = disbursementDetails;

  return (
        <div className="confirm-modal-overlay" onClick={() => !submitting && onClose()}>
      <div className="confirm-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <i className="fas fa-question-circle confirm-icon"></i>
          <h3 className="confirm-modal-title">Confirm Disbursement</h3>
        </div>
        
        <div className="confirm-modal-body">
          <p className="confirm-lead-text">
            Please review the details below before proceeding. This action will be recorded permanently.
          </p>
          <div className="details-summary-grid">
            <div className="detail-item">
              <span className="detail-label">Recipient</span>
              <span className="detail-value">{recipientName}</span>
            </div>
            {payeeName && (
              <div className="detail-item">
                <span className="detail-label">Payee Name</span>
                <span className="detail-value">{payeeName}</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Fund Source</span>
              <span className="detail-value">{fundName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Reference #</span>
              <span className="detail-value">{referenceNo}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Payment Mode</span>
              <span className="detail-value">{modeOfPayment}</span>
            </div>
            {modeOfPayment === "Cheque" && chequeNumber && (
              <div className="detail-item">
                <span className="detail-label">Cheque #</span>
                <span className="detail-value">{chequeNumber}</span>
              </div>
            )}
            <div className="detail-item amount-highlight">
              <span className="detail-label">Amount</span>
              <span className="detail-value">₱{Math.abs(parseFloat(amount || 0)).toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div className="confirm-modal-footer">
          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-confirm"
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <>
                <i className="fas fa-check"></i> Confirm
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDisbursement;
