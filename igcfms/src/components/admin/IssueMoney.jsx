import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "axios";
import API_BASE_URL from "../../config/api";
import "./css/issuemoney.css";
import balanceService from "../../services/balanceService";
import { broadcastFundTransaction } from "../../services/fundTransactionChannel";
import Chart from 'chart.js/auto';
import IssueMoneySkeletonLoader from "../ui/issuemoneySL";
import { useQueryClient } from '@tanstack/react-query';
import { 
  useDisbursements, 
  useFundAccountsForDisbursement, 
  useRecipientAccountsForDisbursement,
  useCreateDisbursement 
} from '../../hooks/useDisbursements';
import { printCompleteCheque } from '../pages/print/chequeSimplePrint';
import { getReceiptPrintHTML } from '../pages/print/recieptPrint';

const CHEQUE_FIELD_LABELS = {
  dateIssued: "Date Issued",
  payeeName: "Payee Name",
  amountNumber: "Amount (Numeric)",
  amountWords: "Amount in Words"
};

const DEFAULT_CHEQUE_FIELD_POSITIONS = {
  dateIssued: { x: 420, y: 20 },
  payeeName: { x: 60, y: 60 },
  amountNumber: { x: 420, y: 100 },
  amountWords: { x: 60, y: 130 }
};

const CHEQUE_DATE_FORMATS = [
  { id: 'long', name: 'Month Day, Year', formatter: new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
  { id: 'numeric', name: 'MM/DD/YYYY', formatter: new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) },
  { id: 'iso', name: 'YYYY-MM-DD', formatter: new Intl.DateTimeFormat('en-CA') }
];

const cloneDefaultChequeLayout = () => JSON.parse(JSON.stringify(DEFAULT_CHEQUE_FIELD_POSITIONS));

