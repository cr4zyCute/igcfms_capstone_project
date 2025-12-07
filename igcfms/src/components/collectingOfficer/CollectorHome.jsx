import React, { useState, useEffect, useRef, useMemo } from "react";
import "./css/collectordashboard.css";
import axios from "axios";
import Chart from 'chart.js/auto';
import PayerDistributionAnalytics from '../analytics/payerDistributionAnalytics';
import ReceiptCountAnalytics from '../analytics/receiptCountAnalytics';
import { useAuth } from '../../contexts/AuthContext';

const CollectorHome = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const categoryChartRef = useRef(null);
  const categoryChartInstance = useRef(null);
  const { user } = useAuth();
  const accountIds = useMemo(() => {
    if (!user) return [];

    const rawIds = [];

    if (Array.isArray(user.assigned_accounts)) {
      user.assigned_accounts.forEach(acc => {
        if (acc?.fund_account_id) rawIds.push(acc.fund_account_id);
        else if (acc?.id) rawIds.push(acc.id);
      });
    }

    if (user.fund_account_id) rawIds.push(user.fund_account_id);
    if (user.fundAccountId) rawIds.push(user.fundAccountId);

    return rawIds
      .map(id => parseInt(id, 10))
      .filter(Number.isFinite);
  }, [user]);
  
  const creatorId = useMemo(() => {
    if (!user) return null;
    const possible = [user.id, user.user_id, user.userId];
    const parsed = possible
      .map(id => parseInt(id, 10))
      .find(Number.isFinite);
    return parsed ?? null;
  }, [user]);

  const [collectionStats, setCollectionStats] = useState({
    todayCollections: 0,
    weeklyCollections: 0,
    monthlyCollections: 0,
    totalCollections: 0,
    pendingReceipts: 0,
    processedReceipts: 0,
    averageCollection: 0,
    topCategory: "",
    yesterdayCollections: 0,
    lastWeekCollections: 0,
    todayTransactionCount: 0,
    weeklyTransactionCount: 0,
    highestDailyCollection: 0,
    collectionGrowth: 0,
  });
  const [recentCollections, setRecentCollections] = useState([]);
  const [collectionsByCategory, setCollectionsByCategory] = useState([]);
  const [collectionsByDepartment, setCollectionsByDepartment] = useState([]);
  const [dailyCollectionTrend, setDailyCollectionTrend] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [activeList, setActiveList] = useState('collections');
  const [receiptStats, setReceiptStats] = useState({
    totalReceiptsIssued: 0,
    totalReceiptAmount: 0,
    averageReceiptAmount: 0,
    todayReceipts: 0,
    weeklyReceipts: 0
  });
  const [payerAnalytics, setPayerAnalytics] = useState({
    payerDistribution: [],
    isLoading: false,
    error: null
  });

  // Auto-slide between tabs every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveList(prev => prev === 'collections' ? 'receipts' : 'collections');
    }, 5000);

    return () => clearInterval(interval);
  }, [accountIds]);

  useEffect(() => {
    const fetchCollectorData = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem('token');
        if (!token) {
          setError("Authentication required. Please log in.");
          setLoading(false);
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        // Fetch transactions (collections only) and receipts
        const [transactionsRes, receiptsRes] = await Promise.all([
          axios.get('/api/transactions', { headers }),
          axios.get('/api/receipts', { headers }).catch(() => ({ data: [] }))
        ]);

        const allTransactions = transactionsRes.data || [];
        const allReceipts = receiptsRes.data || [];

        const filterByAccount = (tx = {}) => {
          if (!Array.isArray(accountIds) || accountIds.length === 0) {
            return true;
          }
          const txAccountId = parseInt(tx.fund_account_id ?? tx.account_id ?? tx.fundAccountId, 10);
          return Number.isFinite(txAccountId) && accountIds.includes(txAccountId);
        };

        const matchesCreator = (obj = {}) => {
          if (!Number.isFinite(creatorId)) return true;
          const candidates = [
            obj.created_by, obj.user_id, obj.issued_by, obj.collector_id, obj.creator_id,
            obj.createdBy, obj.userId, obj.issuedBy, obj.collectorId, obj.creatorId,
            obj.user?.id, obj.creator?.id
          ];
          return candidates
            .map(v => parseInt(v, 10))
            .some(id => Number.isFinite(id) && id === creatorId);
        };

        const filterByCreatorOrRelated = (obj = {}) => {
          if (!Number.isFinite(creatorId)) return true;
          if (matchesCreator(obj)) return true;
          const relatedId = parseInt(obj.transaction_id ?? obj.transactionId, 10);
          if (Number.isFinite(relatedId)) {
            const relatedTx = allTransactions.find(tx => parseInt(tx.id, 10) === relatedId);
            if (relatedTx && matchesCreator(relatedTx)) return true;
          }
          return false;
        };

        // Filter only collection transactions for assigned accounts and created by current user
        const collections = allTransactions
          .filter(tx => tx.type === 'Collection')
          .filter(filterByAccount)
          .filter(filterByCreatorOrRelated);

        // Calculate date ranges
        const today = new Date().toDateString();
        const weekStart = getWeekStart();
        const monthStart = getMonthStart();

        // Calculate collection statistics
        const todayCollections = collections
          .filter(tx => new Date(tx.created_at).toDateString() === today)
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

        const weeklyCollections = collections
          .filter(tx => new Date(tx.created_at) >= weekStart)
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

        const monthlyCollections = collections
          .filter(tx => new Date(tx.created_at) >= monthStart)
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

        const totalCollections = collections
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

        const averageCollection = collections.length > 0 ? totalCollections / collections.length : 0;

        // Receipt statistics
        const relevantReceipts = allReceipts.filter(receipt => {
          // Account constraint
          let accountOk = true;
          if (Array.isArray(accountIds) && accountIds.length > 0) {
            const receiptAccountId = parseInt(receipt.fund_account_id ?? receipt.account_id, 10);
            if (Number.isFinite(receiptAccountId)) {
              accountOk = accountIds.includes(receiptAccountId);
            } else {
              const relatedTransaction = allTransactions.find(tx => tx.id === receipt.transaction_id);
              accountOk = relatedTransaction ? filterByAccount(relatedTransaction) : false;
            }
          }
          // Creator constraint
          const creatorOk = filterByCreatorOrRelated(receipt);
          return accountOk && creatorOk;
        });

        const pendingReceipts = relevantReceipts.filter(receipt => receipt.status === 'pending').length;
        const processedReceipts = relevantReceipts.filter(receipt => receipt.status === 'processed').length;

        // Find top collection category
        const categoryTotals = {};
        collections.forEach(tx => {
          const category = tx.category || 'Other';
          categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(tx.amount || 0);
        });
        const topCategory = Object.keys(categoryTotals).reduce((a, b) => 
          categoryTotals[a] > categoryTotals[b] ? a : b, 'None');

        // Calculate yesterday's collections for comparison
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        const yesterdayCollections = collections
          .filter(tx => new Date(tx.created_at).toDateString() === yesterdayStr)
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

        // Calculate last week's collections for comparison
        const lastWeekStart = new Date(weekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekCollections = collections
          .filter(tx => {
            const txDate = new Date(tx.created_at);
            return txDate >= lastWeekStart && txDate < weekStart;
          })
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

        // Calculate transaction counts
        const todayTransactionCount = collections
          .filter(tx => new Date(tx.created_at).toDateString() === today).length;

        const weeklyTransactionCount = collections
          .filter(tx => new Date(tx.created_at) >= weekStart).length;

        // Find highest daily collection in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dailyTotals = {};
        collections
          .filter(tx => new Date(tx.created_at) >= thirtyDaysAgo)
          .forEach(tx => {
            const dateKey = new Date(tx.created_at).toDateString();
            dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + parseFloat(tx.amount || 0);
          });
        const highestDailyCollection = Math.max(...Object.values(dailyTotals), 0);

        // Calculate growth percentage
        const collectionGrowth = yesterdayCollections > 0 
          ? ((todayCollections - yesterdayCollections) / yesterdayCollections) * 100 
          : 0;

        setCollectionStats({
          todayCollections,
          weeklyCollections,
          monthlyCollections,
          totalCollections,
          pendingReceipts,
          processedReceipts,
          averageCollection,
          topCategory,
          yesterdayCollections,
          lastWeekCollections,
          todayTransactionCount,
          weeklyTransactionCount,
          highestDailyCollection,
          collectionGrowth,
        });

        // Collections by category for charts
        const categoryData = Object.entries(categoryTotals).map(([category, amount]) => ({
          category,
          amount,
          count: collections.filter(tx => (tx.category || 'Other') === category).length
        })).sort((a, b) => b.amount - a.amount);
        setCollectionsByCategory(categoryData);

        // Collections by department
        const departmentTotals = {};
        collections.forEach(tx => {
          const dept = tx.department || 'Unassigned';
          departmentTotals[dept] = (departmentTotals[dept] || 0) + parseFloat(tx.amount || 0);
        });
        const departmentData = Object.entries(departmentTotals).map(([department, amount]) => ({
          department,
          amount,
          count: collections.filter(tx => (tx.department || 'Unassigned') === department).length
        })).sort((a, b) => b.amount - a.amount);
        setCollectionsByDepartment(departmentData);

        // Daily collection trend (last 7 days)
        const dailyTrend = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toDateString();
          
          const dayCollections = collections
            .filter(tx => new Date(tx.created_at).toDateString() === dateStr)
            .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
          
          dailyTrend.push({
            date: date.toLocaleDateString(),
            amount: dayCollections,
            count: collections.filter(tx => new Date(tx.created_at).toDateString() === dateStr).length
          });
        }
        setDailyCollectionTrend(dailyTrend);

        // Recent collections (last 10)
        const recentData = collections
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 10);
        setRecentCollections(recentData);

        // Recent receipts
        const recentReceiptData = relevantReceipts
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 10)
          .map(receipt => {
            const relatedTransaction = allTransactions.find(tx => tx.id === receipt.transaction_id && filterByAccount(tx));
            const amountValue = parseFloat(receipt.amount ?? relatedTransaction?.amount ?? 0);
            return {
              ...receipt,
              amount: amountValue,
            };
          });
        setReceipts(recentReceiptData);

        // Calculate receipt statistics
        const totalReceiptsIssued = relevantReceipts.length;
        
        // Calculate total receipt amount by matching with transactions
        const totalReceiptAmount = relevantReceipts.reduce((sum, receipt) => {
          const transaction = allTransactions.find(tx => tx.id === receipt.transaction_id && filterByAccount(tx));
          return sum + parseFloat(transaction?.amount || 0);
        }, 0);

        const averageReceiptAmount = totalReceiptsIssued > 0 ? totalReceiptAmount / totalReceiptsIssued : 0;

        // Today's receipts
        const todayReceipts = relevantReceipts
          .filter(receipt => new Date(receipt.created_at).toDateString() === today).length;

        // Weekly receipts
        const weeklyReceipts = relevantReceipts
          .filter(receipt => new Date(receipt.created_at) >= weekStart).length;

        setReceiptStats({
          totalReceiptsIssued,
          totalReceiptAmount,
          averageReceiptAmount,
          todayReceipts,
          weeklyReceipts
        });

        // Calculate payer distribution for analytics
        const payerCounts = {};
        const payerAmounts = {};
        
        relevantReceipts.forEach(receipt => {
          const payerName = receipt.payer_name || 'Unknown';
          const transaction = allTransactions.find(tx => tx.id === receipt.transaction_id && filterByAccount(tx));
          const amount = parseFloat(receipt.amount ?? transaction?.amount ?? 0);
          
          payerCounts[payerName] = (payerCounts[payerName] || 0) + 1;
          payerAmounts[payerName] = (payerAmounts[payerName] || 0) + amount;
        });

        const payerDistribution = Object.entries(payerCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 6)
          .map(([name, count]) => ({
            name: name.length > 12 ? name.substring(0, 12) + '...' : name,
            fullName: name,
            count,
            amount: payerAmounts[name] || 0,
            percentage: ((count / allReceipts.length) * 100).toFixed(1)
          }));

        setPayerAnalytics({
          payerDistribution,
          isLoading: false,
          error: null
        });

      } catch (err) {
        console.error('Collector dashboard error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load collector data');
      } finally {
        setLoading(false);
      }
    };

    const getWeekStart = () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const numDaysPastSunday = dayOfWeek === 0 ? 0 : dayOfWeek;
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - numDaysPastSunday);
      weekStart.setHours(0, 0, 0, 0);
      return weekStart;
    };

    const getMonthStart = () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1);
    };

    fetchCollectorData();
  }, []);

  // Initialize pie chart for category collections
  useEffect(() => {
    if (collectionsByCategory.length > 0 && categoryChartRef.current) {
      // Destroy existing chart
      if (categoryChartInstance.current) {
        categoryChartInstance.current.destroy();
      }

      const ctx = categoryChartRef.current.getContext('2d');
      
      // Generate grayscale colors for black and white theme
      const generateGrayscaleColors = (count) => {
        const colors = [];
        const step = 180 / count; // Range from #4a4a4a to #cccccc
        for (let i = 0; i < count; i++) {
          const value = Math.floor(74 + (step * i)); // Start from #4a4a4a (74) to lighter grays
          const hex = value.toString(16).padStart(2, '0');
          colors.push(`#${hex}${hex}${hex}`);
        }
        return colors;
      };

      const colors = generateGrayscaleColors(collectionsByCategory.length);

      categoryChartInstance.current = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: collectionsByCategory.map(cat => cat.category),
          datasets: [{
            data: collectionsByCategory.map(cat => cat.amount),
            backgroundColor: colors,
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: '#000000',
                font: {
                  size: 12,
                  weight: '600'
                },
                padding: 15,
                generateLabels: function(chart) {
                  const data = chart.data;
                  if (data.labels.length && data.datasets.length) {
                    return data.labels.map((label, i) => {
                      const value = data.datasets[0].data[i];
                      const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                      const percentage = ((value / total) * 100).toFixed(1);
                      return {
                        text: `${label} (${percentage}%)`,
                        fillStyle: data.datasets[0].backgroundColor[i],
                        hidden: false,
                        index: i
                      };
                    });
                  }
                  return [];
                }
              }
            },
            tooltip: {
              backgroundColor: '#000000',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: '#333333',
              borderWidth: 1,
              padding: 12,
              displayColors: true,
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ₱${value.toLocaleString()} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }

    return () => {
      if (categoryChartInstance.current) {
        categoryChartInstance.current.destroy();
      }
    };
  }, [collectionsByCategory]);

  if (loading) {
    return (
      <div style={{ padding: '30px' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#000000', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <i className="fas fa-hand-holding-usd"></i> Collecting Officer Dashboard
          </h2>
          <p style={{ fontSize: '14px', color: '#666666', margin: '0' }}>
            Revenue collection management and receipt processing
          </p>
        </div>

        {/* Loading Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} style={{
              background: '#ffffff',
              border: '2px solid #f0f0f0',
              borderRadius: '12px',
              padding: '20px',
              height: '120px',
              animation: 'pulse 1.5s ease-in-out infinite alternate'
            }}>
              <div style={{
                width: '60%',
                height: '16px',
                background: '#e9ecef',
                borderRadius: '4px',
                marginBottom: '12px'
              }}></div>
              <div style={{
                width: '80%',
                height: '32px',
                background: '#e9ecef',
                borderRadius: '6px',
                marginBottom: '8px'
              }}></div>
              <div style={{
                width: '40%',
                height: '12px',
                background: '#e9ecef',
                borderRadius: '3px'
              }}></div>
            </div>
          ))}
        </div>

        {/* Loading Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '25px', marginBottom: '30px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              background: '#ffffff',
              border: '2px solid #f0f0f0',
              borderRadius: '12px',
              padding: '25px'
            }}>
              <div style={{
                height: '300px',
                background: '#f8f9fa',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 1.5s ease-in-out infinite alternate'
              }}>
                <div style={{ color: '#6c757d', fontSize: '16px', textAlign: 'center' }}>
                  <i className="fas fa-chart-bar fa-2x" style={{ marginBottom: '10px', display: 'block' }}></i>
                  Loading Chart...
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayedActivityItems = activeList === 'collections'
    ? recentCollections.slice(0, 5)
    : receipts.slice(0, 5);

  return (
    <div className="collector-page">
      <div className="collector-header">
        <h2 className="collector-title">
          <i className="fas fa-hand-holding-usd"></i> Collecting Officer Dashboard
        </h2>      </div>

      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {/* Primary KPI - Featured Card */}
      <div className="collector-featured-layout">
        <div className="featured-kpi-card">
          <div className="featured-kpi-header">
            <div className="featured-icon">
              <i className="fas fa-calendar-day"></i>
            </div>
            <div className="featured-info">
              <div className="featured-label">Today's Collections</div>
              <div className="featured-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>
          <div className="featured-kpi-body">
            <div className="featured-value">₱{collectionStats.todayCollections.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="featured-stats">
              <div className="featured-stat-item">
                <span className="stat-label">Transactions</span>
                <span className="stat-value">{collectionStats.todayTransactionCount}</span>
              </div>
              <div className="featured-stat-item">
                <span className="stat-label">vs Yesterday</span>
                <span className={`stat-value ${collectionStats.collectionGrowth >= 0 ? 'positive' : 'negative'}`}>
                  {collectionStats.collectionGrowth >= 0 ? '+' : ''}{collectionStats.collectionGrowth.toFixed(1)}%
                  <i className={`fas fa-arrow-${collectionStats.collectionGrowth >= 0 ? 'up' : 'down'}`}></i>
                </span>
              </div>
              <div className="featured-stat-item">
                <span className="stat-label">Yesterday</span>
                <span className="stat-value">₱{collectionStats.yesterdayCollections.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="featured-receipts-card">
          <div className="featured-tabs">
            <button
              className={`tab-button ${activeList === 'collections' ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveList('collections')}
            >
              <i className="fas fa-clipboard-list"></i>
              <span>Recent Activity</span>
            </button>
            <button
              className={`tab-button ${activeList === 'receipts' ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveList('receipts')}
            >
              <i className="fas fa-receipt"></i>
              <span>Recent Receipts</span>
            </button>
          </div>
          <div className="receipts-list">
            {displayedActivityItems.length > 0 ? (
              displayedActivityItems.map((item) => {
                const isCollectionView = activeList === 'collections';
                const identifier = isCollectionView ? item.id : item.receipt_number || item.id;
                const name = isCollectionView ? (item.recipient || 'N/A') : (item.payer_name || 'N/A');
                const dateValue = new Date(item.created_at).toLocaleDateString();
                const amountValue = isCollectionView
                  ? parseFloat(item.amount || 0)
                  : parseFloat(item.amount || 0);

                return (
                  <div
                    key={`${activeList}-${identifier}`}
                    className={`collection-list-item ${isCollectionView ? '' : 'receipt-item'}`}
                  >
                    <div className="collection-id">#{identifier}</div>
                    <div className="collection-details">
                      <span className="collection-payer">{name}</span>
                      <span className="collection-date">{dateValue}</span>
                    </div>
                    <div className="collection-amount">₱{amountValue.toLocaleString()}</div>
                  </div>
                );
              })
            ) : (
              <div className="no-data">
                <i className="fas fa-clipboard-list"></i>
                <p>{activeList === 'collections' ? 'No recent collections found.' : 'No recent receipts found.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collection KPIs - Main Metrics */}
      {/* <div className="collector-kpi-section">
        <div className="kpi-section-title">
          <i className="fas fa-chart-line"></i>
          <span>Collection Performance</span>
        </div>
        <div className="collector-kpi-row">
          <div className="collector-kpi-card success">
            <div className="kpi-icon">
              <i className="fas fa-calendar-week"></i>
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Weekly Collections</div>
              <div className="kpi-value">₱{collectionStats.weeklyCollections.toLocaleString()}</div>
              <div className="kpi-comparison">
                <span className="comparison-label">Last Week:</span>
                <span className="comparison-value">₱{collectionStats.lastWeekCollections.toLocaleString()}</span>
              </div>
            </div>
            <div className="kpi-badge">{collectionStats.weeklyTransactionCount} txns</div>
          </div>
          <div className="collector-kpi-card info">
            <div className="kpi-icon">
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Monthly Collections</div>
              <div className="kpi-value">₱{collectionStats.monthlyCollections.toLocaleString()}</div>
              <div className="kpi-comparison">
                <span className="comparison-label">This Month</span>
              </div>
            </div>
          </div>
          <div className="collector-kpi-card warning">
            <div className="kpi-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Total Collections</div>
              <div className="kpi-value">₱{collectionStats.totalCollections.toLocaleString()}</div>
              <div className="kpi-comparison">
                <span className="comparison-label">All Time</span>
              </div>
            </div>
          </div>
          <div className="collector-kpi-card highlight">
            <div className="kpi-icon">
              <i className="fas fa-trophy"></i>
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Highest Daily Record</div>
              <div className="kpi-value">₱{collectionStats.highestDailyCollection.toLocaleString()}</div>
              <div className="kpi-comparison">
                <span className="comparison-label">Last 30 Days</span>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Receipt Analytics KPIs - From IssueReceipt */}
      {/* <div className="collector-kpi-section">
        <div className="kpi-section-title">
          <i className="fas fa-file-invoice"></i>
          <span>Receipt Analytics</span>
        </div>
        <div className="collector-kpi-row secondary">
          <div className="collector-kpi-card">
            <div className="kpi-icon">
              <i className="fas fa-file-alt"></i>
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Total Receipts Issued</div>
              <div className="kpi-value">{receiptStats.totalReceiptsIssued}</div>
              <div className="kpi-comparison">
                <span className="comparison-label">All Time</span>
              </div>
            </div>
          </div>
          <div className="collector-kpi-card">
            <div className="kpi-icon">
              <i className="fas fa-money-check-alt"></i>
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Total Receipt Amount</div>
              <div className="kpi-value">₱{receiptStats.totalReceiptAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="kpi-comparison">
                <span className="comparison-label">All Receipts</span>
              </div>
            </div>
          </div>
          <div className="collector-kpi-card">
            <div className="kpi-icon">
              <i className="fas fa-chart-bar"></i>
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Average Receipt Amount</div>
              <div className="kpi-value">₱{receiptStats.averageReceiptAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="kpi-comparison">
                <span className="comparison-label">Per Receipt</span>
              </div>
            </div>
          </div>
          <div className="collector-kpi-card">
            <div className="kpi-icon">
              <i className="fas fa-calendar-check"></i>
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Today's Receipts</div>
              <div className="kpi-value">{receiptStats.todayReceipts}</div>
              <div className="kpi-comparison">
                <span className="comparison-label">Weekly: {receiptStats.weeklyReceipts}</span>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Data Tables and Analytics */}
      <div className="collector-data-grid">
        {/* Collections by Category */}
        <div className="collector-table-card">
          <div className="table-header">
            <h3><i className="fas fa-chart-pie"></i> Collections by Category</h3>
            <span className="table-subtitle">Revenue breakdown by category</span>
          </div>
          <div className="pie-chart-container">
            {collectionsByCategory.length > 0 ? (
              <canvas ref={categoryChartRef}></canvas>
            ) : (
              <div className="no-data">
                <i className="fas fa-chart-pie"></i>
                <p>No category data available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Daily Collection Trend */}
        <div className="collector-table-card">
          <div className="table-header">
            <h3><i className="fas fa-chart-area"></i> Daily Collection Trend</h3>
            <span className="table-subtitle">Last 7 days performance</span>
          </div>
          <div className="trend-container">
            {dailyCollectionTrend.map((day) => (
              <div key={day.date} className="trend-day">
                <div className="trend-bar-container">
                  <div 
                    className="trend-bar" 
                    style={{ 
                      height: `${Math.max((day.amount / Math.max(...dailyCollectionTrend.map(d => d.amount || 0))) * 100 || 0, 5)}%`
                    }}
                  ></div>
                </div>
                <div className="trend-amount">₱{day.amount.toLocaleString()}</div>
                <div className="trend-count">{day.count} txns</div>
                <div className="trend-date">{day.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Payer Performance */}
        <PayerDistributionAnalytics analyticsData={payerAnalytics} />

        {/* Issued Receipts Summary */}
        <ReceiptCountAnalytics receipts={receipts} analyticsData={payerAnalytics} />
      </div>
    </div>
  );
};

export default CollectorHome;
