import React, { useState } from 'react';
import './css/ForgotPasswordModal.css';

const ForgotPasswordModal = ({ isOpen, onClose, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/password/reset-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessageType('success');
        setMessage(data.message);
        setEmail('');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setMessageType('error');
        // Check if it's a validation error (email not found)
        if (response.status === 422 && data.errors && data.errors.email) {
          setMessage(data.errors.email[0]);
        } else {
          setMessage(data.message || 'An error occurred. Please try again.');
        }
      }
    } catch (error) {
      setMessageType('error');
      setMessage('An error occurred. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content forgot-password-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Forgot Password</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Enter your email address and we'll send a password reset request to the administrator.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            {message && (
              <div className={`alert alert-${messageType}`}>
                {messageType === 'success' ? '✓' : '✕'} {message}
              </div>
            )}

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !email}
              >
                {loading ? 'Sending...' : 'Request Reset'}
              </button>
            </div>
          </form>

          <div className="info-box">
            <h4>What happens next?</h4>
            <ol>
              <li>Your request will be sent to the administrator</li>
              <li>Admin will review and approve your request</li>
              <li>You'll receive a temporary password via email</li>
              <li>Use the temporary password to log in</li>
              <li>You'll be prompted to change your password</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
