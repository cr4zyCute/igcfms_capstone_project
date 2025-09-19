import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/issuecheque.css";

const IssueCheque = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [disbursements, setDisbursements] = useState([]);
  const [cheques, setCheques] = useState([]);
  const [filteredCheques, setFilteredCheques] = useState([]);
  const [fundAccounts, setFundAccounts] = useState([]);
  
  // Form states
  const [formData, setFormData] = useState({
    disbursementId: "",
    chequeNumber: "",
    bankName: "",
    accountNumber: "",
    payeeName: "",
    amount: "",
    issueDate: new Date().toISOString().split('T')[0],
    memo: "",
    fundAccountId: ""
  });

  // Filter states
  const [filters, setFilters] = useState({
    status: "all",
    dateFrom: "",
    dateTo: "",
    searchTerm: "",
    bankName: "all"
  });

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showChequeModal, setShowChequeModal] = useState(false);
  const [selectedCheque, setSelectedCheque] = useState(null);
  const [chequeResult, setChequeResult] = useState(null);

  const API_BASE = "http://localhost:8000/api";
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchInitialData();
  }, [token]);

  useEffect(() => {
    applyFilters();
  }, [cheques, filters]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch disbursements (for cheque mode), cheques, and fund accounts
      const [disbursementsRes, chequesRes, fundAccountsRes] = await Promise.all([
        axios.get(`${API_BASE}/disbursements?mode_of_payment=Cheque`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/cheques`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/fund-accounts`, { headers }).catch(() => ({ data: [] }))
      ]);

      setDisbursements(disbursementsRes.data || []);
      setCheques(chequesRes.data || []);
      setFundAccounts(fundAccountsRes.data || []);

    } catch (err) {
      console.error('Issue cheque error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...cheques];

    // Status filter (based on issue date - recent vs older)
    if (filters.status === "recent") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(cheque => 
        new Date(cheque.issue_date || cheque.created_at) >= weekAgo
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(cheque => 
        new Date(cheque.issue_date || cheque.created_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(cheque => 
        new Date(cheque.issue_date || cheque.created_at) <= new Date(filters.dateTo + "T23:59:59")
      );
    }

    // Bank name filter
    if (filters.bankName !== "all") {
      filtered = filtered.filter(cheque => 
        cheque.bank_name?.toLowerCase() === filters.bankName.toLowerCase()
      );
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(cheque => 
        cheque.payee_name?.toLowerCase().includes(searchLower) ||
        cheque.cheque_number?.toLowerCase().includes(searchLower) ||
        cheque.bank_name?.toLowerCase().includes(searchLower) ||
        cheque.memo?.toLowerCase().includes(searchLower) ||
        cheque.id.toString().includes(searchLower)
      );
    }

    setFilteredCheques(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      dateFrom: "",
      dateTo: "",
      searchTerm: "",
      bankName: "all"
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-populate fields when disbursement is selected
    if (field === 'disbursementId' && value) {
      const selectedDisbursement = disbursements.find(d => d.id.toString() === value);
      if (selectedDisbursement) {
        setFormData(prev => ({
          ...prev,
          payeeName: selectedDisbursement.payee_name || "",
          amount: selectedDisbursement.amount || "",
          fundAccountId: selectedDisbursement.fund_account_id || ""
        }));
      }
    }
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

  const validateForm = () => {
    const { disbursementId, chequeNumber, bankName, accountNumber, payeeName, amount } = formData;

    if (!disbursementId) {
      showMessage("Please select a disbursement.", 'error');
      return false;
    }
    if (!chequeNumber.trim()) {
      showMessage("Please enter cheque number.", 'error');
      return false;
    }
    if (!bankName.trim()) {
      showMessage("Please enter bank name.", 'error');
      return false;
    }
    if (!accountNumber.trim()) {
      showMessage("Please enter account number.", 'error');
      return false;
    }
    if (!payeeName.trim()) {
      showMessage("Please enter payee name.", 'error');
      return false;
    }
    if (!amount || parseFloat(amount) <= 0) {
      showMessage("Please enter a valid amount.", 'error');
      return false;
    }

    // Check if cheque number already exists
    const existingCheque = cheques.find(c => 
      c.cheque_number?.toLowerCase() === chequeNumber.trim().toLowerCase()
    );
    if (existingCheque) {
      showMessage("Cheque number already exists. Please use a different number.", 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setShowIssueModal(true);
  };

  const confirmIssueCheque = async () => {
    setLoading(true);
    setShowIssueModal(false);
    
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const payload = {
        disbursement_id: parseInt(formData.disbursementId),
        cheque_number: formData.chequeNumber.trim(),
        bank_name: formData.bankName.trim(),
        account_number: formData.accountNumber.trim(),
        payee_name: formData.payeeName.trim(),
        amount: parseFloat(formData.amount),
        issue_date: formData.issueDate,
        memo: formData.memo.trim() || null,
        fund_account_id: formData.fundAccountId ? parseInt(formData.fundAccountId) : null
      };

      const response = await axios.post(`${API_BASE}/cheques`, payload, { headers });

      setChequeResult({
        id: response.data.id || response.data.data?.id,
        chequeNumber: formData.chequeNumber,
        payeeName: formData.payeeName,
        amount: formData.amount,
        bankName: formData.bankName,
        issueDate: formData.issueDate,
        disbursementId: formData.disbursementId
      });

      // Reset form
      setFormData({
        disbursementId: "",
        chequeNumber: "",
        bankName: "",
        accountNumber: "",
        payeeName: "",
        amount: "",
        issueDate: new Date().toISOString().split('T')[0],
        memo: "",
        fundAccountId: ""
      });

      setShowChequeModal(true);
      fetchInitialData(); // Refresh data

    } catch (err) {
      console.error("Error issuing cheque:", err);
      if (err.response?.status === 422 && err.response.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors)
          .flat()
          .join(", ");
        showMessage(`Validation error: ${errorMessages}`, 'error');
      } else {
        showMessage(err.response?.data?.message || "Failed to issue cheque.", 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const viewChequeDetails = (cheque) => {
    setSelectedCheque(cheque);
    // Could open a details modal here
  };

  // Generate next cheque number
  const generateChequeNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    
    return `CHQ-${year}${month}${day}-${timestamp}`;
  };

  // Get unique bank names for filter
  const uniqueBankNames = [...new Set(cheques.map(c => c.bank_name).filter(Boolean))];

  if (loading && disbursements.length === 0) {
    return (
      <div className="issue-cheque-loading">
        <div className="spinner"></div>
        <div className="loading-text">Loading cheque management...</div>
      </div>
    );
  }

  return (
    <div className="issue-cheque-page">
      <div className="ic-header">
        <h2 className="ic-title">
          <i className="fas fa-money-check"></i> Issue Cheque Management
        </h2>
        <p className="ic-subtitle">
          Issue official cheques for disbursement transactions and manage cheque records
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

      <div className="ic-content-grid">
        {/* Issue Cheque Form */}
        <div className="issue-form-section">
          <div className="form-header">
            <h3><i className="fas fa-plus-circle"></i> Issue New Cheque</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="cheque-form">
            <div className="form-group">
              <label>Select Disbursement Transaction *</label>
              <select
                value={formData.disbursementId}
                onChange={(e) => handleInputChange('disbursementId', e.target.value)}
                required
              >
                <option value="">-- Select Disbursement --</option>
                {disbursements.map((disbursement) => (
                  <option key={disbursement.id} value={disbursement.id}>
                    #{disbursement.id} - ₱{parseFloat(disbursement.amount || 0).toLocaleString()} - {disbursement.payee_name || 'N/A'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Cheque Number *</label>
                <div className="cheque-number-input">
                  <input
                    type="text"
                    placeholder="Enter cheque number"
                    value={formData.chequeNumber}
                    onChange={(e) => handleInputChange('chequeNumber', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="generate-btn"
                    onClick={() => handleInputChange('chequeNumber', generateChequeNumber())}
                    title="Generate Cheque Number"
                  >
                    <i className="fas fa-magic"></i>
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Bank Name *</label>
                <input
                  type="text"
                  placeholder="Enter bank name"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Account Number *</label>
                <input
                  type="text"
                  placeholder="Enter account number"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Fund Account</label>
                <select
                  value={formData.fundAccountId}
                  onChange={(e) => handleInputChange('fundAccountId', e.target.value)}
                >
                  <option value="">-- Select Fund Account --</option>
                  {fundAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - ₱{parseFloat(account.balance || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Payee Name *</label>
                <input
                  type="text"
                  placeholder="Enter payee name"
                  value={formData.payeeName}
                  onChange={(e) => handleInputChange('payeeName', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Issue Date</label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => handleInputChange('issueDate', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Memo</label>
                <input
                  type="text"
                  placeholder="Optional memo"
                  value={formData.memo}
                  onChange={(e) => handleInputChange('memo', e.target.value)}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-money-check"></i> Issue Cheque
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Cheque Statistics */}
        <div className="cheque-stats-section">
          <div className="section-header">
            <h3><i className="fas fa-chart-bar"></i> Cheque Statistics</h3>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-money-check"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{cheques.length}</div>
                <div className="stat-label">Total Cheques</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-calendar-day"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {cheques.filter(c => {
                    const chequeDate = new Date(c.issue_date || c.created_at);
                    const today = new Date();
                    return chequeDate.toDateString() === today.toDateString();
                  }).length}
                </div>
                <div className="stat-label">Today's Cheques</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-dollar-sign"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  ₱{cheques.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0).toLocaleString()}
                </div>
                <div className="stat-label">Total Amount</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="ic-filters-section">
        <div className="filters-header">
          <h3><i className="fas fa-filter"></i> Filter Cheques</h3>
          <button className="clear-filters-btn" onClick={clearFilters}>
            <i className="fas fa-times"></i> Clear Filters
          </button>
        </div>
        
        <div className="filters-grid">
          <div className="filter-group">
            <label>Status</label>
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Cheques</option>
              <option value="recent">Recent (Last 7 days)</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Bank Name</label>
            <select 
              value={filters.bankName} 
              onChange={(e) => handleFilterChange('bankName', e.target.value)}
            >
              <option value="all">All Banks</option>
              {uniqueBankNames.map((bank) => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
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
              placeholder="Search cheques..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Cheques Table */}
      <div className="ic-cheques-section">
        <div className="cheques-header">
          <h3><i className="fas fa-table"></i> Cheque Records</h3>
          <div className="cheques-count">
            Showing {filteredCheques.length} of {cheques.length} cheques
          </div>
        </div>

        <div className="cheques-table-container">
          <table className="cheques-table">
            <thead>
              <tr>
                <th><i className="fas fa-hashtag"></i> Cheque ID</th>
                <th><i className="fas fa-money-check"></i> Cheque Number</th>
                <th><i className="fas fa-exchange-alt"></i> Disbursement</th>
                <th><i className="fas fa-user"></i> Payee Name</th>
                <th><i className="fas fa-university"></i> Bank</th>
                <th><i className="fas fa-money-bill"></i> Amount</th>
                <th><i className="fas fa-calendar"></i> Issue Date</th>
                <th><i className="fas fa-cogs"></i> Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCheques.length > 0 ? (
                filteredCheques.map((cheque) => (
                  <tr key={cheque.id}>
                    <td>#{cheque.id}</td>
                    <td className="cheque-number">{cheque.cheque_number}</td>
                    <td>#{cheque.disbursement_id}</td>
                    <td>{cheque.payee_name}</td>
                    <td>{cheque.bank_name}</td>
                    <td className="amount-negative">
                      ₱{parseFloat(cheque.amount || 0).toLocaleString()}
                    </td>
                    <td>{new Date(cheque.issue_date || cheque.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="view-btn"
                          onClick={() => viewChequeDetails(cheque)}
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button 
                          className="print-btn"
                          onClick={() => window.print()}
                          title="Print Cheque"
                        >
                          <i className="fas fa-print"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-data">
                    <i className="fas fa-inbox"></i>
                    <p>No cheques found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showIssueModal && (
        <div className="modal-overlay" onClick={() => setShowIssueModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-question-circle"></i> Confirm Cheque Issue</h3>
              <button className="modal-close" onClick={() => setShowIssueModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="confirmation-details">
                <div className="detail-item">
                  <label>Disbursement ID:</label>
                  <span>#{formData.disbursementId}</span>
                </div>
                <div className="detail-item">
                  <label>Cheque Number:</label>
                  <span>{formData.chequeNumber}</span>
                </div>
                <div className="detail-item">
                  <label>Bank Name:</label>
                  <span>{formData.bankName}</span>
                </div>
                <div className="detail-item">
                  <label>Account Number:</label>
                  <span>{formData.accountNumber}</span>
                </div>
                <div className="detail-item">
                  <label>Payee Name:</label>
                  <span>{formData.payeeName}</span>
                </div>
                <div className="detail-item">
                  <label>Amount:</label>
                  <span>₱{parseFloat(formData.amount || 0).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Issue Date:</label>
                  <span>{new Date(formData.issueDate).toLocaleDateString()}</span>
                </div>
                {formData.memo && (
                  <div className="detail-item">
                    <label>Memo:</label>
                    <span>{formData.memo}</span>
                  </div>
                )}
              </div>
              <p className="confirmation-message">
                Are you sure you want to issue this cheque?
              </p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowIssueModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-btn"
                onClick={confirmIssueCheque}
                disabled={loading}
              >
                {loading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <>
                    <i className="fas fa-check"></i> Issue Cheque
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showChequeModal && chequeResult && (
        <div className="modal-overlay" onClick={() => setShowChequeModal(false)}>
          <div className="modal-content success" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-check-circle"></i> Cheque Issued Successfully</h3>
              <button className="modal-close" onClick={() => setShowChequeModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="success-details">
                <div className="success-icon">
                  <i className="fas fa-money-check"></i>
                </div>
                <h4>Cheque Generated</h4>
                <div className="result-details">
                  <div className="detail-item">
                    <label>Cheque ID:</label>
                    <span>#{chequeResult.id}</span>
                  </div>
                  <div className="detail-item">
                    <label>Cheque Number:</label>
                    <span>{chequeResult.chequeNumber}</span>
                  </div>
                  <div className="detail-item">
                    <label>Payee:</label>
                    <span>{chequeResult.payeeName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Amount:</label>
                    <span>₱{parseFloat(chequeResult.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Bank:</label>
                    <span>{chequeResult.bankName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Issue Date:</label>
                    <span>{new Date(chequeResult.issueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowChequeModal(false)}
              >
                <i className="fas fa-times"></i> Close
              </button>
              <button
                type="button"
                className="print-btn"
                onClick={() => window.print()}
              >
                <i className="fas fa-print"></i> Print Cheque
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueCheque;
