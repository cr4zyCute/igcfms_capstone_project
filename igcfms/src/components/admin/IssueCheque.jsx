import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { useCheques, useCreateCheque, useUpdateCheque } from "../../hooks/useCheques";
import { useDisbursements } from "../../hooks/useDisbursements";
import { useFundAccounts } from "../../hooks/useFundAccounts";
import IssueChequeSkeleton from "../ui/chequeSL";
import { ErrorModal, SuccessModal } from "../common/Modals/IssueChequeModals";
import { printCompleteCheque } from "../pages/print/chequeSimplePrint";
import { generateIssueChequesPDF } from "../reports/export/pdf/IssueChequeExport";
import "./css/issuecheque.css";
import "./css/cheque-styles.css";

// Add pulse animation for skeleton loaders
const pulseAnimation = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

// Lazy load analytics components for better performance
const AverageClearanceTime = lazy(() => import("../analytics/chequeAnalysis/AverageClearanceTime"));
const ChequeProcessingAccuracyRate = lazy(() => import("../analytics/chequeAnalysis/ChequeProcessingAccuracyRate"));
const ChequeReconciliationRate = lazy(() => import("../analytics/chequeAnalysis/ChequeReconciliationRate"));
const OutstandingChequesRatio = lazy(() => import("../analytics/chequeAnalysis/OutstandingChequesRatio"));

// Lightweight loader for analytics (no skeleton visuals)
const AnalyticsLoader = () => (
  <div
    className="ic-analytics-loading"
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      minHeight: '200px',
      borderRadius: '8px',
      background: '#f9f9f9',
      color: '#555',
      fontWeight: 500,
    }}
  >
    <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
    <span>Loading analytics...</span>
  </div>
);

