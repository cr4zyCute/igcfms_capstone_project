import React, { useState, useEffect, useRef, useMemo } from "react";
import "./css/issuereceipt.css";
import Deletion from '../common/Deletion';
import DisbursementTrends from '../analytics/disbursementAnalytics';
import ReceiptCountAnalytics from '../analytics/receiptCountAnalytics';
import PayerDistributionAnalytics from '../analytics/payerDistributionAnalytics';
import IssueReceiptSkeleton from '../ui/issuerecieptLoading';
import { getReceiptPrintHTML } from '../pages/print/recieptPrint';
import { useAuth } from "../../contexts/AuthContext";
import {
  useReceipts,
  useCollectionTransactions,
  useCreateReceipt,
  useDeleteReceipt
} from '../../hooks/useReceipts';

// Chart.js
import Chart from 'chart.js/auto';
import { generateIssuedReceiptsPDF } from '../reports/export/pdf/IssuedReceiptExport';

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

const RECEIPTS_PER_PAGE = 10;
const FILTER_LABEL_MAP = {
  all: 'All Receipts',
  latest: 'Latest First',
  oldest: 'Oldest First',
  highest: 'Highest Amount',
  lowest: 'Lowest Amount',
};

const normalizeAmount = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    if (!cleaned.trim()) {
      return null;
    }
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? null : parsed;
  }

};