const IssueMoney = () => {
  // TanStack Query hooks
  const queryClient = useQueryClient();
  const { 
    data: disbursementsData, 
    isLoading: disbursementsLoading, 
    error: disbursementsError 
  } = useDisbursements();
  
  const { 
    data: fundAccountsData, 
    isLoading: fundAccountsLoading 
  } = useFundAccountsForDisbursement();
  
  const { 
    data: recipientAccountsData, 
    isLoading: recipientAccountsLoading 
  } = useRecipientAccountsForDisbursement();
  
  const createDisbursementMutation = useCreateDisbursement();
  
  // Local state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filteredDisbursements, setFilteredDisbursements] = useState([]);
  
  // Derived data from React Query
  const recentDisbursements = disbursementsData || [];
  const fundAccounts = fundAccountsData || [];
  const recipientAccounts = recipientAccountsData || [];
  const loading = disbursementsLoading || fundAccountsLoading || recipientAccountsLoading;
  const [filters, setFilters] = useState({
    activeFilter: "all",
    searchTerm: "",
    showFilterDropdown: false
  });
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef(null);
  const dpoChartRef = useRef(null);
  const dpoChartInstance = useRef(null);
  const miniGraphRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Form states
  const [formData, setFormData] = useState({
    amount: "",
    recipientAccountId: "",
    payeeName: "", // Manual payee name input
    referenceNo: "", // Will be auto-generated
    fundAccountId: "",
    modeOfPayment: "Cash",
    chequeNumber: "",
    description: ""
  });

  // Generate reference number function (moved up for initialization)
  const generateReferenceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-4);
    
    const prefix = "DISB";
    return `${prefix}-${year}${month}${day}-${timestamp}`;
  };

  // Auto-generate reference number when component loads
  useEffect(() => {
    const autoRefNo = generateReferenceNumber();
    setFormData(prev => ({
      ...prev,
      referenceNo: autoRefNo
    }));
  }, []);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [disbursementResult, setDisbursementResult] = useState(null);
  const [recipientAccountSearch, setRecipientAccountSearch] = useState("");
  const [showRecipientAccountDropdown, setShowRecipientAccountDropdown] = useState(false);
  const [fundAccountSearch, setFundAccountSearch] = useState("");
  const [showFundAccountDropdown, setShowFundAccountDropdown] = useState(false);
  const recipientAccountDropdownRef = useRef(null);
  const fundAccountDropdownRef = useRef(null);
  const chequePreviewRef = useRef(null);
  const [chequePreviewPositions, setChequePreviewPositions] = useState(cloneDefaultChequeLayout());
  const [dragState, setDragState] = useState(null);
  const [chequeDateFormatIndex, setChequeDateFormatIndex] = useState(0);

  const API_BASE = API_BASE_URL;
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const normalizeAmount = (value) => {
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) return 0;
    return Math.round(parsed * 100) / 100;
  };

  // Helper function to convert numbers to words
  const numberToWords = (num) => {
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
    
    return wholeNum.toString();
  };


  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  // Handle recipient account selection with auto-fill
  const handleRecipientAccountSelect = (recipientAccountId) => {
    if (!recipientAccountId) {
      // Clear all auto-filled fields when no recipient is selected
      setFormData(prev => ({
        ...prev,
        recipientAccountId: '',
        payeeName: ''
      }));
      return;
    }

    const selectedRecipient = recipientAccounts.find(recipient => recipient.id === parseInt(recipientAccountId));
    
    if (selectedRecipient) {
      console.log('Selected recipient account:', selectedRecipient);
      
      // Auto-fill form fields based on selected recipient account
      setFormData(prev => ({
        ...prev,
        recipientAccountId: recipientAccountId,
        payeeName: selectedRecipient.name || '', // Auto-fill payee name
        // You can extend this to auto-fill more fields if available in recipient data:
        // address: selectedRecipient.address || prev.address,
        // phone: selectedRecipient.phone || prev.phone,
        // etc.
      }));
      
      // Clear any previous errors
      setError('');
      
      // Show success message for auto-fill with more details
      const message = ` Auto-filled: ${selectedRecipient.name} (${selectedRecipient.fund_code})`;
      showMessage(message, 'success');
      
      console.log('Auto-filled form data:', {
        recipientId: recipientAccountId,
        payeeName: selectedRecipient.name,
        fundCode: selectedRecipient.fund_code,
        contactPerson: selectedRecipient.contact_person
      });
    } else {
      // Handle case where recipient ID doesn't match any account
      setFormData(prev => ({
        ...prev,
        recipientAccountId: recipientAccountId,
        payeeName: ''
      }));
      
      showMessage('Recipient account not found. Please select a valid account.', 'error');
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

  const validateForm = async () => {
    const { amount, recipientAccountId, payeeName, referenceNo, fundAccountId, modeOfPayment, chequeNumber } = formData;

    const requestedAmount = normalizeAmount(amount);

    if (!amount || requestedAmount <= 0) {
      showMessage("Please enter a valid amount.", 'error');
      return false;
    }
    if (!recipientAccountId && !payeeName.trim()) {
      showMessage("Please either select a recipient account or enter a payee name.", 'error');
      return false;
    }
    if (!referenceNo.trim()) {
      showMessage("Please enter reference number.", 'error');
      return false;
    }
    if (!fundAccountId) {
      showMessage("Please select a fund account.", 'error');
      return false;
    }

    // Check fund balance using the loaded fund accounts data
    try {
      const selectedFund = Array.isArray(fundAccounts) 
        ? fundAccounts.find(fund => fund.id === parseInt(fundAccountId))
        : null;
        
      if (!selectedFund) {
        showMessage("Selected fund account not found. Please refresh and try again.", 'error');
        return false;
      }

      // Use the current_balance from the fund account data
      const currentBalance = normalizeAmount(selectedFund.current_balance || 0);
      
      console.log('Fund Balance Check:', {
        fundName: selectedFund.name,
        currentBalance,
        requestedAmount,
        sufficient: currentBalance >= requestedAmount
      });

      if (requestedAmount > currentBalance) {
        showMessage(`Insufficient funds. Available balance: ₱${currentBalance.toLocaleString()} in ${selectedFund.name}`, 'error');
        return false;
      }

      // Also try to get the latest balance from the service as a backup check
      try {
        const serviceBalance = await balanceService.getFundBalance(parseInt(fundAccountId));
        const latestBalance = normalizeAmount(serviceBalance || 0);
        
        // Use the higher of the two balances (in case of sync issues)
        const actualBalance = Math.max(currentBalance, latestBalance);
        
        if (requestedAmount > actualBalance) {
          showMessage(`Insufficient funds. Available balance: ₱${actualBalance.toLocaleString()} in ${selectedFund.name}`, 'error');
          return false;
        }
      } catch (serviceError) {
        console.warn('Balance service check failed, using fund account data:', serviceError);

      }
      
    } catch (error) {
      console.error('Balance validation error:', error);
      showMessage("Error checking fund balance. Please try again.", 'error');
      return false;
    }

    return true;
  };

  const parseAmountValue = (value) => {
    const parsed = Number.parseFloat(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const applyFilters = useCallback(() => {
    if (!Array.isArray(recentDisbursements)) {
      setFilteredDisbursements([]);
      return;
    }

    let data = [...recentDisbursements];

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      data = data.filter((disbursement) => {
        const recipient = disbursement.recipient || '';
        const reference = disbursement.reference || disbursement.reference_no || disbursement.receipt_no || '';
        const purpose = disbursement.purpose || '';
        return (
          recipient.toLowerCase().includes(searchLower) ||
          reference.toString().toLowerCase().includes(searchLower) ||
          purpose.toLowerCase().includes(searchLower) ||
          disbursement.id?.toString().includes(searchLower)
        );
      });
    }

    if (filters.activeFilter === 'latest') {
      data.sort((a, b) => new Date(b.created_at || b.updated_at) - new Date(a.created_at || a.updated_at));
    } else if (filters.activeFilter === 'oldest') {
      data.sort((a, b) => new Date(a.created_at || a.updated_at) - new Date(b.created_at || b.updated_at));
    } else if (filters.activeFilter === 'highest') {
      data.sort((a, b) => parseAmountValue(b.amount) - parseAmountValue(a.amount));
    } else if (filters.activeFilter === 'lowest') {
      data.sort((a, b) => parseAmountValue(a.amount) - parseAmountValue(b.amount));
    }

    setFilteredDisbursements(data);
  }, [recentDisbursements, filters]);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Reset to first page when filters change
  }, [applyFilters]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setShowExportDropdown(false);
      }
      if (!event.target.closest('.filter-dropdown-container')) {
        setFilters(prev => ({ ...prev, showFilterDropdown: false }));
      }
      if (recipientAccountDropdownRef.current && !recipientAccountDropdownRef.current.contains(event.target)) {
        setShowRecipientAccountDropdown(false);
      }
      if (fundAccountDropdownRef.current && !fundAccountDropdownRef.current.contains(event.target)) {
        setShowFundAccountDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (showSuccessModal && disbursementResult?.modeOfPayment === "Cheque") {
      setChequePreviewPositions(cloneDefaultChequeLayout());
    } else if (!showSuccessModal) {
      setDragState(null);
      setChequeDateFormatIndex(0);
    }
  }, [showSuccessModal, disbursementResult?.modeOfPayment]);

  useEffect(() => {
    if (!dragState?.field) {
      return undefined;
    }

    const handlePointerMove = (event) => {
      event.preventDefault();
      if (!chequePreviewRef.current) return;
      const rect = chequePreviewRef.current.getBoundingClientRect();
      const rawX = event.clientX - rect.left - (dragState.offsetX || 0);
      const rawY = event.clientY - rect.top - (dragState.offsetY || 0);
      const maxX = rect.width - 60;
      const maxY = rect.height - 30;
      const clampedX = Math.min(Math.max(rawX, 0), maxX);
      const clampedY = Math.min(Math.max(rawY, 0), maxY);

      setChequePreviewPositions(prev => ({
        ...prev,
        [dragState.field]: {
          x: Math.round(clampedX),
          y: Math.round(clampedY)
        }
      }));
    };

    const handlePointerUp = () => {
      setDragState(null);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState]);

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

  // Initialize DPO Chart
  useEffect(() => {
    // Only initialize chart after ALL loading is complete (not just disbursements)
    // This ensures the skeleton loader is removed and canvas is in DOM
    if (!loading && dpoChartRef.current) {
      // Small delay to ensure DOM is fully updated after skeleton removal
      const timeoutId = setTimeout(() => {
        initializeDPOChart();
      }, 150);
      
      return () => clearTimeout(timeoutId);
    }
    
    return () => {
      if (dpoChartInstance.current) {
        dpoChartInstance.current.destroy();
      }
    };
  }, [recentDisbursements, loading]);

  const initializeDPOChart = () => {
    if (!dpoChartRef.current) {
      console.warn('DPO Chart: Canvas ref not available');
      return;
    }

    const ctx = dpoChartRef.current.getContext('2d');
    
    // Destroy existing chart
    if (dpoChartInstance.current) {
      dpoChartInstance.current.destroy();
    }

    // Calculate DPO data
    const calculateDPO = () => {
      if (recentDisbursements.length === 0) {
        // Sample data when no disbursements
        return [
          { date: 'Sep 28', value: 7 },
          { date: 'Sep 29', value: 11 },
          { date: 'Sep 30', value: 1 },
          { date: 'Oct 2', value: 1 },
          { date: 'Oct 4', value: 1 },
          { date: 'Oct 6', value: 3 },
          { date: 'Oct 8', value: 3 },
          { date: 'Oct 10', value: 4 },
          { date: 'Oct 12', value: 4 },
          { date: 'Oct 14', value: 2 }
        ];
      }

      // Group disbursements by date and calculate average DPO
      const groupedByDate = recentDisbursements.reduce((acc, disbursement) => {
        const createdDate = new Date(disbursement.created_at);
        const dateKey = createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        // Calculate days between creation and now (simplified DPO)
        const now = new Date();
        const daysDiff = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
        
        if (!acc[dateKey]) {
          acc[dateKey] = { totalDays: 0, count: 0, date: dateKey };
        }
        
        acc[dateKey].totalDays += daysDiff;
        acc[dateKey].count += 1;
        
        return acc;
      }, {});

      return Object.values(groupedByDate)
        .map(group => ({
          date: group.date,
          value: Math.round(group.totalDays / group.count)
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-10);
    };

    const dpoData = calculateDPO();
    const labels = dpoData.map(d => d.date);
    const dataPoints = dpoData.map(d => d.value);
    const maxValue = Math.max(...dataPoints, 15);
    // Round up to nearest 5 for cleaner scale
    const suggestedMax = Math.ceil(maxValue / 5) * 5;

    // Create gradients matching the Issued Receipts Summary style
    const gradientFill = ctx.createLinearGradient(0, 0, 0, dpoChartRef.current?.clientHeight || 250);
    gradientFill.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
    gradientFill.addColorStop(1, 'rgba(0, 0, 0, 0.05)');

    const borderGradient = ctx.createLinearGradient(0, 0, dpoChartRef.current?.clientWidth || 320, 0);
    borderGradient.addColorStop(0, '#000000');
    borderGradient.addColorStop(1, '#000000');

    dpoChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'DPO (Days)',
            data: dataPoints,
            borderColor: borderGradient,
            backgroundColor: gradientFill,
            borderWidth: 3,
            fill: 'start',
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: '#0f172a',
            pointBorderColor: '#f9fafb',
            pointBorderWidth: 2,
            pointHitRadius: 12,
            spanGaps: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1400,
          easing: 'easeInOutCubic'
        },
        layout: {
          padding: {
            top: 5,
            bottom: 5,
            left: 5,
            right: 5
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#111827',
            titleColor: '#f9fafb',
            bodyColor: '#f3f4f6',
            borderColor: '#0f172a',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            padding: 12,
            titleFont: { size: 12, weight: '700' },
            bodyFont: { size: 11, weight: '500' },
            callbacks: {
              title: (context) => context[0].label,
              label: (context) => `DPO: ${context.parsed.y} days`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: suggestedMax,
            ticks: {
              color: '#1f2937',
              font: { size: 11, weight: '600' },
              padding: 10,
              precision: 0,
              stepSize: 5
            },
            grid: {
              color: 'rgba(17, 24, 39, 0.08)',
              drawBorder: false,
              tickLength: 0
            }
          },
          x: {
            ticks: {
              color: '#1f2937',
              font: { size: 11, weight: '600' },
              padding: 8,
              maxRotation: 0,
              minRotation: 0
            },
            grid: {
              color: 'rgba(17, 24, 39, 0.06)',
              drawBorder: false,
              tickLength: 0
            }
          }
        },
        elements: {
          line: {
            borderJoinStyle: 'round'
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const formatCurrency = (value) => {
    const normalized = parseAmountValue(value);
    return `₱${Math.abs(normalized).toLocaleString()}`;
  };

  const exportFilters = useMemo(() => ({
    Sorting: filters.activeFilter,
    Search: filters.searchTerm || 'None'
  }), [filters]);

  const disbursementsForExport = useMemo(() => (
    filteredDisbursements.map((disbursement) => ({
      id: disbursement.id,
      reference: disbursement.reference || disbursement.reference_no || disbursement.receipt_no || `#${disbursement.id}`,
      recipient: disbursement.recipient || 'N/A',
      amount: parseAmountValue(disbursement.amount),
      mode_of_payment: disbursement.mode_of_payment || 'N/A',
      created_at: disbursement.created_at || disbursement.updated_at
    }))
  ), [filteredDisbursements]);

  const selectedChequeDateFormatter = useMemo(() => (
    CHEQUE_DATE_FORMATS[chequeDateFormatIndex]?.formatter || new Intl.DateTimeFormat('en-US')
  ), [chequeDateFormatIndex]);

  const currentChequeDateFormatName = useMemo(() => (
    CHEQUE_DATE_FORMATS[chequeDateFormatIndex]?.name || 'Custom'
  ), [chequeDateFormatIndex]);

  const chequeFieldValues = useMemo(() => {
    if (!disbursementResult) {
      return {};
    }

    const amountNumeric = parseFloat(disbursementResult.amount || 0) || 0;
    const formattedAmount = `₱${amountNumeric.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

    const issuedDate = disbursementResult.issuedAt
      ? new Date(disbursementResult.issuedAt)
      : new Date();

    return {
      dateIssued: selectedChequeDateFormatter.format(issuedDate),
      payeeName: disbursementResult.recipientName || '—',
      amountNumber: formattedAmount,
      amountWords: `${numberToWords(amountNumeric)} Pesos Only`
    };
  }, [disbursementResult, selectedChequeDateFormatter]);

  const handleCycleChequeDateFormat = () => {
    setChequeDateFormatIndex(prev => (prev + 1) % CHEQUE_DATE_FORMATS.length);
  };

  const handleStartDrag = (fieldKey, event) => {
    if (!chequePreviewRef.current) return;
    event.preventDefault();
    const containerRect = chequePreviewRef.current.getBoundingClientRect();
    const currentPosition = chequePreviewPositions[fieldKey] || { x: 0, y: 0 };
    const offsetX = event.clientX - (containerRect.left + currentPosition.x);
    const offsetY = event.clientY - (containerRect.top + currentPosition.y);

    if (event.currentTarget?.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    setDragState({ field: fieldKey, offsetX, offsetY });
  };

  const handleResetChequeLayout = () => {
    setChequePreviewPositions(cloneDefaultChequeLayout());
  };

  const sanitizeForHtml = (value) => (value || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const handlePrintChequeLayout = () => {
    if (typeof window === 'undefined') return;
    const printWindow = window.open('', '_blank', 'width=900,height=600');
    if (!printWindow) return;

    const positionedFields = Object.keys(CHEQUE_FIELD_LABELS).map((key) => {
      const position = chequePreviewPositions[key] || { x: 0, y: 0 };
      const value = sanitizeForHtml(chequeFieldValues[key] || '');
      return `<div class="print-field print-field-${key}" style="left:${position.x}px;top:${position.y}px;">${value}</div>`;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Cheque Layout</title>
          <style>
            * { box-sizing: border-box; }
            @page { size: 6.25in 2.25in; margin: 0; }
            html, body {
              width: 6.25in;
              height: 2.25in;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Inter', 'Segoe UI', sans-serif;
              background: #ffffff;
              margin: 0;
              padding: 0;
            }
            .cheque-doc {
              width: 6.25in;
              height: 2.25in;
              position: relative;
            }
            .print-field {
              position: absolute;
              font-size: 14px;
              color: #111827;
              font-weight: 600;
            }
            .print-field-payeeName {
              white-space: nowrap;
            }
            @media print {
              body { margin: 0; }
              .cheque-doc { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="cheque-doc">
            ${positionedFields}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const disbursementSummary = useMemo(() => {
    const totalCount = filteredDisbursements.length;
    const totalAmount = filteredDisbursements.reduce((sum, item) => sum + parseAmountValue(item.amount), 0);
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;

    return {
      totalCount,
      totalAmount,
      averageAmount
    };
  }, [filteredDisbursements]);

  const vendorPerformance = useMemo(() => {
    if (!Array.isArray(recentDisbursements) || recentDisbursements.length === 0) {
      return [];
    }

    const stats = recentDisbursements.reduce((acc, disbursement) => {
      const vendorName = disbursement.recipient || "Unknown Vendor";
      const amountValue = parseAmountValue(disbursement.amount);

      if (!acc[vendorName]) {
        acc[vendorName] = {
          name: vendorName,
          transactions: 0,
          totalAmount: 0
        };
      }

      acc[vendorName].transactions += 1;
      acc[vendorName].totalAmount += Math.abs(amountValue);
      return acc;
    }, {});

    const vendors = Object.values(stats);
    if (!vendors.length) {
      return [];
    }

    const highestAmount = Math.max(...vendors.map(v => v.totalAmount), 0);

    return vendors
      .map(vendor => ({
        name: vendor.name,
        transactions: vendor.transactions,
        amount: formatCurrency(vendor.totalAmount),
        percentage: highestAmount > 0
          ? Math.round((vendor.totalAmount / highestAmount) * 100)
          : 0
      }))
      .sort((a, b) => b.percentage - a.percentage || b.transactions - a.transactions)
      .slice(0, 6);
  }, [recentDisbursements]);

  const handleExportCsv = () => {
    if (!filteredDisbursements.length) {
      setShowExportDropdown(false);
      return;
    }

    const headers = ['Disbursement ID', 'Reference', 'Recipient', 'Amount', 'Payment Mode', 'Date'];
    const rows = disbursementsForExport.map((item) => (
      [
        `#${item.id}`,
        item.reference,
        item.recipient,
        formatCurrency(item.amount),
        item.mode_of_payment,
        item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'
      ].map((value) => `"${(value || '').toString().replace(/"/g, '""')}"`).join(',')
    ));

    const csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n');
    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `recent_disbursements_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportDropdown(false);
  };

  const handleExportPdf = () => {
    if (!filteredDisbursements.length) {
      setShowExportDropdown(false);
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const pdfWindow = window.open('', '_blank');
    if (!pdfWindow) {
      return;
    }

    const generatedBy = (typeof window !== 'undefined' && localStorage.getItem('user_name')) || 'System';
    const summaryRows = `
      <p><strong>Total Disbursements:</strong> ${disbursementSummary.totalCount}</p>
      <p><strong>Total Amount:</strong> ${formatCurrency(disbursementSummary.totalAmount)}</p>
      <p><strong>Average Amount:</strong> ${formatCurrency(disbursementSummary.averageAmount)}</p>
    `;

    const rows = disbursementsForExport.map((item) => `
      <tr>
        <td>#${item.id}</td>
        <td>${item.reference}</td>
        <td>${item.recipient}</td>
        <td>${formatCurrency(item.amount)}</td>
        <td>${item.mode_of_payment}</td>
        <td>${item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</td>
      </tr>
    `).join('');

    pdfWindow.document.write(`
      <html>
        <head>
          <title>Recent Disbursements Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            h2 { font-size: 18px; margin-top: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
            th { background: #111827; color: #ffffff; text-transform: uppercase; font-size: 12px; }
            td { font-size: 13px; }
          </style>
        </head>
        <body>
          <h1>Recent Disbursements Report</h1>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Generated By:</strong> ${generatedBy}</p>
          <h2>Filters</h2>
          <p><strong>Sorting:</strong> ${exportFilters.Sorting}</p>
          <p><strong>Search:</strong> ${exportFilters.Search}</p>
          <h2>Summary</h2>
          ${summaryRows}
          <h2>Disbursements</h2>
          <table>
            <thead>
              <tr>
                <th>Disbursement ID</th>
                <th>Reference</th>
                <th>Recipient</th>
                <th>Amount</th>
                <th>Payment Mode</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `);
    pdfWindow.document.close();
    pdfWindow.focus();
    pdfWindow.print();
    setShowExportDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (!isValid) return;
    
    setShowConfirmModal(true);
  };

  const confirmDisbursement = async () => {
    setSubmitting(true);
    setShowConfirmModal(false);

    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Get recipient account details with safety checks
      const selectedRecipient = Array.isArray(recipientAccounts) 
        ? recipientAccounts.find(recipient => recipient.id === parseInt(formData.recipientAccountId))
        : null;
      const selectedFund = Array.isArray(fundAccounts) 
        ? fundAccounts.find(fund => fund.id === parseInt(formData.fundAccountId))
        : null;

      // Determine the payee name (manual input takes priority over selected recipient)
      const payeeName = formData.payeeName.trim() || selectedRecipient?.name || 'Unknown Recipient';
      const transactionDescription = formData.description.trim() || `Disbursement to ${payeeName}`;

      const normalizedAmount = normalizeAmount(formData.amount);
      if (normalizedAmount <= 0) {
        showMessage("Please enter a valid amount.", 'error');
        return;
      }

      // Create transaction with enhanced audit trail
      const transactionPayload = {
        type: "Disbursement",
        amount: normalizedAmount, // Always send positive amount, backend handles sign
        description: transactionDescription,
        recipient: payeeName,
        payer_name: "System", // For disbursements, use "System" as payer
        recipient_account_id: formData.recipientAccountId ? parseInt(formData.recipientAccountId) : null,
        department: "General", // Default value since field is required
        category: "Disbursement", // Default value since field is required
        reference: formData.referenceNo.trim(),
        fund_account_id: parseInt(formData.fundAccountId),
        mode_of_payment: formData.modeOfPayment,
        cheque_number: formData.modeOfPayment === "Cheque" ? formData.chequeNumber.trim() : null,
        issued_by: parseInt(userId),
        receipt_no: formData.referenceNo.trim(), // Use reference number as receipt number
        reference_no: formData.referenceNo.trim(), // Same as reference number for consistency
        audit_trail: {
          action: "MONEY_ISSUED",
          fund_account: selectedFund?.name || `Fund #${formData.fundAccountId}`,
          recipient_account: selectedRecipient?.name || `Recipient #${formData.recipientAccountId}`,
          amount: normalizedAmount,
          payment_method: formData.modeOfPayment,
          reference: formData.referenceNo.trim(),
          timestamp: new Date().toISOString(),
          user_id: parseInt(userId)
        }
      };

      const transactionRes = await axios.post(
        `${API_BASE}/transactions`,
        transactionPayload,
        { headers }
      );

      const transactionId = transactionRes.data.id || transactionRes.data.data?.id;

      // Create disbursement record
      const disbursementPayload = {
        transaction_id: transactionId,
        payee_name: payeeName,
        recipient_account_id: formData.recipientAccountId ? parseInt(formData.recipientAccountId) : null,
        method: formData.modeOfPayment,
        cheque_number: formData.modeOfPayment === "Cheque" ? formData.chequeNumber.trim() : null,
        fund_account_id: parseInt(formData.fundAccountId),
        issued_by: parseInt(userId),
      };

      await axios.post(
        `${API_BASE}/disbursements`,
        disbursementPayload,
        { headers }
      );

      // selectedFund already declared above
      
      // Process transaction and update balance
      const currentBalance = parseFloat(selectedFund?.current_balance || 0);
      const amountToDeduct = normalizedAmount;
      const newBalance = normalizeAmount(currentBalance - amountToDeduct);
      
      console.log('Processing balance update:', {
        fund_account_id: parseInt(formData.fundAccountId),
        amount: amountToDeduct,
        current_balance_before: currentBalance,
        new_balance_calculated: newBalance,
        operation: 'SUBTRACT (ISSUE_MONEY)'
      });
      
      try {
        // Try balance service first
        const balanceUpdateResult = await balanceService.processTransaction('ISSUE_MONEY', {
          fund_account_id: parseInt(formData.fundAccountId),
          amount: amountToDeduct,
          recipient: selectedRecipient?.name || 'Unknown Recipient',
          fund_account_name: selectedFund?.name || `Fund Account #${formData.fundAccountId}`,
          transaction_id: transactionId,
          payee_name: selectedRecipient?.name || 'Unknown Recipient'
        });
        
        console.log('Balance service update completed:', balanceUpdateResult);
        
        // Invalidate fund accounts cache to refetch updated balances
        queryClient.invalidateQueries({ queryKey: ['fundAccounts'] });

        broadcastFundTransaction({
          accountId: parseInt(formData.fundAccountId),
          type: 'disbursement',
          amount: amountToDeduct,
          source: 'IssueMoney',
          balance: balanceUpdateResult?.newBalance,
        });
        
      } catch (balanceError) {
        console.error('Balance service failed, trying direct update:', balanceError);
        
        // Fallback: Direct API call to update fund account balance
        try {
          await axios.put(
            `${API_BASE}/fund-accounts/${formData.fundAccountId}`,
            { current_balance: newBalance },
            { headers }
          );
          
          console.log('Direct balance update successful:', {
            old_balance: currentBalance,
            new_balance: newBalance,
            amount_deducted: amountToDeduct
          });
          
          // Invalidate fund accounts cache to refetch updated balances
          queryClient.invalidateQueries({ queryKey: ['fundAccounts'] });

          broadcastFundTransaction({
            accountId: parseInt(formData.fundAccountId),
            type: 'disbursement',
            amount: amountToDeduct,
            source: 'IssueMoney',
            balance: newBalance,
          });
          
        } catch (directUpdateError) {
          console.error('Direct balance update also failed:', directUpdateError);
          showMessage('Transaction created but balance update failed. Please refresh the page.', 'error');
        }
      }

      setDisbursementResult({
        transactionId,
        amount: normalizedAmount,
        recipientName: payeeName,
        recipientAccount: selectedRecipient?.fund_code || 'N/A',
        referenceNo: formData.referenceNo,
        modeOfPayment: formData.modeOfPayment,
        chequeNumber: formData.chequeNumber,
        fundAccount: selectedFund?.name || 'Unknown Fund',
        issuedAt: new Date().toISOString()
      });

      // Auto-print cheque if payment mode is Cheque (before resetting form)
      const shouldPrintCheque = formData.modeOfPayment === "Cheque";
      if (shouldPrintCheque) {
        setTimeout(() => {
          printCompleteCheque({
            date: new Date().toLocaleDateString(),
            payeeName: payeeName,
            amount: `₱${normalizedAmount.toLocaleString()}`,
            amountInWords: numberToWords(normalizedAmount) + ' Pesos Only',
            accountNumber: '123123123312',
            routingNumber: formData.referenceNo
          });
        }, 500);
      }

      // Reset form with new auto-generated reference number
      const newRefNo = generateReferenceNumber();
      setFormData({
        amount: "",
        recipientAccountId: "",
        payeeName: "",
        referenceNo: newRefNo,
        fundAccountId: "",
        description: "",
        modeOfPayment: "Cash",
        chequeNumber: "",
      });

      setShowFormModal(false);
      setShowSuccessModal(true);
      
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['disbursements'] });
      queryClient.invalidateQueries({ queryKey: ['fundAccounts'] });

    } catch (err) {
      console.error("Error creating disbursement:", err);
      if (err.response?.status === 422 && err.response.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors)
          .flat()
          .join(", ");
        showMessage(`Validation error: ${errorMessages}`, 'error');
      } else {
        showMessage(err.response?.data?.message || "Failed to create disbursement.", 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };


  // Department and category removed as requested - using default values in backend

  if (loading) {
    return <IssueMoneySkeletonLoader />;
  }

  // Filter recipient accounts based on search
  const filteredRecipientAccounts = recipientAccounts.filter(account => {
    const searchLower = recipientAccountSearch.toLowerCase();
    return (
      account.name?.toLowerCase().includes(searchLower) ||
      account.fund_code?.toLowerCase().includes(searchLower) ||
      account.contact_person?.toLowerCase().includes(searchLower)
    );
  });

  // Get selected recipient account for display
  const selectedRecipientAccount = recipientAccounts.find(acc => acc.id.toString() === formData.recipientAccountId);
  const recipientAccountDisplayValue = selectedRecipientAccount && !showRecipientAccountDropdown
    ? `${selectedRecipientAccount.name} (${selectedRecipientAccount.fund_code}) - ${selectedRecipientAccount.contact_person}`
    : recipientAccountSearch;

  // Filter fund accounts based on search
  const filteredFundAccounts = fundAccounts.filter(account => {
    const searchLower = fundAccountSearch.toLowerCase();
    return (
      account.name?.toLowerCase().includes(searchLower) ||
      account.code?.toLowerCase().includes(searchLower) ||
      account.current_balance?.toString().includes(searchLower)
    );
  });

  // Get selected fund account for display
  const selectedFundAccount = fundAccounts.find(acc => acc.id.toString() === formData.fundAccountId);
  const fundAccountDisplayValue = selectedFundAccount && !showFundAccountDropdown
    ? `${selectedFundAccount.name} (${selectedFundAccount.code}) - ₱${parseFloat(selectedFundAccount.current_balance || 0).toLocaleString()}`
    : fundAccountSearch;

  const renderDisbursementForm = () => (
    <form onSubmit={handleSubmit} className="disbursement-form">
      <div className="form-row">
        <div className="form-group">
          <label>Recipient Account</label>
          <div className="recipient-account-searchable-select" ref={recipientAccountDropdownRef}>
            <div className="recipient-account-search-wrapper-main">
              <input
                type="text"
                className="recipient-account-search-input-main"
                placeholder="Search recipient accounts..."
                value={recipientAccountDisplayValue}
                onChange={(e) => {
                  setRecipientAccountSearch(e.target.value);
                  if (!showRecipientAccountDropdown) {
                    setShowRecipientAccountDropdown(true);
                  }
                }}
                onFocus={() => {
                  setShowRecipientAccountDropdown(true);
                  if (formData.recipientAccountId) {
                    setRecipientAccountSearch('');
                  }
                }}
              />
              <i className="fas fa-search recipient-account-search-icon-main"></i>
            </div>
            {showRecipientAccountDropdown && (
              <div className="recipient-account-dropdown">
                <div className="recipient-account-options">
                  {filteredRecipientAccounts.length > 0 ? (
                    filteredRecipientAccounts.map((account) => (
                      <div 
                        key={account.id}
                        className={`recipient-account-option ${formData.recipientAccountId === account.id.toString() ? 'selected' : ''}`}
                        onClick={() => {
                          handleRecipientAccountSelect(account.id.toString());
                          setShowRecipientAccountDropdown(false);
                          setRecipientAccountSearch('');
                        }}
                      >
                        <div className="recipient-account-option-content">
                          <span className="recipient-account-name">{account.name}</span>
                          <span className="recipient-account-code">({account.fund_code})</span>
                        </div>
                        <span className="recipient-account-contact">{account.contact_person}</span>
                      </div>
                    ))
                  ) : (
                    <div className="recipient-account-option no-results">
                      <span>No recipient accounts found</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <small className="field-hint">
            <i className="fas fa-info-circle"></i>
            Selecting a recipient account will auto-fill the payee name.
          </small>
        </div>
        <div className="form-group">
          <label>
            Payee Name
            {formData.recipientAccountId && formData.payeeName && (
              <span className="autofill-badge">Auto-filled</span>
            )}
          </label>
          <input
            type="text"
            placeholder={formData.recipientAccountId ? "Auto-filled from recipient account" : "Enter payee name"}
            value={formData.payeeName}
            onChange={(e) => handleInputChange('payeeName', e.target.value)}
            style={formData.recipientAccountId && formData.payeeName ? {
              backgroundColor: '#f8f9fa',
              borderColor: '#28a745',
              color: '#495057'
            } : {}}
          />
          <small className="field-hint">
            <i className="fas fa-info-circle"></i>
            {formData.recipientAccountId
              ? "Auto-filled from the selected account. You can modify if needed."
              : "Enter the payee name if no recipient account is selected."}
          </small>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Fund Account (Source) *</label>
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
                        <div className="fund-account-option-content">
                          <span className="fund-account-name">{account.name}</span>
                          <span className="fund-account-code">({account.code})</span>
                        </div>
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
        <div className="form-group">
          <label>Amount *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Enter amount (e.g., 1000.00)"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Reference Number * <span className="autofill-badge">Auto-generated</span></label>
          <input
            type="text"
            placeholder="Auto-generated reference number"
            value={formData.referenceNo}
            readOnly
            style={{
              backgroundColor: '#f8f9fa',
              borderColor: '#28a745',
              color: '#495057'
            }}
          />
          <small className="field-hint">
            <i className="fas fa-info-circle"></i>
            Reference number is automatically generated for each disbursement.
          </small>
        </div>
        <div className="form-group">
          <label>Payment Mode *</label>
          <select
            value={formData.modeOfPayment}
            onChange={(e) => handleInputChange('modeOfPayment', e.target.value)}
            required
          >
            <option value="Cash">Cash</option>
            <option value="Cheque">Cheque</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Description</label>
          <textarea
            placeholder="Enter disbursement description (optional)"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows="2"
          />
        </div>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="submit-btn"
          disabled={loading || submitting}
        >
          {submitting ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Processing...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane"></i> Create Disbursement
            </>
          )}
        </button>
      </div>
    </form>
  );


  return (
    <div className="issue-money-page">
      <div className="im-header">
        <h2 className="im-title">
          <i className="fas fa-money-check-alt"></i> Issue Money / Disbursement
        </h2>
 
        <div className="im-header-actions">
          <button
            type="button"
            className="create-disbursement-btn"
            onClick={() => setShowFormModal(true)}
          >
            <i className="fas fa-plus-circle"></i>
            New Disbursement
          </button>
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

      {/* Dashboard Layout - 5 Box Exact Layout */}
      <div className="issue-money-dashboard">
        <div className="issue-money-box-1">
          <div className="total-disbursement-card">
            <h3>Total disbursement</h3>
            <div className="disbursement-amount">
              {(() => {
                const totalAmount = recentDisbursements.reduce((sum, item) => {
                  const amount = parseFloat(item.amount || 0);
                  return sum + (isNaN(amount) ? 0 : Math.abs(amount));
                }, 0);
                return `₱${totalAmount.toLocaleString()}`;
              })()} 
            </div>
            
            {/* Small Line Graph */}
            <div className="disbursement-mini-graph" ref={miniGraphRef}>
              {(() => {
                // Group disbursements by date and calculate daily totals
                const dailyData = recentDisbursements.reduce((acc, item) => {
                  const date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
                      points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
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
        </div>

        <div className="issue-money-box-2">
          <div className="payment-accuracy-card">
            <div className="box-header">
              <div className="box-title-with-indicator">
                <h3 className="box-title">Payment Accuracy Rate</h3>
              </div>
            </div>
            <div className="box-content">
              {(() => {
                // Calculate Payment Accuracy Rate
                const totalPayments = recentDisbursements.length;
                
                // Assume all successfully stored disbursements are "correct"
                // In a real system, you'd filter by status or error flags
                const correctPayments = recentDisbursements.filter(d => {
                  // Filter out any disbursements with errors or issues
                  // For now, we assume all are correct unless they have specific error indicators
                  return d.amount && d.recipient && d.reference;
                }).length;
                
                const accuracyRate = totalPayments > 0 
                  ? ((correctPayments / totalPayments) * 100).toFixed(1)
                  : 100;
                
                // Determine status based on accuracy rate (Black & White theme)
                const getAccuracyStatus = (rate) => {
                  if (rate >= 98) return { label: 'EXCELLENT' };
                  if (rate >= 90) return { label: 'NEEDS REVIEW' };
                  return { label: 'CRITICAL' };
                };
                
                const status = getAccuracyStatus(parseFloat(accuracyRate));
                
                return (
                  <div className="accuracy-content-compact">
                    <div className="accuracy-gauge-compact">
                      <svg viewBox="0 0 100 60" className="gauge-svg-compact">
                        {/* Background arc */}
                        <path
                          d="M 10 50 A 40 40 0 0 1 90 50"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="10"
                          strokeLinecap="round"
                        />
                        {/* Black arc based on accuracy */}
                        <path
                          d="M 10 50 A 40 40 0 0 1 90 50"
                          fill="none"
                          stroke="#000000"
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={`${(parseFloat(accuracyRate) / 100) * 125.6} 125.6`}
                          style={{ transition: 'stroke-dasharray 1s ease' }}
                        />
                        {/* Center text */}
                        <text x="50" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill="#000000">
                          {accuracyRate}%
                        </text>
                        <text x="50" y="52" textAnchor="middle" fontSize="7" fontWeight="600" fill="#6b7280">
                          Accuracy
                        </text>
                      </svg>
                    </div>
                    
                    <div className="accuracy-status-compact">
                      <span className="status-label-compact">
                        {status.label}
                      </span>
                    </div>
                    
                    <div className="accuracy-details-compact">
                      <div className="detail-item-compact">
                        <span className="detail-label-compact">CORRECT</span>
                        <span className="detail-value-compact">{correctPayments}</span>
                      </div>
                      <div className="detail-divider"></div>
                      <div className="detail-item-compact">
                        <span className="detail-label-compact">TOTAL</span>
                        <span className="detail-value-compact">{totalPayments}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="issue-money-box-3">
          <div className="payment-method-chart">
            <div className="box-header">
              <div className="box-title-with-indicator">
                <h3 className="box-title">Payment Method Distribution</h3>
              </div>
            </div>
            <div className="box-content">
            {(() => {
              // Calculate payment method distribution from real disbursement data
              const calculatePaymentMethodData = () => {
                // Black and white color scheme
                const colorMap = {
                  'Cash': '#000000',           // Pure black for Cash
                  'Cheque': '#374151',         // Dark gray
                  'Bank Transfer': '#4b5563',  // Darker gray
                  'Bank': '#4b5563',           // Darker gray
                  'Check': '#374151'           // Dark gray (alternative spelling)
                };
                
                if (recentDisbursements.length === 0) {
                  // Default data with black and white theme
                  return [
                    { method: 'Cash', count: 25, percentage: 62.5, color: '#000000' },
                    { method: 'Cheque', count: 10, percentage: 25, color: '#374151' },
                    { method: 'Bank Transfer', count: 5, percentage: 12.5, color: '#4b5563' }
                  ];
                }

                // Group disbursements by payment method
                const methodCounts = recentDisbursements.reduce((acc, disbursement) => {
                  const method = disbursement.mode_of_payment || 'Cash';
                  acc[method] = (acc[method] || 0) + 1;
                  return acc;
                }, {});

                const total = Object.values(methodCounts).reduce((sum, count) => sum + count, 0);
                
                return Object.entries(methodCounts)
                  .map(([method, count]) => ({
                    method,
                    count,
                    percentage: total > 0 ? (count / total) * 100 : 0,
                    color: colorMap[method] || '#d1d5db' // Default to lightest gray
                  }))
                  .sort((a, b) => b.count - a.count);
              };

              const data = calculatePaymentMethodData();
              const total = data.reduce((sum, item) => sum + item.count, 0);
              const svgSize = 400;
              const radius = 160;
              const centerX = svgSize / 2;
              const centerY = svgSize / 2;

              let cumulativePercentage = 0;

              return (
                <div className="pie-chart-container">
                  <svg width="100%" height="100%" viewBox={`0 0 ${svgSize} ${svgSize}`} className="large-pie-chart">
                    {/* Pie chart slices */}
                    {data.map((item, index) => {
                      const startAngle = (cumulativePercentage / 100) * 2 * Math.PI - Math.PI / 2;
                      const endAngle = ((cumulativePercentage + item.percentage) / 100) * 2 * Math.PI - Math.PI / 2;
                      
                      const x1 = centerX + radius * Math.cos(startAngle);
                      const y1 = centerY + radius * Math.sin(startAngle);
                      const x2 = centerX + radius * Math.cos(endAngle);
                      const y2 = centerY + radius * Math.sin(endAngle);
                      
                      const largeArcFlag = item.percentage > 50 ? 1 : 0;
                      
                      const pathData = [
                        `M ${centerX} ${centerY}`,
                        `L ${x1} ${y1}`,
                        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        'Z'
                      ].join(' ');

                      // Calculate label position
                      const labelAngle = startAngle + (endAngle - startAngle) / 2;
                      const labelRadius = radius + 40;
                      const labelX = centerX + labelRadius * Math.cos(labelAngle);
                      const labelY = centerY + labelRadius * Math.sin(labelAngle);

                      cumulativePercentage += item.percentage;

                      return (
                        <g key={index}>
                          <path
                            d={pathData}
                            fill={item.color}
                            stroke="#ffffff"
                            strokeWidth="3"
                          />
                          {/* Label outside the pie */}
                          <text
                            x={labelX}
                            y={labelY}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="14"
                            fontWeight="600"
                            fill="#374151"
                          >
                            <tspan x={labelX} dy="0">{item.method}</tspan>
                            <tspan x={labelX} dy="16">{item.percentage.toFixed(1)}%</tspan>
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              );
            })()}
            </div>
          </div>
        </div>

        <div className="issue-money-box-4">
          <div className="vendor-performance-card">
            <div className="vendor-header">
              <i className="fas fa-star"></i>
              <div>
                <h3>Vendor Performance Ratings</h3>
                <p>Bar chart by vendor performance</p>
              </div>
            </div>
            <div className="vendor-list">
              {vendorPerformance.length === 0 ? (
                <div className="vendor-item">
                  <div className="vendor-info">
                    <span className="vendor-name">No vendor performance data yet</span>
                  </div>
                </div>
              ) : (
                vendorPerformance.map((vendor, index) => (
                  <div key={index} className="vendor-item">
                    <div className="vendor-info">
                      <span className="vendor-name">{vendor.name}</span>
                      <span className="vendor-percentage">{vendor.percentage}%</span>
                    </div>
                    <div className="vendor-details">
                      <span className="vendor-transactions">{vendor.transactions} transactions</span>
                      <span className="vendor-amount">{vendor.amount}</span>
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${vendor.percentage}%`,
                          backgroundColor: vendor.percentage === 100 ? '#1f2937' : (vendor.percentage < 50 ? '#1f2937' : '#d1d5db')
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="issue-money-box-5">
          <div className="dashboard-box box-dpo">
            <div className="box-header">
              <div className="box-title-with-indicator">
                <h3 className="box-title">Days Payable Outstanding (DPO)</h3>
              </div>
            </div>
            <div className="box-content">
              <div className="chart-container" style={{ 
                height: '100%', 
                width: '100%',
                position: 'relative',
                padding: '0'
              }}>
                <canvas 
                  ref={dpoChartRef}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100%' 
                  }}
                ></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disbursement Form Modal */}
      {showFormModal && (
        <div className="modal-overlay" onClick={() => setShowFormModal(false)}>
          <div className="modal-content modal-content-compact xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-compact">
              <h3><i className="fas fa-plus-circle"></i> Create New Disbursement</h3>
              <button className="modal-close" onClick={() => setShowFormModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body modal-body-compact">
              {renderDisbursementForm()}
            </div>
          </div>
        </div>
      )}
      {/* Recent Disbursements */}
      <div className="recent-disbursements-section">
        <div className="section-header">
          <div className="section-title-group">
            <h3>
              <i className="fas fa-history"></i>
              Recent Disbursements
              <span className="section-count">({filteredDisbursements.length})</span>
            </h3>
          </div>
          <div className="header-controls">
            <div className="search-filter-container">
              <div className="account-search-container">
                <input
                  type="text"
                  placeholder="Search disbursements..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  className="account-search-input"
                />
                <i className="fas fa-search account-search-icon"></i>
              </div>

              <div className="filter-dropdown-container">
                <button
                  className="filter-dropdown-btn"
                  onClick={() => handleFilterChange('showFilterDropdown', !filters.showFilterDropdown)}
                  title="Filter disbursements"
                  type="button"
                >
                  <i className="fas fa-filter"></i>
                  <span className="filter-label">
                    {filters.activeFilter === 'all' ? 'All Disbursements' :
                     filters.activeFilter === 'latest' ? 'Latest First' :
                     filters.activeFilter === 'oldest' ? 'Oldest First' :
                     filters.activeFilter === 'highest' ? 'Lowest Amount' :
                     'Highest Amount'}
                  </span>
                  <i className={`fas fa-chevron-${filters.showFilterDropdown ? 'up' : 'down'} filter-arrow`}></i>
                </button>

                {filters.showFilterDropdown && (
                  <div className="filter-dropdown-menu">
                    <button
                      className={`filter-option ${filters.activeFilter === 'all' ? 'active' : ''}`}
                      onClick={() => { handleFilterChange('activeFilter', 'all'); handleFilterChange('showFilterDropdown', false); }}
                      type="button"
                    >
                      <i className="fas fa-list"></i>
                      <span>All Disbursements</span>
                      {filters.activeFilter === 'all' && <i className="fas fa-check filter-check"></i>}
                    </button>
                    <button
                      className={`filter-option ${filters.activeFilter === 'latest' ? 'active' : ''}`}
                      onClick={() => { handleFilterChange('activeFilter', 'latest'); handleFilterChange('showFilterDropdown', false); }}
                      type="button"
                    >
                      <i className="fas fa-arrow-down"></i>
                      <span>Latest First</span>
                      {filters.activeFilter === 'latest' && <i className="fas fa-check filter-check"></i>}
                    </button>
                    <button
                      className={`filter-option ${filters.activeFilter === 'oldest' ? 'active' : ''}`}
                      onClick={() => { handleFilterChange('activeFilter', 'oldest'); handleFilterChange('showFilterDropdown', false); }}
                      type="button"
                    >
                      <i className="fas fa-arrow-up"></i>
                      <span>Oldest First</span>
                      {filters.activeFilter === 'oldest' && <i className="fas fa-check filter-check"></i>}
                    </button>
                    <button
                      className={`filter-option ${filters.activeFilter === 'highest' ? 'active' : ''}`}
                      onClick={() => { handleFilterChange('activeFilter', 'highest'); handleFilterChange('showFilterDropdown', false); }}
                      type="button"
                    >
                      <i className="fas fa-sort-amount-down"></i>
                      <span>Lowest Amount</span>
                      {filters.activeFilter === 'highest' && <i className="fas fa-check filter-check"></i>}
                    </button>
                    <button
                      className={`filter-option ${filters.activeFilter === 'lowest' ? 'active' : ''}`}
                      onClick={() => { handleFilterChange('activeFilter', 'lowest'); handleFilterChange('showFilterDropdown', false); }}
                      type="button"
                    >
                      <i className="fas fa-sort-amount-up"></i>
                      <span>Highest Amount</span>
                      {filters.activeFilter === 'lowest' && <i className="fas fa-check filter-check"></i>}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="action-buttons" ref={exportDropdownRef}>
              <button
                className="btn-icon export-btn"
                title="Export Disbursements"
                type="button"
                onClick={() => setShowExportDropdown(prev => !prev)}
              >
                <i className="fas fa-download"></i>
              </button>
              {showExportDropdown && (
                <div className="export-dropdown-menu">
                  <button type="button" className="export-option" onClick={handleExportPdf}>
                    <i className="fas fa-file-pdf"></i>
                    <span>Download PDF</span>
                  </button>
                  <button type="button" className="export-option" onClick={handleExportCsv}>
                    <i className="fas fa-file-excel"></i>
                    <span>Download CSV</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="disbursements-table-section">
          <div className="disbursements-table-container">
            <table className="disbursements-table receipts-table">
              <thead>
                <tr>
                  <th><i className="fas fa-hashtag"></i> DISBURSEMENT ID</th>
                  <th><i className="fas fa-file-invoice"></i> TRANSACTION</th>
                  <th><i className="fas fa-user"></i> RECIPIENT</th>
                  <th><i className="fas fa-money-bill"></i> AMOUNT</th>
                  <th><i className="fas fa-wallet"></i> PAYMENT MODE</th>
                  <th><i className="fas fa-calendar"></i> DATE</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Calculate pagination
                  const totalPages = Math.ceil(filteredDisbursements.length / itemsPerPage);
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const paginatedData = filteredDisbursements.slice(startIndex, endIndex);
                  
                  return paginatedData.length > 0 ? (
                    paginatedData.map((disbursement) => {
                    const rawAmount = Number.parseFloat(disbursement.amount ?? 0);
                    const amountValue = Number.isFinite(rawAmount) ? rawAmount : 0;
                    const amountClass = amountValue < 0 ? "amount-negative" : "amount-positive";
                    const formattedAmount = `₱${Math.abs(amountValue).toLocaleString()}`;
                    const transactionRef = disbursement.reference || disbursement.reference_no || disbursement.receipt_no || `#${disbursement.id}`;
                    const formattedDate = disbursement.created_at ? new Date(disbursement.created_at).toLocaleDateString() : "N/A";

                    return (
                      <tr key={disbursement.id} className="table-row">
                        <td>
                          <div className="cell-content">
                            <span className="receipt-id">#{disbursement.id}</span>
                          </div>
                        </td>
                        <td>
                          <div className="cell-content">
                            <span className="transaction-ref">{transactionRef}</span>
                          </div>
                        </td>
                        <td>
                          <div className="cell-content">
                            <span className="payer-name">{disbursement.recipient || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="cell-content">
                            <span className={`amount ${amountClass}`}>
                              {amountValue < 0 ? '-' : ''}{formattedAmount}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="cell-content">
                            <span className="transaction-mode">{disbursement.mode_of_payment || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="cell-content">
                            <span className="issue-date">{formattedDate}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="no-data">
                      <i className="fas fa-inbox"></i>
                      <p>No recent disbursements found.</p>
                    </td>
                  </tr>
                );
                })()}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {filteredDisbursements.length > 0 && (() => {
            const totalItems = filteredDisbursements.length;
            const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
            const displayStart = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
            const displayEnd = Math.min(currentPage * itemsPerPage, totalItems);
            
            return (
              <div className="table-pagination">
                <div className="pagination-info">
                  Showing {displayStart}-{displayEnd} of {totalItems} disbursements
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
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-question-circle"></i> Confirm Disbursement</h3>
              <button className="modal-close" onClick={() => setShowConfirmModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="confirmation-details">
                <div className="detail-item">
                  <label>Recipient Account:</label>
                  <span>{Array.isArray(recipientAccounts) ? recipientAccounts.find(r => r.id === parseInt(formData.recipientAccountId))?.name || 'Unknown' : 'Loading...'}</span>
                </div>
                {formData.payeeName && (
                  <div className="detail-item">
                    <label>Payee Name:</label>
                    <span>{formData.payeeName}</span>
                  </div>
                )}
                <div className="detail-item">
                  <label>Fund Account (Source):</label>
                  <span>{Array.isArray(fundAccounts) ? fundAccounts.find(f => f.id === parseInt(formData.fundAccountId))?.name || 'Unknown' : 'Loading...'}</span>
                </div>
                <div className="detail-item">
                  <label>Amount:</label>
                  <span>₱{Math.abs(parseFloat(formData.amount || 0)).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Reference Number:</label>
                  <span>{formData.referenceNo}</span>
                </div>
                <div className="detail-item">
                  <label>Payment Mode:</label>
                  <span>{formData.modeOfPayment}</span>
                </div>
                {formData.modeOfPayment === "Cheque" && (
                  <div className="detail-item">
                    <label>Cheque Number:</label>
                    <span>{formData.chequeNumber}</span>
                  </div>
                )}
              </div>
              <p className="confirmation-message">
                Are you sure you want to create this disbursement?
              </p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-btn"
                onClick={confirmDisbursement}
                disabled={submitting}
              >
                {submitting ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <>
                    <i className="fas fa-check"></i> Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && disbursementResult && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content success" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-check-circle"></i> Disbursement Created Successfully</h3>
              <button className="modal-close" onClick={() => setShowSuccessModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="success-details">
                <div className="success-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h4>Disbursement Completed</h4>
                <div className="result-details">
                  <div className="detail-item">
                    <label>Transaction ID:</label>
                    <span>#{disbursementResult.transactionId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Amount:</label>
                    <span>₱{parseFloat(disbursementResult.amount).toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Recipient:</label>
                    <span>{disbursementResult.recipientName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Recipient Account:</label>
                    <span>{disbursementResult.recipientAccount}</span>
                  </div>
                  <div className="detail-item">
                    <label>Fund Account:</label>
                    <span>{disbursementResult.fundAccount}</span>
                  </div>
                  <div className="detail-item">
                    <label>Reference:</label>
                    <span>{disbursementResult.referenceNo}</span>
                  </div>
                  <div className="detail-item">
                    <label>Payment Mode:</label>
                    <span>{disbursementResult.modeOfPayment}</span>
                  </div>
                  {disbursementResult.modeOfPayment === "Cheque" && (
                    <div className="detail-item">
                      <label>Cheque Number:</label>
                      <span>{disbursementResult.chequeNumber}</span>
                    </div>
                  )}
                </div>

                {disbursementResult.modeOfPayment === "Cheque" && (
                  <div className="cheque-preview-panel">
                    <div className="cheque-preview-header">
                      <div className="cheque-preview-header-actions">
                        <button
                          type="button"
                          className="cheque-preview-btn secondary"
                          onClick={handleCycleChequeDateFormat}
                        >
                          <i className="fas fa-calendar-alt"></i>
                          Change Date Format
                          <span className="cheque-preview-format-label">{currentChequeDateFormatName}</span>
                        </button>
                        <button
                          type="button"
                          className="cheque-preview-btn ghost"
                          onClick={handleResetChequeLayout}
                        >
                          <i className="fas fa-undo"></i>
                          Reset Layout
                        </button>
                        <button
                          type="button"
                          className="cheque-preview-btn outline"
                          onClick={handlePrintChequeLayout}
                        >
                          <i className="fas fa-print"></i>
                          Print Layout
                        </button>
                      </div>
                    </div>
                    <div className="cheque-preview-canvas" ref={chequePreviewRef}>
                      <div className="cheque-preview-guides" aria-hidden="true" />
                      {Object.keys(CHEQUE_FIELD_LABELS).map((key) => {
                        const position = chequePreviewPositions[key] || { x: 0, y: 0 };
                        return (
                          <div
                            key={key}
                            className={`cheque-preview-field cheque-field-${key}`}
                            style={{ left: position.x, top: position.y }}
                            onPointerDown={(event) => handleStartDrag(key, event)}
                          >
                            <span className="field-value">{chequeFieldValues[key]}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="cheque-preview-hint">
                      Tip: use the "Print Layout" button to print exactly what you see here.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowSuccessModal(false)}
              >
                <i className="fas fa-times"></i> Close
              </button>
              {disbursementResult?.modeOfPayment === "Cheque" && (
                <button
                  type="button"
                  className="print-btn"
                  onClick={handlePrintChequeLayout}
                >
                  <i className="fas fa-print"></i> Print Cheque
                </button>
              )}
              <button
                type="button"
                className="print-btn"
                onClick={() => {
                  const printWindow = window.open('', '_blank', 'width=800,height=600');
                  if (printWindow) {
                    printWindow.document.write(getReceiptPrintHTML());
                    printWindow.document.close();
                    printWindow.onload = () => {
                      setTimeout(() => {
                        printWindow.focus();
                        printWindow.print();
                      }, 500);
                    };
                  }
                }}
              >
                <i className="fas fa-receipt"></i> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueMoney;
