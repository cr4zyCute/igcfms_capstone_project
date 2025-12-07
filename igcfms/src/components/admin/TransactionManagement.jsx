import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import axios from "axios";
import API_BASE_URL from "../../config/api";
import "./css/transactionmanagement.css";
import "../analytics/TransactionAnalytics.jsx/css/transaction-kpis.css";
import { generateTransactionManagementPDF } from "../reports/export/pdf/TransactionManagementExport";
import * as XLSX from 'xlsx';
import TransactionManagementSL from '../ui/TransactionManagementSL';

// Lazy load chart components for better performance
const TrendChart = lazy(() => import('../analytics/TransactionAnalytics.jsx/TrendChart'));
const CategoryChart = lazy(() => import('../analytics/TransactionAnalytics.jsx/CategoryChart'));

// Loading skeleton
const ChartSkeleton = () => (
  <div style={{ height: '250px', background: '#f5f5f5', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>
);

const TransactionManagement = ({ role = "Admin" }) => {
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

  // Export/Preview states
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [pdfFileName, setPdfFileName] = useState("");

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

  // Close export dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  // Filters summary for export
  const exportFilters = useMemo(() => ({
    'Type': filters.type !== 'all' ? filters.type : 'All',
    'Department': filters.department !== 'all' ? filters.department : 'All',
    'Date From': filters.dateFrom || 'Any',
    'Date To': filters.dateTo || 'Any',
    'Search Term': filters.searchTerm || 'None',
    'Sort': filters.activeFilter || 'all',
  }), [filters]);

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

  const getTransactionDisplayType = useMemo(() => {
    return (transaction) => {
      if (!transaction) return 'Unknown';

      const receipt = transaction.receipt_no || transaction.reference_no || '';

      if (transaction.type === 'Override') {
        return 'Cancelled';
      }

      if (typeof receipt === 'string' && receipt.startsWith('OVR-')) {
        return 'Override';
      }

      return transaction.type || 'Unknown';
    };
  }, []);

  // Export handlers
  const handleExportPdf = () => {
    if (!filteredTransactions.length) {
      setShowExportDropdown(false);
      return;
    }
    try {
      const { blob, filename } = generateTransactionManagementPDF({
        filters: exportFilters,
        transactions: filteredTransactions,
        stats: stats,
        generatedBy: localStorage.getItem('user_name') || 'System',
        reportTitle: 'Transaction Management Report',
      }) || {};
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPdfPreviewUrl(url);
        setPdfFileName(filename || 'transactions_report.pdf');
        setShowPDFPreview(true);
      }
      setShowExportDropdown(false);
    } catch (e) {
      console.error('Error generating PDF:', e);
      setShowExportDropdown(false);
    }
  };

  const handleExportExcel = () => {
    if (!filteredTransactions.length) {
      setShowExportDropdown(false);
      return;
    }
    const rows = filteredTransactions.map((tx) => {
      const displayType = getTransactionDisplayType(tx);
      const amountValue = parseFloat(tx.amount || 0) || 0;
      return {
        'ID': `#${tx.id}`,
        'Type': displayType,
        'Amount': amountValue,
        'Recipient/Payer': tx.recipient || 'N/A',
        'Department': tx.department || 'N/A',
        'Date': tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'N/A',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

    // Summary sheet
    const summaryData = [
      { 'Metric': 'Total Transactions', 'Value': filteredTransactions.length },
      { 'Metric': 'Total Collections', 'Value': stats.totalCollections },
      { 'Metric': 'Total Disbursements', 'Value': stats.totalDisbursements },
      { 'Metric': 'Net Balance', 'Value': stats.netBalance },
      { 'Metric': 'Average Transaction', 'Value': stats.averageTransactionValue },
      { 'Metric': 'Collection Rate', 'Value': `${(stats.collectionRate || 0).toFixed(1)}%` },
      { 'Metric': 'Generated', 'Value': new Date().toLocaleString() },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    ws['!cols'] = [
      { wch: 10 }, // ID
      { wch: 12 }, // Type
      { wch: 14 }, // Amount
      { wch: 24 }, // Recipient/Payer
      { wch: 16 }, // Department
      { wch: 14 }, // Date
    ];
    wsSummary['!cols'] = [{ wch: 22 }, { wch: 40 }];

    const fileName = `transaction_records_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    setShowExportDropdown(false);
  };

  const downloadPDFFromPreview = () => {
    if (!pdfPreviewUrl) return;
    const link = document.createElement('a');
    link.href = pdfPreviewUrl;
    link.download = pdfFileName || 'transactions_report.pdf';
    link.click();
  };

  const closePDFPreview = () => {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setShowPDFPreview(false);
    setPdfPreviewUrl(null);
    setPdfFileName('');
  };


  const departments = [
    "Finance", "Administration", "Operations", "HR", "IT", "Legal",
    "Procurement", "Public Works", "Health Services", "Education", 
    "Social Services", "Other"
  ];

  if (loading) {
    return <TransactionManagementSL />;
  }

  return (
    <div className="transaction-management-page">
      <div className="tm-header">
        <div className="tm-header-content">
          <h1 className="tm-title">
            <i className="fas fa-exchange-alt"></i> Transaction Management
          </h1>
          <div className="tm-header-actions">
           
            {/* <button 
              className="tm-btn-refresh"
              onClick={() => fetchTransactionData()}
              title="Refresh Data"
            >
              <i className="fas fa-sync-alt"></i>
              Refresh
            </button> */}
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
          {/* Trend Charts Section - At the Very Top - Admin Only */}
          {showCharts && role === "Admin" && (
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
            
            {/* <div className={`kpi-card large net-balance ${stats.netBalance >= 0 ? 'positive' : 'negative'}`}>
              <div className="kpi-header">
                <div className="kpi-icon">
                  <i className="fas fa-balance-scale"></i>
                </div>
                <div className="kpi-info">
                  <div className="kpi-label">Net Balance</div>
                  <div className="kpi-value">₱{stats.netBalance.toLocaleString()}</div>
                  <div className="kpi-subtitle">
                    {stats.netBalance >= 0 ? 'âš« Surplus' : 'âšª Deficit'}
                  </div>
                </div>
              </div>
            </div> */}
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
                Transaction
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
                {/* Date Range Controls */}
                <div className="tm-date-range-controls">
                  <div className="tm-date-field">
                    <label>Date From</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      placeholder="dd/mm/yyyy"
                    />
                  </div>
                  <div className="tm-date-field">
                    <label>Date To</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      placeholder="dd/mm/yyyy"
                    />
                  </div>
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
              <div className="tm-export-actions" ref={exportDropdownRef} style={{ position: 'relative' }}>
                <button
                  className="tm-btn-icon tm-export-btn"
                  onClick={() => setShowExportDropdown(prev => !prev)}
                  title="Export / Download"
                  type="button"
                >
                  <i className="fas fa-download"></i>
                </button>
                {showExportDropdown && (
                  <div
                    className="tm-export-dropdown-menu"
                    style={{
                      position: 'absolute', top: '110%', right: 0,
                      background: '#ffffff', border: '2px solid #e0e0e0', borderRadius: 8,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 1000,
                      marginTop: 4, minWidth: 180, overflow: 'hidden'
                    }}
                  >
                    <button type="button" onClick={handleExportPdf} style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px',
                      background: 'white', border: 'none', cursor: 'pointer'
                    }}>
                      <i className="fas fa-file-pdf" style={{ color: '#ef4444' }}></i>
                      <span>Preview PDF</span>
                    </button>
                    <button type="button" onClick={handleExportExcel} style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px',
                      background: 'white', border: 'none', cursor: 'pointer'
                    }}>
                      <i className="fas fa-file-excel" style={{ color: '#16a34a' }}></i>
                      <span>Download Excel</span>
                    </button>
                  </div>
                )}
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
                    <th><i className="fas fa-calendar"></i> DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransactions.length > 0 ? (
                    currentTransactions.map((transaction) => {
                      const displayType = getTransactionDisplayType(transaction);
                      const amountValue = parseFloat(transaction.amount || 0);
                      const amountIsPositive = amountValue >= 0;
                      const amountPrefix = amountIsPositive ? '' : '-';

                      return (
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
                            <span className={`tm-type-badge ${displayType.toLowerCase()}`}>
                              {displayType}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="cell-content">
                            <span className={`amount ${amountIsPositive ? 'amount-positive' : 'amount-negative'}`}>
                              {amountPrefix}₱{Math.abs(amountValue).toLocaleString()}
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
                            <span className="issue-date">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="no-data">
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

      {/* PDF Preview Modal */}
      {showPDFPreview && pdfPreviewUrl && (
        <div
          className="pdf-preview-modal-overlay"
          onClick={closePDFPreview}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div
            className="pdf-preview-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '80vw', height: '85vh', background: '#fff', borderRadius: '10px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div
              className="pdf-preview-header"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                       padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>
                Transaction Records PDF Preview
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
                title="Transaction Records PDF Preview"
                src={pdfPreviewUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}

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
                    {(() => {
                      const displayType = getTransactionDisplayType(selectedTransaction);
                      const amountValue = parseFloat(selectedTransaction.amount || 0);
                      const iconClass = amountValue >= 0 ? 'fa-arrow-down' : 'fa-arrow-up';

                      return (
                        <span className={`tm-type-indicator ${displayType.toLowerCase()}`}>
                          <i className={`fas ${iconClass}`}></i>
                          {displayType}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div className="tm-summary-right">
                  <div className="tm-transaction-amount">
                    <span className="tm-amount-label">Amount</span>
                    {(() => {
                      const amountValue = parseFloat(selectedTransaction.amount || 0);
                      const isPositive = amountValue >= 0;
                      const prefix = isPositive ? '+' : '-';

                      return (
                        <span className={`tm-amount-value ${isPositive ? 'tm-amount-positive' : 'tm-amount-negative'}`}>
                          {prefix}₱{Math.abs(amountValue).toLocaleString()}
                        </span>
                      );
                    })()}
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

