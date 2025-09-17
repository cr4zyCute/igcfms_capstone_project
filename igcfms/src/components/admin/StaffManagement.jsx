
import React, { useState } from "react";
import "../../assets/admin.css";

const StaffManagement = () => {
  const [staffMembers, setStaffMembers] = useState([
    {
      id: 1,
      name: "John Doe",
      role: "cashier",
      email: "john@example.com",
      status: "active",
    },
    {
      id: 2,
      name: "Jane Smith",
      role: "collecting_officer",
      email: "jane@example.com",
      status: "active",
    },
    {
      id: 3,
      name: "Robert Johnson",
      role: "disbursing_officer",
      email: "robert@example.com",
      status: "inactive",
    },
  ]);

  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    role: "cashier",
    password: "",
  });

  const handleAddStaff = (e) => {
    e.preventDefault();
    const newStaffMember = {
      id: staffMembers.length + 1,
      name: newStaff.name,
      email: newStaff.email,
      role: newStaff.role,
      status: "active",
    };

    setStaffMembers([...staffMembers, newStaffMember]);
    setNewStaff({ name: "", email: "", role: "cashier", password: "" });
    setShowAddStaff(false);
  };

  const toggleStaffStatus = (id) => {
    setStaffMembers(
      staffMembers.map((staff) =>
        staff.id === id
          ? {
              ...staff,
              status: staff.status === "active" ? "inactive" : "active",
            }
          : staff
      )
    );
  };

  return (
    <div className="staff-management">
      <div className="section-header">
        <h3>Staff Management</h3>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddStaff(true)}
        >
          Add New Staff
        </button>
      </div>

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
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newStaff.role}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, role: e.target.value })
                  }
                >
                  <option value="cashier">Cashier</option>
                  <option value="collecting_officer">Collecting Officer</option>
                  <option value="disbursing_officer">Disbursing Officer</option>
                  <option value="admin">Administrator</option>
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
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddStaff(false)}>
                  Cancel
                </button>
                <button type="submit">Add Staff</button>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffMembers.map((staff) => (
              <tr key={staff.id}>
                <td>{staff.id}</td>
                <td>{staff.name}</td>
                <td>{staff.email}</td>
                <td>{staff.role}</td>
                <td>
                  <span className={`status-badge ${staff.status}`}>
                    {staff.status}
                  </span>
                </td>
                <td>
                  <button
                    className={`btn ${
                      staff.status === "active" ? "btn-warning" : "btn-success"
                    }`}
                    onClick={() => toggleStaffStatus(staff.id)}
                  >
                    {staff.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                  <button className="btn btn-info">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffManagement;
