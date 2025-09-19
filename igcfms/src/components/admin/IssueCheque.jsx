import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/issuecheque.css";
import "./css/cheque-styles.css";

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
    fundAccountId: "",
    method: "Cheque"
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

      // Fetch transactions (disbursements with cheque method) and fund accounts
      const [transactionsRes, fundAccountsRes] = await Promise.all([
        axios.get(`${API_BASE}/transactions`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/fund-accounts`, { headers }).catch(() => ({ data: [] }))
      ]);

      // Filter for disbursement transactions that can have cheques
      const allTransactions = transactionsRes.data || [];
      const disbursementTransactions = allTransactions.filter(tx => 
        tx.type === 'Disbursement' && tx.mode_of_payment === 'Cheque'
      );
      
      // Use disbursements as cheques for display
      const chequesData = disbursementTransactions;

      setDisbursements(disbursementTransactions);
      setCheques(chequesData);
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

    // Auto-populate fields when transaction is selected
    if (field === 'disbursementId' && value) {
      const selectedTransaction = disbursements.find(d => d.id.toString() === value);
      if (selectedTransaction) {
        setFormData(prev => ({
          ...prev,
          payeeName: selectedTransaction.recipient || "",
          amount: Math.abs(selectedTransaction.amount) || "",
          fundAccountId: selectedTransaction.fund_account_id || ""
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
      showMessage("Please select a transaction.", 'error');
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
        transaction_id: parseInt(formData.disbursementId),
        payee_name: formData.payeeName.trim(),
        method: 'Cheque',
        cheque_number: formData.chequeNumber.trim(),
        bank_name: formData.bankName.trim(),
        account_number: formData.accountNumber.trim(),
        amount: parseFloat(formData.amount),
        issue_date: formData.issueDate,
        memo: formData.memo.trim() || null,
        fund_account_id: formData.fundAccountId ? parseInt(formData.fundAccountId) : null
      };

      const response = await axios.post(`${API_BASE}/disbursements`, payload, { headers });

      setChequeResult({
        id: response.data.id || response.data.data?.id,
        chequeNumber: formData.chequeNumber,
        payeeName: formData.payeeName,
        amount: formData.amount,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        issueDate: formData.issueDate,
        disbursementId: formData.disbursementId,
        memo: formData.memo
      });

      showMessage("Cheque issued successfully!");
      
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

      setShowSuccessModal(true);
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
    setShowChequeModal(true);
  };

  const printCheque = (cheque) => {
    // Create a printable cheque format
    const printWindow = window.open('', '_blank');
    const chequeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cheque - ${cheque.cheque_number}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .cheque-container { border: 2px solid #000; padding: 20px; width: 600px; height: 250px; position: relative; }
          .bank-name { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          .cheque-number { position: absolute; top: 20px; right: 20px; font-size: 14px; }
          .date { position: absolute; top: 60px; right: 20px; }
          .payee { margin-top: 40px; margin-bottom: 20px; }
          .amount-words { margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px; }
          .amount-figures { position: absolute; right: 20px; bottom: 80px; font-size: 16px; font-weight: bold; }
          .signature { position: absolute; bottom: 20px; right: 20px; border-top: 1px solid #000; padding-top: 5px; width: 150px; text-align: center; }
          .memo { position: absolute; bottom: 20px; left: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="cheque-container">
          <div class="bank-name">${cheque.bank_name}</div>
          <div class="cheque-number">Cheque No: ${cheque.cheque_number}</div>
          <div class="date">Date: ${new Date(cheque.issue_date || cheque.created_at).toLocaleDateString()}</div>
          <div class="payee">Pay to the order of: <strong>${cheque.payee_name}</strong></div>
          <div class="amount-words">The sum of: ${numberToWords(parseFloat(cheque.amount))} Pesos</div>
          <div class="amount-figures">₱${parseFloat(cheque.amount).toLocaleString()}</div>
          <div class="signature">Authorized Signature</div>
          ${cheque.memo ? `<div class="memo">Memo: ${cheque.memo}</div>` : ''}
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.close();
          }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(chequeHtml);
    printWindow.document.close();
  };

  // Helper function to convert numbers to words (simplified)
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + numberToWords(num % 100) : '');
    if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + numberToWords(num % 1000) : '');
    
    return num.toString(); // Fallback for very large numbers
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
                <option value="">-- Select Transaction --</option>
                {disbursements.map((transaction) => (
                  <option key={transaction.id} value={transaction.id}>
                    #{transaction.id} - ₱{parseFloat(transaction.amount || 0).toLocaleString()} - {transaction.recipient || transaction.description || 'N/A'}
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
                          onClick={() => printCheque(cheque)}
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

      {/* Cheque Details Modal */}
      {showChequeModal && selectedCheque && (
        <div className="modal-overlay" onClick={() => setShowChequeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-money-check"></i> Cheque Details</h3>
              <button className="modal-close" onClick={() => setShowChequeModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="confirmation-details">
                <div className="detail-item">
                  <label>Cheque ID:</label>
                  <span>#{selectedCheque.id}</span>
                </div>
                <div className="detail-item">
                  <label>Cheque Number:</label>
                  <span>{selectedCheque.cheque_number}</span>
                </div>
                <div className="detail-item">
                  <label>Disbursement ID:</label>
                  <span>#{selectedCheque.disbursement_id}</span>
                </div>
                <div className="detail-item">
                  <label>Payee Name:</label>
                  <span>{selectedCheque.payee_name}</span>
                </div>
                <div className="detail-item">
                  <label>Bank Name:</label>
                  <span>{selectedCheque.bank_name}</span>
                </div>
                <div className="detail-item">
                  <label>Account Number:</label>
                  <span>{selectedCheque.account_number}</span>
                </div>
                <div className="detail-item">
                  <label>Amount:</label>
                  <span>₱{parseFloat(selectedCheque.amount || 0).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Issue Date:</label>
                  <span>{new Date(selectedCheque.issue_date || selectedCheque.created_at).toLocaleDateString()}</span>
                </div>
                {selectedCheque.memo && (
                  <div className="detail-item">
                    <label>Memo:</label>
                    <span>{selectedCheque.memo}</span>
                  </div>
                )}
                <div className="detail-item">
                  <label>Created At:</label>
                  <span>{new Date(selectedCheque.created_at).toLocaleString()}</span>
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
                onClick={() => printCheque(selectedCheque)}
              >
                <i className="fas fa-print"></i> Print Cheque
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Cheque Modal */}
      {showSuccessModal && chequeResult && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="cheque-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cheque-actions-bar">
              <button className="modal-close" onClick={() => setShowSuccessModal(false)}>
                <i className="fas fa-times"></i>
              </button>
              <button className="print-btn" onClick={() => window.print()}>
                <i className="fas fa-print"></i> Print
              </button>
            </div>
            
            {/* Official Cheque Document */}
            <div className="official-cheque" id="cheque-document">
              {/* Cheque Header */}
              <div className="cheque-header">
                <div className="cheque-logo-section">
                  <div className="logo-placeholder">
                    <i className="fas fa-university"></i>
                  </div>
                  <div className="cheque-bank-info">
                    <h1 className="bank-name">{chequeResult.bankName}</h1>
                    <p className="bank-address">Government Banking Division</p>
                    <p className="bank-contact">IGCFMS Account Services</p>
                  </div>
                </div>
                
                <div className="cheque-number-section">
                  <div className="cheque-number-box">
                    <span className="cheque-number-label">CHEQUE NO.</span>
                    <span className="cheque-number-value">{chequeResult.chequeNumber}</span>
                  </div>
                </div>
              </div>

              {/* Cheque Body */}
              <div className="cheque-body">
                <div className="cheque-date-section">
                  <span className="date-label">Date:</span>
                  <span className="date-value">{new Date(chequeResult.issueDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>

                <div className="cheque-payee-section">
                  <div className="payee-line">
                    <span className="payee-label">Pay to the order of:</span>
                    <span className="payee-name">{chequeResult.payeeName}</span>
                  </div>
                </div>

                <div className="cheque-amount-section">
                  <div className="amount-words-line">
                    <span className="amount-words-label">The sum of:</span>
                    <span className="amount-in-words">
                      {numberToWords(parseFloat(chequeResult.amount))} Pesos Only
                    </span>
                  </div>
                  
                  <div className="amount-figures-section">
                    <span className="currency-symbol">₱</span>
                    <span className="amount-figures">{parseFloat(chequeResult.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {chequeResult.memo && (
                  <div className="cheque-memo-section">
                    <span className="memo-label">Memo:</span>
                    <span className="memo-text">{chequeResult.memo}</span>
                  </div>
                )}
              </div>

              {/* Cheque Footer */}
              <div className="cheque-footer">
                <div className="cheque-account-info">
                  <div className="account-number">
                    <span className="account-label">Account No:</span>
                    <span className="account-value">{chequeResult.accountNumber}</span>
                  </div>
                  <div className="routing-info">
                    <span className="routing-label">Routing:</span>
                    <span className="routing-value">IGCF-001-2024</span>
                  </div>
                </div>

                <div className="cheque-signature-section">
                  <div className="signature-line"></div>
                  <div className="signature-label">Authorized Signature</div>
                  <div className="signature-title">IGCFMS Disbursing Officer</div>
                </div>

                <div className="cheque-security-features">
                  <div className="security-line"></div>
                  <div className="micr-line">
                    ⑆001⑆ {chequeResult.accountNumber} ⑆ {chequeResult.chequeNumber}⑆
                  </div>
                </div>
              </div>

              {/* Cheque Watermark */}
              <div className="cheque-watermark">
                <span>IGCFMS</span>
              </div>

              {/* Security Features */}
              <div className="cheque-security-border"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueCheque;
