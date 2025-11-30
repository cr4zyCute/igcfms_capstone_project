import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import "./css/generatereports.css";
import DailyKPI from "../analytics/ReportAnalysis/dailyKPI";
import MonthlyKPI from "../analytics/ReportAnalysis/monthlyKPI";
import YearlyKPI from "../analytics/ReportAnalysis/yearlyKPI";
import ReportPageSkeleton from "../ui/ReportPageSL";

const REPORTS_PER_PAGE = 10;

const GenerateReports = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [overrideRequests, setOverrideRequests] = useState([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    dailyReports: 0,
    monthlyReports: 0,
    yearlyReports: 0
  });
  const [overrideStats, setOverrideStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  // Check if user is Admin
  const isAdmin = user?.role === 'Admin';

  // Report generation form
  const [reportForm, setReportForm] = useState({
    reportType: "daily",
    dateFrom: "",
    dateTo: "",
    department: "all",
    category: "all",
    includeTransactions: true,
    includeOverrides: false,
    format: "pdf"
  });

  // Filter states
  const [filters, setFilters] = useState({
    type: "all",
    dateFrom: "",
    dateTo: "",
    searchTerm: "",
    activeFilter: "all",
    showFilterDropdown: false
  });

  const [showGenerateFormModal, setShowGenerateFormModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportResult, setReportResult] = useState(null);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activityTab, setActivityTab] = useState('kpi');

  const API_BASE = require('../../config/api').default;
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchInitialData(true); // Show loading on initial fetch
    
    // Set up real-time polling every 5 seconds (without loading spinner)
    const pollInterval = setInterval(() => {
      fetchInitialData(false);
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, [token]);

  useEffect(() => {
    applyFilters();
  }, [reports, filters]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openActionMenu && !event.target.closest('.gr-action-menu-container')) {
        setOpenActionMenu(null);
      }
      if (filters.showFilterDropdown && !event.target.closest('.gr-filter-dropdown-container')) {
        setFilters(prev => ({ ...prev, showFilterDropdown: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActionMenu, filters.showFilterDropdown]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredReports.length]);

  useEffect(() => {
    const totalPagesForData = Math.max(1, Math.ceil(filteredReports.length / REPORTS_PER_PAGE));
    if (currentPage > totalPagesForData) {
      setCurrentPage(totalPagesForData);
    }
  }, [filteredReports.length, currentPage]);

  const fetchInitialData = async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      }
      setError("");

      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const overridesEndpoint = isAdmin
        ? `${API_BASE}/override_requests`
        : `${API_BASE}/override_requests/my_requests`;

      // Fetch reports and transactions
      const [reportsRes, transactionsRes, overridesRes] = await Promise.all([
        axios.get(`${API_BASE}/reports`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/transactions`, { headers }).catch(() => ({ data: [] })),
        axios.get(overridesEndpoint, { headers }).catch(() => ({ data: [] }))
      ]);

      setReports(reportsRes.data || []);
      setTransactions(transactionsRes.data || []);
      const overridesData = overridesRes?.data || [];
      setOverrideRequests(overridesData);
      setOverrideStats({
        total: overridesData.length,
        pending: overridesData.filter(req => req.status === 'pending').length,
        approved: overridesData.filter(req => req.status === 'approved').length,
        rejected: overridesData.filter(req => req.status === 'rejected').length
      });
      
      // Calculate stats
      const reportData = reportsRes.data || [];
      setStats({
        totalReports: reportData.length,
        dailyReports: reportData.filter(r => r.report_type === 'daily').length,
        monthlyReports: reportData.filter(r => r.report_type === 'monthly').length,
        yearlyReports: reportData.filter(r => r.report_type === 'yearly').length
      });

    } catch (err) {
      console.error('Generate reports error:', err);
      if (showLoadingSpinner) {
        setError(err.response?.data?.message || err.message || 'Failed to load data');
      }
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
    }
  };

  const applyFilters = () => {
    let filtered = [...reports];

    // Type filter
    if (filters.type !== "all") {
      filtered = filtered.filter(report => report.report_type === filters.type);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(report => 
        new Date(report.generated_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(report => 
        new Date(report.generated_at) <= new Date(filters.dateTo + "T23:59:59")
      );
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(report => 
        report.report_type?.toLowerCase().includes(searchLower) ||
        report.generated_by?.name?.toLowerCase().includes(searchLower) ||
        report.id.toString().includes(searchLower) ||
        report.format?.toLowerCase().includes(searchLower)
      );
    }

    // Apply active filter (sort based on selection)
    if (filters.activeFilter === 'latest') {
      filtered.sort((a, b) => new Date(b.generated_at) - new Date(a.generated_at));
    } else if (filters.activeFilter === 'oldest') {
      filtered.sort((a, b) => new Date(a.generated_at) - new Date(b.generated_at));
    } else if (filters.activeFilter === 'type-asc') {
      filtered.sort((a, b) => a.report_type.localeCompare(b.report_type));
    } else if (filters.activeFilter === 'type-desc') {
      filtered.sort((a, b) => b.report_type.localeCompare(a.report_type));
    }

    setFilteredReports(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: "all",
      dateFrom: "",
      dateTo: "",
      searchTerm: ""
    });
  };

  const handleFormChange = (field, value) => {
    setReportForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showMessage = (message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setError("");
    } else {
      setError(message);
      setSuccess("");
    }
    setTimeout(() => {
      setSuccess("");
      setError("");
    }, 5000);
  };

  const validateReportForm = () => {
    const { reportType, dateFrom, dateTo } = reportForm;

    if (!reportType) {
      showMessage("Please select a report type.", 'error');
      return false;
    }
    
    if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
      showMessage("Start date cannot be after end date.", 'error');
      return false;
    }

    return true;
  };

  const handleGenerateReport = () => {
    setShowGenerateModal(true);
  };

  const confirmGenerateReport = async () => {
    setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const payload = {
        report_type: reportForm.reportType,
        date_from: reportForm.dateFrom || null,
        date_to: reportForm.dateTo || null,
        department: reportForm.department !== 'all' ? reportForm.department : null,
        category: reportForm.category !== 'all' ? reportForm.category : null,
        include_transactions: reportForm.includeTransactions,
        include_overrides: reportForm.includeOverrides,
        format: reportForm.format
      };

      const response = await axios.post(`${API_BASE}/reports`, payload, { headers });

      setReportResult({
        id: response.data.id || response.data.data?.id,
        reportType: reportForm.reportType,
        format: reportForm.format,
        filePath: response.data.file_path || response.data.data?.file_path,
        generatedAt: new Date().toISOString()
      });

      setShowGenerateModal(false);

      showMessage("Report generated successfully!");
      fetchInitialData(); // Refresh data

    } catch (err) {
      console.error("Error generating report:", err);
      if (err.response?.status === 422 && err.response.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors)
          .flat()
          .join(", ");
        showMessage(`Validation error: ${errorMessages}`, 'error');
      } else {
        showMessage(err.response?.data?.message || "Failed to generate report.", 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const viewReportDetails = (report) => {
    setSelectedReport(report);
    setShowPreviewModal(true);
  };

  const downloadReport = (report) => {
    if (report.file_path) {
      const downloadUrl = `${API_BASE.replace('/api', '')}/${report.file_path}`;
      window.open(downloadUrl, '_blank');
    }
  };

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_BASE}/reports/${reportToDelete.id}`, { headers });
      
      showMessage('Report deleted successfully!', 'success');
      setShowDeleteModal(false);
      setReportToDelete(null);
      fetchInitialData(); // Refresh data
    } catch (err) {
      console.error('Error deleting report:', err);
      showMessage(err?.response?.data?.message || 'Failed to delete report.', 'error');
    }
  };

  const recentOverrideRequests = useMemo(() => {
    if (!overrideRequests || overrideRequests.length === 0) return [];

    return [...overrideRequests]
      .sort((a, b) => new Date(b.created_at || b.reviewed_at || 0) - new Date(a.created_at || a.reviewed_at || 0))
      .slice(0, 5);
  }, [overrideRequests]);

  const overridesForSelectedReport = useMemo(() => {
    if (!selectedReport) return [];

    const parseDate = (value) => {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const normalizeRange = () => {
      const from = parseDate(selectedReport.date_from || selectedReport.dateFrom);
      const to = parseDate(selectedReport.date_to || selectedReport.dateTo);
      if (!from && !to) return null;

      return {
        from,
        to: to ? new Date(to.setHours(23, 59, 59, 999)) : null
      };
    };

    const range = normalizeRange();
    const reportType = (selectedReport.report_type || '').toLowerCase();
    const generatedAt = parseDate(selectedReport.generated_at || selectedReport.created_at);

    const isWithinRange = (date) => {
      if (!date) return false;
      if (range) {
        if (range.from && date < range.from) return false;
        if (range.to && date > range.to) return false;
        return true;
      }

      if (!generatedAt) return false;

      if (reportType === 'monthly') {
        return (
          date.getFullYear() === generatedAt.getFullYear() &&
          date.getMonth() === generatedAt.getMonth()
        );
      }

      if (reportType === 'yearly') {
        return date.getFullYear() === generatedAt.getFullYear();
      }

      return (
        date.getFullYear() === generatedAt.getFullYear() &&
        date.getMonth() === generatedAt.getMonth() &&
        date.getDate() === generatedAt.getDate()
      );
    };

    return overrideRequests
      .filter((req) => {
        const comparisonDate = parseDate(req.reviewed_at || req.created_at);
        return isWithinRange(comparisonDate);
      })
      .sort((a, b) => new Date(b.created_at || b.reviewed_at || 0) - new Date(a.created_at || a.reviewed_at || 0));
  }, [overrideRequests, selectedReport]);

  if (loading && reports.length === 0) {
    return <ReportPageSkeleton isAdmin={isAdmin} />;
  }

  return (
    <>
    <div className="generate-reports-page">
      <div className="gr-header">
        <div className="gr-header-content">
          <h1 className="gr-title">
            <i className="fas fa-chart-line"></i> Generate Financial Reports
          </h1>
          <div className="gr-header-actions">
            <button 
              className="gr-btn-generate-report"
              onClick={() => setShowGenerateFormModal(true)}
            >
              <i className="fas fa-plus-circle"></i>
              Generate New Report
            </button>
          </div>
        </div>
      </div>

      <div className="gr-activity-tabs">
        <button
          type="button"
          className={`gr-activity-tab ${activityTab === 'kpi' ? 'active' : ''}`}
          onClick={() => setActivityTab('kpi')}
        >
          <i className="fas fa-chart-column"></i>
          Reports KPI
        </button>
        <button
          type="button"
          className={`gr-activity-tab ${activityTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActivityTab('transactions')}
        >
          <i className="fas fa-exchange-alt"></i>
          Transaction Activity
        </button>
        <button
          type="button"
          className={`gr-activity-tab ${activityTab === 'overrides' ? 'active' : ''}`}
          onClick={() => setActivityTab('overrides')}
        >
          <i className="fas fa-history"></i>
          Override Activity
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {success && (
        <div className="success-banner">
          <i className="fas fa-check-circle"></i>
          {success}
        </div>
      )}

      {/* Financial Collections & Disbursement Dashboard - Only for Admin */}
      {isAdmin && activityTab === 'kpi' && (
        <>
          {/* DAILY REPORT Section */}
          <div className="report-section">
            <DailyKPI transactions={transactions} reports={reports} />
          </div>

          {/* MONTHLY REPORT Section */}
          <div className="report-section">
            <MonthlyKPI transactions={transactions} reports={reports} />
          </div>

          {/* YEARLY REPORT Section */}
          <div className="report-section">
            <YearlyKPI transactions={transactions} reports={reports} />
          </div>
        </>
      )}

      {activityTab === 'kpi' && (
        <div className="gr-content-grid">
          {/* Report Statistics */}
          <div className="report-stats-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-file-alt"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalReports}</div>
                  <div className="stat-label">Total Reports</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-calendar-day"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.dailyReports}</div>
                  <div className="stat-label">Daily Reports</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-calendar-alt"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.monthlyReports}</div>
                  <div className="stat-label">Monthly Reports</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-calendar"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.yearlyReports}</div>
                  <div className="stat-label">Yearly Reports</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-exchange-alt"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{overrideStats.total}</div>
                  <div className="stat-label">Override Requests</div>
                  <div style={{ fontSize: '12px', marginTop: '4px', color: '#6b7280' }}>
                    Approved {overrideStats.approved} • Pending {overrideStats.pending} • Rejected {overrideStats.rejected}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activityTab === 'overrides' && (
        <div className="gr-overrides-section">
          <div className="gr-section-title-group" style={{ marginBottom: '12px' }}>
            <h3>
              <i className="fas fa-history"></i>
              Override Activity Snapshot
              <span className="gr-section-count">({overrideRequests.length})</span>
            </h3>
          </div>
          <div className="gr-table-container">
            <table className="gr-table">
              <thead>
                <tr>
                  <th><i className="fas fa-hashtag"></i> REQUEST ID</th>
                  <th><i className="fas fa-exchange-alt"></i> TRANSACTION</th>
                  <th><i className="fas fa-user"></i> REQUESTED BY</th>
                  <th><i className="fas fa-user-shield"></i> REVIEWED BY</th>
                  <th><i className="fas fa-flag"></i> STATUS</th>
                  <th><i className="fas fa-calendar"></i> DATE</th>
                </tr>
              </thead>
              <tbody>
                {recentOverrideRequests.length > 0 ? (
                  recentOverrideRequests.map((request) => {
                    const requester = request.requested_by || request.requestedBy;
                    const reviewer = request.reviewed_by || request.reviewedBy;
                    const displayDate = request.reviewed_at || request.created_at;

                    return (
                      <tr key={request.id}>
                        <td>
                          <div className="gr-cell-content">
                            <span className="gr-report-id">#{request.id}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="gr-report-type">#{request.transaction_id}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="gr-generated-by">{requester?.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="gr-generated-role">{reviewer?.name || 'Pending'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className={`status-badge ${request.status || 'pending'}`}>
                              {(request.status || 'pending').toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="gr-generated-at">{displayDate ? new Date(displayDate).toLocaleString() : 'N/A'}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="gr-no-data">
                      <div className="gr-no-data-content">
                        <i className="fas fa-inbox"></i>
                        <p>No override activity recorded yet.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports Table */}
      <div className="gr-reports-section">
        <div className="gr-reports-header">
          <div className="gr-section-title-group">
            <h3>
              <i className="fas fa-file-alt"></i>
              Generated Reports
              <span className="gr-section-count">({filteredReports.length})</span>
            </h3>
          </div>
          <div className="gr-header-controls">
            <div className="gr-search-filter-container">
              <div className="gr-date-filter-group">
                <label>Date From</label>
                <input 
                  type="date" 
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="gr-date-input"
                />
              </div>
              
              <div className="gr-date-filter-group">
                <label>Date To</label>
                <input 
                  type="date" 
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="gr-date-input"
                />
              </div>

              <div className="gr-account-search-container">
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  className="gr-account-search-input"
                />
                <i className="fas fa-search gr-account-search-icon"></i>
              </div>
              
              <div className="gr-filter-dropdown-container">
                <button
                  className="gr-filter-dropdown-btn"
                  onClick={() => setFilters(prev => ({ ...prev, showFilterDropdown: !prev.showFilterDropdown }))}
                  title="Filter reports"
                >
                  <i className="fas fa-filter"></i>
                  <span className="gr-filter-label">
                    {filters.activeFilter === 'all' ? 'All Reports' :
                     filters.activeFilter === 'latest' ? 'Latest First' : 
                     filters.activeFilter === 'oldest' ? 'Oldest First' : 
                     filters.activeFilter === 'type-asc' ? 'Type A-Z' : 
                     'Type Z-A'}
                  </span>
                  <i className={`fas fa-chevron-${filters.showFilterDropdown ? 'up' : 'down'} gr-filter-arrow`}></i>
                </button>
                
                {filters.showFilterDropdown && (
                  <div className="gr-filter-dropdown-menu">
                    <button
                      className={`gr-filter-option ${filters.activeFilter === 'all' ? 'active' : ''}`}
                      onClick={() => { handleFilterChange('activeFilter', 'all'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                    >
                      <i className="fas fa-list"></i>
                      <span>All Reports</span>
                      {filters.activeFilter === 'all' && <i className="fas fa-check gr-filter-check"></i>}
                    </button>
                    <button
                      className={`gr-filter-option ${filters.activeFilter === 'latest' ? 'active' : ''}`}
                      onClick={() => { handleFilterChange('activeFilter', 'latest'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                    >
                      <i className="fas fa-arrow-down"></i>
                      <span>Latest First</span>
                      {filters.activeFilter === 'latest' && <i className="fas fa-check gr-filter-check"></i>}
                    </button>
                    <button
                      className={`gr-filter-option ${filters.activeFilter === 'oldest' ? 'active' : ''}`}
                      onClick={() => { handleFilterChange('activeFilter', 'oldest'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                    >
                      <i className="fas fa-arrow-up"></i>
                      <span>Oldest First</span>
                      {filters.activeFilter === 'oldest' && <i className="fas fa-check gr-filter-check"></i>}
                    </button>
                    <button
                      className={`gr-filter-option ${filters.activeFilter === 'type-asc' ? 'active' : ''}`}
                      onClick={() => { handleFilterChange('activeFilter', 'type-asc'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                    >
                      <i className="fas fa-sort-alpha-down"></i>
                      <span>Type A-Z</span>
                      {filters.activeFilter === 'type-asc' && <i className="fas fa-check gr-filter-check"></i>}
                    </button>
                    <button
                      className={`gr-filter-option ${filters.activeFilter === 'type-desc' ? 'active' : ''}`}
                      onClick={() => { handleFilterChange('activeFilter', 'type-desc'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                    >
                      <i className="fas fa-sort-alpha-up"></i>
                      <span>Type Z-A</span>
                      {filters.activeFilter === 'type-desc' && <i className="fas fa-check gr-filter-check"></i>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="gr-table-section">
          <div className="gr-table-container">
            <table className="gr-table">
              <thead>
                <tr>
                  <th><i className="fas fa-hashtag"></i> REPORT ID</th>
                  <th><i className="fas fa-file-alt"></i> REPORT TYPE</th>
                  <th><i className="fas fa-user"></i> GENERATED BY</th>
                  <th><i className="fas fa-user-tag"></i> ROLE</th>
                  <th><i className="fas fa-calendar"></i> GENERATED AT</th>
                  <th><i className="fas fa-file-export"></i> FORMAT</th>
                  <th><i className="fas fa-cog"></i> ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const totalReports = filteredReports.length;
                  const totalPages = Math.max(1, Math.ceil(totalReports / REPORTS_PER_PAGE));
                  const startIndex = (currentPage - 1) * REPORTS_PER_PAGE;
                  const currentReports = filteredReports.slice(startIndex, startIndex + REPORTS_PER_PAGE);
                  
                  return currentReports.length > 0 ? (
                    currentReports.map((report) => {
                    const userData = report.generated_by && typeof report.generated_by === "object"
                      ? report.generated_by
                      : null;

                    return (
                      <tr
                        key={report.id}
                        className={`gr-table-row ${openActionMenu === report.id ? 'gr-row-active-menu' : ''}`}
                        onClick={(e) => {
                          if (!e.target.closest('.gr-action-cell')) {
                            viewReportDetails(report);
                          }
                        }}
                      >
                        <td>
                          <div className="gr-cell-content">
                            <span className="gr-report-id">#{report.id}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="gr-report-type">{report.report_type}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="gr-generated-by">{userData ? userData.name : `User ID: ${report.generated_by}`}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="gr-generated-role">{userData ? userData.role : 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="gr-generated-at">{new Date(report.generated_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gr-cell-content">
                            <span className="gr-format-badge">{report.format?.toUpperCase() || 'PDF'}</span>
                          </div>
                        </td>
                        <td className="gr-action-cell">
                          <div className="gr-cell-content">
                            <div className="gr-action-buttons-group">
                              <div className="gr-action-menu-container">
                                <button
                                  className="gr-action-btn-icon gr-more-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenActionMenu(openActionMenu === report.id ? null : report.id);
                                  }}
                                  title="Actions"
                                >
                                  <i className="fas fa-ellipsis-v"></i>
                                </button>
                                {openActionMenu === report.id && (
                                  <div className="gr-action-dropdown-menu">
                                    <button
                                      className="gr-action-dropdown-item"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        viewReportDetails(report);
                                        setOpenActionMenu(null);
                                      }}
                                    >
                                      <i className="fas fa-eye"></i>
                                      <span>View Details</span>
                                    </button>
                                    <button
                                      className="gr-action-dropdown-item"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadReport(report);
                                        setOpenActionMenu(null);
                                      }}
                                      disabled={!report.file_path}
                                    >
                                      <i className="fas fa-download"></i>
                                      <span>Download Report</span>
                                    </button>
                                    <button
                                      className="gr-action-dropdown-item gr-danger"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReportToDelete(report);
                                        setShowDeleteModal(true);
                                        setOpenActionMenu(null);
                                      }}
                                    >
                                      <i className="fas fa-trash"></i>
                                      <span>Delete Report</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="gr-no-data">
                      <div className="gr-no-data-content">
                        <i className="fas fa-inbox"></i>
                        <p>No reports found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                );
                })()}
              </tbody>
            </table>
          </div>
          {filteredReports.length > 0 && (() => {
            const totalReports = filteredReports.length;
            const totalPages = Math.max(1, Math.ceil(totalReports / REPORTS_PER_PAGE));
            const startIndex = (currentPage - 1) * REPORTS_PER_PAGE;
            const displayStart = totalReports === 0 ? 0 : startIndex + 1;
            const displayEnd = Math.min(totalReports, startIndex + REPORTS_PER_PAGE);
            
            return (
              <div className="gr-table-pagination">
                <div className="gr-pagination-info">
                  Showing {displayStart}-{displayEnd} of {totalReports} reports
                </div>
                <div className="gr-pagination-controls">
                  <button
                    type="button"
                    className="gr-pagination-button"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="gr-pagination-info">Page {currentPage} of {totalPages}</span>
                  <button
                    type="button"
                    className="gr-pagination-button"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || totalReports === 0}
                  >
                    Next
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Generate Confirmation Modal */}
      {showGenerateModal && (
        <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-question-circle"></i> Confirm Report Generation</h3>
              <button className="modal-close" onClick={() => setShowGenerateModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="confirmation-details">
                <div className="detail-item">
                  <label>Report Type:</label>
                  <span>{reportForm.reportType}</span>
                </div>
                {reportForm.reportType === 'custom' && (
                  <>
                    <div className="detail-item">
                      <label>Date Range:</label>
                      <span>{reportForm.dateFrom} to {reportForm.dateTo}</span>
                    </div>
                  </>
                )}
                <div className="detail-item">
                  <label>Department:</label>
                  <span>{reportForm.department === 'all' ? 'All Departments' : reportForm.department}</span>
                </div>
                <div className="detail-item">
                  <label>Category:</label>
                  <span>{reportForm.category === 'all' ? 'All Categories' : reportForm.category}</span>
                </div>
                <div className="detail-item">
                  <label>Format:</label>
                  <span>{reportForm.format.toUpperCase()}</span>
                </div>
                <div className="detail-item">
                  <label>Include Transactions:</label>
                  <span>{reportForm.includeTransactions ? 'Yes' : 'No'}</span>
                </div>
                <div className="detail-item">
                  <label>Include Overrides:</label>
                  <span>{reportForm.includeOverrides ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <p className="confirmation-message">
                Are you sure you want to generate this report?
              </p>
            </div>
            <div className="modal-actions">

              <button
                type="button"
                className="confirm-btn"
                onClick={confirmGenerateReport}
                disabled={loading}
              >
                {loading ? (
                  <>
                    Processing <i className="fas fa-spinner fa-spin"></i>
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i> Generate Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Success Modal */}
      {reportResult && (
        <div className="modal-overlay" onClick={() => setReportResult(null)}>
          <div className="modal-content success" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-check-circle"></i> Report Generated Successfully</h3>
              <button className="modal-close" onClick={() => setReportResult(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="success-details">
                <div className="success-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <h4>Report Generated</h4>
                <div className="result-details">
                  <div className="detail-item">
                    <label>Report ID:</label>
                    <span>#{reportResult.id}</span>
                  </div>
                  <div className="detail-item">
                    <label>Type:</label>
                    <span>{reportResult.reportType}</span>
                  </div>
                  <div className="detail-item">
                    <label>Format:</label>
                    <span>{reportResult.format?.toUpperCase() || 'PDF'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Generated At:</label>
                    <span>{new Date(reportResult.generatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="close-btn"
                onClick={() => setReportResult(null)}
              >
                <i className="fas fa-times"></i> Close
              </button>
              <button
                type="button"
                className="download-btn"
                onClick={() => {
                  if (reportResult.filePath) {
                    const downloadUrl = `${API_BASE.replace('/api', '')}/${reportResult.filePath}`;
                    window.open(downloadUrl, '_blank');
                  }
                }}
                disabled={!reportResult.filePath}
              >
                <i className="fas fa-download"></i> Download Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      {showPreviewModal && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-content gr-report-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header gr-preview-header">
              <div className="gr-preview-header-content">
                <div className="gr-preview-icon">
                  <i className="fas fa-file-chart-line"></i>
                </div>
                <div className="gr-preview-title-group">
                  <h3>Report Details</h3>
                  <p className="gr-preview-subtitle">#{selectedReport.id} • {selectedReport.report_type}</p>
                </div>
              </div>
              <div className="gr-preview-header-actions">
                <button
                  type="button"
                  className="gr-download-header-btn"
                  onClick={() => downloadReport(selectedReport)}
                  disabled={!selectedReport.file_path}
                  title="Download Report"
                >
                  <i className="fas fa-download"></i>
                  <span>Download</span>
                </button>
                <button className="modal-close" onClick={() => setShowPreviewModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            <div className="modal-body gr-preview-body">
              {/* Report Summary Card */}
              <div className="gr-report-summary-card">
                <div className="gr-summary-header">
                  <div className="gr-summary-badge">
                    <i className="fas fa-check-circle"></i>
                    <span>Generated Successfully</span>
                  </div>
                  <div className="gr-report-type-badge">
                    {selectedReport.report_type}
                  </div>
                </div>
                <div className="gr-summary-stats">
                  <div className="gr-summary-stat">
                    <i className="fas fa-calendar-alt"></i>
                    <div className="gr-stat-content">
                      <span className="gr-stat-label">Generated</span>
                      <span className="gr-stat-value">{new Date(selectedReport.generated_at).toLocaleDateString()}</span>
                      <span className="gr-stat-time">{new Date(selectedReport.generated_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="gr-summary-stat">
                    <i className="fas fa-file-alt"></i>
                    <div className="gr-stat-content">
                      <span className="gr-stat-label">Format</span>
                      <span className="gr-stat-value">{selectedReport.format?.toUpperCase() || 'PDF'}</span>
                    </div>
                  </div>
                  <div className="gr-summary-stat">
                    <i className="fas fa-user"></i>
                    <div className="gr-stat-content">
                      <span className="gr-stat-label">Generated By</span>
                      <span className="gr-stat-value">
                        {selectedReport.generated_by && typeof selectedReport.generated_by === "object"
                          ? selectedReport.generated_by.name
                          : `User ID: ${selectedReport.generated_by}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Information */}
              <div className="gr-report-details-grid">
                <div className="gr-detail-section">
                  <h4><i className="fas fa-info-circle"></i> Report Information</h4>
                  <div className="gr-detail-list">
                    <div className="gr-detail-row">
                      <span className="gr-detail-label">Report ID</span>
                      <span className="gr-detail-value">#{selectedReport.id}</span>
                    </div>
                    <div className="gr-detail-row">
                      <span className="gr-detail-label">Report Type</span>
                      <span className="gr-detail-value gr-capitalize">{selectedReport.report_type}</span>
                    </div>
                    <div className="gr-detail-row">
                      <span className="gr-detail-label">File Format</span>
                      <span className="gr-detail-value">{selectedReport.format?.toUpperCase() || 'PDF'}</span>
                    </div>
                    <div className="gr-detail-row">
                      <span className="gr-detail-label">File Size</span>
                      <span className="gr-detail-value">{selectedReport.file_size || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="gr-detail-section">
                  <h4><i className="fas fa-clock"></i> Timeline</h4>
                  <div className="gr-detail-list">
                    <div className="gr-detail-row">
                      <span className="gr-detail-label">Generated Date</span>
                      <span className="gr-detail-value">{new Date(selectedReport.generated_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="gr-detail-row">
                      <span className="gr-detail-label">Generated Time</span>
                      <span className="gr-detail-value">{new Date(selectedReport.generated_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="gr-detail-row">
                      <span className="gr-detail-label">Status</span>
                      <span className="gr-status-badge gr-status-success">
                        <i className="fas fa-check-circle"></i>
                        Generated
                      </span>
                    </div>
                  </div>
                </div>

                {selectedReport.generated_by && typeof selectedReport.generated_by === "object" && (
                  <div className="gr-detail-section">
                    <h4><i className="fas fa-user-shield"></i> Generated By</h4>
                    <div className="gr-detail-list">
                      <div className="gr-detail-row">
                        <span className="gr-detail-label">Name</span>
                        <span className="gr-detail-value">{selectedReport.generated_by.name}</span>
                      </div>
                      <div className="gr-detail-row">
                        <span className="gr-detail-label">Role</span>
                        <span className="gr-detail-value gr-capitalize">{selectedReport.generated_by.role || 'N/A'}</span>
                      </div>
                      <div className="gr-detail-row">
                        <span className="gr-detail-label">User ID</span>
                        <span className="gr-detail-value">#{selectedReport.generated_by.id || selectedReport.generated_by}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedReport.file_path && (
                  <div className="gr-detail-section">
                    <h4><i className="fas fa-folder-open"></i> File Information</h4>
                    <div className="gr-detail-list">
                      <div className="gr-detail-row">
                        <span className="gr-detail-label">File Path</span>
                        <span className="gr-detail-value gr-file-path">{selectedReport.file_path}</span>
                      </div>
                      <div className="gr-detail-row">
                        <span className="gr-detail-label">Availability</span>
                        <span className="gr-status-badge gr-status-available">
                          <i className="fas fa-check"></i>
                          Available for Download
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && reportToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-exclamation-triangle"></i> Confirm Delete</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="confirmation-details">
                <div className="detail-item">
                  <label>Report ID:</label>
                  <span>#{reportToDelete.id}</span>
                </div>
                <div className="detail-item">
                  <label>Type:</label>
                  <span>{reportToDelete.report_type}</span>
                </div>
                <div className="detail-item">
                  <label>Generated At:</label>
                  <span>{new Date(reportToDelete.generated_at).toLocaleDateString()}</span>
                </div>
              </div>
              <p className="confirmation-message">
                Are you sure you want to delete this report? This action cannot be undone.
              </p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                <i className="fas fa-times"></i> Cancel
              </button>
              <button
                type="button"
                className="confirm-btn delete-btn"
                onClick={handleDeleteReport}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash"></i> Delete Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Generate Report Form Modal - Rendered outside main container */}
    {showGenerateFormModal && (
      <div className="modal-overlay" onClick={() => setShowGenerateFormModal(false)}>
        <div className="modal-content generate-report-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3><i className="fas fa-plus-circle"></i> Generate New Report</h3>
            <button className="modal-close" onClick={() => setShowGenerateFormModal(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="modal-body">
            <div className="report-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Report Type *</label>
                  <select
                    value={reportForm.reportType}
                    onChange={(e) => handleFormChange('reportType', e.target.value)}
                    required
                  >
                    <option value="daily">Daily Report</option>
                    <option value="monthly">Monthly Report</option>
                    <option value="yearly">Yearly Report</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Export Format</label>
                  <select
                    value={reportForm.format}
                    onChange={(e) => handleFormChange('format', e.target.value)}
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="excel">Excel Spreadsheet</option>
                    <option value="csv">CSV File</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date From</label>
                  <input
                    type="date"
                    value={reportForm.dateFrom}
                    onChange={(e) => handleFormChange('dateFrom', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Date To</label>
                  <input
                    type="date"
                    value={reportForm.dateTo}
                    onChange={(e) => handleFormChange('dateTo', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Department Filter</label>
                  <select
                    value={reportForm.department}
                    onChange={(e) => handleFormChange('department', e.target.value)}
                  >
                    <option value="all">All Departments</option>
                    <option value="Finance">Finance</option>
                    <option value="Administration">Administration</option>
                    <option value="Operations">Operations</option>
                    <option value="HR">HR</option>
                    <option value="IT">IT</option>
                    <option value="Legal">Legal</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Public Works">Public Works</option>
                    <option value="Health Services">Health Services</option>
                    <option value="Education">Education</option>
                    <option value="Social Services">Social Services</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Category Filter</label>
                  <select
                    value={reportForm.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="Tax Collection">Tax Collection</option>
                    <option value="Permit Fees">Permit Fees</option>
                    <option value="License Fees">License Fees</option>
                    <option value="Service Fees">Service Fees</option>
                    <option value="Fines and Penalties">Fines and Penalties</option>
                    <option value="Salaries">Salaries</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>


            </div>
          </div>
          <div className="modal-actions generate-form-actions">
            <div className="form-group include-options-group">
              <label>Include Options</label>
              <div className="checkbox-group">
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={reportForm.includeTransactions}
                    onChange={(e) => handleFormChange('includeTransactions', e.target.checked)}
                  />
                  <span>Include Transaction Details</span>
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={reportForm.includeOverrides}
                    onChange={(e) => handleFormChange('includeOverrides', e.target.checked)}
                  />
                  <span>Include Override Records</span>
                </label>
              </div>
            </div>
            <button
              type="button"
              className="generate-btn"
              onClick={() => {
                setShowGenerateFormModal(false);
                handleGenerateReport();
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-chart-line"></i> Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default GenerateReports;
