import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./css/issuereceipt.css";

// Import Chart.js properly
import Chart from 'chart.js/auto';

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
  
  // Chart refs
  const monthlyChartRef = useRef(null);
  const distributionChartRef = useRef(null);
  const receiptsCountChartRef = useRef(null);
  const monthlyChartInstance = useRef(null);
  const distributionChartInstance = useRef(null);
  const receiptsCountChartInstance = useRef(null);
  
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
    searchTerm: "",
    showFilterDropdown: false,
    sortBy: "latest" // latest, oldest, highest, lowest
  });

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showIssueFormModal, setShowIssueFormModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptResult, setReceiptResult] = useState(null);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [trendPeriod, setTrendPeriod] = useState("month"); // week, month, year
  const [editFormData, setEditFormData] = useState({
    id: null,
    payerName: "",
    receiptNumber: "",
    issueDate: "",
    transactionId: ""
  });

  const API_BASE = "http://localhost:8000/api";
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchInitialData();
  }, [token]);

  useEffect(() => {
    applyFilters();
  }, [filters, receipts]);

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
      if (distributionChartInstance.current) {
        distributionChartInstance.current.destroy();
      }
      if (receiptsCountChartInstance.current) {
        receiptsCountChartInstance.current.destroy();
      }
    };
  }, [analyticsData]);

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

    // Sort filter
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        if (filters.sortBy === 'latest') {
          // Latest to oldest by date
          return new Date(b.issued_at || b.created_at) - new Date(a.issued_at || a.created_at);
        } else if (filters.sortBy === 'oldest') {
          // Oldest to latest by date
          return new Date(a.issued_at || a.created_at) - new Date(b.issued_at || b.created_at);
        } else if (filters.sortBy === 'highest') {
          // Highest to lowest amount
          const amountA = transactions.find(t => t.id === a.transaction_id)?.amount || 0;
          const amountB = transactions.find(t => t.id === b.transaction_id)?.amount || 0;
          return parseFloat(amountB) - parseFloat(amountA);
        } else if (filters.sortBy === 'lowest') {
          // Lowest to highest amount
          const amountA = transactions.find(t => t.id === a.transaction_id)?.amount || 0;
          const amountB = transactions.find(t => t.id === b.transaction_id)?.amount || 0;
          return parseFloat(amountA) - parseFloat(amountB);
        }
        return 0;
      });
    }

    setFilteredReceipts(filtered);
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    if (transactionSearch.trim()) {
      const searchLower = transactionSearch.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.id.toString().includes(searchLower) ||
        tx.description?.toLowerCase().includes(searchLower) ||
        tx.recipient?.toLowerCase().includes(searchLower) ||
        tx.amount?.toString().includes(searchLower) ||
        tx.department?.toLowerCase().includes(searchLower) ||
        tx.category?.toLowerCase().includes(searchLower)
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

  const openTransactionModal = () => {
    setTransactionSearch("");
    setFilteredTransactions(transactions);
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
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const payload = {
        payer_name: editFormData.payerName.trim(),
        receipt_number: editFormData.receiptNumber.trim(),
        issued_at: editFormData.issueDate
      };

      await axios.put(`${API_BASE}/receipts/${editFormData.id}`, payload, { headers });
      
      showMessage('Receipt updated successfully!', 'success');
      setShowEditModal(false);
      fetchInitialData(); // Refresh data
    } catch (err) {
      console.error('Error updating receipt:', err);
      showMessage(err.response?.data?.message || 'Failed to update receipt.', 'error');
    } finally {
      setLoading(false);
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
    if (distributionChartInstance.current) {
      distributionChartInstance.current.destroy();
    }
    if (receiptsCountChartInstance.current) {
      receiptsCountChartInstance.current.destroy();
    }

    // Enhanced Revenue Trend Chart
    if (monthlyChartRef.current) {
      const ctx = monthlyChartRef.current.getContext('2d');
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, 200);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');

      monthlyChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: analyticsData.monthlyTrend.map(d => d.shortMonth),
          datasets: [{
            label: 'Revenue (₱)',
            data: analyticsData.monthlyTrend.map(d => d.amount),
            borderColor: '#3b82f6',
            backgroundColor: gradient,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: analyticsData.monthlyTrend.map(d => d.isCurrentMonth ? '#10b981' : '#3b82f6'),
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: analyticsData.monthlyTrend.map(d => d.isCurrentMonth ? 6 : 4),
            pointHoverRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 2000,
            easing: 'easeInOutQuart'
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: '#3b82f6',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: false,
              titleFont: { size: 12, weight: 'bold' },
              bodyFont: { size: 11 },
              callbacks: {
                title: (context) => context[0].label,
                label: (context) => {
                  const dataPoint = analyticsData.monthlyTrend[context.dataIndex];
                  const growth = dataPoint.growth;
                  const growthText = growth > 0 ? `↗ +${growth.toFixed(1)}%` : growth < 0 ? `↘ ${growth.toFixed(1)}%` : '→ 0%';
                  return [
                    `Revenue: ₱${context.parsed.y.toLocaleString()}`,
                    `Receipts: ${dataPoint.count}`,
                    `Growth: ${growthText}`
                  ];
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              display: false,
              grid: {
                display: false
              }
            },
            x: {
              display: false,
              grid: {
                display: false
              }
            }
          },
          elements: {
            point: {
              hoverBorderWidth: 3
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });
    }

    // Enhanced Receipt Distribution Chart
    if (distributionChartRef.current && analyticsData.payerDistribution.length) {
      const ctx = distributionChartRef.current.getContext('2d');
      const colors = ['#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db'];
      
      distributionChartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: analyticsData.payerDistribution.map(d => d.name),
          datasets: [{
            label: 'Receipts by Payer',
            data: analyticsData.payerDistribution.map(d => d.count),
            backgroundColor: colors.slice(0, analyticsData.payerDistribution.length),
            borderColor: '#ffffff',
            borderWidth: 3,
            hoverBorderWidth: 4,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '60%',
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1500,
            easing: 'easeInOutQuart'
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: '#3b82f6',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: true,
              titleFont: { size: 12, weight: 'bold' },
              bodyFont: { size: 11 },
              callbacks: {
                title: (context) => context[0].label,
                label: (context) => {
                  const dataPoint = analyticsData.payerDistribution[context.dataIndex];
                  return [
                    `Receipts: ${dataPoint.count}`,
                    `Amount: ₱${dataPoint.amount.toLocaleString()}`,
                    `Share: ${dataPoint.percentage}%`
                  ];
                }
              }
            }
          },
          interaction: {
            intersect: false
          },
          onHover: (event, activeElements) => {
            event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
          }
        }
      });
    }

    // Monthly Receipts Count Chart (Multi-Line Business Intelligence Dashboard)
    if (receiptsCountChartRef.current) {
      const ctx = receiptsCountChartRef.current.getContext('2d');
      
      // Professional color palette for business analytics
      const colors = {
        navy: '#001F3F',      // Deep navy blue
        orange: '#FF851B',    // Burnt orange
        teal: '#39CCCC'       // Teal
      };
      
      // Calculate cumulative and average trends for multi-line display
      const receiptsData = analyticsData.monthlyTrend.map(d => d.count);
      const amountData = analyticsData.monthlyTrend.map(d => Math.round(d.amount / 1000)); // In thousands
      
      // Calculate moving average (smoothed trend)
      const movingAverage = receiptsData.map((val, idx, arr) => {
        if (idx === 0) return val;
        if (idx === 1) return Math.round((arr[0] + arr[1]) / 2);
        return Math.round((arr[idx - 2] + arr[idx - 1] + arr[idx]) / 3);
      });
      
      receiptsCountChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: analyticsData.monthlyTrend.map(d => d.shortMonth),
          datasets: [
            {
              label: 'Receipts Issued',
              data: receiptsData,
              borderColor: colors.navy,
              backgroundColor: 'transparent',
              borderWidth: 2.5,
              fill: false,
              tension: 0.2, // Slightly angular, realistic data trend
              pointRadius: 5,
              pointHoverRadius: 7,
              pointBackgroundColor: colors.navy,
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointHoverBackgroundColor: colors.navy,
              pointHoverBorderColor: '#ffffff',
              pointHoverBorderWidth: 3,
              shadowOffsetX: 0,
              shadowOffsetY: 2,
              shadowBlur: 4,
              shadowColor: 'rgba(0, 31, 63, 0.3)'
            },
            {
              label: 'Revenue (₱K)',
              data: amountData,
              borderColor: colors.orange,
              backgroundColor: 'transparent',
              borderWidth: 2.5,
              fill: false,
              tension: 0.2,
              pointRadius: 5,
              pointHoverRadius: 7,
              pointBackgroundColor: colors.orange,
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointHoverBackgroundColor: colors.orange,
              pointHoverBorderColor: '#ffffff',
              pointHoverBorderWidth: 3,
              shadowOffsetX: 0,
              shadowOffsetY: 2,
              shadowBlur: 4,
              shadowColor: 'rgba(255, 133, 27, 0.3)'
            },
            {
              label: 'Trend (3-period MA)',
              data: movingAverage,
              borderColor: colors.teal,
              backgroundColor: 'transparent',
              borderWidth: 2.5,
              fill: false,
              tension: 0.2,
              pointRadius: 5,
              pointHoverRadius: 7,
              pointBackgroundColor: colors.teal,
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointHoverBackgroundColor: colors.teal,
              pointHoverBorderColor: '#ffffff',
              pointHoverBorderWidth: 3,
              borderDash: [5, 3], // Dashed line for trend
              shadowOffsetX: 0,
              shadowOffsetY: 2,
              shadowBlur: 4,
              shadowColor: 'rgba(57, 204, 204, 0.3)'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1800,
            easing: 'easeInOutQuart'
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              align: 'end',
              labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 15,
                font: {
                  size: 11,
                  weight: '600',
                  family: "'Inter', 'Segoe UI', sans-serif"
                },
                color: '#4b5563',
                boxWidth: 8,
                boxHeight: 8
              }
            },
            tooltip: {
              enabled: true,
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              titleColor: '#1f2937',
              bodyColor: '#4b5563',
              borderColor: '#d1d5db',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: true,
              padding: 12,
              titleFont: { 
                size: 12, 
                weight: '700',
                family: "'Inter', 'Segoe UI', sans-serif"
              },
              bodyFont: { 
                size: 11,
                weight: '500',
                family: "'Inter', 'Segoe UI', sans-serif"
              },
              caretSize: 6,
              caretPadding: 10,
              boxPadding: 4,
              usePointStyle: true,
              callbacks: {
                title: (context) => `Week: ${context[0].label}`,
                label: (context) => {
                  const label = context.dataset.label || '';
                  const value = context.parsed.y;
                  if (label.includes('Revenue')) {
                    return `${label}: ₱${value}K`;
                  }
                  return `${label}: ${value}`;
                },
                afterBody: (context) => {
                  const dataPoint = analyticsData.monthlyTrend[context[0].dataIndex];
                  if (dataPoint.amount > 0) {
                    return `\nTotal Amount: ₱${dataPoint.amount.toLocaleString()}`;
                  }
                  return '';
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Receipts Issued',
                color: '#6b7280',
                font: {
                  size: 12,
                  weight: '600',
                  family: "'Inter', 'Segoe UI', sans-serif"
                },
                padding: { top: 0, bottom: 10 }
              },
              ticks: {
                stepSize: 5,
                color: '#9ca3af',
                font: { 
                  size: 11,
                  weight: '500',
                  family: "'Inter', 'Segoe UI', sans-serif"
                },
                padding: 8
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.06)',
                drawBorder: false,
                lineWidth: 1
              },
              border: {
                display: false
              }
            },
            x: {
              title: {
                display: true,
                text: 'Week',
                color: '#6b7280',
                font: {
                  size: 12,
                  weight: '600',
                  family: "'Inter', 'Segoe UI', sans-serif"
                },
                padding: { top: 10, bottom: 0 }
              },
              ticks: {
                color: '#9ca3af',
                font: { 
                  size: 11,
                  weight: '500',
                  family: "'Inter', 'Segoe UI', sans-serif"
                },
                padding: 8
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.04)',
                drawBorder: false,
                lineWidth: 1
              },
              border: {
                display: false
              }
            }
          },
          elements: {
            line: {
              borderCapStyle: 'round',
              borderJoinStyle: 'round'
            },
            point: {
              hoverBorderWidth: 3
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        },
        plugins: [{
          // Custom plugin for subtle line shadows (soft realism)
          beforeDatasetsDraw: (chart) => {
            const ctx = chart.ctx;
            ctx.save();
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 2;
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
          },
          afterDatasetsDraw: (chart) => {
            chart.ctx.restore();
          }
        }]
      });
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

            {/* Box 1: Placeholder */}
            <div className="dashboard-box box-1">
              <div className="box-content box-1-empty">
                <div className="empty-box-placeholder">
                  <i className="fas fa-chart-area"></i>
                  <p>Box 1</p>
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: Receipt Distribution with Top 3 Payers (Top-Right) */}
          <div className="dashboard-box box-2 box-2-dark-theme">
            <div className="box-header box-2-dark-header">
              <h3 className="box-title">Box 2</h3>
              <span className="box-subtitle">TOP 3 PAYERS</span>
            </div>
            <div className="box-content">
              {analyticsData.isLoading ? (
                <div className="chart-loading">
                  <i className="fas fa-chart-pie"></i>
                  <span>Loading distribution...</span>
                </div>
              ) : analyticsData.error ? (
                <div className="chart-error">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>Failed to load chart</span>
                </div>
              ) : (
                <div className="box-2-layout">
                  <div className="box-2-chart-section">
                    <canvas ref={distributionChartRef} id="distributionChart"></canvas>
                  </div>
                  <div className="box-2-payers-section">
                    <h4 className="box-2-payers-title">TOP 3 PAYERS</h4>
                    {analyticsData.payerDistribution.slice(0, 3).map((payer, index) => (
                      <div key={index} className="box-2-payer-row">
                        <div className="box-2-payer-left">
                          <div className={`box-2-badge badge-${index + 1}`}>#{index + 1}</div>
                          <div className="box-2-payer-name" title={payer.fullName}>{payer.fullName}</div>
                        </div>
                        <div className="box-2-payer-right">
                          <span className="box-2-amount">₱{payer.amount.toLocaleString()}</span>
                          <span className="box-2-receipts">{payer.count} receipts</span>
                          <span className="box-2-percentage">{payer.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Box 3: Monthly Issued Receipts Trend (Bottom-Right) */}
          <div className="dashboard-box box-3">
            <div className="box-header">
              <div className="box-title-with-indicator">
                <h3 className="box-title">Box 3</h3>
                <div className="trend-indicator">
                  <span className="indicator-dot"></span>
                  <span className="indicator-text">Live</span>
                </div>
              </div>
              <select 
                value={trendPeriod} 
                onChange={(e) => setTrendPeriod(e.target.value)}
                className="period-selector"
              >
                <option value="hour">Hourly</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
            <div className="box-content">
              {analyticsData.isLoading ? (
                <div className="chart-loading">
                  <i className="fas fa-chart-bar"></i>
                  <span>Loading receipts trend...</span>
                </div>
              ) : analyticsData.error ? (
                <div className="chart-error">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>Failed to load chart</span>
                </div>
              ) : (
                <div className="chart-container-full">
                  <canvas ref={receiptsCountChartRef} id="receiptsCountChart"></canvas>
                </div>
              )}
            </div>
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
                  {filters.sortBy === 'latest' ? 'Latest First' : 
                   filters.sortBy === 'oldest' ? 'Oldest First' : 
                   filters.sortBy === 'highest' ? 'Highest Amount' : 
                   'Lowest Amount'}
                </span>
                <i className={`fas fa-chevron-${filters.showFilterDropdown ? 'up' : 'down'} filter-arrow`}></i>
              </button>
              
              {filters.showFilterDropdown && (
                <div className="filter-dropdown-menu">
                  <div className="filter-section-title">Sort by Date</div>
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
                  
                  <div className="filter-section-title">Sort by Amount</div>
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
                  
                  <div className="filter-section-divider"></div>
                  <div className="filter-section-title">Filter by Status</div>
                  <button
                    className={`filter-option ${filters.status === 'all' ? 'active' : ''}`}
                    onClick={() => { handleFilterChange('status', 'all'); setFilters(prev => ({ ...prev, showFilterDropdown: false })); }}
                  >
                    <i className="fas fa-list"></i>
                    <span>All Receipts</span>
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
          
          <div className="action-buttons">
            <button className="btn-icon export-btn" title="Export Receipts">
              <i className="fas fa-download"></i>
            </button>
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
              {getSortedReceipts().length > 0 ? (
                getSortedReceipts().map((receipt) => {
                  const transaction = transactions.find(tx => tx.id === receipt.transaction_id);
                  return (
                    <tr 
                      key={receipt.id} 
                      className="table-row clickable-row"
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
                            <div className="payer-avatar">
                              <i className="fas fa-user"></i>
                            </div>
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
                                      if (window.confirm('Are you sure you want to delete this receipt?')) {
                                        console.log('Delete receipt:', receipt.id);
                                      }
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
        <div className="modal-overlay" onClick={() => setShowIssueFormModal(false)}>
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
                    />
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
              </div>

              <div className="modal-footer-form">
                <button
                  type="submit"
                  className="submit-btn issue-receipt-btn"
                  disabled={loading || powerNameError}
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
        </div>
      )}

      {/* Edit Receipt Modal */}
      {showEditModal && (
        <div className="edit-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="edit-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h3 className="edit-modal-title">
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
                      type="text"
                      className="edit-form-input"
                      value={editFormData.issueDate ? new Date(editFormData.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
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
                    type="button"
                    className="edit-btn edit-btn-cancel"
                    onClick={() => setShowEditModal(false)}
                  >
                    <i className="fas fa-times"></i>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="edit-btn edit-btn-save"
                    disabled={loading}
                  >
                    {loading ? (
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
      
    </div>
  );
};


export default IssueReceipt;
