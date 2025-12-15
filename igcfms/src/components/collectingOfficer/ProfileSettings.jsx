import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Chart from 'chart.js/auto';
import API_BASE_URL from "../../config/api";
import "./css/profilesettings.css";
import { useAuth } from "../../contexts/AuthContext";

const ProfileSettings = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [activityData, setActivityData] = useState([]);
  const [modalData, setModalData] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  // Placeholder to show dots representing existing password
  const passwordPlaceholder = "••••••••••••";

  const API_BASE = API_BASE_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUserProfile();
    fetchActivityData();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE}/user/profile`, { headers });
      const userData = response.data;
      setUser(userData);
      setProfileData(prev => ({
        ...prev,
        name: userData.name || "",
        email: userData.email || "",
      }));
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Use authUser as fallback
      if (authUser) {
        setUser(authUser);
        setProfileData(prev => ({
          ...prev,
          name: authUser.name || "",
          email: authUser.email || "",
        }));
      }
    }
  };

  const fetchActivityData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE}/transactions`, { headers });
      const transactions = response.data || [];
      
      // Get last 30 days of activity
      const dailyData = {};
      const now = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        dailyData[dateKey] = { collections: 0, disbursements: 0 };
      }

      transactions.forEach(tx => {
        const txDate = new Date(tx.created_at).toISOString().split('T')[0];
        if (dailyData[txDate]) {
          const amount = Math.abs(parseFloat(tx.amount || 0));
          if (tx.type === 'Collection') {
            dailyData[txDate].collections += amount;
          } else {
            dailyData[txDate].disbursements += amount;
          }
        }
      });

      setActivityData(Object.entries(dailyData).map(([date, data]) => ({
        date,
        ...data
      })));
    } catch (error) {
      console.error("Error fetching activity data:", error);
    }
  };


  // Initialize activity chart
  useEffect(() => {
    if (activityData.length > 0 && chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: activityData.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }),
          datasets: [
            {
              label: 'Collections',
              data: activityData.map(d => d.collections),
              borderColor: '#22c55e',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 4,
            },
            {
              label: 'Disbursements',
              data: activityData.map(d => d.disbursements),
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 4,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: '#1f2937',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: '#374151',
              borderWidth: 1,
              padding: 12,
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ₱${context.parsed.y.toLocaleString()}`;
                }
              }
            }
          },
          scales: {
            x: {
              display: true,
              grid: {
                display: false
              },
              ticks: {
                color: '#6b7280',
                font: { size: 10 },
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 8
              }
            },
            y: {
              display: false,
              beginAtZero: true
            }
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [activityData]);

  const handleUpdateClick = (e) => {
    if (e) e.preventDefault();
    // Initialize modal with current values
    setModalData({
      email: profileData.email,
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setShowModalPassword(false);
    setShowUpdateModal(true);
  };

  const handleModalUpdate = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const updateData = {
        name: profileData.name || displayUser?.name,
        email: modalData.email,
      };

      // If password is being changed
      if (modalData.newPassword) {
        if (modalData.newPassword !== modalData.confirmPassword) {
          setMessage({ type: "error", text: "New passwords do not match" });
          setLoading(false);
          return;
        }
        if (!modalData.currentPassword) {
          setMessage({ type: "error", text: "Current password is required to change password" });
          setLoading(false);
          return;
        }
        updateData.current_password = modalData.currentPassword;
        updateData.password = modalData.newPassword;
        updateData.password_confirmation = modalData.confirmPassword;
      }

      await axios.put(`${API_BASE}/user/profile`, updateData, { headers });
      setMessage({ type: "success", text: "Profile updated successfully" });
      
      // Update the main form data
      setProfileData(prev => ({
        ...prev,
        email: modalData.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
      
      setShowUpdateModal(false);
      fetchUserProfile();
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.message || "Failed to update profile" 
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const maskEmail = (email) => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (local.length <= 2) return email;
    return `${local.charAt(0)}${'*'.repeat(local.length - 2)}${local.charAt(local.length - 1)}@${domain}`;
  };

  const displayUser = user || authUser;


  return (
    <div className="co-profile-container">
      {message.text && (
        <div className={`co-profile-message ${message.type}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {message.text}
        </div>
      )}

      <div className="co-profile-grid">
        {/* Left Card - Profile Info */}
        <div className="co-profile-card co-profile-info-card">
          <div className="co-profile-avatar">
            {getInitials(displayUser?.name)}
          </div>
          <div className="co-profile-details">
            <h2 className="co-profile-name">{displayUser?.name || 'User'}</h2>
            <p className="co-profile-email">{displayUser?.email}</p>
            <span className="co-profile-role-badge">{displayUser?.role || 'Collecting Officer'}</span>
          </div>
        </div>

        {/* Right Card - Update Form */}
        <div className="co-profile-card co-profile-form-card">
          <form onSubmit={handleUpdateClick}>
            <div className="co-form-group">
              <label>Email:</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="co-form-group">
              <label>Password :</label>
              <div className="co-password-input-wrapper">
                <input
                  type="password"
                  value="••••••••••••"
                  readOnly
                  className="co-password-readonly"
                />
                <button 
                  type="button" 
                  className="co-password-toggle"
                  onClick={handleUpdateClick}
                  title="Click to change password"
                >
                  <i className="fas fa-pen"></i>
                </button>
              </div>
            </div>

            <button type="button" className="co-update-btn" disabled={loading} onClick={handleUpdateClick}>
              {loading ? "Updating..." : "Update"}
            </button>
          </form>
        </div>
      </div>

      {/* Update Modal with Form */}
      {showUpdateModal && (
        <div className="co-modal-overlay">
          <div className="co-modal co-modal-form">
            <div className="co-modal-header">
              <h3>Update Profile</h3>
              <button 
                className="co-modal-close" 
                onClick={() => setShowUpdateModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="co-modal-body">
              <div className="co-form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={modalData.email}
                  onChange={(e) => setModalData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="co-form-group">
                <label>New Password:</label>
                <div className="co-password-input-wrapper">
                  <input
                    type={showModalPassword ? "text" : "password"}
                    value={modalData.newPassword}
                    onChange={(e) => setModalData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                  />
                  <button 
                    type="button" 
                    className="co-password-toggle"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowModalPassword(!showModalPassword);
                    }}
                  >
                    <i className={`fas ${showModalPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {modalData.newPassword && (
                <>
                  <div className="co-form-group">
                    <label>Current Password:</label>
                    <input
                      type="password"
                      value={modalData.currentPassword}
                      onChange={(e) => setModalData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                  <div className="co-form-group">
                    <label>Confirm New Password:</label>
                    <input
                      type="password"
                      value={modalData.confirmPassword}
                      onChange={(e) => setModalData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                </>
              )}
            </div>
            <div className="co-modal-footer">
              <button 
                className="co-modal-btn co-modal-btn-cancel" 
                onClick={() => setShowUpdateModal(false)}
              >
                Cancel
              </button>
              <button 
                className="co-modal-btn co-modal-btn-confirm" 
                onClick={handleModalUpdate}
                disabled={loading}
              >
                {loading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Chart */}
      <div className="co-profile-card co-activity-card">
        <div className="co-activity-chart-container">
          <canvas ref={chartRef}></canvas>
        </div>
        <div className="co-activity-legend">
          <span className="co-legend-item">
            <span className="co-legend-color green"></span>
            Collections
          </span>
          <span className="co-legend-item">
            <span className="co-legend-color red"></span>
            Disbursements
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
