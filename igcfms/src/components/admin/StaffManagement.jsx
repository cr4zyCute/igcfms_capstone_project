
import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import "./css/staffmanagement.css";
import Chart from "chart.js/auto";
import {
  useStaffMembers,
  useCreateStaff,
  useUpdateStaff,
  useToggleStaffStatus,
  useDeleteStaff,
} from "../../hooks/useStaffManagement";

const StaffManagement = () => {
  const chartRefs = useRef({ pie: null, newUsers: null, activeTrend: null });

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
  const [errors, setErrors] = useState({});
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // TanStack Query hooks
  const { 
    data: rawStaffData = [], 
    isLoading: staffLoading, 
    error: staffError 
  } = useStaffMembers();

  const createStaffMutation = useCreateStaff();
  const updateStaffMutation = useUpdateStaff();
  const toggleStatusMutation = useToggleStaffStatus();
  const deleteStaffMutation = useDeleteStaff();

  const loading = staffLoading || createStaffMutation.isPending || updateStaffMutation.isPending || 
                  toggleStatusMutation.isPending || deleteStaffMutation.isPending;

  // Data loading
  const mapUserToStaff = (u, idx) => {
    const statusFromBool = (val) => (val ? "active" : "inactive");
    let status = "active";
    if (typeof u?.status === "string") status = u.status.toLowerCase();
    else if (typeof u?.is_active !== "undefined") status = statusFromBool(u.is_active);
    else if (typeof u?.active !== "undefined") status = statusFromBool(u.active);

    const nameFromParts = `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.trim();

    return {
      id: u?.id ?? u?.user_id ?? idx + 1,
      name: u?.name || nameFromParts || (u?.email ? u.email.split("@")[0] : "Unknown"),
      role: u?.role || u?.user_role || "Staff",
      email: u?.email || "",
      status,
      phone: u?.phone || u?.contact_number || "",
      department: u?.department || u?.department_name || "",
      joinDate: u?.joinDate || u?.created_at || u?.join_date || new Date().toISOString(),
    };
  };

  // Map raw staff data
  const staffMembers = useMemo(() => {
    const list = Array.isArray(rawStaffData) ? rawStaffData : rawStaffData?.data || [];
    return list.map(mapUserToStaff);
  }, [rawStaffData]);

  const getInitials = (value = "") => {
    const initials = value
      .split(" ")
      .filter(Boolean)
      .map((segment) => segment[0]?.toUpperCase())
      .slice(0, 2)
      .join("");
    return initials || "ST";
  };

  const handleActionMenuToggle = (event, staffId) => {
    event.stopPropagation();
    setOpenActionMenuId((prev) => (prev === staffId ? null : staffId));
  };

  useEffect(() => {
    if (openActionMenuId === null) return;

    const handleClickOutside = () => setOpenActionMenuId(null);
    const handleKeydown = (event) => {
      if (event.key === "Escape") setOpenActionMenuId(null);
    };

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [openActionMenuId]);

  // Add modal-open class to body when any modal is open
  useEffect(() => {
    if (showAddModal || showEditModal || showDeleteModal || showNotificationModal) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [showAddModal, showEditModal, showDeleteModal, showNotificationModal]);

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
  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        password: formData.password,
        phone: formData.phone,
        department: formData.department,
      };
      await createStaffMutation.mutateAsync(payload);
      setShowAddModal(false);
      resetForm();
      showNotification("success", "Staff Added", `${formData.name} has been successfully added to the system.`);
    } catch (err) {
      console.error("Add staff error", err);
      showNotification("error", "Add Failed", "Unable to add staff. Please try again.");
    }
  };

  const handleEditStaff = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone,
        department: formData.department,
      };
      if (formData.password && formData.password.trim()) {
        payload.password = formData.password;
      }
      await updateStaffMutation.mutateAsync({ id: editingStaff.id, data: payload });
      setShowEditModal(false);
      setEditingStaff(null);
      resetForm();
      showNotification("success", "Staff Updated", `${formData.name}'s information has been successfully updated.`);
    } catch (err) {
      console.error("Edit staff error", err);
      showNotification("error", "Update Failed", "Unable to update staff. Please try again.");
    }
  };

  const handleDeleteStaff = async () => {
    const name = deletingStaff?.name || "Staff";
    try {
      await deleteStaffMutation.mutateAsync(deletingStaff.id);
      setShowDeleteModal(false);
      setDeletingStaff(null);
      showNotification("success", "Staff Deleted", `${name} has been removed from the system.`);
    } catch (err) {
      console.error("Delete staff error", err);
      showNotification("error", "Delete Failed", `Unable to delete ${name}. Please try again.`);
    }
  };

  const toggleStaffStatus = async (staff) => {
    const newStatus = staff.status === "active" ? "inactive" : "active";
    try {
      await toggleStatusMutation.mutateAsync(staff.id);
      showNotification(
        "success",
        "Status Updated",
        `${staff.name} has been ${newStatus === "active" ? "activated" : "deactivated"}.`
      );
    } catch (err) {
      console.error("Toggle status error", err);
      showNotification("error", "Update Failed", `Unable to update status for ${staff.name}.`);
    }
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

  // KPI Data (structured JSON) for charts and summaries
  const kpiData = useMemo(() => {
    const total = staffMembers.length;
    const active = staffMembers.filter(s => s.status === 'active').length;
    const inactive = staffMembers.filter(s => s.status === 'inactive').length;
    const suspended = staffMembers.filter(s => s.status === 'suspended').length;

    const toDate = (val) => {
      const d = new Date(val);
      return isNaN(d) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };
    const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const addMonths = (d, m) => new Date(d.getFullYear(), d.getMonth() + m, 1);
    const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = (d) => d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

    const joinDates = staffMembers
      .map(s => ({ date: toDate(s.joinDate), status: s.status }))
      .filter(x => !!x.date);

    const now = new Date();
    const end = startOfMonth(now);
    const start = addMonths(end, -11); // last 12 months
    const months = [];
    for (let d = new Date(start); d <= end; d = addMonths(d, 1)) {
      months.push(new Date(d));
    }

    // New users per month
    const newUsersSeries = months.map(m => {
      const key = monthKey(m);
      return joinDates.filter(j => monthKey(startOfMonth(j.date)) === key).length;
    });

    // Active users trend (count of users with status 'active' and joined on or before month end)
    const activeUsersSeries = months.map(m => {
      const eom = endOfMonth(m);
      return joinDates.filter(j => j.status === 'active' && j.date <= eom).length;
    });

    const labels = months.map(monthLabel);

    return {
      totals: { users: total },
      statusDistribution: [
        { status: 'Active', count: active, percentage: total ? Math.round((active / total) * 100) : 0, color: '#111111' },
        { status: 'Inactive', count: inactive, percentage: total ? Math.round((inactive / total) * 100) : 0, color: '#bdbdbd' },
        { status: 'Suspended', count: suspended, percentage: total ? Math.round((suspended / total) * 100) : 0, color: '#6d6d6d' },
      ],
      newUsersOverTime: {
        granularity: 'monthly',
        labels,
        series: newUsersSeries,
        points: labels.map((l, i) => ({ date: l, count: newUsersSeries[i] })),
      },
      activeUsersTrend: {
        granularity: 'monthly',
        labels,
        series: activeUsersSeries,
        points: labels.map((l, i) => ({ date: l, count: activeUsersSeries[i] })),
      },
    };
  }, [staffMembers]);

  // Render KPI Charts with Chart.js
  useEffect(() => {
    const getCtx = (id) => {
      const canvas = document.getElementById(id);
      return canvas ? canvas.getContext('2d') : null;
    };

    // Pie: User Status Distribution
    const pieCtx = getCtx('um-status-pie-canvas');
    if (pieCtx) {
      if (chartRefs.current.pie) chartRefs.current.pie.destroy();
      const labels = kpiData.statusDistribution.map((s) => s.status);
      const data = kpiData.statusDistribution.map((s) => s.count);
      const colors = kpiData.statusDistribution.map((s) => s.color);
      chartRefs.current.pie = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data,
              backgroundColor: colors,
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '60%',
          plugins: {
            legend: { display: false },
          },
        },
      });
    }

    // Line: New Users Over Time
    const newUsersCtx = getCtx('um-new-users-canvas');
    if (newUsersCtx) {
      if (chartRefs.current.newUsers) chartRefs.current.newUsers.destroy();
      const gradientFill = newUsersCtx.createLinearGradient(
        0,
        0,
        0,
        newUsersCtx.canvas?.clientHeight || 220
      );
      gradientFill.addColorStop(0, 'rgba(17, 17, 17, 0.42)');
      gradientFill.addColorStop(1, 'rgba(17, 17, 17, 0.08)');

      const borderGradient = newUsersCtx.createLinearGradient(
        0,
        0,
        newUsersCtx.canvas?.clientWidth || 320,
        0
      );
      borderGradient.addColorStop(0, '#0f0f0f');
      borderGradient.addColorStop(1, '#3a3a3a');

      chartRefs.current.newUsers = new Chart(newUsersCtx, {
        type: 'line',
        data: {
          labels: kpiData.newUsersOverTime.labels,
          datasets: [
            {
              label: 'New Users',
              data: kpiData.newUsersOverTime.series,
              borderColor: borderGradient,
              backgroundColor: gradientFill,
              borderWidth: 3,
              fill: 'start',
              tension: 0,
              pointRadius: 0,
              pointHoverRadius: 6,
              pointBackgroundColor: '#111111',
              pointBorderColor: '#f5f5f5',
              pointBorderWidth: 2,
              pointHitRadius: 12,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: { top: 16, bottom: 10, left: 10, right: 16 },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#111111',
              titleColor: '#f5f5f5',
              bodyColor: '#d9d9d9',
              borderColor: '#333333',
              borderWidth: 1,
              padding: 10,
              cornerRadius: 8,
              displayColors: false,
              callbacks: {
                title: (context) => context[0].label,
                label: (context) => `New users: ${context.parsed.y}`,
              },
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(0, 0, 0, 0.08)', drawBorder: false },
              ticks: {
                color: '#1a1a1a',
                font: { size: 11, weight: '600' },
                maxRotation: 0,
                minRotation: 0,
              },
            },
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
                color: '#1a1a1a',
                font: { size: 11, weight: '600' },
                padding: 8,
              },
              grid: { color: 'rgba(0, 0, 0, 0.08)', drawBorder: false },
            },
          },
          elements: {
            line: {
              borderJoinStyle: 'round',
            },
          },
          interaction: {
            intersect: false,
            mode: 'index',
          },
        },
      });
    }

    // Line: Active Users Trend
    const activeTrendCtx = getCtx('um-active-trend-canvas');
    if (activeTrendCtx) {
      if (chartRefs.current.activeTrend) chartRefs.current.activeTrend.destroy();
      const gradientFill = activeTrendCtx.createLinearGradient(
        0,
        0,
        0,
        activeTrendCtx.canvas?.clientHeight || 240
      );
      gradientFill.addColorStop(0, 'rgba(34, 34, 34, 0.38)');
      gradientFill.addColorStop(1, 'rgba(34, 34, 34, 0.08)');

      const borderGradient = activeTrendCtx.createLinearGradient(
        0,
        0,
        activeTrendCtx.canvas?.clientWidth || 360,
        0
      );
      borderGradient.addColorStop(0, '#1a1a1a');
      borderGradient.addColorStop(1, '#4a4a4a');

      chartRefs.current.activeTrend = new Chart(activeTrendCtx, {
        type: 'line',
        data: {
          labels: kpiData.activeUsersTrend.labels,
          datasets: [
            {
              label: 'Active Users',
              data: kpiData.activeUsersTrend.series,
              borderColor: borderGradient,
              backgroundColor: gradientFill,
              borderWidth: 3,
              fill: 'start',
              tension: 0,
              pointRadius: 0,
              pointHoverRadius: 6,
              pointBackgroundColor: '#222222',
              pointBorderColor: '#f5f5f5',
              pointBorderWidth: 2,
              pointHitRadius: 12,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: { top: 18, bottom: 12, left: 10, right: 20 },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1a1a1a',
              titleColor: '#f5f5f5',
              bodyColor: '#d9d9d9',
              borderColor: '#4d4d4d',
              borderWidth: 1,
              padding: 12,
              cornerRadius: 8,
              displayColors: false,
              callbacks: {
                title: (context) => context[0].label,
                label: (context) => `Active users: ${context.parsed.y}`,
              },
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(0, 0, 0, 0.08)', drawBorder: false },
              ticks: {
                color: '#1a1a1a',
                font: { size: 11, weight: '600' },
                maxRotation: 0,
                minRotation: 0,
              },
            },
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
                color: '#1a1a1a',
                font: { size: 11, weight: '600' },
                padding: 8,
              },
              grid: { color: 'rgba(0, 0, 0, 0.08)', drawBorder: false },
            },
          },
          elements: {
            line: {
              borderJoinStyle: 'round',
            },
          },
          interaction: {
            intersect: false,
            mode: 'index',
          },
        },
      });
    }

    return () => {
      ['pie', 'newUsers', 'activeTrend'].forEach((k) => {
        if (chartRefs.current[k]) {
          chartRefs.current[k].destroy();
          chartRefs.current[k] = null;
        }
      });
    };
  }, [kpiData]);

  return (
    <div className="staff-management-page">
      {/* Header Section (styled like IssueCheque, with unique classes) */}
      <div className="sm-header">
        <div className="sm-header-content">
          <div className="sm-header-text">
            <h1 className="sm-title">
              <span className="sm-title-icon"><i className="fas fa-users"></i></span>
              Staff Management
              <span className="sm-total-badge"><i className="fas fa-list-ol"></i> {stats.total} total</span>
            </h1>
            <p className="sm-subtitle">Manage system users, roles, and permissions</p>
          </div>
          <div className="sm-header-actions">
            <button className="sm-btn-add-staff" onClick={openAddModal}>
              <i className="fas fa-user-plus"></i>
              Add New Staff
            </button>
          </div>
        </div>
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

      {/* User Management KPI Dashboard (Top row: KPI | Pie | New Users, Bottom: Active Trend) */}
      <div className="um-dashboard">
        <div className="um-top-grid">
          {/* Pie Chart - Status Distribution */}
          <div className="um-card">
            <div className="um-card-header">
              <h3><i className="fas fa-chart-pie"></i> User Status Distribution</h3>
              <span className="um-subtext">Percentages and counts</span>
            </div>
            <div className="um-card-body">
              <div className="um-chart-placeholder" id="um-status-pie" aria-label="User Status Pie Chart">
                <canvas id="um-status-pie-canvas"></canvas>
              </div>
              <ul className="um-legend">
                {kpiData.statusDistribution.map((s, idx) => (
                  <li key={idx}>
                    <span className="um-legend-dot" style={{ background: s.color }}></span>
                    <span className="um-legend-label">{s.status}</span>
                    <span className="um-legend-value">{s.count}</span>
                    <span className="um-legend-pct">{s.percentage}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* New Users Over Time - Line/Bar */}
          <div className="um-card">
            <div className="um-card-header">
              <h3><i className="fas fa-chart-line"></i> New Users Over Time</h3>
              <span className="um-subtext">{kpiData.newUsersOverTime.granularity === 'monthly' ? 'Monthly' : 'Daily'} registrations</span>
            </div>
            <div className="um-card-body">
              <div className="um-chart-placeholder" id="um-new-users" aria-label="New Users Chart">
                <canvas id="um-new-users-canvas"></canvas>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom - Active Users Trend */}
        <div className="um-bottom-box um-card">
          <div className="um-card-header">
            <h3><i className="fas fa-wave-square"></i> Active Users Trend</h3>
            <span className="um-subtext">Monthly active users (approx.)</span>
          </div>
          <div className="um-card-body">
            <div className="um-chart-placeholder um-large" id="um-active-trend" aria-label="Active Users Trend Chart">
              <canvas id="um-active-trend-canvas"></canvas>
            </div>
          </div>
        </div>

        {/* Structured data for charts (hidden, ready for consumption) */}
        <pre className="um-data-json" aria-hidden="true" style={{ display: 'none' }}>{JSON.stringify(kpiData)}</pre>
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
              <th><i className="fas fa-briefcase"></i> Role</th>
              <th><i className="fas fa-toggle-on"></i> Status</th>
              <th><i className="fas fa-calendar"></i> Join Date</th>
              <th><i className="fas fa-cogs"></i> Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffMembers.map((staff) => (
              <tr key={staff.id}>
                <td>#{staff.id}</td>
                <td className="staff-name-cell">
                  <div className="staff-name-wrapper">
                    <span className="staff-avatar">{getInitials(staff.name)}</span>
                    <div className="staff-name-content">
                      <strong className="staff-name">{staff.name}</strong>
                      <span className="staff-meta">{staff.department || "Not set"}</span>
                    </div>
                  </div>
                </td>
                <td className="staff-email-cell">{staff.email || "-"}</td>
                <td>
                  <span className={`role-badge ${staff.role.toLowerCase().replace(" ", "_")}`}>
                    {staff.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${staff.status}`}>
                    {staff.status}
                  </span>
                </td>
                <td>{new Date(staff.joinDate).toLocaleDateString()}</td>
                <td className="action-cell">
                  <button
                    className={`action-menu-trigger ${openActionMenuId === staff.id ? "is-open" : ""}`}
                    onClick={(event) => handleActionMenuToggle(event, staff.id)}
                    title="More actions"
                  >
                    <span className="sr-only">Open actions menu</span>
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                  <div
                    className={`action-menu ${openActionMenuId === staff.id ? "open" : ""}`}
                    onClick={(event) => event.stopPropagation()}
                    role="menu"
                    aria-hidden={openActionMenuId === staff.id ? "false" : "true"}
                  >
                    <button
                      type="button"
                      className="action-menu-item"
                      onClick={() => {
                        setOpenActionMenuId(null);
                        openEditModal(staff);
                      }}
                    >
                      <i className="fas fa-edit"></i>
                      Edit details
                    </button>
                    <button
                      type="button"
                      className="action-menu-item"
                      onClick={() => {
                        setOpenActionMenuId(null);
                        toggleStaffStatus(staff);
                      }}
                    >
                      <i className={`fas fa-${staff.status === "active" ? "user-times" : "user-check"}`}></i>
                      {staff.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      className="action-menu-item danger"
                      onClick={() => {
                        setOpenActionMenuId(null);
                        openDeleteModal(staff);
                      }}
                    >
                      <i className="fas fa-trash"></i>
                      Delete user
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && createPortal(
        (
          <div
            className="modal-overlay sm-blur-overlay"
            onClick={() => setShowAddModal(false)}
          >
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
        ),
        document.body
      )}

      {/* Edit Staff Modal */}
      {showEditModal && (
        <div
          className="modal-overlay"
          style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none', background: 'transparent' }}
          onClick={() => setShowEditModal(false)}
        >
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
        <div
          className="modal-overlay"
          style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none', background: 'transparent' }}
          onClick={() => setShowDeleteModal(false)}
        >
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
        <div
          className="modal-overlay"
          style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none', background: 'transparent' }}
          onClick={() => setShowNotificationModal(false)}
        >
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
