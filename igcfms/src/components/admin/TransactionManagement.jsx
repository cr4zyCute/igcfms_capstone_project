import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import axios from "axios";
import API_BASE_URL from "../../config/api";
import "./css/transactionmanagement.css";
import "../analytics/TransactionAnalytics.jsx/css/transaction-kpis.css";

// Lazy load chart components for better performance
const TrendChart = lazy(() => import('../analytics/TransactionAnalytics.jsx/TrendChart'));
const CategoryChart = lazy(() => import('../analytics/TransactionAnalytics.jsx/CategoryChart'));

// Loading skeleton
const ChartSkeleton = () => (
  <div style={{ height: '250px', background: '#f5f5f5', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>
);

const TransactionManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [overrideRequests, setOverrideRequests] = useState([]);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalCollections: 0,
    totalDisbursements: 0,
    netBalance: 0,
    pendingOverrides: 0,
    todayTransactions: 0,
    todayAmount: 0,
    thisMonthTransactions: 0,
    averageTransactionValue: 0,
    collectionRate: 0,
    monthlyBurnRate: 0,
  });
  
  const [trendData, setTrendData] = useState({
    collections: [],
    disbursements: [],
  });
  
  const [showCharts, setShowCharts] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    type: "all",
    department: "all",
    dateFrom: "",
    dateTo: "",
    searchTerm: "",
    status: "all",
    activeFilter: "all",
    showFilterDropdown: false
  });

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const API_BASE = API_BASE_URL;

  useEffect(() => {
    fetchTransactionData();
  }, []);
  
  // Defer chart loading for faster initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCharts(true);
    }, 500); // Load charts after 500ms
    
    return () => clearTimeout(timer);
  }, []);


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
      const [transactionsRes, overrideRes] = await Promise.all([
        axios.get(`${API_BASE}/transactions`, { headers }),
        axios.get(`${API_BASE}/override-requests`, { headers }).catch(() => ({ data: [] }))
      ]);

      const allTransactions = transactionsRes.data || [];
      const allOverrides = overrideRes.data || [];

      setTransactions(allTransactions);
      setOverrideRequests(allOverrides);

      // Calculate statistics
      const today = new Date().toDateString();
      const thisMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const todayTxs = allTransactions.filter(tx => 
        new Date(tx.created_at).toDateString() === today
      );
      const todayTransactions = todayTxs.length;
      const todayAmount = todayTxs.reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount || 0)), 0);

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
      
      // Calculate additional KPIs
      const netBalance = totalCollections - totalDisbursements;
      const averageTransactionValue = allTransactions.length > 0 
        ? (totalCollections + totalDisbursements) / allTransactions.length 
        : 0;
      
      // Collection Rate (collections vs total transactions)
      const collectionRate = allTransactions.length > 0
        ? (allTransactions.filter(tx => tx.type === 'Collection').length / allTransactions.length) * 100
        : 0;
      
      // Monthly Burn Rate (average daily disbursements * 30)
      const daysInMonth = new Date(currentYear, thisMonth + 1, 0).getDate();
      const monthlyDisbursements = allTransactions.filter(tx => {
        const txDate = new Date(tx.created_at);
        return tx.type === 'Disbursement' && 
               txDate.getMonth() === thisMonth && 
               txDate.getFullYear() === currentYear;
      }).reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
      const monthlyBurnRate = monthlyDisbursements / daysInMonth;
      
      // Calculate trend data (last 30 days)
      const last30Days = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayCollections = allTransactions
          .filter(tx => tx.type === 'Collection' && tx.created_at.startsWith(dateStr))
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
        
        const dayDisbursements = allTransactions
          .filter(tx => tx.type === 'Disbursement' && tx.created_at.startsWith(dateStr))
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
        
        last30Days.push({
          date: dateStr,
          collections: dayCollections,
          disbursements: dayDisbursements
        });
      }

      setStats({
        totalTransactions: allTransactions.length,
        totalCollections,
        totalDisbursements,
        netBalance,
        pendingOverrides,
        todayTransactions,
        todayAmount,
        thisMonthTransactions,
        averageTransactionValue,
        collectionRate,
        monthlyBurnRate,
      });
      
      setTrendData({
        collections: last30Days.map(d => ({ date: d.date, value: d.collections })),
        disbursements: last30Days.map(d => ({ date: d.date, value: d.disbursements })),
      });

    } catch (err) {
      console.error('Transaction management error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load transaction data');
    } finally {
      setLoading(false);
    }
  };

  // Memoized filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      // Type filter
      if (filters.type !== "all" && transaction.type !== filters.type) {
        return false;
      }

      // Department filter
      if (filters.department !== "all" && transaction.department !== filters.department) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom && new Date(transaction.created_at) < new Date(filters.dateFrom)) {
        return false;
      }
      if (filters.dateTo && new Date(transaction.created_at) > new Date(filters.dateTo)) {
        return false;
      }

      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return (
          transaction.id?.toString().includes(searchLower) ||
          transaction.type?.toLowerCase().includes(searchLower) ||
          transaction.description?.toLowerCase().includes(searchLower) ||
          transaction.recipient?.toLowerCase().includes(searchLower) ||
          transaction.department?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });

    // Apply sorting based on activeFilter
    if (filters.activeFilter === 'latest') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (filters.activeFilter === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (filters.activeFilter === 'highest') {
      filtered.sort((a, b) => parseFloat(b.amount || 0) - parseFloat(a.amount || 0));
    } else if (filters.activeFilter === 'lowest') {
      filtered.sort((a, b) => parseFloat(a.amount || 0) - parseFloat(b.amount || 0));
    } else if (filters.activeFilter === 'collections') {
      filtered = filtered.filter(tx => tx.type === 'Collection');
    } else if (filters.activeFilter === 'disbursements') {
      filtered = filtered.filter(tx => tx.type === 'Disbursement');
    }

    return filtered;
  }, [transactions, filters]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);
  const displayStart = filteredTransactions.length > 0 ? startIndex + 1 : 0;
  const displayEnd = Math.min(endIndex, filteredTransactions.length);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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
        <div className="tm-header-content">
          <h1 className="tm-title">
            <i className="fas fa-exchange-alt"></i> Transaction Management
          </h1>
          <div className="tm-header-actions">
            <button 
              className="tm-btn-export"
              onClick={() => {/* Add export functionality */}}
              title="Export Transactions"
            >
              <i className="fas fa-download"></i>
              Export Report
            </button>
            <button 
              className="tm-btn-refresh"
              onClick={() => fetchTransactionData()}
              title="Refresh Data"
            >
              <i className="fas fa-sync-alt"></i>
              Refresh
            </button>
          </div>
        </div>
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
          {/* Trend Charts Section - At the Very Top */}
          {showCharts && (
            <div className="tm-trends-section">
              <div className="trends-header">
                <h3><i className="fas fa-chart-line"></i> Trends & Analysis (Last 30 Days)</h3>
              </div>
              
              <div className="trends-grid">
                <div className="trend-chart-container">
                  <h4>Collections vs Disbursements</h4>
                  <Suspense fallback={<ChartSkeleton />}>
                    <TrendChart 
                      collectionsData={trendData.collections}
                      disbursementsData={trendData.disbursements}
                    />
                  </Suspense>
                </div>
              </div>
            </div>
          )}

          {/* Top Row - Primary KPIs */}
          <div className="tm-primary-kpis">
            <div className="kpi-card large collections">
              <div className="kpi-header">
                <div className="kpi-icon">
                  <i className="fas fa-arrow-down"></i>
                </div>
                <div className="kpi-info">
                  <div className="kpi-label">Total Collections</div>
                  <div className="kpi-value">₱{stats.totalCollections.toLocaleString()}</div>
                  <div className="kpi-subtitle">Incoming Funds</div>
                </div>
              </div>
            </div>
            
            <div className="kpi-card large disbursements">
              <div className="kpi-header">
                <div className="kpi-icon">
                  <i className="fas fa-arrow-up"></i>
                </div>
                <div className="kpi-info">
                  <div className="kpi-label">Total Disbursements</div>
                  <div className="kpi-value">₱{stats.totalDisbursements.toLocaleString()}</div>
                  <div className="kpi-subtitle">Outgoing Funds</div>
                </div>
              </div>
            </div>
            
            <div className={`kpi-card large net-balance ${stats.netBalance >= 0 ? 'positive' : 'negative'}`}>
              <div className="kpi-header">
                <div className="kpi-icon">
                  <i className="fas fa-balance-scale"></i>
                </div>
                <div className="kpi-info">
                  <div className="kpi-label">Net Balance</div>
                  <div className="kpi-value">₱{stats.netBalance.toLocaleString()}</div>
                  <div className="kpi-subtitle">
                    {stats.netBalance >= 0 ? '⚫ Surplus' : '⚪ Deficit'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Second Row - Performance Metrics */}
          <div className="tm-performance-kpis">
            <div className="kpi-card medium today">
              <div className="kpi-icon-small">
                <i className="fas fa-calendar-day"></i>
              </div>
              <div className="kpi-content">
                <div className="kpi-label">Today's Activity</div>
                <div className="kpi-value">{stats.todayTransactions}</div>
                <div className="kpi-subtitle">₱{stats.todayAmount.toLocaleString()}</div>
              </div>
            </div>
            
            <div className="kpi-card medium average">
              <div className="kpi-icon-small">
                <i className="fas fa-calculator"></i>
              </div>
              <div className="kpi-content">
                <div className="kpi-label">Avg Transaction</div>
                <div className="kpi-value">₱{stats.averageTransactionValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                <div className="kpi-subtitle">Per Record</div>
              </div>
            </div>
            
            <div className="kpi-card medium collection-rate">
              <div className="kpi-icon-small">
                <i className="fas fa-chart-pie"></i>
              </div>
              <div className="kpi-content">
                <div className="kpi-label">Collection Rate</div>
                <div className="kpi-value">{stats.collectionRate.toFixed(1)}%</div>
                <div className="kpi-subtitle">
                  <div className="mini-progress-bar">
                    <div className="progress-fill" style={{ width: `${stats.collectionRate}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="kpi-card medium burn-rate">
              <div className="kpi-icon-small">
                <i className="fas fa-fire"></i>
              </div>
              <div className="kpi-content">
                <div className="kpi-label">Daily Burn Rate</div>
                <div className="kpi-value">₱{stats.monthlyBurnRate.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                <div className="kpi-subtitle">Avg Daily Spending</div>
              </div>
            </div>
          </div>

          {/* Transactions Section Header - IssueReceipt Style */}
          <div className="tm-section-header">
            <div className="tm-section-title-group">
              <h3>
                <i className="fas fa-exchange-alt"></i>
                Transaction Records
                <span className="tm-section-count">({filteredTransactions.length})</span>
              </h3>
            </div>
            <div className="tm-header-controls">
              <div className="tm-search-filter-container">
                <div className="tm-search-container">
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    className="tm-search-input"
                  />
                  <i className="fas fa-search tm-search-icon"></i>
                </div>
                
                <div className="tm-filter-dropdown-container">
                  <button
                    className="tm-filter-dropdown-btn"
                    onClick={() => setFilters(prev => ({ ...prev, showFilterDropdown: !prev.showFilterDropdown }))}
                    title="Filter transactions"
                  >
                    <i className="fas fa-filter"></i>
                    <span className="tm-filter-label">
                      {filters.activeFilter === 'all' ? 'All Transactions' :
                       filters.activeFilter === 'latest' ? 'Latest First' :
                       filters.activeFilter === 'oldest' ? 'Oldest First' :
                       filters.activeFilter === 'highest' ? 'Highest Amount' :
                       filters.activeFilter === 'lowest' ? 'Lowest Amount' :
                       filters.activeFilter === 'collections' ? 'Collections Only' :
                       'Disbursements Only'}
                    </span>
                    <i className={`fas fa-chevron-${filters.showFilterDropdown ? 'up' : 'down'} tm-filter-arrow`}></i>
                  </button>
                  
                  {filters.showFilterDropdown && (
                    <div className="tm-filter-dropdown-menu">
                      <button
                        className={`tm-filter-option ${filters.activeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => { handleFilterChange('activeFilter', 'all'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                      >
                        <i className="fas fa-list"></i>
                        <span>All Transactions</span>
                        {filters.activeFilter === 'all' && <i className="fas fa-check tm-filter-check"></i>}
                      </button>
                      <button
                        className={`tm-filter-option ${filters.activeFilter === 'latest' ? 'active' : ''}`}
                        onClick={() => { handleFilterChange('activeFilter', 'latest'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                      >
                        <i className="fas fa-arrow-down"></i>
                        <span>Latest First</span>
                        {filters.activeFilter === 'latest' && <i className="fas fa-check tm-filter-check"></i>}
                      </button>
                      <button
                        className={`tm-filter-option ${filters.activeFilter === 'oldest' ? 'active' : ''}`}
                        onClick={() => { handleFilterChange('activeFilter', 'oldest'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                      >
                        <i className="fas fa-arrow-up"></i>
                        <span>Oldest First</span>
                        {filters.activeFilter === 'oldest' && <i className="fas fa-check tm-filter-check"></i>}
                      </button>
                      <button
                        className={`tm-filter-option ${filters.activeFilter === 'highest' ? 'active' : ''}`}
                        onClick={() => { handleFilterChange('activeFilter', 'highest'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                      >
                        <i className="fas fa-sort-amount-down"></i>
                        <span>Highest Amount</span>
                        {filters.activeFilter === 'highest' && <i className="fas fa-check tm-filter-check"></i>}
                      </button>
                      <button
                        className={`tm-filter-option ${filters.activeFilter === 'lowest' ? 'active' : ''}`}
                        onClick={() => { handleFilterChange('activeFilter', 'lowest'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                      >
                        <i className="fas fa-sort-amount-up"></i>
                        <span>Lowest Amount</span>
                        {filters.activeFilter === 'lowest' && <i className="fas fa-check tm-filter-check"></i>}
                      </button>
                      <button
                        className={`tm-filter-option ${filters.activeFilter === 'collections' ? 'active' : ''}`}
                        onClick={() => { handleFilterChange('activeFilter', 'collections'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                      >
                        <i className="fas fa-arrow-circle-down"></i>
                        <span>Collections Only</span>
                        {filters.activeFilter === 'collections' && <i className="fas fa-check tm-filter-check"></i>}
                      </button>
                      <button
                        className={`tm-filter-option ${filters.activeFilter === 'disbursements' ? 'active' : ''}`}
                        onClick={() => { handleFilterChange('activeFilter', 'disbursements'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                      >
                        <i className="fas fa-arrow-circle-up"></i>
                        <span>Disbursements Only</span>
                        {filters.activeFilter === 'disbursements' && <i className="fas fa-check tm-filter-check"></i>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table - IssueMoney Style */}
          <div className="tm-table-section receipts-table-section">
            <div className="tm-table-container receipts-table-container">
              <table className="tm-table receipts-table">
                <thead>
                  <tr>
                    <th><i className="fas fa-hashtag"></i> ID</th>
                    <th><i className="fas fa-tag"></i> TYPE</th>
                    <th><i className="fas fa-money-bill"></i> AMOUNT</th>
                    <th><i className="fas fa-user"></i> RECIPIENT/PAYER</th>
                    <th><i className="fas fa-building"></i> DEPARTMENT</th>
                    <th><i className="fas fa-calendar"></i> DATE</th>
                    <th><i className="fas fa-cog"></i> ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransactions.length > 0 ? (
                    currentTransactions.map((transaction) => (
                      <tr 
                        key={transaction.id}
                        className="table-row"
                        onClick={(e) => {
                          if (!e.target.closest('.action-cell')) {
                            viewTransactionDetails(transaction);
                          }
                        }}
                      >
                        <td>
                          <div className="cell-content">
                            <span className="receipt-id">#{transaction.id}</span>
                          </div>
                        </td>
                        <td>
                          <div className="cell-content">
                            <span className={`tm-type-badge ${transaction.type.toLowerCase()}`}>
                              {transaction.type}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="cell-content">
                            <span className={`amount ${transaction.type === 'Collection' ? 'amount-positive' : 'amount-negative'}`}>
                              {transaction.type === 'Collection' ? '' : '-'}₱{Math.abs(parseFloat(transaction.amount || 0)).toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="cell-content">
                            <span className="payer-name">{transaction.recipient || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="cell-content">
                            <span className="payer-name">{transaction.department || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="cell-content">
                            <span className="issue-date">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="action-cell">
                          <div className="cell-content">
                            <div className="action-buttons-group">
                              <button 
                                className="action-btn-icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewTransactionDetails(transaction);
                                }}
                                title="View Details"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="no-data">
                        <i className="fas fa-inbox"></i>
                        <p>No transactions found matching your criteria.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination - IssueMoney Style */}
            {filteredTransactions.length > 0 && (
              <div className="table-pagination">
                <div className="pagination-info">
                  Showing {displayStart}-{displayEnd} of {filteredTransactions.length} transactions
                </div>
                <div className="pagination-controls">
                  <button
                    type="button"
                    className="pagination-button"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="pagination-info">Page {currentPage} of {totalPages}</span>
                  <button
                    type="button"
                    className="pagination-button"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || filteredTransactions.length === 0}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Enhanced Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="tm-modal-backdrop" onClick={() => setShowDetailsModal(false)}>
          <div className="tm-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="tm-modal-header">
              <div className="tm-modal-title-section">
                <div className="tm-modal-icon">
                  <i className="fas fa-receipt"></i>
                </div>
                <div className="tm-modal-title-content">
                  <h2 className="tm-modal-title">Transaction Details</h2>
                  <p className="tm-modal-subtitle">Complete transaction information</p>
                </div>
              </div>
              <button className="tm-modal-close-btn" onClick={() => setShowDetailsModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="tm-modal-body">
              {/* Transaction Summary Card */}
              <div className="tm-transaction-summary-card">
                <div className="tm-summary-left">
                  <div className="tm-transaction-id">
                    <span className="tm-id-label">Transaction ID</span>
                    <span className="tm-id-value">#{selectedTransaction.id}</span>
                  </div>
                  <div className="tm-transaction-type">
                    <span className={`tm-type-indicator ${selectedTransaction.type.toLowerCase()}`}>
                      <i className={`fas ${selectedTransaction.type === 'Collection' ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                      {selectedTransaction.type}
                    </span>
                  </div>
                </div>
                <div className="tm-summary-right">
                  <div className="tm-transaction-amount">
                    <span className="tm-amount-label">Amount</span>
                    <span className={`tm-amount-value ${selectedTransaction.type === 'Collection' ? 'tm-amount-positive' : 'tm-amount-negative'}`}>
                      {selectedTransaction.type === 'Collection' ? '+' : '-'}₱{Math.abs(parseFloat(selectedTransaction.amount || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction Details Grid */}
              <div className="tm-details-section">
                <h3 className="tm-section-title">
                  <i className="fas fa-info-circle"></i>
                  Transaction Information
                </h3>
                <div className="tm-details-grid">
                  <div className="tm-detail-card">
                    <div className="tm-detail-icon">
                      <i className="fas fa-user"></i>
                    </div>
                    <div className="tm-detail-content">
                      <label className="tm-detail-label">Recipient/Payer</label>
                      <span className="tm-detail-value">{selectedTransaction.recipient || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="tm-detail-card">
                    <div className="tm-detail-icon">
                      <i className="fas fa-building"></i>
                    </div>
                    <div className="tm-detail-content">
                      <label className="tm-detail-label">Department</label>
                      <span className="tm-detail-value">{selectedTransaction.department || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="tm-detail-card">
                    <div className="tm-detail-icon">
                      <i className="fas fa-tag"></i>
                    </div>
                    <div className="tm-detail-content">
                      <label className="tm-detail-label">Category</label>
                      <span className="tm-detail-value">{selectedTransaction.category || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="tm-detail-card">
                    <div className="tm-detail-icon">
                      <i className="fas fa-credit-card"></i>
                    </div>
                    <div className="tm-detail-content">
                      <label className="tm-detail-label">Payment Mode</label>
                      <span className="tm-detail-value">{selectedTransaction.mode_of_payment || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="tm-detail-card">
                    <div className="tm-detail-icon">
                      <i className="fas fa-hashtag"></i>
                    </div>
                    <div className="tm-detail-content">
                      <label className="tm-detail-label">Reference</label>
                      <span className="tm-detail-value">{selectedTransaction.reference || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="tm-detail-card">
                    <div className="tm-detail-icon">
                      <i className="fas fa-receipt"></i>
                    </div>
                    <div className="tm-detail-content">
                      <label className="tm-detail-label">Receipt/Reference No</label>
                      <span className="tm-detail-value">{selectedTransaction.receipt_no || selectedTransaction.reference_no || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              {selectedTransaction.description && (
                <div className="tm-description-section">
                  <h3 className="tm-section-title">
                    <i className="fas fa-file-alt"></i>
                    Description
                  </h3>
                  <div className="tm-description-card">
                    <p className="tm-description-text">{selectedTransaction.description}</p>
                  </div>
                </div>
              )}

              {/* Timestamp Section */}
              <div className="tm-timestamp-section">
                <h3 className="tm-section-title">
                  <i className="fas fa-clock"></i>
                  Timeline
                </h3>
                <div className="tm-timestamp-grid">
                  <div className="tm-timestamp-item">
                    <div className="tm-timestamp-icon created">
                      <i className="fas fa-plus-circle"></i>
                    </div>
                    <div className="tm-timestamp-content">
                      <label className="tm-timestamp-label">Created</label>
                      <span className="tm-timestamp-value">{new Date(selectedTransaction.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="tm-timestamp-item">
                    <div className="tm-timestamp-icon updated">
                      <i className="fas fa-edit"></i>
                    </div>
                    <div className="tm-timestamp-content">
                      <label className="tm-timestamp-label">Last Updated</label>
                      <span className="tm-timestamp-value">{new Date(selectedTransaction.updated_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="tm-modal-footer">
              <button className="tm-modal-btn tm-btn-secondary" onClick={() => setShowDetailsModal(false)}>
                <i className="fas fa-times"></i>
                Close
              </button>
              <button className="tm-modal-btn tm-btn-primary" onClick={() => window.print()}>
                <i className="fas fa-print"></i>
                Print Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManagement;
