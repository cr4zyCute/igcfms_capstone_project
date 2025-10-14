import React, { useState, useEffect, useRef, useMemo } from "react";
import "./css/issuereceipt.css";
import Deletion from '../common/Deletion';
import DisbursementTrends from '../analytics/disbursementAnalytics';
import ReceiptCountAnalytics from '../analytics/receiptCountAnalytics';
import PayerDistributionAnalytics from '../analytics/payerDistributionAnalytics';
import IssueReceiptSkeleton from '../ui/issuerecieptLoading';
import {
  useReceipts,
  useCollectionTransactions,
  useCreateReceipt,
  useUpdateReceipt,
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

  return null;
};

const formatCurrency = (value) => {
  const amount = normalizeAmount(value);
  if (amount === null) {
    return '—';
  }
  return amount.toLocaleString('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
const IssueReceipt = () => {
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
  // Filter states
  const [filters, setFilters] = useState({
    activeFilter: "all", // all, latest, oldest, highest, lowest
    dateFrom: "",
    dateTo: "",
    searchTerm: "",
    showFilterDropdown: false
  });
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showIssueFormModal, setShowIssueFormModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptToDelete, setReceiptToDelete] = useState(null);
  const [receiptResult, setReceiptResult] = useState(null);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [trendPeriod, setTrendPeriod] = useState('month');
  const [disbursementPeriod, setDisbursementPeriod] = useState('week'); // week, month, year
  const [editFormData, setEditFormData] = useState({
    id: null,
    payerName: "",
    receiptNumber: "",
    issueDate: "",
    transactionId: ""
  });
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
  const updateReceiptMutation = useUpdateReceipt();
  const deleteReceiptMutation = useDeleteReceipt();

  const receipts = useMemo(() => receiptsData || [], [receiptsData]);
  const transactions = useMemo(() => collectionTransactions || [], [collectionTransactions]);
  const isInitialLoading = receiptsLoading || transactionsLoading;
  const mutationLoading = createReceiptMutation.isPending || updateReceiptMutation.isPending || deleteReceiptMutation.isPending;

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
        const amountA = transactions.find(t => t.id === a.transaction_id)?.amount || 0;
        const amountB = transactions.find(t => t.id === b.transaction_id)?.amount || 0;
        return parseFloat(amountB) - parseFloat(amountA);
      });
    } else if (filters.activeFilter === 'lowest') {
      // Lowest to highest amount
      filtered.sort((a, b) => {
        const amountA = transactions.find(t => t.id === a.transaction_id)?.amount || 0;
        const amountB = transactions.find(t => t.id === b.transaction_id)?.amount || 0;
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
      activeFilter: "all",
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
    
    return `#${transaction.id} - ₱${parseFloat(transaction.amount || 0).toLocaleString()} - ${transaction.description || 'Collection'} - ${transaction.recipient || 'N/A'}`;
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
    setShowIssueModal(false);

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

  // Print only the receipt content
  const printReceipt = () => {
    const printContent = document.getElementById('receipt-document');
    const originalContent = document.body.innerHTML;
    
    if (printContent) {
      document.body.innerHTML = printContent.outerHTML;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload(); // Reload to restore React functionality
    }
  };

  // Handle edit receipt
  const handleEditReceipt = (receipt) => {
    setEditFormData({
      id: receipt.id,
      payerName: receipt.payer_name || "",
      receiptNumber: receipt.receipt_number || "",
      issueDate: receipt.issued_at ? new Date(receipt.issued_at).toISOString().split('T')[0] : "",
      transactionId: receipt.transaction_id?.toString() || ""
    });
    setSelectedReceipt(receipt);
    setShowEditModal(true);
  };

  // Handle edit form input change
  const handleEditInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Submit edit receipt
  const submitEditReceipt = async () => {
    try {
      const payload = {
        payer_name: editFormData.payerName.trim(),
        receipt_number: editFormData.receiptNumber.trim(),
        issued_at: editFormData.issueDate
      };

      await updateReceiptMutation.mutateAsync({ id: editFormData.id, data: payload });

      showMessage('Receipt updated successfully!', 'success');
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating receipt:', err);
      showMessage(err?.response?.data?.message || err.message || 'Failed to update receipt.', 'error');
    }
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
        'Under ₱1,000': 0,
        '₱1,000 - ₱5,000': 0,
        '₱5,000 - ₱10,000': 0,
        '₱10,000 - ₱50,000': 0,
        'Over ₱50,000': 0
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
        const aTransaction = transactions.find(t => t.id === a.transaction_id);
        const bTransaction = transactions.find(t => t.id === b.transaction_id);
        aValue = aTransaction ? parseFloat(aTransaction.amount || 0) : 0;
        bValue = bTransaction ? parseFloat(bTransaction.amount || 0) : 0;
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
      const transaction = transactions.find((tx) => tx.id === receipt.transaction_id);
      const amount = normalizeAmount(receipt.amount ?? transaction?.amount);
      return sum + (amount ?? 0);
    }, 0);

    const averageAmountValue = totalReceiptsCount > 0 ? totalAmountValue / totalReceiptsCount : 0;

    return {
      totalReceipts: totalReceiptsCount,
      totalAmount: totalAmountValue,
      averageAmount: averageAmountValue,
    };
  }, [sortedReceipts, transactions]);

  const receiptsForExport = useMemo(() => sortedReceipts.map((receipt) => {
    const transaction = transactions.find((tx) => tx.id === receipt.transaction_id);
    const amountValue = normalizeAmount(receipt.amount ?? transaction?.amount) ?? 0;

    return {
      ...receipt,
      amount: amountValue,
      payor: receipt.payer_name || transaction?.recipient || '',
      payer: receipt.payer_name || transaction?.recipient || '',
      payment_method: receipt.payment_method || transaction?.payment_method || '',
      paymentMethod: receipt.paymentMethod || transaction?.payment_method || '',
      cashier: receipt.cashier || transaction?.cashier || '',
      issuedBy: receipt.issued_by || transaction?.cashier || '',
      issue_date: receipt.issued_at || receipt.created_at,
      dateIssued: receipt.issued_at || receipt.created_at,
    };
  }), [sortedReceipts, transactions]);

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

    const headers = ['Receipt ID', 'Receipt Number', 'Transaction', 'Payer Name', 'Amount', 'Issue Date'];
    const rows = sortedReceipts.map((receipt) => {
      const transaction = transactions.find(tx => tx.id === receipt.transaction_id);
      const amountValue = normalizeAmount(receipt.amount ?? transaction?.amount) ?? 0;
      return [
        `#${receipt.id}`,
        receipt.receipt_number,
        `#${receipt.transaction_id}`,
        receipt.payer_name,
        formatCurrency(amountValue),
        new Date(receipt.issued_at || receipt.created_at).toLocaleDateString()
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

  if (isInitialLoading) {
    return <IssueReceiptSkeleton />;
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
              className="btn-issue-new-receipt"
              onClick={() => setShowIssueFormModal(true)}
            >
              <i className="fas fa-plus-circle"></i>
              Issue New Receipt
            </button>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-value">₱{analyticsData.totalAmount.toLocaleString()}</span>
            <span className="stat-label">Total Amount</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{receipts.length}</span>
            <span className="stat-label">Total Receipts</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">₱{analyticsData.averageAmount.toLocaleString()}</span>
            <span className="stat-label">Average Amount</span>
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
      <div className="analytics-dashboard-section">
        {/* 3-Box Grid Layout */}
        <div className="three-box-grid">
          {/* Left Column: Stats Cards + Box 1 */}
          <div className="left-column">
            {/* Top Stats Cards */}
            <div className="left-stats-cards">
              <div className="stat-card-modern">
                <div className="stat-card-content">
                  {analyticsData.isLoading ? (
                    <div className="loading-indicator">
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <>
                      <div className="stat-card-value">₱{analyticsData.totalAmount.toLocaleString()}</div>
                      <div className="stat-card-label">{receipts.length} receipts issued</div>
                      {analyticsData.revenueGrowth !== 0 && (
                        <div className={`stat-growth-badge ${analyticsData.revenueGrowth > 0 ? 'positive' : 'negative'}`}>
                          <i className={`fas fa-arrow-${analyticsData.revenueGrowth > 0 ? 'up' : 'down'}`}></i>
                          {Math.abs(analyticsData.revenueGrowth).toFixed(1)}%
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <div className="stat-card-modern">
                <div className="stat-card-content">
                  {analyticsData.isLoading ? (
                    <div className="loading-indicator">
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <>
                      <div className="stat-card-value">₱{analyticsData.averageAmount.toLocaleString()}</div>
                      <div className="stat-card-label">Average per receipt</div>
                      <div className="stat-card-updated">
                        <i className="fas fa-clock"></i>
                        Updated {new Date(analyticsData.lastUpdated).toLocaleTimeString()}
                      </div>
                    </>
                  )}
                </div>
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
                                    className="action-dropdown-item"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditReceipt(receipt);
                                      setOpenActionMenu(null);
                                    }}
                                  >
                                    <i className="fas fa-edit"></i>
                                    <span>Edit Receipt</span>
                                  </button>
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
              <button className="print-btn" onClick={printReceipt}>
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
                ×
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
                          <span>₱{parseFloat(transaction.amount || 0).toLocaleString()}</span>
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
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="receipt-form-modal">
              <div className="modal-body-form">
                <div className="form-group">
                  <label>Select Collection Transaction *</label>
                  <div className="transaction-selector">
                    <button
                      type="button"
                      className="transaction-select-btn"
                      onClick={openTransactionModal}
                      style={{ width: '100%', height: '42px', padding: '12px 16px' }}
                    >
                      <span className="selected-transaction">
                        {getSelectedTransactionDisplay()}
                      </span>
                      <i className="fas fa-chevron-down"></i>
                    </button>
                    {formData.transactionId && (
                      <button
                        type="button"
                        className="clear-selection-btn"
                        onClick={() => handleInputChange('transactionId', '')}
                        title="Clear Selection"
                        style={{ width: '100%', height: '42px' }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Payer Name *</label>
                    <input
                      type="text"
                      placeholder="Enter payer name"
                      value={formData.payerName}
                      onChange={(e) => {
                        handleInputChange('payerName', e.target.value);
                        validatePowerName(e.target.value);
                      }}
                      required
                      className={powerNameError ? 'error' : ''}
                      style={{ width: '100%', height: '42px', padding: '12px 16px', boxSizing: 'border-box' }}
                    />
                    {powerNameError && (
                      <div className="error-message">
                        <i className="fas fa-exclamation-circle"></i>
                        {powerNameError}
                      </div>
                    )}
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
                  disabled={mutationLoading || powerNameError}
                >
                  {mutationLoading ? (
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
        </div>
      )}

      {/* Edit Receipt Modal */}
      {showEditModal && (
        <div className="edit-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="edit-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h3 style={{ color: 'white' }} className="edit-modal-title">
                <i className="fas fa-edit"></i>
                Edit Receipt
              </h3>
              <button className="edit-modal-close" onClick={() => setShowEditModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="edit-modal-body">
              <form onSubmit={(e) => { e.preventDefault(); submitEditReceipt(); }}>
                {/* 2x2 Grid Form */}
                <div className="edit-form-grid">
                  {/* Payer Name */}
                  <div className="edit-form-field">
                    <label className="edit-form-label">
                      <i className="fas fa-user"></i>
                      Payer Name *
                    </label>
                    <input
                      type="text"
                      className="edit-form-input"
                      placeholder="Enter payer name"
                      value={editFormData.payerName}
                      onChange={(e) => handleEditInputChange('payerName', e.target.value)}
                      required
                    />
                  </div>

                  {/* Receipt Number */}
                  <div className="edit-form-field">
                    <label className="edit-form-label">
                      <i className="fas fa-receipt"></i>
                      Receipt Number
                    </label>
                    <input
                      type="text"
                      className="edit-form-input"
                      value={editFormData.receiptNumber}
                      disabled
                    />
                  </div>

                  {/* Issue Date */}
                  <div className="edit-form-field">
                    <label className="edit-form-label">
                      <i className="fas fa-calendar-alt"></i>
                      Issue Date
                    </label>
                    <input
                      type="date"
                      className="edit-form-input"
                      value={editFormData.issueDate}
                      onChange={(e) => handleEditInputChange('issueDate', e.target.value)}
                      disabled
                    />
                  </div>

                  {/* Transaction ID */}
                  <div className="edit-form-field">
                    <label className="edit-form-label">
                      <i className="fas fa-hashtag"></i>
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      className="edit-form-input"
                      value={`#${editFormData.transactionId}`}
                      disabled
                    />
                  </div>
                </div>

                {/* Receipt Info Card */}
                <div className="edit-info-card">
                  <div className="edit-info-header">
                    <i className="fas fa-info-circle"></i>
                    Current Receipt Information
                  </div>
                  <div className="edit-info-grid">
                    <div className="edit-info-item">
                      <span className="edit-info-label">Receipt ID</span>
                      <span className="edit-info-value">#{selectedReceipt?.id}</span>
                    </div>
                    <div className="edit-info-item">
                      <span className="edit-info-label">Created</span>
                      <span className="edit-info-value">
                        {selectedReceipt?.created_at ? new Date(selectedReceipt.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="edit-info-item">
                      <span className="edit-info-label">Amount</span>
                      <span className="edit-info-value">
                        {(() => {
                          const transaction = transactions.find(t => t.id === selectedReceipt?.transaction_id);
                          return transaction ? `₱${parseFloat(transaction.amount || 0).toLocaleString()}` : 'N/A';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="edit-modal-footer">
                  <button
                    type="submit"
                    className="edit-btn edit-btn-save"
                    disabled={mutationLoading}
                  >
                    {mutationLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
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
