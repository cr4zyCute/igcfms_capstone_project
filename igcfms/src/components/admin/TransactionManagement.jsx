import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import API_BASE_URL from "../../config/api";
import "./css/transactionmanagement.css";

const TransactionManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [overrideRequests, setOverrideRequests] = useState([]);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalCollections: 0,
    totalDisbursements: 0,
    pendingOverrides: 0,
    todayTransactions: 0,
    thisMonthTransactions: 0,
  });

  // Filter states
  const [filters, setFilters] = useState({
    type: "all",
    department: "all",
    dateFrom: "",
    dateTo: "",
    searchTerm: "",
    status: "all"
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Receive Money Form State
  const [receiveMoneyForm, setReceiveMoneyForm] = useState({
    payerName: '',
    amount: '',
    reference: '',
    modeOfPayment: 'Cash',
    description: '',
    fundAccountId: '',
    department: 'Finance',
    category: 'Tax Collection'
  });
  const [fundAccounts, setFundAccounts] = useState([]);

  const API_BASE = API_BASE_URL;

  useEffect(() => {
    fetchTransactionData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const fetchTransactionData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem('token');
      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch all transaction-related data
      const [transactionsRes, overrideRes, fundAccountsRes] = await Promise.all([
        axios.get(`${API_BASE}/transactions`, { headers }),
        axios.get(`${API_BASE}/override-requests`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/fund-accounts`, { headers }).catch(() => ({ data: [] }))
      ]);

      const allTransactions = transactionsRes.data || [];
      const allOverrides = overrideRes.data || [];
      const allFundAccounts = Array.isArray(fundAccountsRes.data) ? fundAccountsRes.data : (fundAccountsRes.data?.data || []);

      setTransactions(allTransactions);
      setOverrideRequests(allOverrides);
      setFundAccounts(allFundAccounts);

      // Calculate statistics
      const today = new Date().toDateString();
      const thisMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const todayTransactions = allTransactions.filter(tx => 
        new Date(tx.created_at).toDateString() === today
      ).length;

      const thisMonthTransactions = allTransactions.filter(tx => {
        const txDate = new Date(tx.created_at);
        return txDate.getMonth() === thisMonth && txDate.getFullYear() === currentYear;
      }).length;

      const totalCollections = allTransactions
        .filter(tx => tx.type === 'Collection')
        .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

      const totalDisbursements = allTransactions
        .filter(tx => tx.type === 'Disbursement')
        .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

      const pendingOverrides = allOverrides.filter(req => req.status === 'pending').length;

      setStats({
        totalTransactions: allTransactions.length,
        totalCollections,
        totalDisbursements,
        pendingOverrides,
        todayTransactions,
        thisMonthTransactions,
      });

    } catch (err) {
      console.error('Transaction management error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load transaction data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Type filter
    if (filters.type !== "all") {
      filtered = filtered.filter(tx => tx.type === filters.type);
    }

    // Department filter
    if (filters.department !== "all") {
      filtered = filtered.filter(tx => tx.department === filters.department);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(tx => 
        new Date(tx.created_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(tx => 
        new Date(tx.created_at) <= new Date(filters.dateTo + "T23:59:59")
      );
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.description?.toLowerCase().includes(searchLower) ||
        tx.recipient?.toLowerCase().includes(searchLower) ||
        tx.reference?.toLowerCase().includes(searchLower) ||
        tx.id.toString().includes(searchLower)
      );
    }

    setFilteredTransactions(filtered);
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
      department: "all",
      dateFrom: "",
      dateTo: "",
      searchTerm: "",
      status: "all"
    });
  };

  const viewTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const handleReceiveMoneyChange = (field, value) => {
    setReceiveMoneyForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReceiveMoneySubmit = async (e) => {
    e.preventDefault();
    
    if (!receiveMoneyForm.payerName.trim()) {
      setError("Please enter payer name.");
      return;
    }
    if (!receiveMoneyForm.amount || parseFloat(receiveMoneyForm.amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (!receiveMoneyForm.fundAccountId) {
      setError("Please select a fund account.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Auto-generate receipt and reference numbers
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const dailyCount = transactions.filter(tx => 
        tx.type === 'Collection' && 
        new Date(tx.created_at).toDateString() === new Date().toDateString()
      ).length + 1;
      
      const receiptNo = `RCPT-${today}-${String(dailyCount).padStart(4, '0')}`;
      const referenceNo = `COL-${new Date().getFullYear()}-${String(dailyCount).padStart(4, '0')}`;

      // Create transaction
      const transactionPayload = {
        type: 'Collection',
        amount: parseFloat(receiveMoneyForm.amount),
        description: receiveMoneyForm.description.trim() || `Collection from ${receiveMoneyForm.payerName}`,
        recipient: receiveMoneyForm.payerName.trim(),
        department: receiveMoneyForm.department,
        category: receiveMoneyForm.category,
        reference: receiveMoneyForm.reference.trim() || referenceNo,
        receipt_no: receiptNo,
        reference_no: referenceNo,
        fund_account_id: parseInt(receiveMoneyForm.fundAccountId),
        mode_of_payment: receiveMoneyForm.modeOfPayment,
        created_by: parseInt(userId)
      };

      const transactionRes = await axios.post(
        `${API_BASE}/transactions`,
        transactionPayload,
        { headers }
      );

      // Create receipt record
      await axios.post(
        `${API_BASE}/receipts`,
        {
          transaction_id: transactionRes.data.id || transactionRes.data.data?.id,
          payer_name: receiveMoneyForm.payerName.trim(),
          receipt_number: receiptNo,
          issued_at: new Date().toISOString()
        },
        { headers }
      );

      // Reset form
      setReceiveMoneyForm({
        payerName: '',
        amount: '',
        reference: '',
        modeOfPayment: 'Cash',
        description: '',
        fundAccountId: '',
        department: 'Finance',
        category: 'Tax Collection'
      });

      setSuccess(`Collection transaction created successfully! Receipt: ${receiptNo}`);
      setError("");
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess("");
      }, 5000);
      
      fetchTransactionData(); 

    } catch (err) {
      console.error("Error creating collection:", err);
      if (err.response?.status === 422 && err.response.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors)
          .flat()
          .join(", ");
        setError(`Validation error: ${errorMessages}`);
      } else {
        setError(err.response?.data?.message || "Failed to create collection transaction.");
      }
    } finally {
      setLoading(false);
    }
  };

  const departments = [
    "Finance", "Administration", "Operations", "HR", "IT", "Legal",
    "Procurement", "Public Works", "Health Services", "Education", 
    "Social Services", "Other"
  ];

  if (loading) {
    return (
      <div className="transaction-management-loading">
        <div className="spinner"></div>
        <div className="loading-text">Loading transaction management...</div>
      </div>
    );
  }

  return (
    <div className="transaction-management-page">
      <div className="tm-header">
        <h2 className="tm-title">
          <i className="fas fa-exchange-alt"></i> Transaction Management
        </h2>
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

      {/* Main Content Layout */}
      <div className="tm-main-layout">
        {/* Left Content */}
        <div className="tm-left-content">
          {/* Statistics Cards Grid */}
          <div className="tm-stats-grid">
            <div className="stat-card collections">
              <div className="stat-icon">
                <i className="fas fa-arrow-down"></i>
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Collections</div>
                <div className="stat-value">₱{stats.totalCollections.toLocaleString()}</div>
              </div>
            </div>
            <div className="stat-card disbursements">
              <div className="stat-icon">
                <i className="fas fa-arrow-up"></i>
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Disbursements</div>
                <div className="stat-value">₱{stats.totalDisbursements.toLocaleString()}</div>
              </div>
            </div>
            <div className="stat-card total-transactions">
              <div className="stat-icon">
                <i className="fas fa-list"></i>
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Transactions</div>
                <div className="stat-value">{stats.totalTransactions.toLocaleString()}</div>
              </div>
            </div>
            <div className="stat-card today-transactions">
              <div className="stat-icon">
                <i className="fas fa-calendar-day"></i>
              </div>
              <div className="stat-content">
                <div className="stat-label">Today's Transactions</div>
                <div className="stat-value">{stats.todayTransactions}</div>
              </div>
            </div>
            <div className="stat-card net-balance">
              <div className="stat-icon">
                <i className="fas fa-balance-scale"></i>
              </div>
              <div className="stat-content">
                <div className="stat-label">Net Balance</div>
                <div className="stat-value">₱{(stats.totalCollections - stats.totalDisbursements).toLocaleString()}</div>
              </div>
            </div>
            <div className="stat-card collection-rate">
              <div className="stat-icon">
                <i className="fas fa-chart-pie"></i>
              </div>
              <div className="stat-content">
                <div className="stat-label">Collection Rate</div>
                <div className="stat-value">
                  {stats.totalTransactions > 0 ? 
                    Math.round((transactions.filter(tx => tx.type === 'Collection').length / stats.totalTransactions) * 100) : 0}%
                </div>
                <div className="collection-rate-graph">
                  <div className="graph-container">
                    <div 
                      className="collection-bar"
                      style={{
                        height: `${stats.totalTransactions > 0 ? 
                          Math.round((transactions.filter(tx => tx.type === 'Collection').length / stats.totalTransactions) * 100) : 0}%`
                      }}
                    ></div>
                    <div 
                      className="disbursement-bar"
                      style={{
                        height: `${stats.totalTransactions > 0 ? 
                          Math.round((transactions.filter(tx => tx.type === 'Disbursement').length / stats.totalTransactions) * 100) : 0}%`
                      }}
                    ></div>
                  </div>
                  <div className="graph-labels">
                    <span className="collection-label">Collections</span>
                    <span className="disbursement-label">Disbursements</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="tm-filters-section">
            <div className="filters-header">
              <h3><i className="fas fa-filter"></i> Transaction Filters</h3>
              <button className="clear-filters-btn" onClick={clearFilters}>
                <i className="fas fa-times"></i> Clear Filters
              </button>
            </div>
            
            <div className="filters-grid">
              <div className="filter-group">
                <label>Transaction Type</label>
                <select 
                  value={filters.type} 
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="Collection">Collections</option>
                  <option value="Disbursement">Disbursements</option>
                  <option value="Override">Overrides</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Department</label>
                <select 
                  value={filters.department} 
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Date From</label>
                <input 
                  type="date" 
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  placeholder="dd/mm/yyyy"
                />
              </div>

              <div className="filter-group">
                <label>Date To</label>
                <input 
                  type="date" 
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  placeholder="dd/mm/yyyy"
                />
              </div>

              <div className="filter-group">
                <label>Search</label>
                <input 
                  type="text" 
                  placeholder="Search transactions..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="tm-transactions-section">
            <div className="transactions-header">
              <h3>Transaction Records</h3>
            </div>

            <div className="transactions-table-container">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Recipient/Payer</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Created By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>#{transaction.id}</td>
                        <td>
                          <span className={`transaction-type-badge ${transaction.type.toLowerCase()}`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className={`amount ${transaction.type === 'Collection' ? 'positive' : 'negative'}`}>
                          {transaction.type === 'Collection' ? '+' : '-'}₱{parseFloat(transaction.amount || 0).toLocaleString()}
                        </td>
                        <td>{transaction.recipient || 'N/A'}</td>
                        <td>{transaction.department || 'N/A'}</td>
                        <td>{new Date(transaction.created_at).toLocaleDateString()}</td>
                        <td>{transaction.created_by || 'System'}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="view-btn"
                              onClick={() => viewTransactionDetails(transaction)}
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="no-data">
                        <i className="fas fa-inbox"></i>
                        <p>No transactions found matching your criteria.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Panel - Receive Money Form */}
        <div className="tm-right-panel">
          <div className="receive-money-panel">
            <form onSubmit={handleReceiveMoneySubmit}>
              <h3>Receive Money</h3>
              
              <div className="form-group">
                <label>Payer Name *</label>
                <input 
                  type="text" 
                  placeholder="Enter payer name"
                  value={receiveMoneyForm.payerName}
                  onChange={(e) => handleReceiveMoneyChange('payerName', e.target.value)}
                  required
                />
              </div>
              
              <div className="form-info">
                <p><strong>Receipt Number:</strong> Will be auto-generated</p>
                <p><strong>Reference Number:</strong> Will be auto-generated</p>
              </div>
              
              <div className="form-group">
                <label>Amount *</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  placeholder="Enter amount"
                  value={receiveMoneyForm.amount}
                  onChange={(e) => handleReceiveMoneyChange('amount', e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Reference (optional)</label>
                <input 
                  type="text" 
                  placeholder="Enter reference"
                  value={receiveMoneyForm.reference}
                  onChange={(e) => handleReceiveMoneyChange('reference', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Payment Mode *</label>
                <select 
                  value={receiveMoneyForm.modeOfPayment}
                  onChange={(e) => handleReceiveMoneyChange('modeOfPayment', e.target.value)}
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea 
                  rows="2" 
                  placeholder="Enter description"
                  value={receiveMoneyForm.description}
                  onChange={(e) => handleReceiveMoneyChange('description', e.target.value)}
                ></textarea>
              </div>
              
              <div className="form-group">
                <label>Fund Account *</label>
                <select 
                  value={receiveMoneyForm.fundAccountId}
                  onChange={(e) => handleReceiveMoneyChange('fundAccountId', e.target.value)}
                  required
                >
                  <option value="">-- Select Fund Account --</option>
                  {fundAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.code})
                    </option>
                  ))}
                </select>
              </div>
              
              <button 
                type="submit" 
                className="create-transaction-btn"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Collection Transaction'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-info-circle"></i> Transaction Details</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="transaction-details-grid">
                <div className="detail-item">
                  <label>Transaction ID:</label>
                  <span>#{selectedTransaction.id}</span>
                </div>
                <div className="detail-item">
                  <label>Type:</label>
                  <span className={`transaction-type-badge ${selectedTransaction.type.toLowerCase()}`}>
                    {selectedTransaction.type}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Amount:</label>
                  <span className={`amount ${selectedTransaction.type === 'Collection' ? 'positive' : 'negative'}`}>
                    ₱{parseFloat(selectedTransaction.amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Description:</label>
                  <span>{selectedTransaction.description || 'No description'}</span>
                </div>
                <div className="detail-item">
                  <label>Recipient/Payer:</label>
                  <span>{selectedTransaction.recipient || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Department:</label>
                  <span>{selectedTransaction.department || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Category:</label>
                  <span>{selectedTransaction.category || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Reference:</label>
                  <span>{selectedTransaction.reference || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Receipt/Reference No:</label>
                  <span>{selectedTransaction.receipt_no || selectedTransaction.reference_no || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Payment Mode:</label>
                  <span>{selectedTransaction.mode_of_payment || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Created Date:</label>
                  <span>{new Date(selectedTransaction.created_at).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Last Updated:</label>
                  <span>{new Date(selectedTransaction.updated_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManagement;
