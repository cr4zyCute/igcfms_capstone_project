import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import '../modals/css/ForcePasswordChangeModal.css';

const ForcePasswordChangeModal = ({ isOpen, userName, onPasswordChanged }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePasswords = () => {
    if (!currentPassword.trim()) {
      setError('Current password is required');
      return false;
    }
    if (!newPassword.trim()) {
      setError('New password is required');
      return false;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return false;
    }
    return true;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePasswords()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/password/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        onPasswordChanged();
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Password change error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="force-password-overlay">
      <div className="force-password-modal">
        <div className="force-password-header">
          <div className="force-password-icon">
            <i className="fas fa-lock"></i>
          </div>
          <div className="force-password-header-content">
            <h2>Change Your Password</h2>
            <p className="force-password-subtitle">
              Welcome, <strong>{userName}</strong>! You must change your temporary password before continuing.
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="force-password-form">
          <div className="force-password-body">
            {error && (
              <div className="force-password-error">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            <div className="force-password-group">
              <label className="force-password-label">
                <i className="fas fa-key"></i> Current Password *
              </label>
              <div className="force-password-input-wrapper">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  className="force-password-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your temporary password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="force-password-toggle"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  disabled={loading}
                >
                  <i className={`fas fa-eye${showCurrentPassword ? '' : '-slash'}`}></i>
                </button>
              </div>
            </div>

            <div className="force-password-group">
              <label className="force-password-label">
                <i className="fas fa-lock"></i> New Password *
              </label>
              <div className="force-password-input-wrapper">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="force-password-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create a strong password (min. 8 characters)"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="force-password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={loading}
                >
                  <i className={`fas fa-eye${showNewPassword ? '' : '-slash'}`}></i>
                </button>
              </div>
              <div className="force-password-hint">
                <small>Use a mix of uppercase, lowercase, numbers, and symbols for better security</small>
              </div>
            </div>

            <div className="force-password-group">
              <label className="force-password-label">
                <i className="fas fa-check-circle"></i> Confirm Password *
              </label>
              <div className="force-password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="force-password-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="force-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  <i className={`fas fa-eye${showConfirmPassword ? '' : '-slash'}`}></i>
                </button>
              </div>
            </div>

            <div className="force-password-info">
              <i className="fas fa-info-circle"></i>
              <p>
                This is a required security step. Your temporary password must be changed before you can access the system.
              </p>
            </div>
          </div>

          <div className="force-password-footer">
            <button
              type="submit"
              className="force-password-btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Changing Password...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i> Change Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ForcePasswordChangeModal;
