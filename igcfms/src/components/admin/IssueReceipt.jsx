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
  
  // Chart refs
  const monthlyChartRef = useRef(null);
  const distributionChartRef = useRef(null);
  const monthlyChartInstance = useRef(null);
  const distributionChartInstance = useRef(null);
  
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
    searchTerm: ""
  });

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptResult, setReceiptResult] = useState(null);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  const API_BASE = "http://localhost:8000/api";
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchInitialData();
  }, [token]);

  useEffect(() => {
    applyFilters();
  }, [receipts, filters]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, transactionSearch]);

  useEffect(() => {
    if (receipts.length > 0) {
      generateAnalyticsData();
    }
  }, [receipts, transactions]);

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

      // Enhanced monthly trend data (last 12 months for better insights)
      const monthlyData = {};
      const last12Months = [];
      const now = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        last12Months.push({ key: monthKey, label: monthLabel, date });
        monthlyData[monthKey] = { count: 0, amount: 0, receipts: [] };
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
        const monthKey = `${receiptDate.getFullYear()}-${String(receiptDate.getMonth() + 1).padStart(2, '0')}`;
        const transaction = transactions.find(t => t.id === receipt.transaction_id);
        const amount = transaction ? parseFloat(transaction.amount || 0) : 0;
        
        // Monthly data
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].count += 1;
          monthlyData[monthKey].amount += amount;
          monthlyData[monthKey].receipts.push(receipt);
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

      // Enhanced monthly trend with growth indicators
      const monthlyTrend = last12Months.map((month, index) => {
        const data = monthlyData[month.key];
        const prevData = index > 0 ? monthlyData[last12Months[index - 1].key] : null;
        const growth = prevData && prevData.amount > 0 
          ? ((data.amount - prevData.amount) / prevData.amount) * 100 
          : 0;

        return {
          month: month.label,
          shortMonth: month.label.substring(0, 3),
          count: data.count,
          amount: data.amount,
          growth,
          isCurrentMonth: month.date.getMonth() === currentMonth && month.date.getFullYear() === currentYear
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
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
      
      distributionChartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: analyticsData.payerDistribution.map(d => d.name),
          datasets: [{
            label: 'Receipts by Payer',
            data: analyticsData.payerDistribution.map(d => d.count),
            backgroundColor: colors.slice(0, analyticsData.payerDistribution.length),
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverBorderWidth: 3,
            hoverOffset: 8
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
            <i className="fas fa-receipt"></i> Total Receipt
          </h1>
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

      {/* Analytics Cards Section - New Layout */}
      <div className="analytics-cards-section">
        <div className="analytics-cards-container">
          <div className="analytics-cards-grid">

            
            {/* Enhanced Stats Row */}
            <div className="stats-row">
              <div className="analytics-card stats-card">
                <div className="card-content">
                  {analyticsData.isLoading ? (
                    <div className="loading-indicator">
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <>
                      <div className="card-value animated-counter">
                        ₱{analyticsData.totalAmount.toLocaleString()}
                      </div>
                      <div className="card-subtitle">
                        {receipts.length} receipts issued
                        {analyticsData.revenueGrowth !== 0 && (
                          <div className={`growth-indicator ${analyticsData.revenueGrowth > 0 ? 'positive' : 'negative'}`}>
                            <i className={`fas fa-arrow-${analyticsData.revenueGrowth > 0 ? 'up' : 'down'}`}></i>
                            {Math.abs(analyticsData.revenueGrowth).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="analytics-card stats-card">
                <div className="card-content">
                  {analyticsData.isLoading ? (
                    <div className="loading-indicator">
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <>
                      <div className="card-value animated-counter">
                        ₱{analyticsData.averageAmount.toLocaleString()}
                      </div>
                      <div className="card-subtitle">
                        Average per receipt
                        <div className="last-updated">
                          <i className="fas fa-clock"></i>
                          Updated {new Date(analyticsData.lastUpdated).toLocaleTimeString()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Enhanced Chart Cards */}
            <div className="chart-cards">
              <div className="analytics-card chart-card">
                <div className="card-content">
                  <div className="chart-header-info">
                    <h4 className="chart-title">Revenue Trend Analysis</h4>
                    <div className="chart-meta">
                      <span className="data-points">{analyticsData.monthlyTrend.length} months</span>
                      {analyticsData.revenueGrowth !== 0 && (
                        <span className={`trend-badge ${analyticsData.revenueGrowth > 0 ? 'positive' : 'negative'}`}>
                          {analyticsData.revenueGrowth > 0 ? '↗' : '↘'} {Math.abs(analyticsData.revenueGrowth).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  {analyticsData.isLoading ? (
                    <div className="chart-loading">
                      <i className="fas fa-chart-line"></i>
                      <span>Loading chart data...</span>
                    </div>
                  ) : analyticsData.error ? (
                    <div className="chart-error">
                      <i className="fas fa-exclamation-triangle"></i>
                      <span>Failed to load chart</span>
                    </div>
                  ) : (
                    <div className="mini-chart-wrapper">
                      <canvas ref={monthlyChartRef} id="monthlyChart"></canvas>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="analytics-card chart-card">
                <div className="card-content">
                  <div className="chart-header-info">
                    <h4 className="chart-title">Receipt Distribution</h4>
                    <div className="chart-meta">
                      <span className="data-points">{analyticsData.payerDistribution.length} payers</span>
                      <span className="total-badge">
                        {receipts.length} total receipts
                      </span>
                    </div>
                  </div>
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
                    <div className="mini-chart-wrapper">
                      <canvas ref={distributionChartRef} id="distributionChart"></canvas>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Form Section on the Right */}
          <div className="form-section-container">
            <div className="issue-form-section">
              <div className="form-header">
                <h3><i className="fas fa-plus-circle"></i> Issue New Receipt</h3>
              </div>
              
              <form onSubmit={handleSubmit} className="receipt-form">
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

                <div className="form-actions">
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
        </div>
      </div>


      {/* Modern Filters Section */}
      <div className="modern-filters-section">
        <div className="filters-container">
          <div className="filter-dropdown">
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="modern-select"
            >
              <option value="all">Status</option>
              <option value="recent">Recent (Last 7 days)</option>
            </select>
            <i className="fas fa-chevron-down dropdown-icon"></i>
          </div>

          <div className="filter-dropdown">
            <input 
              type="date" 
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="modern-date-input"
              placeholder="Date From"
            />
            <i className="fas fa-chevron-down dropdown-icon"></i>
          </div>

          <div className="filter-dropdown">
            <input 
              type="date" 
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="modern-date-input"
              placeholder="Date To"
            />
            <i className="fas fa-chevron-down dropdown-icon"></i>
          </div>

          <div className="filter-dropdown search-filter">
            <input 
              type="text" 
              placeholder="Search"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="modern-search-input"
            />
            <i className="fas fa-search search-icon"></i>
          </div>

          <button className="export-btn">
            <i className="fas fa-download"></i>
            Export
          </button>
        </div>
      </div>

      {/* Modern Receipts Table */}
      <div className="modern-receipts-section">
        <div className="modern-table-container">
          <table className="modern-receipts-table">
            <thead>
              <tr>
                <th>
                  <div className="table-header sortable" onClick={() => handleSort('id')}>
                    <span>RECEIPT ID</span>
                    <i className={`fas fa-sort${sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '-up' : '-down') : ''}`}></i>
                  </div>
                </th>
                <th>
                  <div className="table-header sortable" onClick={() => handleSort('receipt_number')}>
                    <span>RECEIPT NUMBER</span>
                    <i className={`fas fa-sort${sortConfig.key === 'receipt_number' ? (sortConfig.direction === 'asc' ? '-up' : '-down') : ''}`}></i>
                  </div>
                </th>
                <th>
                  <div className="table-header sortable" onClick={() => handleSort('transaction_id')}>
                    <span>TRANSACTION</span>
                    <i className={`fas fa-sort${sortConfig.key === 'transaction_id' ? (sortConfig.direction === 'asc' ? '-up' : '-down') : ''}`}></i>
                  </div>
                </th>
                <th>
                  <div className="table-header sortable" onClick={() => handleSort('payer_name')}>
                    <span>PAYER NAME</span>
                    <i className={`fas fa-sort${sortConfig.key === 'payer_name' ? (sortConfig.direction === 'asc' ? '-up' : '-down') : ''}`}></i>
                  </div>
                </th>
                <th>
                  <div className="table-header sortable" onClick={() => handleSort('amount')}>
                    <span>AMOUNT</span>
                    <i className={`fas fa-sort${sortConfig.key === 'amount' ? (sortConfig.direction === 'asc' ? '-up' : '-down') : ''}`}></i>
                  </div>
                </th>
                <th>
                  <div className="table-header sortable" onClick={() => handleSort('issued_at')}>
                    <span>ISSUE DATE</span>
                    <i className={`fas fa-sort${sortConfig.key === 'issued_at' ? (sortConfig.direction === 'asc' ? '-up' : '-down') : ''}`}></i>
                  </div>
                </th>
                <th>
                  <div className="table-header">
                    <span>ACTIONS</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {getSortedReceipts().length > 0 ? (
                getSortedReceipts().map((receipt) => {
                  const transaction = transactions.find(tx => tx.id === receipt.transaction_id);
                  return (
                    <tr key={receipt.id} className="table-row">
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
                          <span className="amount">
                            ₱{transaction ? parseFloat(transaction.amount || 0).toLocaleString() : 'N/A'}
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
                      <td>
                        <div className="cell-content">
                          <div className="action-buttons">
                            <button 
                              className="action-btn view-btn"
                              onClick={() => viewReceiptDetails(receipt)}
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button 
                              className="action-btn edit-btn"
                              onClick={() => {
                                // Edit functionality can be added here
                                console.log('Edit receipt:', receipt.id);
                              }}
                              title="Edit Receipt"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => {
                                // Delete functionality can be added here
                                if (window.confirm('Are you sure you want to delete this receipt?')) {
                                  console.log('Delete receipt:', receipt.id);
                                }
                              }}
                              title="Delete Receipt"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                            <button 
                              className="action-btn print-btn"
                              onClick={() => {
                                viewReceiptDetails(receipt);
                                setTimeout(() => printReceipt(), 500);
                              }}
                              title="Print Receipt"
                            >
                              <i className="fas fa-print"></i>
                            </button>
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
            <div className="modal-header">
              <h3><i className="fas fa-search"></i> Select Collection Transaction</h3>
              <button className="modal-close" onClick={() => setShowTransactionModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-search-section">
              <div className="search-input-container">
                <i className="fas fa-search search-icon"></i>
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
                        <div className="transaction-amount">
                          <i className="fas fa-peso-sign"></i>
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
            
            <div className="modal-footer">
              <div className="transaction-count">
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowTransactionModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueReceipt;
