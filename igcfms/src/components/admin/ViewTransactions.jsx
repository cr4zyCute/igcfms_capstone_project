import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/viewtransactions.css";

const ViewTransactions = ({ filterByAccountIds = null }) => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Enhanced filters
  const [filters, setFilters] = useState({
    type: "all",
    department: "all",
    category: "all",
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
    searchTerm: "",
    paymentMode: "all"
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0
  });

  const API_BASE = "http://localhost:8000/api";

  useEffect(() => {
    fetchTransactions();
  }, [filterByAccountIds]);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const fetchTransactions = async () => {
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

      let params = {};
      if (filterByAccountIds && Array.isArray(filterByAccountIds)) {
        params.accountIds = filterByAccountIds.join(",");
      }

      const response = await axios.get(`${API_BASE}/transactions`, { 
        headers,
        params 
      });
      
      setTransactions(response.data || []);

    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err.response?.data?.message || "Failed to fetch transactions. Please try again.");
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

    // Category filter
    if (filters.category !== "all") {
      filtered = filtered.filter(tx => tx.category === filters.category);
    }

    // Payment mode filter
    if (filters.paymentMode !== "all") {
      filtered = filtered.filter(tx => tx.mode_of_payment === filters.paymentMode);
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

    // Amount range filter
    if (filters.amountMin) {
      filtered = filtered.filter(tx => 
        parseFloat(tx.amount || 0) >= parseFloat(filters.amountMin)
      );
    }
    if (filters.amountMax) {
      filtered = filtered.filter(tx => 
        parseFloat(tx.amount || 0) <= parseFloat(filters.amountMax)
      );
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.description?.toLowerCase().includes(searchLower) ||
        tx.recipient?.toLowerCase().includes(searchLower) ||
        tx.reference?.toLowerCase().includes(searchLower) ||
        tx.receipt_no?.toLowerCase().includes(searchLower) ||
        tx.reference_no?.toLowerCase().includes(searchLower) ||
        tx.id.toString().includes(searchLower)
      );
    }

    setFilteredTransactions(filtered);
    setPagination(prev => ({
      ...prev,
      totalItems: filtered.length,
      currentPage: 1
    }));
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
      category: "all",
      dateFrom: "",
      dateTo: "",
      amountMin: "",
      amountMax: "",
      searchTerm: "",
      paymentMode: "all"
    });
  };

  const viewTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const exportTransactions = (format) => {
    // Implementation for export functionality
    console.log(`Exporting ${filteredTransactions.length} transactions as ${format}`);
    setShowExportModal(false);
  };

  // Pagination logic
  const paginatedTransactions = filteredTransactions.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage);

  const departments = [
    "Finance", "Administration", "Operations", "HR", "IT", "Legal",
    "Procurement", "Public Works", "Health Services", "Education", 
    "Social Services", "Other"
  ];

  const categories = [
    "Tax Collection", "Permit Fees", "License Fees", "Service Fees",
    "Fines and Penalties", "Rental Income", "Interest Income", 
    "Grants and Donations", "Miscellaneous Revenue", "Salaries",
    "Office Supplies", "Equipment", "Utilities", "Travel", "Other"
  ];

  if (loading) {
    return (
      <div className="view-transactions-loading">
        <div className="spinner"></div>
        <div className="loading-text">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="view-transactions-page">
      <div className="vt-header">
        <h2 className="vt-title">
          <i className="fas fa-list"></i> View All Transactions
        </h2>
        <p className="vt-subtitle">
          Comprehensive transaction records with advanced filtering and export options
        </p>
        <div className="header-actions">
          <button 
            className="export-btn"
            onClick={() => setShowExportModal(true)}
          >
            <i className="fas fa-download"></i> Export Data
          </button>
          <button 
            className="refresh-btn"
            onClick={fetchTransactions}
          >
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {/* Advanced Filters */}
      <div className="vt-filters-section">
        <div className="filters-header">
          <h3><i className="fas fa-filter"></i> Advanced Filters</h3>
          <button className="clear-filters-btn" onClick={clearFilters}>
            <i className="fas fa-times"></i> Clear All
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
            <label>Category</label>
            <select 
              value={filters.category} 
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Payment Mode</label>
            <select 
              value={filters.paymentMode} 
              onChange={(e) => handleFilterChange('paymentMode', e.target.value)}
            >
              <option value="all">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Bank Transfer">Bank Transfer</option>
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
            <label>Min Amount</label>
            <input 
              type="number" 
              placeholder="0.00"
              value={filters.amountMin}
              onChange={(e) => handleFilterChange('amountMin', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Max Amount</label>
            <input 
              type="number" 
              placeholder="999999.00"
              value={filters.amountMax}
              onChange={(e) => handleFilterChange('amountMax', e.target.value)}
            />
          </div>

          <div className="filter-group full-width">
            <label>Search</label>
            <input 
              type="text" 
              placeholder="Search by description, recipient, reference..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <div className="results-info">
          <span className="results-count">
            Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
          </span>
          {filteredTransactions.length !== transactions.length && (
            <span className="filter-note">
              (filtered from {transactions.length} total)
            </span>
          )}
        </div>
        <div className="results-stats">
          <span className="stat-item">
            Collections: ₱{filteredTransactions
              .filter(tx => tx.type === 'Collection')
              .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0)
              .toLocaleString()}
          </span>
          <span className="stat-item">
            Disbursements: ₱{filteredTransactions
              .filter(tx => tx.type === 'Disbursement')
              .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0)
              .toLocaleString()}
          </span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="vt-transactions-section">
        <div className="transactions-table-container">
          <table className="transactions-table">
            <thead>
              <tr>
                <th><i className="fas fa-hashtag"></i> ID</th>
                <th><i className="fas fa-calendar"></i> Date</th>
                <th><i className="fas fa-tag"></i> Type</th>
                <th><i className="fas fa-money-bill"></i> Amount</th>
                <th><i className="fas fa-align-left"></i> Description</th>
                <th><i className="fas fa-user"></i> Recipient/Payer</th>
                <th><i className="fas fa-building"></i> Department</th>
                <th><i className="fas fa-credit-card"></i> Payment Mode</th>
                <th><i className="fas fa-receipt"></i> Reference</th>
                <th><i className="fas fa-cogs"></i> Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>#{transaction.id}</td>
                    <td>{new Date(transaction.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`transaction-type-badge ${transaction.type.toLowerCase()}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className={`amount ${transaction.type === 'Collection' ? 'positive' : 'negative'}`}>
                      {transaction.type === 'Collection' ? '+' : '-'}₱{parseFloat(transaction.amount || 0).toLocaleString()}
                    </td>
                    <td className="description-cell">
                      {transaction.description || 'No description'}
                    </td>
                    <td>{transaction.recipient || 'N/A'}</td>
                    <td>{transaction.department || 'N/A'}</td>
                    <td>
                      <span className="payment-mode-badge">
                        {transaction.mode_of_payment || 'N/A'}
                      </span>
                    </td>
                    <td>{transaction.reference || transaction.receipt_no || transaction.reference_no || 'N/A'}</td>
                    <td>
                      <button 
                        className="view-details-btn"
                        onClick={() => viewTransactionDetails(transaction)}
                        title="View Details"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="no-data">
                    <i className="fas fa-inbox"></i>
                    <p>No transactions found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="page-btn"
              onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
              disabled={pagination.currentPage === 1}
            >
              <i className="fas fa-chevron-left"></i> Previous
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, pagination.currentPage - 2) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    className={`page-number ${pageNum === pagination.currentPage ? 'active' : ''}`}
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: pageNum }))}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button 
              className="page-btn"
              onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(totalPages, prev.currentPage + 1) }))}
              disabled={pagination.currentPage === totalPages}
            >
              Next <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
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
                  <label>Payment Mode:</label>
                  <span>{selectedTransaction.mode_of_payment || 'N/A'}</span>
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

      {/* Export Modal */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-download"></i> Export Transactions</h3>
              <button className="modal-close" onClick={() => setShowExportModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Export {filteredTransactions.length} filtered transactions:</p>
              <div className="export-options">
                <button 
                  className="export-option-btn"
                  onClick={() => exportTransactions('excel')}
                >
                  <i className="fas fa-file-excel"></i>
                  Excel (.xlsx)
                </button>
                <button 
                  className="export-option-btn"
                  onClick={() => exportTransactions('pdf')}
                >
                  <i className="fas fa-file-pdf"></i>
                  PDF Report
                </button>
                <button 
                  className="export-option-btn"
                  onClick={() => exportTransactions('csv')}
                >
                  <i className="fas fa-file-csv"></i>
                  CSV Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewTransactions;
