import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/issuereceipt.css";

// Helper function to convert numbers to words
const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const thousands = ['', 'Thousand', 'Million', 'Billion'];

  if (num === 0) return 'Zero';

  const convertHundreds = (n) => {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + ' ';
      return result;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result;
  };

  let result = '';
  let thousandIndex = 0;
  
  while (num > 0) {
    if (num % 1000 !== 0) {
      result = convertHundreds(num % 1000) + thousands[thousandIndex] + ' ' + result;
    }
    num = Math.floor(num / 1000);
    thousandIndex++;
  }

  return result.trim();
};

const IssueReceipt = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  
  // Form states
  const [formData, setFormData] = useState({
    transactionId: "",
    payerName: "",
    receiptNumber: "",
    issueDate: new Date().toISOString().split('T')[0],
  });

  // Filter states
  const [filters, setFilters] = useState({
    status: "all",
    dateFrom: "",
    dateTo: "",
    searchTerm: ""
  });

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptResult, setReceiptResult] = useState(null);

  const API_BASE = "http://localhost:8000/api";
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchInitialData();
  }, [token]);

  useEffect(() => {
    applyFilters();
  }, [receipts, filters]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch collection transactions and receipts
      const [transactionsRes, receiptsRes] = await Promise.all([
        axios.get(`${API_BASE}/transactions?type=Collection`, { headers }),
        axios.get(`${API_BASE}/receipts`, { headers }).catch(() => ({ data: [] }))
      ]);

      setTransactions(transactionsRes.data || []);
      setReceipts(receiptsRes.data || []);

    } catch (err) {
      console.error('Issue receipt error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...receipts];

    // Status filter (based on issued date - recent vs older)
    if (filters.status === "recent") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(receipt => 
        new Date(receipt.issued_at || receipt.created_at) >= weekAgo
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(receipt => 
        new Date(receipt.issued_at || receipt.created_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(receipt => 
        new Date(receipt.issued_at || receipt.created_at) <= new Date(filters.dateTo + "T23:59:59")
      );
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(receipt => 
        receipt.payer_name?.toLowerCase().includes(searchLower) ||
        receipt.receipt_number?.toLowerCase().includes(searchLower) ||
        receipt.transaction_id?.toString().includes(searchLower) ||
        receipt.id.toString().includes(searchLower)
      );
    }

    setFilteredReceipts(filtered);
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
      searchTerm: ""
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-populate payer name when transaction is selected
    if (field === 'transactionId' && value) {
      const selectedTransaction = transactions.find(tx => tx.id.toString() === value);
      if (selectedTransaction && selectedTransaction.recipient) {
        setFormData(prev => ({
          ...prev,
          payerName: selectedTransaction.recipient
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
    const { transactionId, payerName, receiptNumber } = formData;

    if (!transactionId) {
      showMessage("Please select a transaction.", 'error');
      return false;
    }
    if (!payerName.trim()) {
      showMessage("Please enter payer name.", 'error');
      return false;
    }
    if (!receiptNumber.trim()) {
      showMessage("Please enter receipt number.", 'error');
      return false;
    }

    // Check if receipt number already exists
    const existingReceipt = receipts.find(r => 
      r.receipt_number?.toLowerCase() === receiptNumber.trim().toLowerCase()
    );
    if (existingReceipt) {
      showMessage("Receipt number already exists. Please use a different number.", 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setShowIssueModal(true);
  };

  const confirmIssueReceipt = async () => {
    setLoading(true);
    setShowIssueModal(false);
    
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const payload = {
        transaction_id: parseInt(formData.transactionId),
        payer_name: formData.payerName.trim(),
        receipt_number: formData.receiptNumber.trim(),
      };

      const response = await axios.post(`${API_BASE}/receipts`, payload, { headers });

      setReceiptResult({
        id: response.data.id || response.data.data?.id,
        receiptNumber: formData.receiptNumber,
        payerName: formData.payerName,
        transactionId: formData.transactionId,
        issueDate: formData.issueDate
      });

      // Reset form
      setFormData({
        transactionId: "",
        payerName: "",
        receiptNumber: "",
        issueDate: new Date().toISOString().split('T')[0],
      });

      setShowReceiptModal(true);
      fetchInitialData(); // Refresh data

    } catch (err) {
      console.error("Error issuing receipt:", err);
      if (err.response?.status === 422 && err.response.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors)
          .flat()
          .join(", ");
        showMessage(`Validation error: ${errorMessages}`, 'error');
      } else {
        showMessage(err.response?.data?.message || "Failed to issue receipt.", 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const viewReceiptDetails = (receipt) => {
    setSelectedReceipt(receipt);
    // Could open a details modal here
  };

  // Generate next receipt number
  const generateReceiptNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    
    return `RCP-${year}${month}${day}-${timestamp}`;
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="issue-receipt-loading">
        <div className="spinner"></div>
        <div className="loading-text">Loading receipt management...</div>
      </div>
    );
  }

  return (
    <div className="issue-receipt-page">
      <div className="ir-header">
        <h2 className="ir-title">
          <i className="fas fa-receipt"></i> Issue Receipt Management
        </h2>
        <p className="ir-subtitle">
          Issue official receipts for collection transactions and manage receipt records
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

      <div className="ir-content-grid">
        {/* Issue Receipt Form */}
        <div className="issue-form-section">
          <div className="form-header">
            <h3><i className="fas fa-plus-circle"></i> Issue New Receipt</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="receipt-form">
            <div className="form-group">
              <label>Select Collection Transaction *</label>
              <select
                value={formData.transactionId}
                onChange={(e) => handleInputChange('transactionId', e.target.value)}
                required
              >
                <option value="">-- Select Transaction --</option>
                {transactions.map((tx) => (
                  <option key={tx.id} value={tx.id}>
                    #{tx.id} - ₱{parseFloat(tx.amount || 0).toLocaleString()} - {tx.description || 'Collection'} - {tx.recipient || 'N/A'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Payer Name *</label>
                <input
                  type="text"
                  placeholder="Enter payer name"
                  value={formData.payerName}
                  onChange={(e) => handleInputChange('payerName', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Receipt Number *</label>
                <div className="receipt-number-input">
                  <input
                    type="text"
                    placeholder="Enter receipt number"
                    value={formData.receiptNumber}
                    onChange={(e) => handleInputChange('receiptNumber', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="generate-btn"
                    onClick={() => handleInputChange('receiptNumber', generateReceiptNumber())}
                    title="Generate Receipt Number"
                  >
                    <i className="fas fa-magic"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Issue Date</label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => handleInputChange('issueDate', e.target.value)}
              />
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
                    <i className="fas fa-receipt"></i> Issue Receipt
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Receipt Statistics */}
        <div className="receipt-stats-section">
          <div className="section-header">
            <h3><i className="fas fa-chart-bar"></i> Receipt Statistics</h3>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-receipt"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{receipts.length}</div>
                <div className="stat-label">Total Receipts</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-calendar-day"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {receipts.filter(r => {
                    const receiptDate = new Date(r.issued_at || r.created_at);
                    const today = new Date();
                    return receiptDate.toDateString() === today.toDateString();
                  }).length}
                </div>
                <div className="stat-label">Today's Receipts</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-calendar-week"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {receipts.filter(r => {
                    const receiptDate = new Date(r.issued_at || r.created_at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return receiptDate >= weekAgo;
                  }).length}
                </div>
                <div className="stat-label">This Week</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="ir-filters-section">
        <div className="filters-header">
          <h3><i className="fas fa-filter"></i> Filter Receipts</h3>
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
              <option value="all">All Receipts</option>
              <option value="recent">Recent (Last 7 days)</option>
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
              placeholder="Search receipts..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="ir-receipts-section">
        <div className="receipts-header">
          <h3><i className="fas fa-table"></i> Receipt Records</h3>
          <div className="receipts-count">
            Showing {filteredReceipts.length} of {receipts.length} receipts
          </div>
        </div>

        <div className="receipts-table-container">
          <table className="receipts-table">
            <thead>
              <tr>
                <th><i className="fas fa-hashtag"></i> Receipt ID</th>
                <th><i className="fas fa-receipt"></i> Receipt Number</th>
                <th><i className="fas fa-exchange-alt"></i> Transaction</th>
                <th><i className="fas fa-user"></i> Payer Name</th>
                <th><i className="fas fa-money-bill"></i> Amount</th>
                <th><i className="fas fa-calendar"></i> Issue Date</th>
                <th><i className="fas fa-cogs"></i> Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceipts.length > 0 ? (
                filteredReceipts.map((receipt) => {
                  const transaction = transactions.find(tx => tx.id === receipt.transaction_id);
                  return (
                    <tr key={receipt.id}>
                      <td>#{receipt.id}</td>
                      <td className="receipt-number">{receipt.receipt_number}</td>
                      <td>#{receipt.transaction_id}</td>
                      <td>{receipt.payer_name}</td>
                      <td className="amount-positive">
                        ₱{transaction ? parseFloat(transaction.amount || 0).toLocaleString() : 'N/A'}
                      </td>
                      <td>{new Date(receipt.issued_at || receipt.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="view-btn"
                            onClick={() => viewReceiptDetails(receipt)}
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className="print-btn"
                            onClick={() => window.print()}
                            title="Print Receipt"
                          >
                            <i className="fas fa-print"></i>
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
                    <p>No receipts found matching your criteria.</p>
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
              <h3><i className="fas fa-question-circle"></i> Confirm Receipt Issue</h3>
              <button className="modal-close" onClick={() => setShowIssueModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="confirmation-details">
                <div className="detail-item">
                  <label>Transaction ID:</label>
                  <span>#{formData.transactionId}</span>
                </div>
                <div className="detail-item">
                  <label>Payer Name:</label>
                  <span>{formData.payerName}</span>
                </div>
                <div className="detail-item">
                  <label>Receipt Number:</label>
                  <span>{formData.receiptNumber}</span>
                </div>
                <div className="detail-item">
                  <label>Issue Date:</label>
                  <span>{new Date(formData.issueDate).toLocaleDateString()}</span>
                </div>
              </div>
              <p className="confirmation-message">
                Are you sure you want to issue this receipt?
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
                onClick={confirmIssueReceipt}
                disabled={loading}
              >
                {loading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <>
                    <i className="fas fa-check"></i> Issue Receipt
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      {showReceiptModal && receiptResult && (
        <div className="modal-overlay" onClick={() => setShowReceiptModal(false)}>
          <div className="receipt-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-actions-bar">
              <button className="modal-close" onClick={() => setShowReceiptModal(false)}>
                <i className="fas fa-times"></i>
              </button>
              <button className="print-btn" onClick={() => window.print()}>
                <i className="fas fa-print"></i> Print
              </button>
            </div>
            
            {/* Official Receipt Document */}
            <div className="official-receipt" id="receipt-document">
              {/* Receipt Header */}
              <div className="receipt-header">
                <div className="receipt-logo-section">
                  <div className="logo-placeholder">
                    <i className="fas fa-university"></i>
                  </div>
                  <div className="receipt-title-section">
                    <h1 className="receipt-org-name">IGCFMS</h1>
                    <h2 className="receipt-org-subtitle">Integrated Government Cash Flow Management System</h2>
                    <p className="receipt-address">Government Financial Services Department</p>
                    <p className="receipt-contact">Tel: (02) 8888-0000 | Email: igcfmsa@gmail.com</p>
                  </div>
                </div>
                
                <div className="receipt-document-info">
                  <h3 className="receipt-document-title">OFFICIAL RECEIPT</h3>
                  <div className="receipt-number-box">
                    <span className="receipt-number-label">Receipt No.</span>
                    <span className="receipt-number-value">{receiptResult.receiptNumber}</span>
                  </div>
                </div>
              </div>

              {/* Receipt Body */}
              <div className="receipt-body">
                <div className="receipt-date-section">
                  <div className="receipt-date">
                    <span className="date-label">Date:</span>
                    <span className="date-value">{new Date(receiptResult.issueDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                </div>

                <div className="receipt-payer-section">
                  <div className="payer-info">
                    <span className="payer-label">Received from:</span>
                    <span className="payer-name">{receiptResult.payerName}</span>
                  </div>
                </div>

                <div className="receipt-amount-section">
                  <div className="amount-info">
                    <span className="amount-label">The sum of:</span>
                    <div className="amount-details">
                      {(() => {
                        const transaction = transactions.find(tx => tx.id.toString() === receiptResult.transactionId);
                        const amount = transaction ? parseFloat(transaction.amount || 0) : 0;
                        return (
                          <>
                            <div className="amount-words">
                              <span className="amount-in-words">
                                {numberToWords(amount)} Pesos Only
                              </span>
                            </div>
                            <div className="amount-figures">
                              <span className="currency">₱</span>
                              <span className="amount-value">{amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="receipt-purpose-section">
                  <div className="purpose-info">
                    <span className="purpose-label">For:</span>
                    <div className="purpose-details">
                      {(() => {
                        const transaction = transactions.find(tx => tx.id.toString() === receiptResult.transactionId);
                        return (
                          <>
                            <div className="purpose-description">
                              {transaction?.description || 'Government Collection'}
                            </div>
                            <div className="purpose-category">
                              Category: {transaction?.category || 'General Revenue'}
                            </div>
                            <div className="purpose-department">
                              Department: {transaction?.department || 'Finance'}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="receipt-reference-section">
                  <div className="reference-info">
                    <span className="reference-label">Transaction Reference:</span>
                    <span className="reference-value">TXN-{receiptResult.transactionId}</span>
                  </div>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="receipt-footer">
                <div className="receipt-signatures">
                  <div className="signature-section">
                    <div className="signature-line"></div>
                    <div className="signature-label">Received by</div>
                    <div className="signature-title">Authorized Collecting Officer</div>
                  </div>
                  <div className="signature-section">
                    <div className="signature-line"></div>
                    <div className="signature-label">Verified by</div>
                    <div className="signature-title">Finance Officer</div>
                  </div>
                </div>

                <div className="receipt-footer-info">
                  <div className="receipt-serial">
                    <span>Receipt ID: #{receiptResult.id}</span>
                  </div>
                  <div className="receipt-timestamp">
                    <span>Generated: {new Date().toLocaleString()}</span>
                  </div>
                  <div className="receipt-validity">
                    <span>This receipt is computer-generated and valid without signature</span>
                  </div>
                </div>

                <div className="receipt-watermark">
                  <span>IGCFMS - OFFICIAL RECEIPT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueReceipt;
