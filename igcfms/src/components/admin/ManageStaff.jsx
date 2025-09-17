import React, { useState, useEffect } from "react";
import "../../assets/admin.css";
import { getUsers, createUser, toggleUserStatus } from "../../services/api";

const ManageStaff = () => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    role: "Cashier",
    password: "",
  });

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

  const handleToggleStatus = async (id) => {
    try {
      await toggleUserStatus(id);
      setSuccess("Staff status updated successfully!");
      fetchStaffMembers();
    } catch (err) {
      setError("Failed to update staff status. Please try again.");
      console.error("Error updating staff status:", err);
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner" aria-label="Loading staff members" />
      </div>
    );
  }

  return (
    <div className="staff-management">
      <div className="section-header">
        <h3>Staff Management</h3>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddStaff(true)}
          disabled={loading}
        >
          Add New Staff
        </button>
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
            {staffMembers.length > 0 ? (
              staffMembers.map((staff) => (
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
