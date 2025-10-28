import React, { useState, useEffect } from "react";
import "./css/collectordashboard.css";
import axios from "axios";

const CollectorHome = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

        // Filter only collection transactions
        const collections = allTransactions.filter(tx => tx.type === 'Collection');

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
        const pendingReceipts = allReceipts.filter(receipt => receipt.status === 'pending').length;
        const processedReceipts = allReceipts.filter(receipt => receipt.status === 'processed').length;

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
        const recentReceiptData = allReceipts
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 8);
        setReceipts(recentReceiptData);

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

  return (
    <div className="collector-page">
      <div className="collector-header">
        <h2 className="collector-title">
          <i className="fas fa-hand-holding-usd"></i> Collecting Officer Dashboard
        </h2>
        <p className="collector-subtitle">Monitor revenue collections, receipts, and collection performance</p>
      </div>

      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {/* Collection KPIs */}
      <div className="collector-kpi-row">
        <div className="collector-kpi-card primary">
          <div className="kpi-icon">
            <i className="fas fa-calendar-day"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Today's Collections</div>
            <div className="kpi-value">₱{collectionStats.todayCollections.toLocaleString()}</div>
          </div>
        </div>
        <div className="collector-kpi-card success">
          <div className="kpi-icon">
            <i className="fas fa-calendar-week"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Weekly Collections</div>
            <div className="kpi-value">₱{collectionStats.weeklyCollections.toLocaleString()}</div>
          </div>
        </div>
        <div className="collector-kpi-card info">
          <div className="kpi-icon">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Monthly Collections</div>
            <div className="kpi-value">₱{collectionStats.monthlyCollections.toLocaleString()}</div>
          </div>
        </div>
        <div className="collector-kpi-card warning">
          <div className="kpi-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Total Collections</div>
            <div className="kpi-value">₱{collectionStats.totalCollections.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="collector-kpi-row secondary">
        <div className="collector-kpi-card">
          <div className="kpi-icon">
            <i className="fas fa-receipt"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Pending Receipts</div>
            <div className="kpi-value">{collectionStats.pendingReceipts}</div>
          </div>
        </div>
        <div className="collector-kpi-card">
          <div className="kpi-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Processed Receipts</div>
            <div className="kpi-value">{collectionStats.processedReceipts}</div>
          </div>
        </div>
        <div className="collector-kpi-card">
          <div className="kpi-icon">
            <i className="fas fa-calculator"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Average Collection</div>
            <div className="kpi-value">₱{collectionStats.averageCollection.toLocaleString()}</div>
          </div>
        </div>
        <div className="collector-kpi-card">
          <div className="kpi-icon">
            <i className="fas fa-trophy"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Top Category</div>
            <div className="kpi-value">{collectionStats.topCategory}</div>
          </div>
        </div>
      </div>

      {/* Data Tables and Analytics */}
      <div className="collector-data-grid">
        
        {/* Recent Collections */}
        <div className="collector-table-card">
          <div className="table-header">
            <h3><i className="fas fa-history"></i> Recent Collections</h3>
            <span className="table-subtitle">Latest collection transactions</span>
          </div>
          <div className="table-container">
            <table className="collector-table">
              <thead>
                <tr>
                  <th><i className="fas fa-hashtag"></i> ID</th>
                  <th><i className="fas fa-money-bill"></i> Amount</th>
                  <th><i className="fas fa-tag"></i> Category</th>
                  <th><i className="fas fa-building"></i> Department</th>
                  <th><i className="fas fa-user"></i> Payer</th>
                  <th><i className="fas fa-calendar"></i> Date</th>
                </tr>
              </thead>
              <tbody>
                {recentCollections.length > 0 ? (
                  recentCollections.map((collection) => (
                    <tr key={collection.id}>
                      <td>#{collection.id}</td>
                      <td className="amount-positive">₱{parseFloat(collection.amount || 0).toLocaleString()}</td>
                      <td>{collection.category || 'N/A'}</td>
                      <td>{collection.department || 'N/A'}</td>
                      <td>{collection.recipient || 'N/A'}</td>
                      <td>{new Date(collection.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-data">
                      <i className="fas fa-inbox"></i>
                      <p>No recent collections found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Collections by Category */}
        <div className="collector-table-card">
          <div className="table-header">
            <h3><i className="fas fa-chart-pie"></i> Collections by Category</h3>
            <span className="table-subtitle">Revenue breakdown by category</span>
          </div>
          <div className="category-grid">
            {collectionsByCategory.slice(0, 6).map((category, index) => (
              <div key={category.category} className="category-card">
                <div className="category-header">
                  <h4>{category.category}</h4>
                  <span className="category-count">{category.count} transactions</span>
                </div>
                <div className="category-amount">₱{category.amount.toLocaleString()}</div>
                <div className="category-bar">
                  <div 
                    className="category-progress" 
                    style={{ 
                      width: `${(category.amount / collectionsByCategory[0]?.amount) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Collection Trend */}
        <div className="collector-table-card">
          <div className="table-header">
            <h3><i className="fas fa-chart-area"></i> Daily Collection Trend</h3>
            <span className="table-subtitle">Last 7 days performance</span>
          </div>
          <div className="trend-container">
            {dailyCollectionTrend.map((day, index) => (
              <div key={day.date} className="trend-day">
                <div className="trend-bar-container">
                  <div 
                    className="trend-bar" 
                    style={{ 
                      height: `${Math.max((day.amount / Math.max(...dailyCollectionTrend.map(d => d.amount))) * 100, 5)}%` 
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

        {/* Recent Receipts */}
        <div className="collector-table-card">
          <div className="table-header">
            <h3><i className="fas fa-receipt"></i> Recent Receipts</h3>
            <span className="table-subtitle">Receipt processing status</span>
          </div>
          <div className="receipts-container">
            {receipts.length > 0 ? (
              receipts.map((receipt) => (
                <div key={receipt.id} className="receipt-card">
                  <div className="receipt-header">
                    <span className="receipt-number">#{receipt.receipt_number || receipt.id}</span>
                    <span className={`receipt-status ${receipt.status || 'pending'}`}>
                      {receipt.status || 'pending'}
                    </span>
                  </div>
                  <div className="receipt-amount">₱{parseFloat(receipt.amount || 0).toLocaleString()}</div>
                  <div className="receipt-details">
                    <div className="receipt-payer">{receipt.payer_name || 'N/A'}</div>
                    <div className="receipt-date">{new Date(receipt.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">
                <i className="fas fa-receipt"></i>
                <p>No recent receipts found.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CollectorHome;