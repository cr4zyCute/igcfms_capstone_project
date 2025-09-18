import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './css/Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'Collecting Officer'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // try {
    //   const response = await api.post('/register', formData);
      
    //   setMessage(response.data.message);
    //   setFormData({
    //     name: '',
    //     email: '',
    //     password: '',
    //     password_confirmation: '',
    //     role: 'Collecting Officer'
    //   });
      
    //   // Optional: Redirect to login after successful registration
    //   setTimeout(() => {
    //     navigate('/login');
    //   }, 3000);
      
    // } catch (error) {
    //   if (error.response?.data?.errors) {
    //     const errors = Object.values(error.response.data.errors).flat();
    //     setMessage(errors.join(', '));
    //   } else {
    //     setMessage(error.response?.data?.message || 'Registration failed. Please try again.');
    //   }
    // } finally {
    //   setLoading(false);
    // }
    try {
  const response = await api.post('/register', formData);
  setMessage(response.data.message);

  if (response.status === 201) {
    // Only redirect if email sent successfully
    setTimeout(() => {
      navigate('/login');
    }, 3000);
  }
  
  setFormData({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'Collecting Officer'
  });

} catch (error) {
  if (error.response?.data?.errors) {
    const errors = Object.values(error.response.data.errors).flat();
    setMessage(errors.join(', '));
  } else {
    setMessage(error.response?.data?.message || 'Registration failed. Please try again.');
  }
} finally {
  setLoading(false);
}
  };

  return (
    <div className="register-container">
      <div className="register-card">
        {/* Form Section */}
        <div className="register-form">
          <div className="register-header">
            <h2>Create Account</h2>
            <p className="register-subtitle">
              Join our Internal Government Collection and Financial Management System
            </p>
          </div>

          {message && (
            <div className={`register-message ${
              message.includes('submitted') || message.includes('success') ? 'success' : 'error'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="role" className="form-label">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="Collecting Officer">Collecting Officer</option>
                <option value="Disbursing Officer">Disbursing Officer</option>
                <option value="Cashier">Cashier</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password_confirmation" className="form-label">
                  Confirm Password
                </label>
                <input
                  id="password_confirmation"
                  name="password_confirmation"
                  type="password"
                  required
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <button type="submit" disabled={loading}>
              {loading && <span className="loading-spinner"></span>}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="login-link">
              <p>Already have an account? {' '}
                <Link to="/login">Sign in here</Link>
              </p>
            </div>
          </form>
        </div>

        {/* Info Panel */}
        <div className="register-info">
          <div className="info-content">
            <h3 className="info-title">Welcome to IGCFMS</h3>
            <p className="info-description">
              Streamline your government financial operations with our comprehensive management system.
            </p>
            <ul className="info-features">
              <li>Secure financial data management</li>
              <li>Real-time collection tracking</li>
              <li>Automated disbursement processes</li>
              <li>Comprehensive reporting tools</li>
              <li>Multi-role access control</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;