import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/generatereports.css";

const GenerateReports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    dailyReports: 0,
    monthlyReports: 0,
    yearlyReports: 0
  });

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
    searchTerm: ""
  });

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportResult, setReportResult] = useState(null);

  const API_BASE = require('../../config/api').default;
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchInitialData();
  }, [token]);

  useEffect(() => {
    applyFilters();
  }, [reports, filters]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch reports and transactions
      const [reportsRes, transactionsRes] = await Promise.all([
        axios.get(`${API_BASE}/reports`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/transactions`, { headers }).catch(() => ({ data: [] }))
      ]);

      setReports(reportsRes.data || []);
      setTransactions(transactionsRes.data || []);
      
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
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
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
        report.id.toString().includes(searchLower)
      );
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
    if (!validateReportForm()) return;
    setShowGenerateModal(true);
  };

  const confirmGenerateReport = async () => {
    setLoading(true);
    setShowGenerateModal(false);
    
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

  if (loading && reports.length === 0) {
    return (
      <div className="generate-reports-loading">
        <div className="spinner"></div>
        <div className="loading-text">Loading report management...</div>
      </div>
    );
  }

  return (
    <div className="generate-reports-page">
      <div className="gr-header">
        <h2 className="gr-title">
          <i className="fas fa-chart-line"></i> Generate Financial Reports
        </h2>
        <p className="gr-subtitle">
          Generate comprehensive financial reports with customizable parameters and export options
        </p>
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

      <div className="gr-content-grid">
        {/* Report Generation Form */}
        <div className="generate-form-section">
          <div className="form-header">
            <h3><i className="fas fa-plus-circle"></i> Generate New Report</h3>
          </div>
          
          <div className="report-form">
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

            <div className="form-row">
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

            <div className="form-group">
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

            <div className="form-actions">
              <button
                type="button"
                className="generate-btn"
                onClick={handleGenerateReport}
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

        {/* Report Statistics */}
        <div className="report-stats-section">
          <div className="section-header">
            <h3><i className="fas fa-chart-bar"></i> Report Statistics</h3>
          </div>
          
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
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="gr-filters-section">
        <div className="filters-header">
          <h3><i className="fas fa-filter"></i> Filter Reports</h3>
          <button className="clear-filters-btn" onClick={clearFilters}>
            <i className="fas fa-times"></i> Clear Filters
          </button>
        </div>
        
        <div className="filters-grid">
          <div className="filter-group">
            <label>Report Type</label>
            <select 
              value={filters.type} 
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Date From</label>
            <input 
              type="date" 
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Date To</label>
            <input 
              type="date" 
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Search</label>
            <input 
              type="text" 
              placeholder="Search reports..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="gr-reports-section">
        <div className="reports-header">
          <h3><i className="fas fa-table"></i> Generated Reports</h3>
          <div className="reports-count">
            Showing {filteredReports.length} of {reports.length} reports
          </div>
        </div>

        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th><i className="fas fa-hashtag"></i> Report ID</th>
                <th><i className="fas fa-file-alt"></i> Type</th>
                <th><i className="fas fa-user"></i> Generated By</th>
                <th><i className="fas fa-user-tag"></i> Role</th>
                <th><i className="fas fa-calendar"></i> Generated At</th>
                <th><i className="fas fa-file-export"></i> Format</th>
                <th><i className="fas fa-cogs"></i> Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => {
                  const userData = report.generated_by && typeof report.generated_by === "object"
                    ? report.generated_by : null;
                  
                  return (
                    <tr key={report.id}>
                      <td>#{report.id}</td>
                      <td className="report-type">{report.report_type}</td>
                      <td>{userData ? userData.name : `User ID: ${report.generated_by}`}</td>
                      <td>{userData ? userData.role : "N/A"}</td>
                      <td>{new Date(report.generated_at).toLocaleDateString()}</td>
                      <td>
                        <span className="format-badge">
                          {report.format?.toUpperCase() || 'PDF'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="view-btn"
                            onClick={() => viewReportDetails(report)}
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className="download-btn"
                            onClick={() => downloadReport(report)}
                            title="Download Report"
                            disabled={!report.file_path}
                          >
                            <i className="fas fa-download"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">
                    <i className="fas fa-inbox"></i>
                    <p>No reports found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                className="cancel-btn"
                onClick={() => setShowGenerateModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-btn"
                onClick={confirmGenerateReport}
                disabled={loading}
              >
                {loading ? (
                  <i className="fas fa-spinner fa-spin"></i>
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
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-file-alt"></i> Report Details</h3>
              <button className="modal-close" onClick={() => setShowPreviewModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="report-details">
                <div className="detail-section">
                  <h4>Report Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Report ID:</label>
                      <span>#{selectedReport.id}</span>
                    </div>
                    <div className="detail-item">
                      <label>Type:</label>
                      <span>{selectedReport.report_type}</span>
                    </div>
                    <div className="detail-item">
                      <label>Generated At:</label>
                      <span>{new Date(selectedReport.generated_at).toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                      <label>Format:</label>
                      <span>{selectedReport.format?.toUpperCase() || 'PDF'}</span>
                    </div>
                    <div className="detail-item">
                      <label>File Size:</label>
                      <span>{selectedReport.file_size || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      <span className="status-badge success">Generated</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowPreviewModal(false)}
              >
                <i className="fas fa-times"></i> Close
              </button>
              <button
                type="button"
                className="download-btn"
                onClick={() => downloadReport(selectedReport)}
                disabled={!selectedReport.file_path}
              >
                <i className="fas fa-download"></i> Download Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateReports;