const IssueCheque = ({ showKpiSections = true, useSkeletonLoader = true, filterByUserId = null, hideKpiDashboard = false } = {}) => {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [filteredCheques, setFilteredCheques] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [updatingChequeId, setUpdatingChequeId] = useState(null);

  // TanStack Query hooks
  let {
    data: cheques = [],
    isLoading: chequesLoading,
    error: chequesError
  } = useCheques();

  // Debug: Log cheques data to see what's being returned
  useEffect(() => {
    if (cheques.length > 0) {
      console.log('Cheques data from API:', cheques);
      console.log('First cheque structure:', cheques[0]);
    }
  }, [cheques]);

  // Filter cheques by userId if provided
  if (filterByUserId) {
    const userIdInt = parseInt(filterByUserId);
    cheques = cheques.filter(cheque => {
      // Check multiple possible field names for the creator/issuer
      const matches = 
        cheque.issued_by === userIdInt || 
        cheque.created_by === userIdInt ||
        cheque.user_id === userIdInt ||
        cheque.creator_id === userIdInt ||
        cheque.disbursing_officer_id === userIdInt ||
        (cheque.creator && cheque.creator.id === userIdInt);
      
      return matches;
    });
  }

  let {
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
  const updateChequeMutation = useUpdateCheque();

  // Combined loading state
  const isInitialLoading = chequesLoading || disbursementsLoading || fundAccountsLoading;
  const mutationLoading = createChequeMutation.isPending;
  const updateLoading = updateChequeMutation.isPending;
  
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
    showFilterDropdown: false,
    sortBy: "latest"
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

  // Defer analytics loading for faster initial render
  useEffect(() => {
    if (!showKpiSections || hideKpiDashboard) return;

    const timer = setTimeout(() => {
      setShowAnalytics(true);
    }, 100); // Load analytics after 100ms
    
    return () => clearTimeout(timer);
  }, [showKpiSections, hideKpiDashboard]);

  // Debounced filter application
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters();
    }, 200); // 200ms debounce
    
    return () => clearTimeout(timer);
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

  const handleToggleReconciled = async (cheque) => {
    if (!cheque?.id) return;
    setUpdatingChequeId(cheque.id);
    try {
      const newValue = !cheque.reconciled;
      await updateChequeMutation.mutateAsync({
        id: cheque.id,
        data: {
          reconciled: newValue,
          status: newValue && (!cheque.status || cheque.status === 'Issued') ? 'Cleared' : cheque.status,
        },
      });
      setSuccessMessage(newValue ? 'Cheque marked as reconciled.' : 'Cheque marked as unmatched.');
      setErrorMessage('');
    } catch (error) {
      console.error('Failed to update reconciliation:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to update cheque reconciliation.');
      setSuccessMessage('');
    } finally {
      setUpdatingChequeId(null);
      setOpenActionMenu(null);
    }
  };

  const handleToggleClearedStatus = async (cheque) => {
    if (!cheque?.id) return;
    setUpdatingChequeId(cheque.id);
    try {
      const nextStatus = cheque.status === 'Cleared' ? 'Issued' : 'Cleared';
      const reconciled = nextStatus === 'Cleared' ? cheque.reconciled : false;
      await updateChequeMutation.mutateAsync({
        id: cheque.id,
        data: {
          status: nextStatus,
          reconciled,
        },
      });
      setSuccessMessage(`Cheque marked as ${nextStatus}.`);
      setErrorMessage('');
    } catch (error) {
      console.error('Failed to update status:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to update cheque status.');
      setSuccessMessage('');
    } finally {
      setUpdatingChequeId(null);
      setOpenActionMenu(null);
    }
  };

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
      setErrorMessage("No disbursement transactions found. Please create disbursement transactions using 'Disburese' first before issuing cheques.");
    }
  }, [disbursements, disbursementsLoading]);

  const applyFilters = () => {
    let filtered = [...cheques];

    // Apply sorting first
    switch (filters.sortBy) {
      case 'latest':
        filtered.sort((a, b) => new Date(b.issue_date || b.created_at) - new Date(a.issue_date || a.created_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.issue_date || a.created_at) - new Date(b.issue_date || b.created_at));
        break;
      case 'highest':
        filtered.sort((a, b) => Math.abs(parseFloat(b.amount || 0)) - Math.abs(parseFloat(a.amount || 0)));
        break;
      case 'lowest':
        filtered.sort((a, b) => Math.abs(parseFloat(a.amount || 0)) - Math.abs(parseFloat(b.amount || 0)));
        break;
      default:
        break;
    }

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
      bankName: "all",
      sortBy: "latest",
      showFilterDropdown: false
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
    console.log('Cheque data:', cheque); // Debug log
    setChequeResult({
      id: cheque.id,
      chequeNumber: cheque.cheque_number,
      payeeName: cheque.payee_name,
      amount: Math.abs(parseFloat(cheque.amount) || 0),
      bankName: cheque.bank_name,
      accountNumber: cheque.account_number,
      issueDate: cheque.issue_date || cheque.created_at,
      memo: cheque.memo
    });
    setShowSuccessModal(true);
  };

  // Print cheque using custom template
  const handlePrintCheque = () => {
    if (!chequeResult) return;
    
    const chequeData = {
      chequeNumber: chequeResult.chequeNumber,
      date: new Date(chequeResult.issueDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      payeeName: chequeResult.payeeName,
      amount: chequeResult.amount || 0,
      amountInWords: numberToWords(chequeResult.amount || 0) + ' Pesos Only',
      memo: chequeResult.memo || '',
      accountNumber: chequeResult.accountNumber || '',
      routingNumber: 'IGCF-001-2024'
    };
    
    printCompleteCheque(chequeData);
  };

  // Handle PDF export for all cheques
  const handleExportPDF = () => {
    const totalAmount = filteredCheques.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    const averageAmount = filteredCheques.length > 0 ? totalAmount / filteredCheques.length : 0;

    const summary = {
      totalCheques: filteredCheques.length,
      totalAmount: totalAmount,
      averageAmount: averageAmount,
    };

    const filterInfo = {
      ...(filters.status !== 'all' && { Status: filters.status }),
      ...(filters.bankName !== 'all' && { Bank: filters.bankName }),
      ...(filters.dateFrom && { 'From Date': filters.dateFrom }),
      ...(filters.dateTo && { 'To Date': filters.dateTo }),
      ...(filters.searchTerm && { Search: filters.searchTerm }),
    };

    generateIssueChequesPDF({
      filters: filterInfo,
      cheques: filteredCheques,
      summary: summary,
      generatedBy: 'System',
      reportTitle: 'Issued Cheques Report',
    });

    setShowExportDropdown(false);
  };

  // Helper function to convert numbers to words (simplified)
  const numberToWords = (num) => {
    // Convert to integer (whole pesos only)
    const wholeNum = Math.floor(Math.abs(parseFloat(num) || 0));
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const convertBelowThousand = (n) => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertBelowThousand(n % 100) : '');
    };
    
    if (wholeNum === 0) return 'Zero';
    if (wholeNum < 1000) return convertBelowThousand(wholeNum);
    if (wholeNum < 1000000) {
      const thousands = Math.floor(wholeNum / 1000);
      const remainder = wholeNum % 1000;
      return convertBelowThousand(thousands) + ' Thousand' + (remainder !== 0 ? ' ' + convertBelowThousand(remainder) : '');
    }
    
    return wholeNum.toString(); // Fallback for very large numbers
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

  // Filter fund accounts based on search - memoized
  const filteredFundAccounts = useMemo(() => {
    return fundAccounts.filter(account => {
      const searchLower = fundAccountSearch.toLowerCase();
      return (
        account.name?.toLowerCase().includes(searchLower) ||
        account.current_balance?.toString().includes(searchLower)
      );
    });
  }, [fundAccounts, fundAccountSearch]);

  // Get selected fund account name for display
  const selectedFundAccount = fundAccounts.find(acc => acc.id.toString() === formData.fundAccountId);
  const fundAccountDisplayText = selectedFundAccount 
    ? `${selectedFundAccount.name} - ₱${parseFloat(selectedFundAccount.current_balance || 0).toLocaleString()}`
    : "-- Select Fund Account --";

  // Filter disbursements based on search - memoized
  const filteredDisbursements = useMemo(() => {
    return disbursements.filter(transaction => {
      const searchLower = disbursementSearch.toLowerCase();
      return (
        transaction.id?.toString().includes(searchLower) ||
        transaction.recipient?.toLowerCase().includes(searchLower) ||
        transaction.description?.toLowerCase().includes(searchLower) ||
        transaction.amount?.toString().includes(searchLower)
      );
    });
  }, [disbursements, disbursementSearch]);

  // Get selected disbursement for display
  const selectedDisbursement = disbursements.find(d => d.id.toString() === formData.disbursementId);
  const disbursementDisplayValue = selectedDisbursement && !showDisbursementDropdown
    ? `#${selectedDisbursement.id} - ${selectedDisbursement.recipient || selectedDisbursement.description || 'N/A'} - ₱${parseFloat(selectedDisbursement.amount || 0).toLocaleString()}`
    : disbursementSearch;

  // Get selected fund account for display
  const fundAccountDisplayValue = selectedFundAccount && !showFundAccountDropdown
    ? `${selectedFundAccount.name} - ₱${parseFloat(selectedFundAccount.current_balance || 0).toLocaleString()}`
    : fundAccountSearch;

  // Memoize calculations
  const totalChequeAmount = useMemo(() => 
    cheques.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0), 
    [cheques]
  );
  
  const averageChequeAmount = useMemo(() => 
    cheques.length > 0 ? (totalChequeAmount / cheques.length) : 0, 
    [cheques.length, totalChequeAmount]
  );
  
  // Memoize mini graph data
  const miniGraphData = useMemo(() => {
    if (!cheques || cheques.length === 0) return null;
    
    const dailyData = cheques.reduce((acc, item) => {
      const date = new Date(item.issue_date || item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const amount = parseFloat(item.amount || 0);
      if (!acc[date]) acc[date] = 0;
      acc[date] += Math.abs(amount);
      return acc;
    }, {});
    
    const sortedDates = Object.keys(dailyData).slice(-7);
    const values = sortedDates.map(date => dailyData[date]);
    
    if (values.length === 0) return null;
    
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;
    const pointWidth = 50;
    const width = Math.max(values.length * pointWidth, 300);
    const height = 50;
    const padding = 10;
    
    const points = values.map((value, index) => {
      const x = padding + (index / (values.length - 1 || 1)) * (width - padding * 2);
      const y = padding + (height - padding * 2) - ((value - minValue) / range) * (height - padding * 2);
      return { x, y, value, date: sortedDates[index] };
    });
    
    return { points, width, height, padding };
  }, [cheques]);

  if (isInitialLoading) {
    if (useSkeletonLoader) {
      return <IssueChequeSkeleton showKpiSections={showKpiSections} />;
    }

    return (
      <div
        className="ic-basic-loader"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          padding: "2rem",
          fontSize: "1rem",
          color: "#333",
        }}
      >
        <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
        <span>Loading cheque data...</span>
      </div>
    );
  }

  return (
    <div className="issue-cheque-page">
      {updateLoading && (
        <div className="ic-global-loader">
          <i className="fas fa-spinner fa-spin"></i>
          <span>Updating cheque status...</span>
        </div>
      )}
      <div className="ic-header">
        <div className="ic-header-content">
          <h1 className="ic-title">
            <i className="fas fa-money-check"></i> Issue Cheque
           {/* < span className="ic-live-badge">
              <i className="fas fa-circle"></i> Live
            </span> */}
          </h1>
          <div className="ic-header-actions">
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
      {showKpiSections && !hideKpiDashboard && (
        <div className="ic-dashboard-grid">
          {/* Left Column - Summary Cards */}
          <div className="ic-left-column">
            <div className="ic-summary-card ic-combined-card">
              <div className="ic-card-title">Total</div>
              <div className="ic-card-value">₱{totalChequeAmount.toLocaleString()}</div>
              <div className="ic-card-subtitle">{cheques.length} Issued Cheque</div>
              
              {/* Small Line Graph - Optimized with memoized data */}
              <div className="ic-cheque-mini-graph" ref={miniGraphRef}>
                {!miniGraphData ? (
                  <div className="no-graph-data">No data available</div>
                ) : (
                  <svg viewBox={`0 0 ${miniGraphData.width} ${miniGraphData.height}`} className="mini-graph-svg" preserveAspectRatio="xMidYMid meet">
                    {/* Area fill */}
                    <polygon
                      points={`${miniGraphData.padding},${miniGraphData.height} ${miniGraphData.points.map(p => `${p.x},${p.y}`).join(' ')} ${miniGraphData.width - miniGraphData.padding},${miniGraphData.height}`}
                      fill="rgba(0, 0, 0, 0.1)"
                    />
                    {/* Line */}
                    <polyline
                      points={miniGraphData.points.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke="#000000"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Data points with hover */}
                    {miniGraphData.points.map((point, index) => (
                      <g key={index}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="8"
                          fill="transparent"
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={() => setHoveredPoint({ index, value: point.value, date: point.date, x: point.x, y: point.y })}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="2"
                          fill="#000000"
                          style={{ pointerEvents: 'none' }}
                        />
                      </g>
                    ))}
                    
                    {/* Tooltip */}
                    {hoveredPoint && (() => {
                      const isTopHalf = hoveredPoint.y < miniGraphData.height / 2;
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
                )}
              </div>
            </div>
            
            <div className="ic-summary-card">
              <div className="ic-card-title">Average Cheque</div>
              <div className="ic-card-value">
                ₱{averageChequeAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="ic-card-subtitle">Per Transaction</div>
            </div>
          </div>

          {/* Right Column - Main Chart - Lazy loaded */}
          <div className="ic-right-column">
            {showAnalytics ? (
              <Suspense fallback={<AnalyticsLoader />}>
                <AverageClearanceTime cheques={cheques} />
              </Suspense>
            ) : (
              <AnalyticsLoader />
            )}
          </div>
        </div>
      )}

      {/* Bottom Row - Analytics Cards - Lazy loaded */}
      {showKpiSections && !hideKpiDashboard && showAnalytics && (
        <div className="ic-analytics-row">
          <div className="ic-analytics-wrapper">
            <div className="ic-analytics-title">Cheque Processing Accuracy Rate</div>
            <Suspense fallback={<AnalyticsLoader />}>
              <ChequeProcessingAccuracyRate cheques={cheques} />
            </Suspense>
          </div>

          <div className="ic-analytics-wrapper">
            <div className="ic-analytics-title">Cheque Reconciliation Rate</div>
            <Suspense fallback={<AnalyticsLoader />}>
              <ChequeReconciliationRate cheques={cheques} />
            </Suspense>
          </div>

          <div className="ic-analytics-wrapper">
            <div className="ic-analytics-title">Outstanding Cheques Ratio</div>
            <Suspense fallback={<AnalyticsLoader />}>
              <OutstandingChequesRatio cheques={cheques} />
            </Suspense>
          </div>
        </div>
      )}

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
                title="Filter and sort cheques"
              >
                <i className="fas fa-filter"></i>
                <span className="filter-label">
                  {filters.status === 'recent' ? 'Recent (Last 7 days)' : 
                   filters.sortBy === 'latest' ? 'Latest First' :
                   filters.sortBy === 'oldest' ? 'Oldest First' :
                   filters.sortBy === 'highest' ? 'Highest Amount' :
                   filters.sortBy === 'lowest' ? 'Lowest Amount' :
                   'All Cheques'}
                </span>
                <i className={`fas fa-chevron-${filters.showFilterDropdown ? 'up' : 'down'} filter-arrow`}></i>
              </button>
              
              {filters.showFilterDropdown && (
                <div className="filter-dropdown-menu">
                  {/* Status Filter Section */}
                  <div className="filter-section-header">Status</div>
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

                  {/* Sort Filter Section */}
                 
                  <button
                    className={`filter-option ${filters.sortBy === 'latest' ? 'active' : ''}`}
                    onClick={() => { handleFilterChange('sortBy', 'latest'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                  >
                    <i className="fas fa-arrow-down"></i>
                    <span>Latest First</span>
                    {filters.sortBy === 'latest' && <i className="fas fa-check filter-check"></i>}
                  </button>
                  <button
                    className={`filter-option ${filters.sortBy === 'oldest' ? 'active' : ''}`}
                    onClick={() => { handleFilterChange('sortBy', 'oldest'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                  >
                    <i className="fas fa-arrow-up"></i>
                    <span>Oldest First</span>
                    {filters.sortBy === 'oldest' && <i className="fas fa-check filter-check"></i>}
                  </button>
                  <button
                    className={`filter-option ${filters.sortBy === 'highest' ? 'active' : ''}`}
                    onClick={() => { handleFilterChange('sortBy', 'highest'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                  >
                    <i className="fas fa-sort-amount-down"></i>
                    <span>Highest Amount</span>
                    {filters.sortBy === 'highest' && <i className="fas fa-check filter-check"></i>}
                  </button>
                  <button
                    className={`filter-option ${filters.sortBy === 'lowest' ? 'active' : ''}`}
                    onClick={() => { handleFilterChange('sortBy', 'lowest'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                  >
                    <i className="fas fa-sort-amount-up"></i>
                    <span>Lowest Amount</span>
                    {filters.sortBy === 'lowest' && <i className="fas fa-check filter-check"></i>}
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
                <button 
                  type="button" 
                  className="export-option"
                  onClick={handleExportPDF}
                  title="Export filtered cheques as PDF"
                >
                  <i className="fas fa-file-pdf"></i>
                  <span>Download PDF</span>
                </button>
                <button type="button" className="export-option" disabled title="Excel export coming soon">
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
                <th><i className="fas fa-user"></i> PAYEE NAME</th>
                <th><i className="fas fa-university"></i> BANK</th>
                <th><i className="fas fa-money-bill"></i> AMOUNT</th>
                <th><i className="fas fa-calendar"></i> ISSUE DATE</th>
                <th><i className="fas fa-info-circle"></i> STATUS</th>
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
                          ₱{Math.abs(parseFloat(cheque.amount || cheque.cheque_amount || cheque.transaction?.amount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-content">
                        <span className="issue-date">
                          {new Date(cheque.issue_date || cheque.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                    </td>
                    <td className="status-cell">
                      <div className="cell-content">
                        <div className="status-chip">
                          <span className={`status-dot status-${(cheque.status || 'Issued').toLowerCase()}`}></span>
                          <span className="status-text">{cheque.status || 'Issued'}</span>
                        </div>
                        <div className="reconcile-indicator">
                          <span className={`reconcile-badge ${cheque.reconciled ? 'reconciled' : 'pending'}`}>
                            <i className={`fas ${cheque.reconciled ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                            {cheque.reconciled ? 'Reconciled' : 'Unmatched'}
                          </span>
                        </div>
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
                                <div className="action-dropdown-divider"></div>
                                <button
                                  className="action-dropdown-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleReconciled(cheque);
                                  }}
                                  disabled={updateLoading && updatingChequeId === cheque.id}
                                >
                                  {updateLoading && updatingChequeId === cheque.id ? (
                                    <>
                                      <i className="fas fa-spinner fa-spin"></i>
                                      <span>Updating...</span>
                                    </>
                                  ) : (
                                    <>
                                      <i className={`fas ${cheque.reconciled ? 'fa-undo' : 'fa-check'}`}></i>
                                      <span>{cheque.reconciled ? 'Mark Unreconciled' : 'Mark Reconciled'}</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  className="action-dropdown-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleClearedStatus(cheque);
                                  }}
                                  disabled={updateLoading && updatingChequeId === cheque.id}
                                >
                                  {updateLoading && updatingChequeId === cheque.id ? (
                                    <>
                                      <i className="fas fa-spinner fa-spin"></i>
                                      <span>Updating...</span>
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-exchange-alt"></i>
                                      <span>{cheque.status === 'Cleared' ? 'Mark Issued' : 'Mark Cleared'}</span>
                                    </>
                                  )}
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
              <button className="ic-print-btn" onClick={handlePrintCheque}>
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
                      {numberToWords(chequeResult.amount || 0)} Pesos Only
                    </span>
                  </div>
                  
                  <div className="amount-figures-section">
                    <span className="currency-symbol">₱</span>
                    <span className="amount-figures">{parseFloat(chequeResult.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
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
                                  <span className="fund-account-balance">₱{parseFloat(account.current_balance || 0).toLocaleString()}</span>
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
