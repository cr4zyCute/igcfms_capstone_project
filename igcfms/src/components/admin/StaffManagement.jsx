
import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import "./css/staffmanagement.css";
import Chart from "chart.js/auto";
import * as XLSX from 'xlsx';
import { generateStaffDirectoryPDF } from "../reports/export/pdf/staffexport.jsx";
import UserStatusDistribution from "../analytics/staffmanagementAnalytics/UserStatusDistribution.jsx";
import NewUsersOverTime from "../analytics/staffmanagementAnalytics/NewUsersOverTime.jsx";
import ActiveUsersTrend from "../analytics/staffmanagementAnalytics/ActiveUsersTrend.jsx";
import Deletion from "../common/Deletion.jsx";
import {
  useStaffMembers,
  useCreateStaff,
  useUpdateStaff,
  useToggleStaffStatus,
  useDeleteStaff,
} from "../../hooks/useStaffManagement";
import { useStaffManagementWebSocket } from "../../hooks/useStaffManagementWebSocket";

const StaffManagement = () => {
  const chartRefs = useRef({ pie: null, newUsers: null, activeTrend: null });

  // WebSocket for real-time updates
  useStaffManagementWebSocket();

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
  const [actionMenuPosition, setActionMenuPosition] = useState({ top: 0, left: 0 });
  const [filters, setFilters] = useState({
    activeFilter: 'latest',
    dateFrom: '',
    dateTo: '',
    searchTerm: '',
    showFilterDropdown: false,
  });
  const filterDropdownRef = useRef(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [pdfFileName, setPdfFileName] = useState("");

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
    const target = event.currentTarget;
    const nextIsOpen = openActionMenuId !== staffId;
    if (nextIsOpen && target && target.getBoundingClientRect) {
      const rect = target.getBoundingClientRect();
      const menuWidth = 200;
      const menuHeight = 156; // approx height for 3 items
      let left = Math.max(8, Math.min(window.innerWidth - menuWidth - 8, rect.right - menuWidth));
      let top = rect.bottom + 8; // viewport coords for position: fixed
      if (top + menuHeight > window.innerHeight - 8) {
        top = Math.max(8, rect.top - menuHeight - 8); // flip upward if not enough space
      }
      setActionMenuPosition({ top, left });
    }
    setOpenActionMenuId((prev) => (prev === staffId ? null : staffId));
  };

  useEffect(() => {
    if (openActionMenuId === null) return;

    const handlePointerDownOutside = (event) => {
      const t = event.target;
      if (t && (t.closest && (t.closest('.action-menu') || t.closest('.action-menu-trigger')))) return;
      setOpenActionMenuId(null);
    };
    const handleKeydown = (event) => {
      if (event.key === "Escape") setOpenActionMenuId(null);
    };

    document.addEventListener("mousedown", handlePointerDownOutside, true);
    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside, true);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [openActionMenuId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setFilters((prev) => ({ ...prev, showFilterDropdown: false }));
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add modal-open class to body when any modal is open
  useEffect(() => {
    if (showAddModal || showEditModal || showDeleteModal || showNotificationModal || showPDFPreview) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [showAddModal, showEditModal, showDeleteModal, showNotificationModal, showPDFPreview]);

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

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
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
        department: formData.department
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
        department: formData.department
      };
      if (formData.password && formData.password.trim()) {
        payload.password = formData.password;
      }
      console.log("Updating staff with ID:", editingStaff.id, "Payload:", payload);
      await updateStaffMutation.mutateAsync({ id: editingStaff.id, data: payload });
      setShowEditModal(false);
      setEditingStaff(null);
      resetForm();
      showNotification("success", "Staff Updated", `${formData.name}'s information has been successfully updated.`);
    } catch (err) {
      console.error("Edit staff error", err);
      const errorMsg = err?.response?.data?.message || err?.message || "Unable to update staff. Please try again.";
      showNotification("error", "Update Failed", errorMsg);
    }
  };

  const handleDeleteStaff = async () => {
    const name = deletingStaff?.name || "Staff";
    try {
      console.log("Deleting staff with ID:", deletingStaff.id);
      await deleteStaffMutation.mutateAsync(deletingStaff.id);
      setShowDeleteModal(false);
      setDeletingStaff(null);
      showNotification("success", "Staff Deleted", `${name} has been removed from the system.`);
    } catch (err) {
      console.error("Delete staff error", err);
      const errorMsg = err?.response?.data?.message || err?.message || `Unable to delete ${name}. Please try again.`;
      showNotification("error", "Delete Failed", errorMsg);
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

  const filteredStaff = useMemo(() => {
    let data = [...staffMembers];
    const { searchTerm, dateFrom, dateTo } = filters;
    const canonicalRole = (r) => {
      const s = (r || '').toString().trim().toLowerCase();
      if (s === 'administrator' || s === 'admin') return 'Admin';
      if (s === 'collecting officer' || s === 'collecting_officer' || s === 'collectingofficer') return 'Collecting Officer';
      if (s === 'cashier') return 'Cashier';
      if (s === 'disbursing officer' || s === 'disbursing_officer' || s === 'disbursingofficer') return 'Disbursing Officer';
      return r || '';
    };
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter((s) =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.role || '').toLowerCase().includes(q) ||
        (s.department || '').toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q) ||
        String(s.id).includes(q)
      );
    }
    if (dateFrom) {
      data = data.filter((s) => new Date(s.joinDate) >= new Date(dateFrom));
    }
    if (dateTo) {
      data = data.filter((s) => new Date(s.joinDate) <= new Date(`${dateTo}T23:59:59`));
    }
    if (filters.activeFilter && String(filters.activeFilter).startsWith('role:')) {
      const roleValue = String(filters.activeFilter).slice(5);
      data = data.filter((s) => canonicalRole(s.role) === roleValue);
    }
    return data;
  }, [staffMembers, filters.searchTerm, filters.dateFrom, filters.dateTo, filters.activeFilter]);

  const sortedStaff = useMemo(() => {
    const arr = [...filteredStaff];
    switch (filters.activeFilter) {
      case 'oldest':
        arr.sort((a, b) => new Date(a.joinDate) - new Date(b.joinDate));
        break;
      default:
        arr.sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate));
    }
    return arr;
  }, [filteredStaff, filters.activeFilter]);

  // Export helpers
  const exportFilters = useMemo(() => ({
    Search: filters.searchTerm || 'None',
    'Date From': filters.dateFrom || '—',
    'Date To': filters.dateTo || '—',
    Sorting: (
      filters.activeFilter === 'latest' ? 'Latest First' :
      filters.activeFilter === 'oldest' ? 'Oldest First' :
      (String(filters.activeFilter || '').startsWith('role:') ? `Role: ${String(filters.activeFilter).slice(5)}` : 'Latest First')
    )
  }), [filters]);

  const handleExportPdf = () => {
    if (!sortedStaff.length) { setShowExportDropdown(false); return; }
    try {
      const { blob, filename } = generateStaffDirectoryPDF({
        staff: sortedStaff,
        filters: exportFilters,
        reportTitle: 'Staff Directory',
      });
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
      setPdfFileName(filename);
      setShowPDFPreview(true);
    } catch (e) {
      console.error('Error generating Staff PDF:', e);
    }
    setShowExportDropdown(false);
  };

  const handleExportExcel = () => {
    if (!sortedStaff.length) { setShowExportDropdown(false); return; }
    const data = sortedStaff.map((s) => ({
      'ID': s.id,
      'Name': s.name,
      'Email': s.email,
      'Role': s.role,
      'Status': (s.status || '').toString().toUpperCase(),
      'Department': s.department || '',
      'Join Date': new Date(s.joinDate).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Staff');

    // Summary sheet
    const summaryData = [
      { Metric: 'Total Staff', Value: String(sortedStaff.length) },
      { Metric: 'Active', Value: String(sortedStaff.filter(s => s.status === 'active').length) },
      { Metric: 'Inactive', Value: String(sortedStaff.filter(s => s.status === 'inactive').length) },
      { Metric: 'Generated', Value: new Date().toLocaleString() },
      { Metric: 'Sorting', Value: exportFilters.Sorting },
      { Metric: 'Search', Value: exportFilters.Search },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    ws['!cols'] = [
      { wch: 8 }, { wch: 26 }, { wch: 32 }, { wch: 16 }, { wch: 12 }, { wch: 22 }, { wch: 16 }
    ];

    const fileName = `staff_directory_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    setShowExportDropdown(false);
  };

  const downloadPDFFromPreview = () => {
    if (!pdfPreviewUrl) return;
    const a = document.createElement('a');
    a.href = pdfPreviewUrl;
    a.download = pdfFileName || 'staff_directory.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const closePDFPreview = () => {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl(null);
    setPdfFileName('');
    setShowPDFPreview(false);
  };
 
  // KPI Data (structured JSON) for charts and summaries
  const kpiData = useMemo(() => {
    const total = staffMembers.length;
    const active = staffMembers.filter(s => s.status === 'active').length;
    const inactive = staffMembers.filter(s => s.status === 'inactive').length;
    const suspended = staffMembers.filter(s => s.status === 'suspended').length;
    const canonicalRole = (r) => {
      const s = (r || '').toString().trim().toLowerCase();
      if (s === 'administrator' || s === 'admin') return 'Admin';
      if (s === 'collecting officer' || s === 'collecting_officer' || s === 'collectingofficer') return 'Collecting Officer';
      if (s === 'cashier') return 'Cashier';
      if (s === 'disbursing officer' || s === 'disbursing_officer' || s === 'disbursingofficer') return 'Disbursing Officer';
      return r || '';
    };
    const roleOrder = ['Collecting Officer', 'Cashier', 'Disbursing Officer', 'Admin'];
    const roleColors = {
      'Collecting Officer': '#000000',
      'Cashier': '#333333',
      'Disbursing Officer': '#666666',
      'Admin': '#999999',
    };
    const roleDistribution = roleOrder.map((role) => {
      const count = staffMembers.filter(s => canonicalRole(s.role) === role).length;
      return {
        status: role,
        count,
        percentage: total ? Math.round((count / total) * 100) : 0,
        color: roleColors[role],
      };
    });
    console.log('Role Distribution Colors:', roleDistribution);

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
      roleDistribution,
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

  // KPI charts are now rendered by dedicated components

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
          <UserStatusDistribution kpiData={kpiData} />
          <NewUsersOverTime kpiData={kpiData} />
          <ActiveUsersTrend kpiData={kpiData} />
        </div>

        {/* Structured data for charts (hidden, ready for consumption) */}
        <pre className="um-data-json" aria-hidden="true" style={{ display: 'none' }}>{JSON.stringify(kpiData)}</pre>
      </div>

      {/* Staff Table */}
      <div className="staff-table-container">
        <div className="section-header">
          <div className="section-title-group">
            <h3>
              <i className="fas fa-table"></i>
              Staff Directory
              <span className="section-count">({sortedStaff.length})</span>
            </h3>
          </div>
          <div className="header-controls" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
            <div className="search-filter-container" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
              <div className="account-search-container">
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  className="account-search-input"
                />
                <i className="fas fa-search account-search-icon"></i>
              </div>
            </div>

            <div className="date-range-controls" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="date-field" style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  placeholder="dd/mm/yyyy"
                  style={{
                    padding: '5px 8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    height: '34px',
                    fontSize: '12px'
                  }}
                />
              </div>
              <div className="date-field" style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  placeholder="dd/mm/yyyy"
                  style={{
                    padding: '5px 8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    height: '34px',
                    fontSize: '12px'
                  }}
                />
              </div>
            </div>

            <div className="filter-dropdown-container" ref={filterDropdownRef}>
              <button
                className="filter-dropdown-btn"
                onClick={() => setFilters(prev => ({ ...prev, showFilterDropdown: !prev.showFilterDropdown }))}
                title="Sort staff"
              >
                <i className="fas fa-filter"></i>
                <span className="filter-label">
                  {filters.activeFilter === 'latest' ? 'Latest First' :
                   filters.activeFilter === 'oldest' ? 'Oldest First' :
                   (String(filters.activeFilter || '').startsWith('role:') ? `Role: ${String(filters.activeFilter).slice(5)}` : 'Latest First')}
                </span>
                <i className={`fas fa-chevron-${filters.showFilterDropdown ? 'up' : 'down'} filter-arrow`}></i>
              </button>
              {filters.showFilterDropdown && (
                <div className="filter-dropdown-menu">
                  <button
                    className={`filter-option ${filters.activeFilter === 'latest' ? 'active' : ''}`}
                    onClick={() => { handleFilterChange('activeFilter', 'latest'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                  >
                    <i className="fas fa-arrow-down"></i>
                    <span>Latest First</span>
                    {filters.activeFilter === 'latest' && <i className="fas fa-check filter-check"></i>}
                  </button>
                  <button
                    className={`filter-option ${filters.activeFilter === 'oldest' ? 'active' : ''}`}
                    onClick={() => { handleFilterChange('activeFilter', 'oldest'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                  >
                    <i className="fas fa-arrow-up"></i>
                    <span>Oldest First</span>
                    {filters.activeFilter === 'oldest' && <i className="fas fa-check filter-check"></i>}
                  </button>
                  <button
                    className={`filter-option ${filters.activeFilter === 'role:Collecting Officer' ? 'active' : ''}`}
                    onClick={() => { handleFilterChange('activeFilter', 'role:Collecting Officer'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                  >
                    <i className="fas fa-briefcase"></i>
                    <span>Collecting Officer</span>
                    {filters.activeFilter === 'role:Collecting Officer' && <i className="fas fa-check filter-check"></i>}
                  </button>
                  <button
                    className={`filter-option ${filters.activeFilter === 'role:Cashier' ? 'active' : ''}`}
                    onClick={() => { handleFilterChange('activeFilter', 'role:Cashier'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                  >
                    <i className="fas fa-briefcase"></i>
                    <span>Cashier</span>
                    {filters.activeFilter === 'role:Cashier' && <i className="fas fa-check filter-check"></i>}
                  </button>
                  <button
                    className={`filter-option ${filters.activeFilter === 'role:Disbursing Officer' ? 'active' : ''}`}
                    onClick={() => { handleFilterChange('activeFilter', 'role:Disbursing Officer'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                  >
                    <i className="fas fa-briefcase"></i>
                    <span>Disbursing Officer</span>
                    {filters.activeFilter === 'role:Disbursing Officer' && <i className="fas fa-check filter-check"></i>}
                  </button>
                  <button
                    className={`filter-option ${filters.activeFilter === 'role:Admin' ? 'active' : ''}`}
                    onClick={() => { handleFilterChange('activeFilter', 'role:Admin'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                  >
                    <i className="fas fa-user-shield"></i>
                    <span>Admin</span>
                    {filters.activeFilter === 'role:Admin' && <i className="fas fa-check filter-check"></i>}
                  </button>
                </div>
              )}
            </div>

            <div className="action-buttons" ref={exportDropdownRef}>
              <button
                className="btn-icon export-btn"
                title="Export Staff"
                type="button"
                onClick={() => setShowExportDropdown(prev => !prev)}
              >
                <i className="fas fa-download" style={{ color: '#ffffff' }}></i>
              </button>
              {showExportDropdown && (
                <div className="export-dropdown-menu">
                  <button type="button" className="export-option" onClick={handleExportPdf}>
                    <i className="fas fa-file-pdf"></i>
                    <span>Download PDF</span>
                  </button>
                  <button type="button" className="export-option" onClick={handleExportExcel}>
                    <i className="fas fa-file-excel"></i>
                    <span>Download Excel</span>
                  </button>
                </div>
              )}
            </div>
          </div>
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
            {sortedStaff.map((staff) => (
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
                  {openActionMenuId === staff.id && createPortal(
                    (
                      <div
                        className="action-menu open"
                        style={{ position: 'fixed', top: actionMenuPosition.top, left: actionMenuPosition.left, right: 'auto', minWidth: 200 }}
                        onMouseDown={(event) => event.stopPropagation()}
                        role="menu"
                        aria-hidden="false"
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
                    ),
                    document.body
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPDFPreview && pdfPreviewUrl && createPortal(
        (
          <div
            className="modal-overlay sm-blur-overlay pdf-preview-modal-overlay"
            onClick={closePDFPreview}
            style={{ zIndex: 100000 }}
          >
            <div
              className="pdf-preview-modal"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '80vw',
                height: '85vh',
                background: '#fff',
                borderRadius: '10px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <div
                className="pdf-preview-header"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: '1px solid #e5e7eb',
                  background: '#f9fafb'
                }}
              >
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>
                  Staff Directory PDF Preview
                </h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={downloadPDFFromPreview}
                    style={{ padding: '8px 12px', border: '1px solid #111827', borderRadius: 6, background: '#111827', color: '#fff', cursor: 'pointer' }}
                  >
                    <i className="fas fa-download"></i> Download
                  </button>
                  <button
                    type="button"
                    onClick={closePDFPreview}
                    style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', color: '#111827', cursor: 'pointer' }}
                  >
                    <i className="fas fa-times"></i> Close
                  </button>
                </div>
              </div>
              <div className="pdf-preview-body" style={{ flex: 1, background: '#11182710' }}>
                <iframe
                  title="Staff Directory PDF Preview"
                  src={pdfPreviewUrl}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </div>
            </div>
          </div>
        ),
        document.body
      )}

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
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group" style={{ gridColumn: '1 / 2' }}>
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
                  <div className="form-group" style={{ gridColumn: '2 / 3' }}>
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
                  <div className="form-group" style={{ gridColumn: '1 / 2' }}>
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
                  <div className="form-group" style={{ gridColumn: '2 / 3' }}>
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
      {showEditModal && createPortal(
        (
        <div
          className="modal-overlay sm-blur-overlay"
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
        ),
        document.body
      )}

      {/* Delete Confirmation Modal (Shared UI) */}
      <Deletion
        isOpen={!!(showDeleteModal && deletingStaff)}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteStaff}
        loading={deleteStaffMutation?.isPending}
        title="CONFIRM DELETE"
        message={`Are you sure you want to delete ${deletingStaff?.name || 'this user'}? This action cannot be undone.`}
        itemDetails={deletingStaff ? [
          { label: 'Name', value: deletingStaff.name || '-' },
          { label: 'Email', value: deletingStaff.email || '-' },
          { label: 'Role', value: deletingStaff.role || '-' },
        ] : []}
        confirmText="Delete Staff"
        cancelText="Cancel"
      />

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
