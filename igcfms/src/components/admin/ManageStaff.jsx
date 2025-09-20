import React, { useState, useEffect } from "react";
import "../../assets/admin.css";
import { getUsers, createUser, toggleUserStatus } from "../../services/api";

const ManageStaff = () => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showEditStaff, setShowEditStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [editingStaff, setEditingStaff] = useState(null);

  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    role: "Cashier",
    password: "",
  });

  const roles = ["Admin", "Cashier", "Collecting Officer", "Disbursing Officer"];

  useEffect(() => {
    fetchStaffMembers();
  }, []);

  const fetchStaffMembers = async () => {
    try {
      setLoading(true);
      const users = await getUsers(); // already returns data array
      setStaffMembers(users);
      setError("");
    } catch (err) {
      setError("Failed to fetch staff members. Please try again.");
      console.error("Error fetching staff:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createUser(newStaff);
      setSuccess("Staff member added successfully!");
      setNewStaff({ name: "", email: "", role: "Cashier", password: "" });
      setShowAddStaff(false);
      fetchStaffMembers(); // Refresh the list
    } catch (err) {
      setError("Failed to add staff member. Please try again.");
      console.error("Error adding staff:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await toggleUserStatus(userId);
      setSuccess("Staff status updated successfully!");
      fetchStaffMembers(); // Refresh the list
    } catch (err) {
      setError("Failed to update staff status. Please try again.");
      console.error("Error toggling status:", err);
    }
  };

  const handleEditStaff = (staff) => {
    setEditingStaff(staff);
    setNewStaff({
      name: staff.name,
      email: staff.email,
      role: staff.role,
      password: "",
    });
    setShowEditStaff(true);
  };

  // Filter and search functionality
  const filteredStaff = staffMembers.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || staff.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getStaffStats = () => {
    return {
      total: staffMembers.length,
      active: staffMembers.filter((s) => s.status === "active").length,
      admin: staffMembers.filter((s) => s.role === "Admin").length,
      cashier: staffMembers.filter((s) => s.role === "Cashier").length,
      collector: staffMembers.filter((s) => s.role === "Collecting Officer").length,
      disburser: staffMembers.filter((s) => s.role === "Disbursing Officer").length,
    };
  };

  const stats = getStaffStats();

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner" aria-label="Loading staff members" />
      </div>
    );
  }

  return (
    <div className="staff-management">
      {/* Header Section */}
      <div className="funds-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="header-title">
              <i className="fas fa-users-cog"></i>
              Staff Management
            </h1>
            <p className="header-subtitle">
              Manage system users, roles, and access permissions
            </p>
          </div>
        </div>
        <button className="add-recipient-btn" onClick={() => setShowAddStaff(true)}>
          <i className="fas fa-user-plus"></i> Add New Staff
        </button>
      </div>

      {/* Stats Cards */}
      <div className="recipient-stats">
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
          <div className="stat-icon admin">
            <i className="fas fa-user-shield"></i>
          </div>
          <div className="stat-value">{stats.admin}</div>
          <div className="stat-label">Administrators</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cashier">
            <i className="fas fa-cash-register"></i>
          </div>
          <div className="stat-value">{stats.cashier}</div>
          <div className="stat-label">Cashiers</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search staff by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-dropdown">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showAddStaff && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>Add New Staff Member</h4>
            <form onSubmit={handleAddStaff}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={newStaff.name}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, name: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, email: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newStaff.role}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, role: e.target.value })
                  }
                  disabled={loading}
                >
                  <option value="Cashier">Cashier</option>
                  <option value="Collecting Officer">Collecting Officer</option>
                  <option value="Disbursing Officer">Disbursing Officer</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={newStaff.password}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, password: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowAddStaff(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="staff-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.length > 0 ? (
              filteredStaff.map((staff) => (
                <tr key={staff.id}>
                  <td>{staff.id}</td>
                  <td>{staff.name}</td>
                  <td>{staff.email}</td>
                  <td>
                    <span className="role-badge">{staff.role}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${staff.status}`}>
                      {staff.status}
                    </span>
                  </td>
                  <td>
                    {staff.last_login
                      ? new Date(staff.last_login).toLocaleString()
                      : "Never"}
                  </td>
                  <td>
                    <button
                      className={`btn ${
                        staff.status === "active"
                          ? "btn-warning"
                          : "btn-success"
                      }`}
                      onClick={() => handleToggleStatus(staff.id)}
                      disabled={loading}
                    >
                      {staff.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  No staff members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageStaff;