const formatCurrency = (value) => {
  const amount = normalizeAmount(value);
  if (amount === null) {
    return '₱0.00';
  }
  return amount.toLocaleString('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
const IssueReceipt = () => {
  const { user } = useAuth();
  const isAdmin = (user?.role || '').toString().toLowerCase() === 'admin';
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({
    monthlyTrend: [],
    payerDistribution: [],
    totalAmount: 0,
    averageAmount: 0,
    revenueGrowth: 0,
    lastUpdated: new Date(),
    isLoading: false,
    error: null
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [powerNameError, setPowerNameError] = useState('');
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  // Chart refs
  const monthlyChartRef = useRef(null);
  const receiptsCountChartRef = useRef(null);
  const monthlyChartInstance = useRef(null);
  const receiptsCountChartInstance = useRef(null);
  const exportDropdownRef = useRef(null);
  // Form states
  const [formData, setFormData] = useState({
    transactionId: "",
    payerName: "",
    receiptNumber: "",
    issueDate: new Date().toISOString().split('T')[0],
  });
  
  // Transaction search states
  const [transactionSearchInput, setTransactionSearchInput] = useState("");
  const [showTransactionDropdown, setShowTransactionDropdown] = useState(false);
  const transactionDropdownRef = useRef(null);
  // Filter states
  const [filters, setFilters] = useState({
    activeFilter: "latest", // all, latest, oldest, highest, lowest
    dateFrom: "",
    dateTo: "",
    searchTerm: "",
    showFilterDropdown: false
  });
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showIssueFormModal, setShowIssueFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptToDelete, setReceiptToDelete] = useState(null);
  const [receiptResult, setReceiptResult] = useState(null);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [trendPeriod, setTrendPeriod] = useState('month');
  const [disbursementPeriod, setDisbursementPeriod] = useState('week'); // week, month, year
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const {
    data: receiptsData = [],
    isLoading: receiptsLoading,
    error: receiptsError
  } = useReceipts();

  const {
    data: collectionTransactions = [],
    isLoading: transactionsLoading,
    error: transactionsError
  } = useCollectionTransactions();

  const createReceiptMutation = useCreateReceipt();
  const deleteReceiptMutation = useDeleteReceipt();

  const receipts = useMemo(() => receiptsData || [], [receiptsData]);
  const transactions = useMemo(() => collectionTransactions || [], [collectionTransactions]);
  const isInitialLoading = receiptsLoading || transactionsLoading;
  const mutationLoading = createReceiptMutation.isPending || deleteReceiptMutation.isPending;

  const getReceiptStatusLabel = (receipt) => {
    if (!receipt) return 'Issued';
    const raw = receipt.status || 'Issued';
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  };

  const getReceiptStatusClass = (receipt) => {
    const status = (receipt?.status || 'issued').toLowerCase();
    if (status === 'cancelled') return 'status-cancelled';
    if (status === 'override') return 'status-override';
    return 'status-issued';
  };

  useEffect(() => {
    if (receiptsError) {
      setError(receiptsError.message || 'Failed to load receipts');
    }
  }, [receiptsError]);

  useEffect(() => {
    if (transactionsError) {
      setError(transactionsError.message || 'Failed to load collection transactions');
    }
  }, [transactionsError]);

  useEffect(() => {
    applyFilters();
  }, [filters, receipts, transactions]);

  useEffect(() => {
    if (receipts.length > 0 && transactions.length > 0) {
      generateAnalyticsData();
    }
  }, [receipts, transactions, trendPeriod]);

  useEffect(() => {
    initializeCharts();
    return () => {
      // Cleanup charts on unmount
      if (monthlyChartInstance.current) {
        monthlyChartInstance.current.destroy();
      }
      if (receiptsCountChartInstance.current) {
        receiptsCountChartInstance.current.destroy();
      }
    };
  }, [analyticsData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setShowExportDropdown(false);
      }
      if (transactionDropdownRef.current && !transactionDropdownRef.current.contains(event.target)) {
        setShowTransactionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const applyFilters = () => {
    let filtered = [...receipts];

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

    // Apply active filter (sort/filter based on selection)
    if (filters.activeFilter === 'latest') {
      // Latest to oldest by date
      filtered.sort((a, b) => new Date(b.issued_at || b.created_at) - new Date(a.issued_at || a.created_at));
    } else if (filters.activeFilter === 'oldest') {
      // Oldest to latest by date
      filtered.sort((a, b) => new Date(a.issued_at || a.created_at) - new Date(b.issued_at || b.created_at));
    } else if (filters.activeFilter === 'highest') {
      // Highest to lowest amount
      filtered.sort((a, b) => {
        const amountA = a.transaction?.amount ?? transactions.find(t => t.id === a.transaction_id)?.amount ?? 0;
        const amountB = b.transaction?.amount ?? transactions.find(t => t.id === b.transaction_id)?.amount ?? 0;
        return parseFloat(amountB) - parseFloat(amountA);
      });
    } else if (filters.activeFilter === 'lowest') {
      // Lowest to highest amount
      filtered.sort((a, b) => {
        const amountA = a.transaction?.amount ?? transactions.find(t => t.id === a.transaction_id)?.amount ?? 0;
        const amountB = b.transaction?.amount ?? transactions.find(t => t.id === b.transaction_id)?.amount ?? 0;
        return parseFloat(amountA) - parseFloat(amountB);
      });
    }
    // 'all' doesn't need any special sorting, just shows all receipts

    setFilteredReceipts(filtered);
  };

  const filteredTransactions = useMemo(() => {
    const base = Array.isArray(transactions) ? transactions : [];

    if (!transactionSearch.trim()) {
      return base;
    }

    const searchLower = transactionSearch.toLowerCase();
    return base.filter(tx => 
      tx.id?.toString().includes(searchLower) ||
      tx.description?.toLowerCase().includes(searchLower) ||
      tx.recipient?.toLowerCase().includes(searchLower) ||
      tx.payer_name?.toLowerCase().includes(searchLower) ||
      tx.amount?.toString().includes(searchLower) ||
      tx.department?.toLowerCase().includes(searchLower) ||
      tx.category?.toLowerCase().includes(searchLower)
    );
  }, [transactions, transactionSearch]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      activeFilter: "latest",
      dateFrom: "",
      dateTo: "",
      searchTerm: "",
      showFilterDropdown: false
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

  // Handle transaction selection with auto-fill
  const handleTransactionSelect = (transactionId) => {
    if (!transactionId) {
      // Clear fields when no transaction is selected
      setFormData(prev => ({
        ...prev,
        transactionId: '',
        payerName: '',
        receiptNumber: ''
      }));
      setTransactionSearchInput('');
      return;
    }

    const selectedTransaction = transactions.find(tx => tx.id === parseInt(transactionId));
    
    if (selectedTransaction) {
      // Auto-fill fields based on selected transaction
      const generatedReceiptNumber = generateReceiptNumber();
      
      setFormData(prev => ({
        ...prev,
        transactionId: transactionId,
        payerName: selectedTransaction.recipient || '',
        receiptNumber: generatedReceiptNumber
      }));
      
      setShowTransactionDropdown(false);
      setTransactionSearchInput('');
    }
  };

  const openTransactionModal = () => {
    setTransactionSearch("");
    setShowTransactionModal(true);
  };

  const selectTransaction = (transaction) => {
    handleInputChange('transactionId', transaction.id.toString());
    // Auto-generate receipt number when transaction is selected
    const generatedReceiptNumber = generateReceiptNumber();
    handleInputChange('receiptNumber', generatedReceiptNumber);
    setShowTransactionModal(false);
  };

  const getSelectedTransactionDisplay = () => {
    if (!formData.transactionId) return "-- Select Transaction --";
    
    const transaction = transactions.find(tx => tx.id.toString() === formData.transactionId);
    if (!transaction) return "-- Select Transaction --";
    
    return `#${transaction.id} - ₱${parseFloat(transaction.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} - ${transaction.description || 'Collection'} - ${transaction.recipient || 'N/A'}`;
  };

  const showMessage = (message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setTimeout(() => setSuccess(""), 5000);
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
    try {
      const payload = {
        transaction_id: parseInt(formData.transactionId, 10),
        payer_name: formData.payerName.trim(),
        receipt_number: formData.receiptNumber.trim(),
      };

      const response = await createReceiptMutation.mutateAsync(payload);
      const createdReceipt = response?.data || response || {};

      setReceiptResult({
        id: createdReceipt.id || createdReceipt.data?.id,
        receiptNumber: createdReceipt.receipt_number || formData.receiptNumber,
        payerName: createdReceipt.payer_name || formData.payerName,
        transactionId: String(createdReceipt.transaction_id || formData.transactionId),
        issueDate: createdReceipt.issued_at || formData.issueDate
      });

      setFormData({
        transactionId: "",
        payerName: "",
        receiptNumber: "",
        issueDate: new Date().toISOString().split('T')[0],
      });

      // Close confirmation modal after successful creation
      setShowIssueModal(false);
      setShowIssueFormModal(false);
      setShowReceiptModal(true);
      showMessage('Receipt issued successfully!', 'success');

    } catch (err) {
      console.error("Error issuing receipt:", err);
      const validationErrors = err?.response?.data?.errors;
      if (validationErrors) {
        const errorMessages = Object.values(validationErrors).flat().join(", ");
        showMessage(`Validation error: ${errorMessages}`, 'error');
      } else {
        showMessage(err?.response?.data?.message || err.message || "Failed to issue receipt.", 'error');
      }
      // Keep confirmation modal open on error so user can retry
    }
  };

  const viewReceiptDetails = (receipt) => {
    setSelectedReceipt(receipt);
    // Set the receipt result to show the modal
    setReceiptResult({
      id: receipt.id,
      receiptNumber: receipt.receipt_number,
      transactionId: receipt.transaction_id.toString(),
      payerName: receipt.payer_name,
      issueDate: receipt.issued_at || receipt.created_at
    });
    setShowReceiptModal(true);
  };

  // Print only the receipt content using recieptPrint template
  const printReceipt = () => {
    const receiptElement = document.getElementById('receipt-document');
    if (!receiptElement) {
      console.error('Receipt print area not found.');
      return;
    }

    // Create a new window for printing - Receipt size (4 x 8.6 inches)
    const printWindow = window.open('', '_blank', 'width=384,height=825');
    if (!printWindow) {
      console.error('Unable to open print window.');
      return;
    }

    // Get the print HTML template from the imported function
    printWindow.document.write(getReceiptPrintHTML());

    // Clone and write the receipt content
    const clonedReceipt = receiptElement.cloneNode(true);
    printWindow.document.write(clonedReceipt.outerHTML);

    // Close the document
    printWindow.document.write(`
      </body>
      </html>
    `);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  };

  // Delete receipt
  const deleteReceipt = async () => {
    if (!receiptToDelete) return;

    try {
      await deleteReceiptMutation.mutateAsync(receiptToDelete.id);

      showMessage('Receipt deleted successfully!', 'success');
      setShowDeleteModal(false);
      setReceiptToDelete(null);
    } catch (err) {
      console.error('Error deleting receipt:', err);
      showMessage(err?.response?.data?.message || err.message || 'Failed to delete receipt.', 'error');
    }
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

  // Enhanced analytics data generation
  const generateAnalyticsData = () => {
    setAnalyticsData(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      if (!receipts.length) {
        setAnalyticsData(prev => ({
          ...prev,
          monthlyTrend: [],
          payerDistribution: [],
          totalAmount: 0,
          averageAmount: 0,
          revenueGrowth: 0,
          lastUpdated: new Date(),
          isLoading: false
        }));
        return;
      }

      // Enhanced trend data based on selected period
      const trendData = {};
      const periods = [];
      const now = new Date();
      
      let periodCount, periodUnit, formatKey, formatLabel;
      
      if (trendPeriod === 'week') {
        periodCount = 12; // Last 12 weeks
        periodUnit = 'week';
        for (let i = periodCount - 1; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - (i * 7));
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const periodKey = `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getDate()) / 7)}`;
          const periodLabel = `Week ${Math.ceil((weekStart.getDate()) / 7)}`;
          periods.push({ key: periodKey, label: periodLabel, date: weekStart });
          trendData[periodKey] = { count: 0, amount: 0, receipts: [] };
        }
      } else if (trendPeriod === 'month') {
        periodCount = 12; // Last 12 months
        periodUnit = 'month';
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const periodLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          periods.push({ key: periodKey, label: periodLabel, date });
          trendData[periodKey] = { count: 0, amount: 0, receipts: [] };
        }
      } else if (trendPeriod === 'year') {
        periodCount = 5; // Last 5 years
        periodUnit = 'year';
        for (let i = periodCount - 1; i >= 0; i--) {
          const year = now.getFullYear() - i;
          const periodKey = `${year}`;
          const periodLabel = `${year}`;
          periods.push({ key: periodKey, label: periodLabel, date: new Date(year, 0, 1) });
          trendData[periodKey] = { count: 0, amount: 0, receipts: [] };
        }
      }

      // Enhanced payer and amount distribution
      const payerCounts = {};
      const payerAmounts = {};
      const amountRanges = {
        'Under 1,000': 0,
        '1,000 - 5,000': 0,
        '5,000 - 10,000': 0,
        '10,000 - 50,000': 0,
        'Over 50,000': 0
      };
      
      let totalAmount = 0;
      let currentMonthAmount = 0;
      let previousMonthAmount = 0;
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      receipts.forEach(receipt => {
        const receiptDate = new Date(receipt.issued_at || receipt.created_at);
        const transaction = transactions.find(t => t.id === receipt.transaction_id);
        const amount = transaction ? parseFloat(transaction.amount || 0) : 0;
        
        // Determine period key based on selected period
        let periodKey;
        if (trendPeriod === 'week') {
          const weekStart = new Date(receiptDate);
          weekStart.setDate(receiptDate.getDate() - receiptDate.getDay());
          periodKey = `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getDate()) / 7)}`;
        } else if (trendPeriod === 'month') {
          periodKey = `${receiptDate.getFullYear()}-${String(receiptDate.getMonth() + 1).padStart(2, '0')}`;
        } else if (trendPeriod === 'year') {
          periodKey = `${receiptDate.getFullYear()}`;
        }
        
        // Period data
        if (trendData[periodKey]) {
          trendData[periodKey].count += 1;
          trendData[periodKey].amount += amount;
          trendData[periodKey].receipts.push(receipt);
        }

        // Current vs previous month comparison
        if (receiptDate.getMonth() === currentMonth && receiptDate.getFullYear() === currentYear) {
          currentMonthAmount += amount;
        } else if (receiptDate.getMonth() === (currentMonth - 1) && receiptDate.getFullYear() === currentYear) {
          previousMonthAmount += amount;
        }

        totalAmount += amount;

        // Payer distribution
        const payerName = receipt.payer_name || 'Unknown';
        payerCounts[payerName] = (payerCounts[payerName] || 0) + 1;
        payerAmounts[payerName] = (payerAmounts[payerName] || 0) + amount;

        // Amount range distribution
        if (amount < 1000) amountRanges['Under ₱1,000']++;
        else if (amount < 5000) amountRanges['₱1,000 - ₱5,000']++;
        else if (amount < 10000) amountRanges['₱5,000 - ₱10,000']++;
        else if (amount < 50000) amountRanges['₱10,000 - ₱50,000']++;
        else amountRanges['Over ₱50,000']++;
      });

      // Calculate revenue growth
      const revenueGrowth = previousMonthAmount > 0 
        ? ((currentMonthAmount - previousMonthAmount) / previousMonthAmount) * 100 
        : currentMonthAmount > 0 ? 100 : 0;

      // Enhanced trend with growth indicators
      const monthlyTrend = periods.map((period, index) => {
        const data = trendData[period.key];
        const prevData = index > 0 ? trendData[periods[index - 1].key] : null;
        const growth = prevData && prevData.amount > 0 
          ? ((data.amount - prevData.amount) / prevData.amount) * 100 
          : 0;

        let isCurrent = false;
        if (trendPeriod === 'month') {
          isCurrent = period.date.getMonth() === currentMonth && period.date.getFullYear() === currentYear;
        } else if (trendPeriod === 'year') {
          isCurrent = period.date.getFullYear() === currentYear;
        }

        return {
          month: period.label,
          shortMonth: period.label.length > 8 ? period.label.substring(0, 8) : period.label,
          count: data.count,
          amount: data.amount,
          growth,
          isCurrentMonth: isCurrent
        };
      });

      // Enhanced payer distribution with amounts
      const payerDistribution = Object.entries(payerCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6)
        .map(([name, count]) => ({
          name: name.length > 12 ? name.substring(0, 12) + '...' : name,
          fullName: name,
          count,
          amount: payerAmounts[name] || 0,
          percentage: ((count / receipts.length) * 100).toFixed(1)
        }));

      // Amount range distribution
      const amountDistribution = Object.entries(amountRanges)
        .filter(([, count]) => count > 0)
        .map(([range, count]) => ({
          range,
          count,
          percentage: ((count / receipts.length) * 100).toFixed(1)
        }));

      setAnalyticsData({
        monthlyTrend,
        payerDistribution,
        amountDistribution,
        totalAmount,
        averageAmount: receipts.length > 0 ? totalAmount / receipts.length : 0,
        revenueGrowth,
        currentMonthAmount,
        previousMonthAmount,
        lastUpdated: new Date(),
        isLoading: false,
        error: null
      });

    } catch (error) {
      console.error('Error generating analytics data:', error);
      setAnalyticsData(prev => ({
        ...prev,
        error: 'Failed to generate analytics data',
        isLoading: false
      }));
    }
  };

  // Initialize charts
  const initializeCharts = () => {
    if (!analyticsData.monthlyTrend.length) return;

    // Destroy existing charts
    if (monthlyChartInstance.current) {
      monthlyChartInstance.current.destroy();
    }
    if (receiptsCountChartInstance.current) {
      receiptsCountChartInstance.current.destroy();
    }
  };

  // Enhanced form validation with power name
  const validatePowerName = (value) => {
    if (!value.trim()) {
      setPowerNameError('Power name is required');
      return false;
    }
    if (value.length < 3) {
      setPowerNameError('Power name must be at least 3 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9\s]+$/.test(value)) {
      setPowerNameError('Power name can only contain letters, numbers, and spaces');
      return false;
    }
    setPowerNameError('');
    return true;
  };

  // Sort table data
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedReceipts = () => {
    if (!sortConfig.key) return filteredReceipts;

    return [...filteredReceipts].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle special cases
      if (sortConfig.key === 'amount') {
        const aAmount = a.transaction?.amount ?? transactions.find(t => t.id === a.transaction_id)?.amount ?? 0;
        const bAmount = b.transaction?.amount ?? transactions.find(t => t.id === b.transaction_id)?.amount ?? 0;
        aValue = parseFloat(aAmount || 0);
        bValue = parseFloat(bAmount || 0);
      } else if (sortConfig.key === 'issued_at') {
        aValue = new Date(a.issued_at || a.created_at);
        bValue = new Date(b.issued_at || b.created_at);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedReceipts = useMemo(
    () => getSortedReceipts(),
    [filteredReceipts, sortConfig, transactions]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [sortedReceipts]);

  useEffect(() => {
    const totalPagesForData = Math.max(1, Math.ceil(sortedReceipts.length / RECEIPTS_PER_PAGE));
    if (currentPage > totalPagesForData) {
      setCurrentPage(totalPagesForData);
    }
  }, [sortedReceipts.length, currentPage]);

  const totalReceipts = sortedReceipts.length;
  const totalPages = Math.max(1, Math.ceil(totalReceipts / RECEIPTS_PER_PAGE));
  const startIndex = (currentPage - 1) * RECEIPTS_PER_PAGE;
  const currentReceipts = sortedReceipts.slice(startIndex, startIndex + RECEIPTS_PER_PAGE);
  const displayStart = totalReceipts === 0 ? 0 : startIndex + 1;
  const displayEnd = Math.min(totalReceipts, startIndex + currentReceipts.length);

  const receiptsSummary = useMemo(() => {
    const totalReceiptsCount = sortedReceipts.length;
    const totalAmountValue = sortedReceipts.reduce((sum, receipt) => {
      const amountSource = receipt.transaction?.amount ?? transactions.find((tx) => tx.id === receipt.transaction_id)?.amount;
      const amount = normalizeAmount(receipt.amount ?? amountSource);
      return sum + (amount ?? 0);
    }, 0);

    const averageAmountValue = totalReceiptsCount > 0 ? totalAmountValue / totalReceiptsCount : 0;

    return {
      totalReceipts: totalReceiptsCount,
      totalAmount: totalAmountValue,
      averageAmount: averageAmountValue,
    };
  }, [sortedReceipts, transactions]);

  const receiptsForExport = useMemo(() => {
    return sortedReceipts.map((receipt) => {
      const transaction = receipt.transaction ?? transactions.find((tx) => tx.id === receipt.transaction_id);
      const amountValue = normalizeAmount(receipt.amount ?? transaction?.amount) ?? 0;

      return {
        ...receipt,
        amount: amountValue,
        payor: receipt.payer_name || (transaction?.recipient || ''),
        payer: receipt.payer_name || (transaction?.recipient || ''),
        payment_method: receipt.payment_method || (transaction?.payment_method || ''),
        paymentMethod: receipt.paymentMethod || (transaction?.payment_method || ''),
        cashier: receipt.cashier || (transaction?.cashier || ''),
        issuedBy: receipt.issued_by || (transaction?.cashier || ''),
        issue_date: receipt.issued_at || receipt.created_at,
        dateIssued: receipt.issued_at || receipt.created_at,
        status: (receipt.status || 'Issued').toString(),
      };
    });
  }, [sortedReceipts, transactions]);

  const exportFilters = useMemo(() => ({
    'Sorting': FILTER_LABEL_MAP[filters.activeFilter] || FILTER_LABEL_MAP.all,
    'Search Term': filters.searchTerm || 'None',
    'Date From': filters.dateFrom || 'Any',
    'Date To': filters.dateTo || 'Any',
  }), [filters]);

  const handleExportPdf = () => {
    if (!sortedReceipts.length) {
      setShowExportDropdown(false);
      return;
    }

    generateIssuedReceiptsPDF({
      filters: exportFilters,
      receipts: receiptsForExport,
      summary: receiptsSummary,
      generatedBy: (typeof window !== 'undefined' && localStorage.getItem('user_name')) || 'System',
      reportTitle: 'Issued Receipts Report',
    });
    setShowExportDropdown(false);
  };

  const handleExportExcel = () => {
    if (!sortedReceipts.length) {
      setShowExportDropdown(false);
      return;
    }

    const headers = ['Receipt ID', 'Receipt Number', 'Transaction', 'Payer Name', 'Amount', 'Issue Date', 'Status'];
    const rows = sortedReceipts.map((receipt) => {
      const transaction = receipt.transaction ?? transactions.find(tx => tx.id === receipt.transaction_id);
      const amountValue = normalizeAmount(receipt.amount ?? transaction?.amount) ?? 0;
      return [
        `#${receipt.id}`,
        receipt.receipt_number,
        `#${receipt.transaction_id}`,
        receipt.payer_name,
        formatCurrency(amountValue),
        new Date(receipt.issued_at || receipt.created_at).toLocaleDateString(),
        (receipt.status || 'Issued')
      ].map((value) => `"${(value || '').toString().replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `issued_receipts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportDropdown(false);
  };

  // Filter transactions for dropdown based on search
  const filteredTransactionsForDropdown = transactions.filter(tx => {
    const searchLower = transactionSearchInput.toLowerCase();
    return (
      tx.id?.toString().includes(searchLower) ||
      tx.recipient?.toLowerCase().includes(searchLower) ||
      tx.description?.toLowerCase().includes(searchLower) ||
      tx.amount?.toString().includes(searchLower)
    );
  });

  // Get selected transaction for display
  const selectedTransaction = transactions.find(tx => tx.id.toString() === formData.transactionId);
  const transactionDisplayValue = selectedTransaction && !showTransactionDropdown
    ? `#${selectedTransaction.id} - ₱${parseFloat(selectedTransaction.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })} - ${selectedTransaction.description || 'Collection'} - ${selectedTransaction.recipient || 'N/A'}`
    : transactionSearchInput;

  if (isInitialLoading) {
    return <IssueReceiptSkeleton showAnalytics={isAdmin} />;
  }

  return (
    <div className="issue-receipt-page">
      <div className="ir-header">
        <div className="header-content">
          <h1 className="ir-title">
            <i className="fas fa-receipt"></i> Issue Receipt
          </h1>
          <div className="header-actions">
            <button
              className="header-settings-btn"
              onClick={() => setShowIssueFormModal(true)}
            >
              <i className="fas fa-cog"></i>
            </button>
            <button
              className="header-primary-btn"
              onClick={() => setShowIssueFormModal(true)}
            >
              <i className="fas fa-plus-circle"></i> Issue New Receipt
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

      {/* Analytics Dashboard - Enhanced 3-Box Layout */}
      {isAdmin && (
        <div className="analytics-dashboard-section">
          {/* 3-Box Grid Layout */}
          <div className="three-box-grid">
            {/* Left Column: Stats Cards + Box 1 */}
            <div className="left-column">
              {/* Top Stats Cards */}
              <div className="left-stats-cards">
                <div className="minimal-stat-card">
                  {analyticsData.isLoading ? (
                    <div className="loading-indicator">
                    </div>
                  ) : (
                    <>
                      <div className="minimal-stat-value">₱{analyticsData.totalAmount.toLocaleString()}</div>
                      <div className="minimal-stat-label">{receipts.length} receipts issued</div>
                      <div className="minimal-stat-change">
                        <i className="fas fa-arrow-up"></i>
                        100.0%
                      </div>
                    </>
                  )}
                </div>
                
                <div className="minimal-stat-card">
                  {analyticsData.isLoading ? (
                    <div className="loading-indicator">
                    </div>
                  ) : (
                    <>
                      <div className="minimal-stat-value">₱{analyticsData.averageAmount.toLocaleString()}</div>
                      <div className="minimal-stat-label">Average per receipt</div>
                      <div className="minimal-stat-updated">
                        <i className="fas fa-clock"></i>
                        Updated {new Date(analyticsData.lastUpdated).toLocaleTimeString()}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Box 1: Disbursement Trends Component */}
              <DisbursementTrends 
                receipts={receipts}
                transactions={transactions}
                disbursementPeriod={disbursementPeriod}
                onPeriodChange={setDisbursementPeriod}
              />
            </div>

            {/* Right Column: Box 2 and Box 3 */}
            <div className="right-column">
              {/* Box 2: Payer Distribution Analytics Component */}
              <PayerDistributionAnalytics 
                analyticsData={analyticsData}
              />

              {/* Box 3: Receipt Count Analytics Component */}
              <ReceiptCountAnalytics 
                receipts={receipts}
                analyticsData={analyticsData}
              />
            </div>
          </div>
        </div>
      )}


      <div className={`receipts-section ${isAdmin ? 'admin-view' : ''}`}>
          {/* Receipts Section Header */}
          <div className="section-header">
            <div className="section-title-group">
              <h3>
                <i className="fas fa-receipt"></i>
                Issued Receipts
                <span className="section-count">({filteredReceipts.length})</span>
              </h3>
            </div>
            <div className="header-controls">
              <div className="search-filter-container">
                <div className="account-search-container">
                  <input
                    type="text"
                    placeholder="Search receipts..."
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
                    title="Filter receipts"
                  >
                    <i className="fas fa-filter"></i>
                    <span className="filter-label">
                      {filters.activeFilter === 'all' ? 'All Receipts' :
                       filters.activeFilter === 'latest' ? 'Latest First' :
                       filters.activeFilter === 'oldest' ? 'Oldest First' :
                       filters.activeFilter === 'highest' ? 'Highest Amount' :
                       'Lowest Amount'}
                    </span>
                    <i className={`fas fa-chevron-${filters.showFilterDropdown ? 'up' : 'down'} filter-arrow`}></i>
                  </button>

                  {filters.showFilterDropdown && (
                    <div className="filter-dropdown-menu">
                      <button
                        className={`filter-option ${filters.activeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => { handleFilterChange('activeFilter', 'all'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                      >
                        <i className="fas fa-list"></i>
                        <span>All Receipts</span>
                        {filters.activeFilter === 'all' && <i className="fas fa-check filter-check"></i>}
                      </button>
                      <button
                        className={`filter-option ${filters.activeFilter === 'latest' ? 'active' : ''}`}
                        onClick={() => { handleFilterChange('activeFilter', 'latest'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                      >
                        <i className="fas fa-arrow-down"></i>
                        <span>Latest First</span>
                        {filters.activeFilter === 'latest' && <i className="fas fa-check filter-check"></i>}
                      </button>
                      <button
                        className={`filter-option ${filters.activeFilter === 'oldest' ? 'active' : ''}`}
                        onClick={() => { handleFilterChange('activeFilter', 'oldest'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                      >
                        <i className="fas fa-arrow-up"></i>
                        <span>Oldest First</span>
                        {filters.activeFilter === 'oldest' && <i className="fas fa-check filter-check"></i>}
                      </button>
                      <button
                        className={`filter-option ${filters.activeFilter === 'highest' ? 'active' : ''}`}
                        onClick={() => { handleFilterChange('activeFilter', 'highest'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                      >
                        <i className="fas fa-sort-amount-down"></i>
                        <span>Highest Amount</span>
                        {filters.activeFilter === 'highest' && <i className="fas fa-check filter-check"></i>}
                      </button>
                      <button
                        className={`filter-option ${filters.activeFilter === 'lowest' ? 'active' : ''}`}
                        onClick={() => { handleFilterChange('activeFilter', 'lowest'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                      >
                        <i className="fas fa-sort-amount-up"></i>
                        <span>Lowest Amount</span>
                        {filters.activeFilter === 'lowest' && <i className="fas fa-check filter-check"></i>}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="action-buttons" ref={exportDropdownRef}>
                <button
                  className="btn-icon export-btn"
                  title="Export Receipts"
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
                    <button type="button" className="export-option" onClick={handleExportExcel}>
                      <i className="fas fa-file-excel"></i>
                      <span>Download Excel</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Receipts Table */}
          <div className="receipts-table-section">
            <div className="receipts-table-container">
              <table className="receipts-table">
                <thead>
              <tr>
                <th><i className="fas fa-hashtag"></i> RECEIPT ID</th>
                <th><i className="fas fa-receipt"></i> RECEIPT NUMBER</th>
                <th><i className="fas fa-exchange-alt"></i> TRANSACTION</th>
                <th><i className="fas fa-user"></i> PAYER NAME</th>
                <th><i className="fas fa-money-bill"></i> AMOUNT</th>
                <th><i className="fas fa-calendar"></i> ISSUE DATE</th>
                <th><i className="fas fa-cog"></i> ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {sortedReceipts.length > 0 ? (
                currentReceipts.map((receipt) => {
                  const transaction = transactions.find(tx => tx.id === receipt.transaction_id);
                  return (
                    <tr 
                      key={receipt.id} 
                      className={`table-row clickable-row ${openActionMenu === receipt.id ? 'row-active-menu' : ''}`}
                      onClick={(e) => {
                        // Don't trigger if clicking on action buttons
                        if (!e.target.closest('.action-cell')) {
                          viewReceiptDetails(receipt);
                        }
                      }}
                    >
                      <td>
                        <div className="cell-content">
                          <span className="receipt-id">#{receipt.id}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-content">
                          <span className="receipt-number">{receipt.receipt_number}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-content">
                          <span className="transaction-ref">#{receipt.transaction_id}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-content">
                          <div className="payer-info">
                            {/* <div className="payer-avatar">
                              <i className="fas fa-user"></i>
                            </div> */}
                            <span className="payer-name">{receipt.payer_name}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="cell-content">
                          <span className={`amount ${transaction?.type === 'Disbursement' || (transaction?.amount && transaction.amount < 0) ? 'amount-negative' : 'amount-positive'}`}>
                            {transaction?.type === 'Disbursement' || (transaction?.amount && transaction.amount < 0) ? '-' : ''}₱{transaction ? Math.abs(parseFloat(transaction.amount || 0)).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-content">
                          <span className="issue-date">
                            {new Date(receipt.issued_at || receipt.created_at).toLocaleDateString()}
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
                                  setOpenActionMenu(openActionMenu === receipt.id ? null : receipt.id);
                                }}
                                title="Actions"
                              >
                                <i className="fas fa-ellipsis-v"></i>
                              </button>
                              {openActionMenu === receipt.id && (
                                <div className="action-dropdown-menu">
                                  <button 
                                    className="action-dropdown-item danger"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setReceiptToDelete(receipt);
                                      setShowDeleteModal(true);
                                      setOpenActionMenu(null);
                                    }}
                                  >
                                    <i className="fas fa-trash"></i>
                                    <span>Delete Receipt</span>
                                  </button>
                                  <button 
                                    className="action-dropdown-item"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      viewReceiptDetails(receipt);
                                      setTimeout(() => printReceipt(), 500);
                                      setOpenActionMenu(null);
                                    }}
                                  >
                                    <i className="fas fa-print"></i>
                                    <span>Print Receipt</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
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
        {sortedReceipts.length > 0 && (
          <div className="table-pagination">
            <div className="pagination-info">
              Showing {displayStart}-{displayEnd} of {totalReceipts} receipts
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
                disabled={currentPage === totalPages || totalReceipts === 0}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

      {/* Confirmation Modal */}
      {showIssueModal && (
        <div className="modal-overlay confirmation-overlay" onClick={() => setShowIssueModal(false)}>
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
                disabled={mutationLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-btn"
                onClick={confirmIssueReceipt}
                disabled={mutationLoading}
              >
                {mutationLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i> Confirm Issue
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Receipt Modal - Print Optimized Design */}
      {showReceiptModal && receiptResult && (
        <div className="modal-overlay" onClick={() => setShowReceiptModal(false)}>
          <div className="receipt-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-actions-bar">
              <button className="modal-close" onClick={() => setShowReceiptModal(false)}>
                <i className="fas fa-times"></i>
              </button>
              <button className="print-btn" onClick={printReceipt}>
                <i className="fas fa-print"></i> Print
              </button>
            </div>
            
            {/* Official Receipt Document - Print Optimized */}
            <div className="receipt-print-area" id="receipt-document">
              {/* Header */}
              <div className="official-receipt-header">
                <div className="receipt-top-bar">
                  
                </div>
                
                <div className="receipt-title-section">
                  <div className="receipt-logos">
                    <div className="logo-image left-logo" aria-hidden="true"></div>
                    <div className="receipt-title-content" aria-hidden="true"></div>
                    <div className="logo-image right-logo" aria-hidden="true"></div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="official-receipt-body">
                <div className="receipt-center-logos" aria-hidden="true">
                  <div className="center-logo-container"></div>
                </div>

                {/* Payer Information */}
                <div className="receipt-payer-info" style={{ marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                  <p style={{ fontSize: '12px', marginBottom: '8px' }}>
                    <strong>RECEIVED FROM:</strong> {receiptResult.payerName || 'N/A'}
                  </p>
                  <p style={{ fontSize: '11px', marginBottom: '5px' }}>
                    <strong>DATE:</strong> {new Date(receiptResult.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                {/* Fund Account Information */}
                {(() => {
                  const transaction = transactions.find(tx => tx.id.toString() === receiptResult.transactionId);
                  const allocationItems = transaction?.fund_allocations || transaction?.fundAccounts || transaction?.allocations;
                  if (!allocationItems || allocationItems.length === 0) return null;

                  return (
                    <div className="receipt-fund-info">
                      <p className="fund-label">FUND ACCOUNTS USED:</p>
                      <div className="fund-items-grid single-column">
                        {allocationItems.map((item, idx) => (
                          <div key={idx} className="fund-item-row">
                            <span className="fund-name">{item.name || item.fundAccountName || `Fund ${idx + 1}`}</span>
                            <span className="fund-amount">
                              {parseFloat(item.amount || item.allocatedAmount || 0).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Empty space for watermark visibility */}
                <div className="receipt-body-spacer"></div>

                {/* Total Amount - Bottom Right */}
                {(() => {
                  const transaction = transactions.find(tx => tx.id.toString() === receiptResult.transactionId);
                  const amount = transaction ? parseFloat(transaction.amount || 0) : 0;
                  return (
                    <>
                      <div className="receipt-total-right">
                        <span className="total-label-bold">TOTAL:</span>
                        <span className="total-amount-bold">PHP{amount.toFixed(2)}</span>
                      </div>

                      {/* Amount in Words - Bold */}
                      <div className="amount-words-bold">
                        {numberToWords(amount)} PESOS ONLY
                      </div>
                    </>
                  );
                })()}

                {/* Description */}
                {(() => {
                  const transaction = transactions.find(tx => tx.id.toString() === receiptResult.transactionId);
                  return transaction?.description ? (
                    <div className="receipt-description-box">
                      <p className="description-label-receipt">Description:</p>
                      <p className="description-text-receipt">{transaction.description}</p>
                    </div>
                  ) : null;
                })()}

                {(user?.name || user?.role) && (
                  <div className="receipt-issued-by">
                    <p className="issued-by-name">
                      {user?.name || 'N/A'}
                      {user?.role ? ` • ${user.role}` : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Transaction Selection Modal */}
      {showTransactionModal && (
        <div className="modal-overlay" onClick={() => setShowTransactionModal(false)}>
          <div className="transaction-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header transaction-modal-header">
              <h3><i className="fas fa-search"></i> Select Collection Transaction</h3>
              <div className="transaction-count"> 
                    Showing {filteredTransactions.length} of {transactions.length} transactions
                  </div>
              <button className="modal-close" onClick={() => setShowTransactionModal(false)}>
                Ã—
              </button>
            </div>
            
            <div className="modal-search-section">
              <div className="search-input-container">
                
                <input
                  type="text"
                  placeholder="Search by ID, description, recipient, amount, department..."
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  className="transaction-search-input"
                  autoFocus
                />
                {transactionSearch && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setTransactionSearch("")}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="modal-body">
              <div className="transaction-list">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`transaction-item ${formData.transactionId === transaction.id.toString() ? 'selected' : ''}`}
                      onClick={() => selectTransaction(transaction)}
                    >
                      <div className="transaction-main-info">
                        <div className="transaction-id">
                          <i className="fas fa-hashtag"></i>
                          <span>#{transaction.id}</span>
                        </div>
                        <div className={`transaction-amount ${parseFloat(transaction.amount || 0) < 0 ? 'negative' : 'positive'}`}>
                          <span>{parseFloat(transaction.amount || 0).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="transaction-details">
                        <div className="transaction-description">
                          <i className="fas fa-file-alt"></i>
                          <span>{transaction.description || 'Collection Transaction'}</span>
                        </div>
                        <div className="transaction-recipient">
                          <i className="fas fa-user"></i>
                          <span>{transaction.recipient || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="transaction-meta">
                        <div className="transaction-department">
                          <i className="fas fa-building"></i>
                          <span>{transaction.department || 'N/A'}</span>
                        </div>
                        <div className="transaction-category">
                          <i className="fas fa-tag"></i>
                          <span>{transaction.category || 'N/A'}</span>
                        </div>
                        <div className="transaction-date">
                          <i className="fas fa-calendar"></i>
                          <span>{new Date(transaction.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {formData.transactionId === transaction.id.toString() && (
                        <div className="selected-indicator">
                          <i className="fas fa-check-circle"></i>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-transactions">
                    <i className="fas fa-search"></i>
                    <p>No transactions found matching your search.</p>
                    {transactionSearch && (
                      <button
                        type="button"
                        className="clear-search-link"
                        onClick={() => setTransactionSearch("")}
                      >
                        Clear search to see all transactions
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          
          </div>
        </div>
      )}

      {/* Issue New Receipt Modal */}
      {showIssueFormModal && (
        <div
          className={`modal-overlay ${showIssueModal ? 'issue-modal-underlay' : ''}`}
          onClick={() => setShowIssueFormModal(false)}
        >
          <div className="modal issue-receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-black">
              <h4><i className="fas fa-plus-circle"></i> Issue New Receipt</h4>
              <button 
                type="button" 
                onClick={() => setShowIssueFormModal(false)}
                className="close-button"
              >
                Ã—
              </button>
            </div>

            <form onSubmit={handleSubmit} className="receipt-form-modal">
              <div className="modal-body-form">
                <div className="form-group">
                  <label>Select Collection Transaction *</label>
                  <div className="recipient-account-searchable-select" ref={transactionDropdownRef}>
                    <div className="recipient-account-search-wrapper-main">
                      <input
                        type="text"
                        className="recipient-account-search-input-main"
                        placeholder="Search collection transactions..."
                        value={transactionDisplayValue}
                        onChange={(e) => {
                          setTransactionSearchInput(e.target.value);
                          setShowTransactionDropdown(true);
                        }}
                        onFocus={() => setShowTransactionDropdown(true)}
                        style={{ width: '100%', height: '42px', padding: '12px 16px', boxSizing: 'border-box' }}
                      />
                      <i className="fas fa-search recipient-account-search-icon-main"></i>
                      {formData.transactionId && (
                        <button
                          type="button"
                          className="recipient-account-clear-btn-main"
                          onClick={() => handleTransactionSelect('')}
                          title="Clear selection"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                    {showTransactionDropdown && (
                      <div className="transaction-dropdown-box">
                        {filteredTransactionsForDropdown.length > 0 ? (
                          filteredTransactionsForDropdown.map((tx) => (
                            <div
                              key={tx.id}
                              className="transaction-dropdown-item"
                              onClick={() => handleTransactionSelect(tx.id.toString())}
                            >
                              <div className="transaction-item-left">
                                <span className="transaction-id">#{tx.id}</span>
                                <span className="transaction-description">{tx.description || tx.recipient || 'Collection'}</span>
                              </div>
                              <div className="transaction-item-right">
                                <span className="transaction-amount">{parseFloat(tx.amount || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="transaction-dropdown-item no-results">
                            <span>No collection transactions found</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <small className="field-hint">
                    <i className="fas fa-info-circle"></i>
                    Selecting a transaction will auto-fill payer name and receipt number.
                  </small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Payer Name *
                      {formData.transactionId && <span className="auto-filled-badge">Auto-filled</span>}
                    </label>
                    <input
                      type="text"
                      placeholder={formData.transactionId ? "Auto-filled from transaction" : "Enter payer name"}
                      value={formData.payerName}
                      onChange={(e) => {
                        handleInputChange('payerName', e.target.value);
                        validatePowerName(e.target.value);
                      }}
                      required
                      className={powerNameError ? 'error' : ''}
                      style={{ 
                        width: '100%', 
                        height: '42px', 
                        padding: '12px 16px', 
                        boxSizing: 'border-box',
                        ...(formData.transactionId && formData.payerName ? {
                          backgroundColor: '#f0f9ff',
                          borderColor: '#3b82f6'
                        } : {})
                      }}
                    />
                    {powerNameError && (
                      <div className="error-message">
                        <i className="fas fa-exclamation-circle"></i>
                        {powerNameError}
                      </div>
                    )}
                    <small className="field-hint">
                      <i className="fas fa-info-circle"></i>
                      {formData.transactionId
                        ? "Auto-filled from the selected transaction. You can modify if needed."
                        : "Enter the payer name if no transaction is selected."}
                    </small>
                  </div>
                  <div className="form-group">
                    <label>Receipt Number</label>
                    <input
                      type="text"
                      placeholder=""
                      value={formData.receiptNumber}
                      onChange={(e) => handleInputChange('receiptNumber', e.target.value)}
                      required
                      readOnly
                      className="auto-generated-field"
                      style={{ width: '100%', height: '42px', padding: '12px 16px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Issue Date</label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => handleInputChange('issueDate', e.target.value)}
                    style={{ width: '100%', height: '42px', padding: '12px 16px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="modal-footer-form">
                <button
                  type="submit"
                  className="submit-btn issue-receipt-btn"
                  disabled={powerNameError}
                >
                  <i className="fas fa-receipt"></i> Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
        <Deletion
          isOpen={showDeleteModal && !!receiptToDelete}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={deleteReceipt}
          loading={mutationLoading}
          title="CONFIRM DELETION"
          message="Are you sure you want to delete this receipt? This action cannot be undone and will permanently remove all associated data."
          itemDetails={receiptToDelete ? [
            { label: "Receipt Number", value: receiptToDelete.receipt_number },
            { label: "Payer Name", value: receiptToDelete.payer_name },
            { label: "Transaction ID", value: `#${receiptToDelete.transaction_id}` }
          ] : []}
          confirmText="Delete"
          cancelText="Cancel"
        />
    </div>
  );
};


export default IssueReceipt;





