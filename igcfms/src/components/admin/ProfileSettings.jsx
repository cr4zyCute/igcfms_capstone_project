import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/profilesettings.css";

const ProfileSettings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [activeSection, setActiveSection] = useState("profile-settings");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Profile form data
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // System settings data
  const [systemSettings, setSystemSettings] = useState({
    systemName: "IGCFMS",
    timezone: "Asia/Manila",
    dateFormat: "DD/MM/YYYY",
    currency: "PHP",
    language: "en",
    sessionTimeout: 30,
    passwordMinLength: 8,
    maxLoginAttempts: 5,
    twoFactorAuth: false,
    emailNotifications: true,
    auditLogRetention: 365
  });

  const API_BASE = "http://localhost:8000/api";
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUserProfile();
    fetchSystemSettings();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE}/user/profile`, { headers });
      const userData = response.data;
      setUser(userData);
      setProfileData({
        name: userData.name || "",
        email: userData.email || "",
        role: userData.role || "",
        department: userData.department || "",
        phone: userData.phone || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      if (error.response?.status === 404) {
        setMessage({ type: "error", text: "Profile endpoint not found. Please contact administrator." });
      } else if (error.response?.status === 401) {
        setMessage({ type: "error", text: "Authentication failed. Please login again." });
        // Optionally redirect to login
      } else {
        setMessage({ type: "error", text: "Failed to load profile data. Please try again later." });
      }
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE}/system/settings`, { headers });
      if (response.data) {
        setSystemSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error("Error fetching system settings:", error);
      if (error.response?.status === 404) {
        console.warn("System settings endpoint not found, using default values");
        // Keep default values, no error message for system settings
      } else if (error.response?.status === 401) {
        setMessage({ type: "error", text: "Authentication failed. Please login again." });
      } else {
        console.warn("Failed to load system settings, using defaults");
      }
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const updateData = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        department: profileData.department
      };

      // If password is being changed
      if (profileData.newPassword) {
        if (profileData.newPassword !== profileData.confirmPassword) {
          setMessage({ type: "error", text: "New passwords do not match" });
          setLoading(false);
          return;
        }
        if (!profileData.currentPassword) {
          setMessage({ type: "error", text: "Current password is required to change password" });
          setLoading(false);
          return;
        }
        updateData.current_password = profileData.currentPassword;
        updateData.password = profileData.newPassword;
        updateData.password_confirmation = profileData.confirmPassword;
      }

      await axios.put(`${API_BASE}/user/profile`, updateData, { headers });
      setMessage({ type: "success", text: "Profile updated successfully" });
      
      // Clear password fields
      setProfileData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
      
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

  const handleSystemSettingsUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API_BASE}/system/settings`, systemSettings, { headers });
      setMessage({ type: "success", text: "System settings updated successfully" });
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.message || "Failed to update system settings" 
      });
    } finally {
      setLoading(false);
    }
  };

  const renderProfileSection = () => (
    <div className="settings-content">
      <div className="settings-header">
        <h2>Profile Settings</h2>
        <p>Manage your account information and security settings</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {message.text}
        </div>
      )}

      <form onSubmit={handleProfileUpdate} className="settings-form">
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Department</label>
              <select
                value={profileData.department}
                onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
              >
                <option value="">Select Department</option>
                <option value="Finance">Finance</option>
                <option value="Administration">Administration</option>
                <option value="Operations">Operations</option>
                <option value="HR">Human Resources</option>
                <option value="IT">Information Technology</option>
                <option value="Legal">Legal</option>
                <option value="Procurement">Procurement</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Account Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Role</label>
              <input
                type="text"
                value={profileData.role}
                disabled
                className="disabled-input"
              />
              <small>Contact administrator to change your role</small>
            </div>
            <div className="form-group">
              <label>Account Status</label>
              <div className="status-badge active">
                <i className="fas fa-check-circle"></i>
                Active
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Change Password</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={profileData.currentPassword}
                onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Enter current password"
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={profileData.newPassword}
                onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter new password"
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={profileData.confirmPassword}
                onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            <i className="fas fa-save"></i>
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </div>
      </form>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="settings-content">
      <div className="settings-header">
        <h2>System Settings</h2>
        <p>Configure system-wide preferences and security settings</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSystemSettingsUpdate} className="settings-form">
        <div className="form-section">
          <h3>General Settings</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>System Name</label>
              <input
                type="text"
                value={systemSettings.systemName}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, systemName: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Time Zone</label>
              <select
                value={systemSettings.timezone}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, timezone: e.target.value }))}
              >
                <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                <option value="UTC">UTC (GMT+0)</option>
                <option value="America/New_York">America/New_York (GMT-5)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date Format</label>
              <select
                value={systemSettings.dateFormat}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div className="form-group">
              <label>Currency</label>
              <select
                value={systemSettings.currency}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, currency: e.target.value }))}
              >
                <option value="PHP">Philippine Peso (₱)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Security Settings</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Session Timeout (minutes)</label>
              <input
                type="number"
                value={systemSettings.sessionTimeout}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                min="5"
                max="480"
              />
            </div>
            <div className="form-group">
              <label>Password Minimum Length</label>
              <input
                type="number"
                value={systemSettings.passwordMinLength}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
                min="6"
                max="20"
              />
            </div>
            <div className="form-group">
              <label>Max Login Attempts</label>
              <input
                type="number"
                value={systemSettings.maxLoginAttempts}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                min="3"
                max="10"
              />
            </div>
            <div className="form-group">
              <label>Audit Log Retention (days)</label>
              <input
                type="number"
                value={systemSettings.auditLogRetention}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, auditLogRetention: parseInt(e.target.value) }))}
                min="30"
                max="3650"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Feature Settings</h3>
          <div className="form-grid">
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={systemSettings.twoFactorAuth}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, twoFactorAuth: e.target.checked }))}
                />
                <span className="checkmark"></span>
                Enable Two-Factor Authentication
              </label>
            </div>
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={systemSettings.emailNotifications}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                />
                <span className="checkmark"></span>
                Enable Email Notifications
              </label>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            <i className="fas fa-save"></i>
            {loading ? "Updating..." : "Update Settings"}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="profile-settings-container">
      <div className="settings-layout">
        {/* Left Sidebar */}
        <div className="settings-sidebar">
          <div className="sidebar-header">
            <h2>Settings</h2>
          </div>
          
          <div className="sidebar-nav">
            <button
              className={`nav-item ${activeSection === "profile-settings" ? "active" : ""}`}
              onClick={() => setActiveSection("profile-settings")}
            >
              <i className="fas fa-user"></i>
              Profile Settings
            </button>
            <button
              className={`nav-item ${activeSection === "system-settings" ? "active" : ""}`}
              onClick={() => setActiveSection("system-settings")}
            >
              <i className="fas fa-cog"></i>
              System Settings
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="settings-main">
          {activeSection === "profile-settings" && renderProfileSection()}
          {activeSection === "system-settings" && renderSystemSettings()}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
