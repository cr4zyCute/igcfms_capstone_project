import React from 'react';
import '../css/Disbursement/FormError.css';

const FormError = ({ title = "Validation Error", message, onClose }) => {
  return (
    <div className="modal-overlay-error" onClick={onClose}>
      <div className="modal-content-error" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-error">
          <h3>
            <i className="fas fa-exclamation-triangle"></i>
            {title}
          </h3>
        </div>
        <div className="modal-body-error">
          <p>{message}</p>
        </div>
        <div className="modal-footer-error">
          <button onClick={onClose} className="ok-btn-error">
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormError;
