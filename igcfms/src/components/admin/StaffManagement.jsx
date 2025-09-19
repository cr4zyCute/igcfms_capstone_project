
import React, { useState, useEffect } from "react";
import "./css/staffmanagement.css";

const StaffManagement = () => {
  const [staffMembers, setStaffMembers] = useState([
    {
      id: 1,
      name: "John Doe",
      role: "Cashier",
      email: "john@example.com",
      status: "active",
      phone: "+1234567890",
      department: "Finance",
      joinDate: "2024-01-15",
    },
    {
      id: 2,
      name: "Jane Smith",
      role: "Collecting Officer",
      email: "jane@example.com",
      status: "active",
      phone: "+1234567891",
      department: "Revenue",
      joinDate: "2024-02-20",
    },
    {
      id: 3,
      name: "Robert Johnson",
      role: "Disbursing Officer",
      email: "robert@example.com",
      status: "inactive",
      phone: "+1234567892",
      department: "Finance",
      joinDate: "2024-01-10",
    },
    {
      id: 4,
      name: "Sarah Wilson",
      role: "Admin",
      email: "sarah@example.com",
      status: "active",
      phone: "+1234567893",
      department: "Administration",
      joinDate: "2023-12-01",
    },
  ]);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Cashier",
    password: "",
    phone: "",
    department: "Finance",
  });
  
  // Other States
  const [editingStaff, setEditingStaff] = useState(null);
  const [deletingStaff, setDeletingStaff] = useState(null);
  const [notification, setNotification] = useState({
    type: "success",
    title: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Utility Functions
  const showNotification = (type, title, message) => {
    setNotification({ type, title, message });
    setShowNotificationModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "Cashier",
      password: "",
      phone: "",
      department: "Finance",
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.email.includes("@")) newErrors.email = "Valid email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!editingStaff && !formData.password.trim()) newErrors.password = "Password is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // CRUD Operations
  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    
    setTimeout(() => {
      const newStaff = {
        id: Math.max(...staffMembers.map(s => s.id)) + 1,
        ...formData,
        status: "active",
        joinDate: new Date().toISOString().split('T')[0],
      };

      setStaffMembers([...staffMembers, newStaff]);
      setShowAddModal(false);
      resetForm();
      setLoading(false);
      showNotification("success", "Staff Added", `${formData.name} has been successfully added to the system.`);
    }, 1000);
  };

  const handleEditStaff = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    
    setTimeout(() => {
      setStaffMembers(staffMembers.map(staff => 
        staff.id === editingStaff.id 
          ? { ...staff, ...formData }
          : staff
      ));
      
      setShowEditModal(false);
      setEditingStaff(null);
      resetForm();
      setLoading(false);
      showNotification("success", "Staff Updated", `${formData.name}'s information has been successfully updated.`);
    }, 1000);
  };

  const handleDeleteStaff = () => {
    setLoading(true);
    
    setTimeout(() => {
      setStaffMembers(staffMembers.filter(staff => staff.id !== deletingStaff.id));
      setShowDeleteModal(false);
      setDeletingStaff(null);
      setLoading(false);
      showNotification("success", "Staff Deleted", `${deletingStaff.name} has been removed from the system.`);
    }, 1000);
  };

  const toggleStaffStatus = (staff) => {
    const newStatus = staff.status === "active" ? "inactive" : "active";
    
    setStaffMembers(staffMembers.map(s => 
      s.id === staff.id 
        ? { ...s, status: newStatus }
        : s
    ));
    
    showNotification(
      "success", 
      "Status Updated", 
      `${staff.name} has been ${newStatus === "active" ? "activated" : "deactivated"}.`
    );
  };

  // Modal Handlers
  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      email: staff.email,
      role: staff.role,
      password: "",
      phone: staff.phone,
      department: staff.department,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (staff) => {
    setDeletingStaff(staff);
    setShowDeleteModal(true);
  };

  // Calculate Stats
  const stats = {
    total: staffMembers.length,
    active: staffMembers.filter(s => s.status === "active").length,
    inactive: staffMembers.filter(s => s.status === "inactive").length,
    admins: staffMembers.filter(s => s.role === "Admin").length,
  };

  return (
    <div className="staff-management-page">
      {/* Header Section */}
      <div className="staff-header">
        <div>
          <h2 className="staff-title">
            <i className="fas fa-users"></i> Staff Management
          </h2>
          <p className="staff-subtitle">
            Manage system users, roles, and permissions
          </p>
        </div>
        <button className="add-staff-btn" onClick={openAddModal}>
          <i className="fas fa-plus"></i> Add New Staff
        </button>
      </div>

      {/* Stats Cards */}
      <div className="staff-stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Staff</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <i className="fas fa-user-check"></i>
          </div>
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Active Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon inactive">
            <i className="fas fa-user-times"></i>
          </div>
          <div className="stat-value">{stats.inactive}</div>
          <div className="stat-label">Inactive Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon admin">
            <i className="fas fa-user-shield"></i>
          </div>
          <div className="stat-value">{stats.admins}</div>
          <div className="stat-label">Administrators</div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="staff-table-container">
        <div className="staff-table-header">
          <h3 className="table-title">
            <i className="fas fa-table"></i> Staff Directory
          </h3>
        </div>
        <table className="staff-table">
          <thead>
            <tr>
              <th><i className="fas fa-hashtag"></i> ID</th>
              <th><i className="fas fa-user"></i> Name</th>
              <th><i className="fas fa-envelope"></i> Email</th>
              <th><i className="fas fa-phone"></i> Phone</th>
              <th><i className="fas fa-briefcase"></i> Role</th>
              <th><i className="fas fa-building"></i> Department</th>
              <th><i className="fas fa-toggle-on"></i> Status</th>
              <th><i className="fas fa-calendar"></i> Join Date</th>
              <th><i className="fas fa-cogs"></i> Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffMembers.map((staff) => (
              <tr key={staff.id}>
                <td>#{staff.id}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#007bff',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      {staff.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <strong>{staff.name}</strong>
                  </div>
                </td>
                <td>{staff.email}</td>
                <td>{staff.phone}</td>
                <td>
                  <span className={`role-badge ${staff.role.toLowerCase().replace(' ', '_')}`}>
                    {staff.role}
                  </span>
                </td>
                <td>{staff.department}</td>
                <td>
                  <span className={`status-badge ${staff.status}`}>
                    {staff.status}
                  </span>
                </td>
                <td>{new Date(staff.joinDate).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => openEditModal(staff)}
                      title="Edit Staff"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className={`action-btn toggle-btn ${staff.status === "inactive" ? "activate" : ""}`}
                      onClick={() => toggleStaffStatus(staff)}
                      title={staff.status === "active" ? "Deactivate" : "Activate"}
                    >
                      <i className={`fas fa-${staff.status === "active" ? "user-times" : "user-check"}`}></i>
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => openDeleteModal(staff)}
                      title="Delete Staff"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-user-plus"></i> Add New Staff Member
              </h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddStaff}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className={`form-input ${errors.name ? 'error' : ''}`}
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter full name"
                    />
                    {errors.name && <div className="form-error">{errors.name}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className={`form-input ${errors.email ? 'error' : ''}`}
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="Enter email address"
                    />
                    {errors.email && <div className="form-error">{errors.email}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      className={`form-input ${errors.phone ? 'error' : ''}`}
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                    {errors.phone && <div className="form-error">{errors.phone}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role *</label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="Cashier">Cashier</option>
                      <option value="Collecting Officer">Collecting Officer</option>
                      <option value="Disbursing Officer">Disbursing Officer</option>
                      <option value="Admin">Administrator</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <select
                      className="form-select"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                    >
                      <option value="Finance">Finance</option>
                      <option value="Revenue">Revenue</option>
                      <option value="Administration">Administration</option>
                      <option value="Operations">Operations</option>
                      <option value="IT">IT</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Password *</label>
                    <input
                      type="password"
                      className={`form-input ${errors.password ? 'error' : ''}`}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Enter password"
                    />
                    {errors.password && <div className="form-error">{errors.password}</div>}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  <i className="fas fa-times"></i> Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>}
                  {loading ? 'Adding...' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-user-edit"></i> Edit Staff Member
              </h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleEditStaff}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className={`form-input ${errors.name ? 'error' : ''}`}
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter full name"
                    />
                    {errors.name && <div className="form-error">{errors.name}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className={`form-input ${errors.email ? 'error' : ''}`}
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="Enter email address"
                    />
                    {errors.email && <div className="form-error">{errors.email}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      className={`form-input ${errors.phone ? 'error' : ''}`}
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                    {errors.phone && <div className="form-error">{errors.phone}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role *</label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="Cashier">Cashier</option>
                      <option value="Collecting Officer">Collecting Officer</option>
                      <option value="Disbursing Officer">Disbursing Officer</option>
                      <option value="Admin">Administrator</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <select
                      className="form-select"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                    >
                      <option value="Finance">Finance</option>
                      <option value="Revenue">Revenue</option>
                      <option value="Administration">Administration</option>
                      <option value="Operations">Operations</option>
                      <option value="IT">IT</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">New Password (leave blank to keep current)</label>
                    <input
                      type="password"
                      className="form-input"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Enter new password (optional)"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  <i className="fas fa-times"></i> Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                  {loading ? 'Updating...' : 'Update Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingStaff && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-exclamation-triangle" style={{color: '#dc3545'}}></i> Confirm Delete
              </h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{deletingStaff.name}</strong>?</p>
              <p style={{color: '#dc3545', fontSize: '14px'}}>
                <i className="fas fa-warning"></i> This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                <i className="fas fa-times"></i> Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteStaff} disabled={loading}>
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash"></i>}
                {loading ? 'Deleting...' : 'Delete Staff'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="modal-overlay" onClick={() => setShowNotificationModal(false)}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-header">
              <div className={`notification-icon ${notification.type}`}>
                <i className={`fas fa-${notification.type === 'success' ? 'check-circle' : notification.type === 'error' ? 'times-circle' : 'exclamation-triangle'}`}></i>
              </div>
              <h3 className="notification-title">{notification.title}</h3>
              <p className="notification-message">{notification.message}</p>
            </div>
            <div className="notification-footer">
              <button className="btn btn-primary" onClick={() => setShowNotificationModal(false)}>
                <i className="fas fa-check"></i> OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
