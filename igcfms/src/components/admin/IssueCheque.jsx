import React, { useState, useEffect, useMemo, useRef } from "react";
import { useCheques, useCreateCheque } from "../../hooks/useCheques";
import { useDisbursements } from "../../hooks/useDisbursements";
import { useFundAccounts } from "../../hooks/useFundAccounts";
import IssueChequeSkeleton from "../ui/chequeSL";
import AverageClearanceTime from "../analytics/chequeAnalysis/AverageClearanceTime";
import ChequeProcessingAccuracyRate from "../analytics/chequeAnalysis/ChequeProcessingAccuracyRate";
import ChequeReconciliationRate from "../analytics/chequeAnalysis/ChequeReconciliationRate";
import OutstandingChequesRatio from "../analytics/chequeAnalysis/OutstandingChequesRatio";
import { ErrorModal, SuccessModal } from "../common/Modals/IssueChequeModals";
import "./css/issuecheque.css";
import "./css/cheque-styles.css";

const IssueCheque = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [filteredCheques, setFilteredCheques] = useState([]);

  // TanStack Query hooks
  const {
    data: cheques = [],
    isLoading: chequesLoading,
    error: chequesError
  } = useCheques();

  const {
    data: disbursements = [],
    isLoading: disbursementsLoading,
    error: disbursementsError
  } = useDisbursements();

  const {
    data: fundAccountsData,
    isLoading: fundAccountsLoading,
    error: fundAccountsError
  } = useFundAccounts();
  
  const fundAccounts = fundAccountsData?.data || [];

  const createChequeMutation = useCreateCheque();

  // Combined loading state
  const isInitialLoading = chequesLoading || disbursementsLoading || fundAccountsLoading;
  const mutationLoading = createChequeMutation.isPending;
  
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
    bankName: "all",
    showFilterDropdown: false
  });

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showChequeModal, setShowChequeModal] = useState(false);
  const [showIssueFormModal, setShowIssueFormModal] = useState(false);
  const [selectedCheque, setSelectedCheque] = useState(null);
  const [chequeResult, setChequeResult] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [fundAccountSearch, setFundAccountSearch] = useState("");
  const [showFundAccountDropdown, setShowFundAccountDropdown] = useState(false);
  const [disbursementSearch, setDisbursementSearch] = useState("");
  const [showDisbursementDropdown, setShowDisbursementDropdown] = useState(false);
  const miniGraphRef = useRef(null);
  const exportDropdownRef = useRef(null);
  const fundAccountDropdownRef = useRef(null);
  const disbursementDropdownRef = useRef(null);

  useEffect(() => {
    applyFilters();
  }, [cheques, filters]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setShowExportDropdown(false);
      }
      if (!event.target.closest('.filter-dropdown-container')) {
        setFilters(prev => ({ ...prev, showFilterDropdown: false }));
      }
      if (!event.target.closest('.action-menu-container')) {
        setOpenActionMenu(null);
      }
      if (fundAccountDropdownRef.current && !fundAccountDropdownRef.current.contains(event.target)) {
        setShowFundAccountDropdown(false);
      }
      if (disbursementDropdownRef.current && !disbursementDropdownRef.current.contains(event.target)) {
        setShowDisbursementDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Mouse drag scrolling for mini graph
  useEffect(() => {
    const graphContainer = miniGraphRef.current;
    if (!graphContainer) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    const handleMouseDown = (e) => {
      isDown = true;
      graphContainer.style.cursor = 'grabbing';
      startX = e.pageX - graphContainer.offsetLeft;
      scrollLeft = graphContainer.scrollLeft;
    };

    const handleMouseLeave = () => {
      isDown = false;
      graphContainer.style.cursor = 'grab';
    };

    const handleMouseUp = () => {
      isDown = false;
      graphContainer.style.cursor = 'grab';
    };

    const handleMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - graphContainer.offsetLeft;
      const walk = (x - startX) * 2; // Scroll speed
      graphContainer.scrollLeft = scrollLeft - walk;
    };

    graphContainer.addEventListener('mousedown', handleMouseDown);
    graphContainer.addEventListener('mouseleave', handleMouseLeave);
    graphContainer.addEventListener('mouseup', handleMouseUp);
    graphContainer.addEventListener('mousemove', handleMouseMove);

    return () => {
      graphContainer.removeEventListener('mousedown', handleMouseDown);
      graphContainer.removeEventListener('mouseleave', handleMouseLeave);
      graphContainer.removeEventListener('mouseup', handleMouseUp);
      graphContainer.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Show helpful message if no disbursements exist
  useEffect(() => {
    if (!disbursementsLoading && disbursements.length === 0) {
      setErrorMessage("No disbursement transactions found. Please create disbursement transactions using 'Issue Money' first before issuing cheques.");
    }
  }, [disbursements, disbursementsLoading]);

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
          fundAccountId: selectedTransaction.fund_account_id || "",
          chequeNumber: generateChequeNumber() // Auto-generate cheque number
        }));
      }
    }
  };

  const showMessage = (message, type = 'success') => {
    if (type === 'success') {
      setSuccessMessage(message);
      setErrorMessage("");
    } else {
      setErrorMessage(message);
      setSuccessMessage("");
    }
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

    createChequeMutation.mutate(payload, {
      onSuccess: (response) => {
        // Close modals after successful mutation
        setShowIssueModal(false);
        setShowIssueFormModal(false);
        
        setChequeResult({
          id: response.id || response.data?.id,
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
      },
      onError: (err) => {
        // Close modals on error too
        setShowIssueModal(false);
        setShowIssueFormModal(false);
        
        console.error("Error issuing cheque:", err);
        if (err.response?.status === 422 && err.response.data?.errors) {
          const errorMessages = Object.values(err.response.data.errors)
            .flat()
            .join(", ");
          showMessage(`Validation error: ${errorMessages}`, 'error');
        } else {
          showMessage(err.response?.data?.message || "Failed to issue cheque.", 'error');
        }
      }
    });
  };

  const viewChequeDetails = (cheque) => {
    setChequeResult({
      id: cheque.id,
      chequeNumber: cheque.cheque_number,
      payeeName: cheque.payee_name,
      amount: cheque.amount,
      bankName: cheque.bank_name,
      accountNumber: cheque.account_number,
      issueDate: cheque.issue_date || cheque.created_at,
      memo: cheque.memo
    });
    setShowSuccessModal(true);
  };

  // Print only the cheque content
  const printCheque = () => {
    window.print();
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

  // Filter fund accounts based on search
  const filteredFundAccounts = fundAccounts.filter(account => {
    const searchLower = fundAccountSearch.toLowerCase();
    return (
      account.name?.toLowerCase().includes(searchLower) ||
      account.balance?.toString().includes(searchLower)
    );
  });

  // Get selected fund account name for display
  const selectedFundAccount = fundAccounts.find(acc => acc.id.toString() === formData.fundAccountId);
  const fundAccountDisplayText = selectedFundAccount 
    ? `${selectedFundAccount.name} - ₱${parseFloat(selectedFundAccount.balance || 0).toLocaleString()}`
    : "-- Select Fund Account --";

  // Filter disbursements based on search
  const filteredDisbursements = disbursements.filter(transaction => {
    const searchLower = disbursementSearch.toLowerCase();
    return (
      transaction.id?.toString().includes(searchLower) ||
      transaction.recipient?.toLowerCase().includes(searchLower) ||
      transaction.description?.toLowerCase().includes(searchLower) ||
      transaction.amount?.toString().includes(searchLower)
    );
  });

  // Get selected disbursement for display
  const selectedDisbursement = disbursements.find(d => d.id.toString() === formData.disbursementId);
  const disbursementDisplayValue = selectedDisbursement && !showDisbursementDropdown
    ? `#${selectedDisbursement.id} - ${selectedDisbursement.recipient || selectedDisbursement.description || 'N/A'} - ₱${parseFloat(selectedDisbursement.amount || 0).toLocaleString()}`
    : disbursementSearch;

  // Get selected fund account for display
  const fundAccountDisplayValue = selectedFundAccount && !showFundAccountDropdown
    ? `${selectedFundAccount.name} - ₱${parseFloat(selectedFundAccount.balance || 0).toLocaleString()}`
    : fundAccountSearch;

  // Memoize KPI components to prevent re-render on action menu state changes
  const memoizedAverageClearanceTime = useMemo(() => <AverageClearanceTime cheques={cheques} />, [cheques]);
  const memoizedProcessingAccuracy = useMemo(() => <ChequeProcessingAccuracyRate cheques={cheques} />, [cheques]);
  const memoizedReconciliationRate = useMemo(() => <ChequeReconciliationRate cheques={cheques} />, [cheques]);
  const memoizedOutstandingRatio = useMemo(() => <OutstandingChequesRatio cheques={cheques} />, [cheques]);

  if (isInitialLoading) {
    return <IssueChequeSkeleton />;
  }

  return (
    <div className="issue-cheque-page">
      <div className="ic-header">
        <div className="ic-header-content">
          <h1 className="ic-title">
            <i className="fas fa-money-check"></i> Issue Cheque
           {/* < span className="ic-live-badge">
              <i className="fas fa-circle"></i> Live
            </span> */}
          </h1>
          <div className="ic-header-actions">
            <button 
              className="ic-btn-issue-new-cheque"
              onClick={() => setShowIssueFormModal(true)}
            >
              <i className="fas fa-plus-circle"></i>
              Issue New Cheque
            </button>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      <ErrorModal 
        message={errorMessage} 
        onClose={() => setErrorMessage("")} 
      />

      {/* Success Modal */}
      <SuccessModal 
        message={successMessage} 
        onClose={() => setSuccessMessage("")} 
      />

      {/* Dashboard Layout */}
      <div className="ic-dashboard-grid">
        {/* Left Column - Summary Cards */}
        <div className="ic-left-column">
          <div className="ic-summary-card ic-combined-card">
            <div className="ic-card-title">Total</div>
            <div className="ic-card-value">₱{cheques.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0).toLocaleString()}</div>
            <div className="ic-card-subtitle">{cheques.length} Issued Cheque</div>
            
            {/* Small Line Graph */}
            <div className="ic-cheque-mini-graph" ref={miniGraphRef}>
              {(() => {
                // Group cheques by date and calculate daily totals
                const dailyData = cheques.reduce((acc, item) => {
                  const date = new Date(item.issue_date || item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const amount = parseFloat(item.amount || 0);
                  
                  if (!acc[date]) {
                    acc[date] = 0;
                  }
                  acc[date] += Math.abs(amount);
                  return acc;
                }, {});
                
                // Get last 7 days of data
                const sortedDates = Object.keys(dailyData).slice(-7);
                const values = sortedDates.map(date => dailyData[date]);
                const dates = sortedDates;
                
                if (values.length === 0) {
                  return <div className="no-graph-data">No data available</div>;
                }
                
                const maxValue = Math.max(...values, 1);
                const minValue = Math.min(...values, 0);
                const range = maxValue - minValue || 1;
                
                // Create SVG points - dynamic width based on data points
                const pointWidth = 50; // Width per data point
                const width = Math.max(values.length * pointWidth, 300);
                const height = 50;
                const padding = 10;
                
                const points = values.map((value, index) => {
                  const x = padding + (index / (values.length - 1 || 1)) * (width - padding * 2);
                  const y = padding + (height - padding * 2) - ((value - minValue) / range) * (height - padding * 2);
                  return `${x},${y}`;
                }).join(' ');
                
                return (
                  <svg viewBox={`0 0 ${width} ${height}`} className="mini-graph-svg" preserveAspectRatio="xMidYMid meet">
                    {/* Area fill */}
                    <polygon
                      points={`${padding},${height} ${points} ${width - padding},${height}`}
                      fill="rgba(0, 0, 0, 0.1)"
                    />
                    {/* Line */}
                    <polyline
                      points={points}
                      fill="none"
                      stroke="#000000"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Data points with hover */}
                    {values.map((value, index) => {
                      const x = padding + (index / (values.length - 1 || 1)) * (width - padding * 2);
                      const y = padding + (height - padding * 2) - ((value - minValue) / range) * (height - padding * 2);
                      return (
                        <g key={index}>
                          <circle
                            cx={x}
                            cy={y}
                            r="8"
                            fill="transparent"
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredPoint({ index, value, date: dates[index], x, y })}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                          <circle
                            cx={x}
                            cy={y}
                            r="2"
                            fill="#000000"
                            style={{ pointerEvents: 'none' }}
                          />
                        </g>
                      );
                    })}
                    
                    {/* Tooltip - position based on dot location */}
                    {hoveredPoint && (() => {
                      // If dot is in top half, show tooltip below; if in bottom half, show above
                      const isTopHalf = hoveredPoint.y < height / 2;
                      const tooltipY = isTopHalf ? hoveredPoint.y + 8 : hoveredPoint.y - 22;
                      const textY = isTopHalf ? hoveredPoint.y + 20 : hoveredPoint.y - 10;
                      
                      return (
                        <g style={{ pointerEvents: 'none' }}>
                          <rect
                            x={hoveredPoint.x - 25}
                            y={tooltipY}
                            width="50"
                            height="18"
                            fill="#000000"
                            rx="3"
                            opacity="0.95"
                          />
                          <text
                            x={hoveredPoint.x}
                            y={textY}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="7"
                            fontWeight="700"
                          >
                            ₱{hoveredPoint.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </text>
                        </g>
                      );
                    })()}
                  </svg>
                );
              })()}
            </div>
          </div>
          
          <div className="ic-summary-card">
            <div className="ic-card-title">Average Cheque</div>
            <div className="ic-card-value">
              ₱{cheques.length > 0 
                ? (cheques.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) / cheques.length).toLocaleString(undefined, { maximumFractionDigits: 2 })
                : '0'}
            </div>
            <div className="ic-card-subtitle">Per Transaction</div>
          </div>
        </div>

        {/* Right Column - Main Chart */}
        <div className="ic-right-column">
          {memoizedAverageClearanceTime}
        </div>
      </div>

      {/* Bottom Row - Analytics Cards */}
      <div className="ic-analytics-row">
        <div className="ic-analytics-wrapper">
          <div className="ic-analytics-title">Cheque Processing Accuracy Rate</div>
          {memoizedProcessingAccuracy}
        </div>

        <div className="ic-analytics-wrapper">
          <div className="ic-analytics-title">Cheque Reconciliation Rate</div>
          {memoizedReconciliationRate}
        </div>

        <div className="ic-analytics-wrapper">
          <div className="ic-analytics-title">Outstanding Cheques Ratio</div>
          {memoizedOutstandingRatio}
        </div>
      </div>

      {/* Table Header with Search and Filters */}
      <div className="ic-table-header">
        <div className="section-title-group">
          <h3>
            <i className="fas fa-money-check"></i>
            Issued Cheques
            <span className="section-count">({filteredCheques.length})</span>
          </h3>
        </div>
        <div className="header-controls">
          <div className="search-filter-container">
            <div className="account-search-container">
              <input
                type="text"
                placeholder="Search cheques..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="account-search-input"
              />
              <i className="fas fa-search account-search-icon"></i>
            </div>
            
            <div className="filter-dropdown-container">
              <button
                className="filter-dropdown-btn"
                onClick={() => setFilters(prev => ({ ...prev, showFilterDropdown: !prev.showFilterDropdown }))}
                title="Filter cheques"
              >
                <i className="fas fa-filter"></i>
                <span className="filter-label">
                  {filters.status === 'all' ? 'All Cheques' : 'Recent (Last 7 days)'}
                </span>
                <i className={`fas fa-chevron-${filters.showFilterDropdown ? 'up' : 'down'} filter-arrow`}></i>
              </button>
              
              {filters.showFilterDropdown && (
                <div className="filter-dropdown-menu">
                  <button
                    className={`filter-option ${filters.status === 'all' ? 'active' : ''}`}
                    onClick={() => { handleFilterChange('status', 'all'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                  >
                    <i className="fas fa-list"></i>
                    <span>All Cheques</span>
                    {filters.status === 'all' && <i className="fas fa-check filter-check"></i>}
                  </button>
                  <button
                    className={`filter-option ${filters.status === 'recent' ? 'active' : ''}`}
                    onClick={() => { handleFilterChange('status', 'recent'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                  >
                    <i className="fas fa-clock"></i>
                    <span>Recent (Last 7 days)</span>
                    {filters.status === 'recent' && <i className="fas fa-check filter-check"></i>}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="action-buttons" ref={exportDropdownRef}>
            <button
              className="btn-icon export-btn"
              title="Export Cheques"
              type="button"
              onClick={() => setShowExportDropdown(prev => !prev)}
            >
              <i className="fas fa-download"></i>
            </button>
            {showExportDropdown && (
              <div className="export-dropdown-menu">
                <button type="button" className="export-option">
                  <i className="fas fa-file-pdf"></i>
                  <span>Download PDF</span>
                </button>
                <button type="button" className="export-option">
                  <i className="fas fa-file-excel"></i>
                  <span>Download Excel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cheques Table */}
      <div className="ic-cheques-section">
        <div className="ic-cheques-table-container">
          <table className="ic-cheques-table">
            <thead>
              <tr>
                <th><i className="fas fa-hashtag"></i> CHEQUE ID</th>
                <th><i className="fas fa-money-check"></i> CHEQUE NUMBER</th>
                <th><i className="fas fa-exchange-alt"></i> DISBURSEMENT</th>
                <th><i className="fas fa-user"></i> PAYEE NAME</th>
                <th><i className="fas fa-university"></i> BANK</th>
                <th><i className="fas fa-money-bill"></i> AMOUNT</th>
                <th><i className="fas fa-calendar"></i> ISSUE DATE</th>
                <th><i className="fas fa-cog"></i> ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCheques.length > 0 ? (
                filteredCheques.map((cheque) => (
                  <tr 
                    key={cheque.id}
                    className={`table-row clickable-row ${openActionMenu === cheque.id ? 'row-active-menu' : ''}`}
                    onClick={(e) => {
                      if (!e.target.closest('.action-cell')) {
                        viewChequeDetails(cheque);
                      }
                    }}
                  >
                    <td>
                      <div className="cell-content">
                        <span className="cheque-id">#{cheque.id}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-content">
                        <span className="cheque-number">{cheque.cheque_number}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-content">
                        <span className="transaction-ref">#{cheque.disbursement_id}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-content">
                        <div className="payer-info">
                          <span className="payer-name">{cheque.payee_name}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cell-content">
                        <span className="bank-name">{cheque.bank_name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-content">
                        <span className="amount amount-negative">
                          -₱{parseFloat(cheque.amount || 0).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-content">
                        <span className="issue-date">
                          {new Date(cheque.issue_date || cheque.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="action-cell">
                      <div className="cell-content">
                        <div className="action-buttons-group">
                          <div className="action-menu-container">
                            <button 
                              className="action-btn-icon more-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenu(openActionMenu === cheque.id ? null : cheque.id);
                              }}
                              title="Actions"
                            >
                              <i className="fas fa-ellipsis-v"></i>
                            </button>
                            {openActionMenu === cheque.id && (
                              <div className="action-dropdown-menu">
                                <button 
                                  className="action-dropdown-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setChequeResult({
                                      id: cheque.id,
                                      chequeNumber: cheque.cheque_number,
                                      payeeName: cheque.payee_name,
                                      amount: cheque.amount,
                                      bankName: cheque.bank_name,
                                      accountNumber: cheque.account_number,
                                      issueDate: cheque.issue_date || cheque.created_at,
                                      memo: cheque.memo
                                    });
                                    setShowSuccessModal(true);
                                    setOpenActionMenu(null);
                                  }}
                                >
                                  <i className="fas fa-eye"></i>
                                  <span>View Details</span>
                                </button>
                                <button 
                                  className="action-dropdown-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setChequeResult({
                                      id: cheque.id,
                                      chequeNumber: cheque.cheque_number,
                                      payeeName: cheque.payee_name,
                                      amount: cheque.amount,
                                      bankName: cheque.bank_name,
                                      accountNumber: cheque.account_number,
                                      issueDate: cheque.issue_date || cheque.created_at,
                                      memo: cheque.memo
                                    });
                                    setShowSuccessModal(true);
                                    setOpenActionMenu(null);
                                  }}
                                >
                                  <i className="fas fa-print"></i>
                                  <span>Print Cheque</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
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
        <div className="ic-modal-overlay ic-confirmation-modal-overlay" onClick={() => setShowIssueModal(false)}>
          <div className="ic-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ic-modal-header">
              <h3><i className="fas fa-question-circle"></i> Confirm Cheque Issue</h3>
              <button className="ic-modal-close" onClick={() => setShowIssueModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="ic-modal-body">
              <div className="ic-confirmation-details">
                <div className="ic-detail-item">
                  <label>Disbursement ID:</label>
                  <span>#{formData.disbursementId}</span>
                </div>
                <div className="ic-detail-item">
                  <label>Cheque Number:</label>
                  <span>{formData.chequeNumber}</span>
                </div>
                <div className="ic-detail-item">
                  <label>Bank Name:</label>
                  <span>{formData.bankName}</span>
                </div>
                <div className="ic-detail-item">
                  <label>Account Number:</label>
                  <span>{formData.accountNumber}</span>
                </div>
                <div className="ic-detail-item">
                  <label>Payee Name:</label>
                  <span>{formData.payeeName}</span>
                </div>
                <div className="ic-detail-item">
                  <label>Amount:</label>
                  <span>₱{parseFloat(formData.amount || 0).toLocaleString()}</span>
                </div>
                <div className="ic-detail-item">
                  <label>Issue Date:</label>
                  <span>{new Date(formData.issueDate).toLocaleDateString()}</span>
                </div>
                {formData.memo && (
                  <div className="ic-detail-item">
                    <label>Memo:</label>
                    <span>{formData.memo}</span>
                  </div>
                )}
              </div>
              <p className="ic-confirmation-message">
                Are you sure you want to issue this cheque?
              </p>
            </div>
            <div className="ic-modal-actions">
              <button
                type="button"
                className="ic-cancel-btn"
                onClick={() => setShowIssueModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ic-confirm-btn"
                onClick={confirmIssueCheque}
                disabled={mutationLoading}
              >
                {mutationLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Processing...
                  </>
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
        <div className="ic-modal-overlay" onClick={() => setShowChequeModal(false)}>
          <div className="ic-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ic-modal-header">
              <h3><i className="fas fa-money-check"></i> Cheque Details</h3>
              <button className="ic-modal-close" onClick={() => setShowChequeModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="ic-modal-body">
              <div className="ic-confirmation-details">
                <div className="ic-detail-item">
                  <label>Cheque ID:</label>
                  <span>#{selectedCheque.id}</span>
                </div>
                <div className="ic-detail-item">
                  <label>Cheque Number:</label>
                  <span>{selectedCheque.cheque_number}</span>
                </div>
                <div className="ic-detail-item">
                  <label>Disbursement ID:</label>
                  <span>#{selectedCheque.disbursement_id}</span>
                </div>
                <div className="ic-detail-item">
                  <label>Payee Name:</label>
                  <span>{selectedCheque.payee_name}</span>
                </div>
                <div className="ic-detail-item">
                  <label>Bank Name:</label>
                  <span>{selectedCheque.bank_name}</span>
                </div>
                <div className="ic-detail-item">
                  <label>Account Number:</label>
                  <span>{selectedCheque.account_number}</span>
                </div>
                <div className="ic-detail-item">
                  <label>Amount:</label>
                  <span>₱{parseFloat(selectedCheque.amount || 0).toLocaleString()}</span>
                </div>
                <div className="ic-detail-item">
                  <label>Issue Date:</label>
                  <span>{new Date(selectedCheque.issue_date || selectedCheque.created_at).toLocaleDateString()}</span>
                </div>
                {selectedCheque.memo && (
                  <div className="ic-detail-item">
                    <label>Memo:</label>
                    <span>{selectedCheque.memo}</span>
                  </div>
                )}
                <div className="ic-detail-item">
                  <label>Created At:</label>
                  <span>{new Date(selectedCheque.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="ic-modal-actions">
              <button
                type="button"
                className="ic-close-btn"
                onClick={() => setShowChequeModal(false)}
              >
                <i className="fas fa-times"></i> Close
              </button>
              <button
                type="button"
                className="ic-print-btn"
                onClick={() => {
                  setChequeResult({
                    id: selectedCheque.id,
                    chequeNumber: selectedCheque.cheque_number,
                    payeeName: selectedCheque.payee_name,
                    amount: selectedCheque.amount,
                    bankName: selectedCheque.bank_name,
                    accountNumber: selectedCheque.account_number,
                    issueDate: selectedCheque.issue_date || selectedCheque.created_at,
                    memo: selectedCheque.memo
                  });
                  setShowChequeModal(false);
                  setShowSuccessModal(true);
                }}
              >
                <i className="fas fa-print"></i> Print Cheque
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Cheque Modal */}
      {showSuccessModal && chequeResult && (
        <div className="ic-modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="ic-cheque-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ic-cheque-actions-bar">
              <button className="ic-modal-close" onClick={() => setShowSuccessModal(false)}>
                <i className="fas fa-times"></i>
              </button>
              <button className="ic-print-btn" onClick={printCheque}>
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

      {/* Issue Form Modal */}
      {showIssueFormModal && (
        <div className="ic-modal-overlay" onClick={() => setShowIssueFormModal(false)}>
          <div className="ic-modal-content ic-form-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ic-modal-header">
              <h3><i className="fas fa-plus-circle"></i> Issue New Cheque</h3>
              <button className="ic-modal-close" onClick={() => setShowIssueFormModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="ic-modal-body">
              <form onSubmit={handleSubmit} className="ic-cheque-form">
                <div className="ic-form-group">
                  <label>Select Disbursement Transaction *</label>
                  <div className="disbursement-searchable-select" ref={disbursementDropdownRef}>
                    <div className="disbursement-search-wrapper-main">
                      <input
                        type="text"
                        className="disbursement-search-input-main"
                        placeholder="Search disbursement transactions..."
                        value={disbursementDisplayValue}
                        onChange={(e) => {
                          setDisbursementSearch(e.target.value);
                          if (!showDisbursementDropdown) {
                            setShowDisbursementDropdown(true);
                          }
                        }}
                        onFocus={() => {
                          setShowDisbursementDropdown(true);
                          if (formData.disbursementId) {
                            setDisbursementSearch('');
                          }
                        }}
                      />
                      <i className="fas fa-search disbursement-search-icon-main"></i>
                    </div>
                    {showDisbursementDropdown && (
                      <div className="disbursement-dropdown">
                        <div className="disbursement-options">
                          {filteredDisbursements.length > 0 ? (
                            filteredDisbursements.map((transaction) => (
                              <div 
                                key={transaction.id}
                                className={`disbursement-option ${formData.disbursementId === transaction.id.toString() ? 'selected' : ''}`}
                                onClick={() => {
                                  handleInputChange('disbursementId', transaction.id.toString());
                                  setShowDisbursementDropdown(false);
                                  setDisbursementSearch('');
                                }}
                              >
                                <div className="disbursement-option-content">
                                  <span className="disbursement-id">#{transaction.id}</span>
                                  <span className="disbursement-recipient">{transaction.recipient || transaction.description || 'N/A'}</span>
                                </div>
                                <span className="disbursement-amount">₱{parseFloat(transaction.amount || 0).toLocaleString()}</span>
                              </div>
                            ))
                          ) : (
                            <div className="disbursement-option no-results">
                              <span>No transactions found</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ic-form-row">
                  <div className="ic-form-group">
                    <label>Cheque Number *</label>
                    <input
                      type="text"
                      placeholder="Auto-generated when transaction is selected"
                      value={formData.chequeNumber}
                      onChange={(e) => handleInputChange('chequeNumber', e.target.value)}
                      required
                      readOnly
                    />
                  </div>
                  <div className="ic-form-group">
                    <label>Fund Account</label>
                    <div className="fund-account-searchable-select" ref={fundAccountDropdownRef}>
                      <div className="fund-account-search-wrapper-main">
                        <input
                          type="text"
                          className="fund-account-search-input-main"
                          placeholder="Search fund accounts..."
                          value={fundAccountDisplayValue}
                          onChange={(e) => {
                            setFundAccountSearch(e.target.value);
                            if (!showFundAccountDropdown) {
                              setShowFundAccountDropdown(true);
                            }
                          }}
                          onFocus={() => {
                            setShowFundAccountDropdown(true);
                            if (formData.fundAccountId) {
                              setFundAccountSearch('');
                            }
                          }}
                        />
                        <i className="fas fa-search fund-account-search-icon-main"></i>
                      </div>
                      {showFundAccountDropdown && (
                        <div className="fund-account-dropdown">
                          <div className="fund-account-options">
                            {filteredFundAccounts.length > 0 ? (
                              filteredFundAccounts.map((account) => (
                                <div 
                                  key={account.id}
                                  className={`fund-account-option ${formData.fundAccountId === account.id.toString() ? 'selected' : ''}`}
                                  onClick={() => {
                                    handleInputChange('fundAccountId', account.id.toString());
                                    setShowFundAccountDropdown(false);
                                    setFundAccountSearch('');
                                  }}
                                >
                                  <span className="fund-account-name">{account.name}</span>
                                  <span className="fund-account-balance">₱{parseFloat(account.balance || 0).toLocaleString()}</span>
                                </div>
                              ))
                            ) : (
                              <div className="fund-account-option no-results">
                                <span>No fund accounts found</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ic-form-row">
                  <div className="ic-form-group">
                    <label>Payee Name *</label>
                    <input
                      type="text"
                      placeholder="Enter payee name"
                      value={formData.payeeName}
                      onChange={(e) => handleInputChange('payeeName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="ic-form-group">
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

                <div className="ic-form-row">
                  <div className="ic-form-group">
                    <label>Bank Name *</label>
                    <input
                      type="text"
                      placeholder="Enter bank name"
                      value={formData.bankName}
                      onChange={(e) => handleInputChange('bankName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="ic-form-group">
                    <label>Account Number *</label>
                    <input
                      type="text"
                      placeholder="Enter account number"
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="ic-form-row">
                  <div className="ic-form-group">
                    <label>Issue Date</label>
                    <input
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => handleInputChange('issueDate', e.target.value)}
                    />
                  </div>
                  <div className="ic-form-group">
                    <label>Memo</label>
                    <input
                      type="text"
                      placeholder="Optional memo"
                      value={formData.memo}
                      onChange={(e) => handleInputChange('memo', e.target.value)}
                    />
                  </div>
                </div>

                <div className="ic-modal-actions">
                  <button
                    type="button"
                    className="ic-cancel-btn"
                    onClick={() => setShowIssueFormModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ic-confirm-btn"
                    disabled={mutationLoading}
                  >
                    {mutationLoading ? (
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
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueCheque;
