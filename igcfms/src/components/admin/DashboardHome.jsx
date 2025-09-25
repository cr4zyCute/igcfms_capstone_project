import React, { useEffect, useRef, useState } from "react";
import "../admin/css/home.css";
import axios from "axios";
import LoadingSpinner, { StatsSkeleton, CardSkeleton, TableSkeleton } from "../common/LoadingSpinner";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, ComposedChart
} from "recharts";

const DashboardHome = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeFunds: 0,
    totalRevenue: 0,
    totalExpense: 0,
    todayTransactions: 0,
    pendingOverrides: 0,
    totalCollections: 0,
    totalDisbursements: 0,
    netBalance: 0,
  });
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [fundDistribution, setFundDistribution] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [topAccounts, setTopAccounts] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [transactionTrends, setTransactionTrends] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [overrideRequests, setOverrideRequests] = useState([]);
  const [loading, setLoading] = useState({
    stats: true,
    charts: true,
    tables: true
  });
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [viewMode, setViewMode] = useState('daily'); // daily | weekly
  const [streaming, setStreaming] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);

  const API_BASE = "http://localhost:8000/api";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading({ stats: true, charts: true, tables: true });
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
          setError("No authentication token found. Please log in again.");
          setLoading({ stats: false, charts: false, tables: false });
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        // Fetch all data from your actual APIs
        const [
          usersRes,
          fundsRes,
          transactionsRes,
          auditRes,
          overrideRes
        ] = await Promise.all([
          axios.get(`${API_BASE}/users`, { headers }),
          axios.get(`${API_BASE}/fund-accounts`, { headers }),
          axios.get(`${API_BASE}/transactions`, { headers }),
          axios.get(`${API_BASE}/audit-logs`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/override-requests`, { headers }).catch(() => ({ data: [] }))
        ]);

        const users = usersRes.data || [];
        const funds = fundsRes.data || [];
        const transactions = transactionsRes.data || [];
        const audits = auditRes.data || [];
        const overrides = overrideRes.data || [];

        // Calculate comprehensive statistics
        const today = new Date().toDateString();
        const thisMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        // Basic stats
        const totalUsers = users.filter(user => user.status === 'active').length;
        const activeFunds = funds.filter(fund => fund.is_active).length;
        
        const todayTransactions = transactions.filter(tx => 
          new Date(tx.created_at).toDateString() === today
        ).length;

        const totalCollections = transactions
          .filter(tx => tx.type === 'Collection')
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

        const totalDisbursements = transactions
          .filter(tx => tx.type === 'Disbursement')
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

        const netBalance = totalCollections - totalDisbursements;
        const pendingOverrides = overrides.filter(req => req.status === 'pending').length;

        // Revenue by account type
        const revenueAccounts = funds.filter(fund => fund.account_type === 'Revenue');
        const expenseAccounts = funds.filter(fund => fund.account_type === 'Expense');
        
        const totalRevenue = revenueAccounts.reduce((sum, acc) => 
          sum + parseFloat(acc.current_balance || 0), 0);
        const totalExpense = expenseAccounts.reduce((sum, acc) => 
          sum + parseFloat(acc.current_balance || 0), 0);

        setStats({
          totalUsers,
          activeFunds,
          totalRevenue,
          totalExpense,
          todayTransactions,
          pendingOverrides,
          totalCollections,
          totalDisbursements,
          netBalance,
        });
        
        // Stats are loaded
        setLoading(prev => ({ ...prev, stats: false }));

        // Generate daily revenue data (last 7 days)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toDateString();
          
          const dayCollections = transactions
            .filter(tx => tx.type === 'Collection' && new Date(tx.created_at).toDateString() === dateStr)
            .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
          
          last7Days.push({
            date: date.toLocaleDateString(),
            amount: dayCollections,
            collections: dayCollections,
            disbursements: transactions
              .filter(tx => tx.type === 'Disbursement' && new Date(tx.created_at).toDateString() === dateStr)
              .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0)
          });
        }
        setDailyRevenue(last7Days);

        // Fund distribution by account type
        const fundTypes = ['Revenue', 'Expense', 'Asset', 'Liability', 'Equity'];
        const distribution = fundTypes.map(type => {
          const typeAccounts = funds.filter(fund => fund.account_type === type);
          const totalBalance = typeAccounts.reduce((sum, acc) => 
            sum + parseFloat(acc.current_balance || 0), 0);
          
          return {
            name: type,
            value: totalBalance,
            count: typeAccounts.length
          };
        }).filter(item => item.value > 0);
        setFundDistribution(distribution);

        // Department statistics
        const departments = [...new Set(transactions.map(tx => tx.department).filter(Boolean))];
        const deptStats = departments.map(dept => {
          const deptTransactions = transactions.filter(tx => tx.department === dept);
          const collections = deptTransactions
            .filter(tx => tx.type === 'Collection')
            .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
          const disbursements = deptTransactions
            .filter(tx => tx.type === 'Disbursement')
            .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
          
          return {
            department: dept,
            collections,
            disbursements,
            total: collections + disbursements,
            count: deptTransactions.length
          };
        }).sort((a, b) => b.total - a.total);
        setDepartmentStats(deptStats);

        // Monthly revenue trend (last 6 months)
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const month = date.getMonth();
          const year = date.getFullYear();
          
          const monthTransactions = transactions.filter(tx => {
            const txDate = new Date(tx.created_at);
            return txDate.getMonth() === month && txDate.getFullYear() === year;
          });
          
          const collections = monthTransactions
            .filter(tx => tx.type === 'Collection')
            .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
          
          const disbursements = monthTransactions
            .filter(tx => tx.type === 'Disbursement')
            .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
          
          monthlyData.push({
            month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            collections,
            disbursements,
            net: collections - disbursements
          });
        }
        setMonthlyRevenue(monthlyData);

        // Transaction trends by type
        const trendData = last7Days.map(day => ({
          ...day,
          total: day.collections + day.disbursements
        }));
        setTransactionTrends(trendData);
        
        // Charts are loaded
        setLoading(prev => ({ ...prev, charts: false }));

        // User activity (from audit logs or transactions)
        const userStats = users.map(user => {
          const userTransactions = transactions.filter(tx => tx.created_by === user.id);
          return {
            name: user.name,
            role: user.role,
            transactions: userTransactions.length,
            lastActivity: user.last_login || user.updated_at
          };
        }).sort((a, b) => b.transactions - a.transactions);
        setUserActivity(userStats);

        // Set other data
        setRecentTransactions(transactions.slice(0, 10));
        setTopAccounts(funds
          .sort((a, b) => parseFloat(b.current_balance || 0) - parseFloat(a.current_balance || 0))
          .slice(0, 5)
        );
        setAuditLogs(audits.slice(0, 10));
        setOverrideRequests(overrides.filter(req => req.status === 'pending').slice(0, 5));
        
        // Tables are loaded
        setLoading(prev => ({ ...prev, tables: false }));

      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
      } finally {
        setLoading({ stats: false, charts: false, tables: false });
        setLastUpdated(new Date());
      }
    };

    fetchDashboardData();

    // Auto-refresh every 30s
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    // WebSocket streaming (best-effort)
    try {
      const ws = new WebSocket('ws://localhost:8000/ws');
      wsRef.current = ws;
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => setWsConnected(false);
      ws.onerror = () => setWsConnected(false);
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          // expected shapes: {type:'transaction', data:{...}} or {type:'stats', data:{...}}
          if (msg.type === 'transaction' && msg.data) {
            setStreaming(true);
            setRecentTransactions(prev => [msg.data, ...prev].slice(0, 10));
            // lightweight updates
            setDailyRevenue(prev => {
              const dateStr = new Date(msg.data.created_at).toLocaleDateString();
              const copy = [...prev];
              const idx = copy.findIndex(d => d.date === dateStr);
              if (idx >= 0) {
                if (msg.data.type === 'Collection') copy[idx].collections += parseFloat(msg.data.amount || 0);
                if (msg.data.type === 'Disbursement') copy[idx].disbursements += parseFloat(msg.data.amount || 0);
                copy[idx].amount = copy[idx].collections;
              }
              return copy;
            });
            setLastUpdated(new Date());
            setTimeout(() => setStreaming(false), 1500);
          }
          if (msg.type === 'override' && msg.data) {
            setOverrideRequests(prev => [msg.data, ...prev].slice(0, 5));
          }
        } catch {}
      };
    } catch {}

    return () => {
      clearInterval(intervalId);
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
      }
    };
  }, []);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA00FF", "#FF4444"];
  const GRAYS = ["#111111", "#333333", "#555555", "#777777", "#999999", "#BBBBBB"];

  // Helpers for trends
  const formatPeso = (num) => `₱${(num || 0).toLocaleString()}`;
  const computeChange = (current, previous) => {
    const prev = previous || 0;
    if (prev === 0) return { pct: current ? 100 : 0, dir: current >= 0 ? 'up' : 'down' };
    const diff = current - prev;
    const pct = Math.round((diff / prev) * 100);
    return { pct: Math.abs(pct), dir: diff >= 0 ? 'up' : 'down' };
  };

  // Build previous period comparisons (simple heuristic)
  const last7Collections = dailyRevenue.reduce((s, d) => s + (d.collections || 0), 0);
  const last7Disb = dailyRevenue.reduce((s, d) => s + (d.disbursements || 0), 0);
  const prev7Collections = dailyRevenue.slice(0, Math.max(0, dailyRevenue.length - 7)).reduce((s, d) => s + (d.collections || 0), 0);
  const prev7Disb = dailyRevenue.slice(0, Math.max(0, dailyRevenue.length - 7)).reduce((s, d) => s + (d.disbursements || 0), 0);
  const collectionsTrend = computeChange(last7Collections, prev7Collections);
  const disbTrend = computeChange(last7Disb, prev7Disb);
  const netTrend = computeChange(stats.netBalance, stats.netBalance - (last7Collections - last7Disb));

  // 30-day cash flow with moving average
  const buildLastNDays = (n) => {
    const days = [];
    for (let i = n - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      days.push({ key: dateStr, label: date.toLocaleDateString() });
    }
    return days;
  };

  const last30Template = buildLastNDays(30);
  const last30 = last30Template.map(t => {
    const collections = recentTransactions
      .filter(tx => tx.type === 'Collection' && new Date(tx.created_at).toDateString() === t.key)
      .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
    const disbursements = recentTransactions
      .filter(tx => tx.type === 'Disbursement' && new Date(tx.created_at).toDateString() === t.key)
      .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
    const net = collections - disbursements;
    return { date: t.label, collections, disbursements, net };
  });

  const movingAverage = (arr, windowSize = 7) => {
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      const from = Math.max(0, i - windowSize + 1);
      const slice = arr.slice(from, i + 1);
      const avg = slice.reduce((s, d) => s + d.net, 0) / slice.length;
      out.push({ ...arr[i], ma: avg });
    }
    return out;
  };
  const cashFlow30 = movingAverage(last30, 7);

  // Weekly aggregation for toggle
  const aggregateWeekly = (daysData) => {
    const out = [];
    for (let i = 0; i < daysData.length; i += 7) {
      const chunk = daysData.slice(i, i + 7);
      const collections = chunk.reduce((s, d) => s + (d.collections || 0), 0);
      const disbursements = chunk.reduce((s, d) => s + (d.disbursements || 0), 0);
      out.push({ period: `Week ${Math.floor(i / 7) + 1}`, collections, disbursements });
    }
    return out;
  };

  const trendSource = viewMode === 'daily' ? dailyRevenue.map(d => ({ period: d.date, collections: d.collections, disbursements: d.disbursements })) : aggregateWeekly(dailyRevenue);

  // Heatmap 7x24
  const heatmap = (() => {
    const grid = Array.from({ length: 7 }, (_, day) => ({ day, hours: Array.from({ length: 24 }, (_, h) => 0) }));
    recentTransactions.forEach(tx => {
      const dt = new Date(tx.created_at);
      const day = dt.getDay();
      const hour = dt.getHours();
      grid[day].hours[hour] += 1;
    });
    const max = Math.max(1, ...grid.flatMap(g => g.hours));
    return { grid, max };
  })();

  if (error) {
    return (
      <div className="admin-page grid gap-6 p-6 bg-gray-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error: </strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page" style={{ padding: '20px', background: '#ffffff', minHeight: '100vh' }}>
      <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #f0f0f0' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#000000', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <i className="fas fa-chart-line"></i> IGCFMS Admin Dashboard
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '14px', color: '#666666', margin: 0 }}>
            Comprehensive financial management system overview and analytics
          </p>
          <div className="realtime-indicator">
            <span className="realtime-dot"></span>
            {wsConnected ? 'Live' : 'Auto-refresh 30s'}
            <span className="last-updated" style={{ marginLeft: 8 }}>
              {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
      {/* Enhanced KPI Cards */}
      <section className="area-metrics">
      {loading.stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
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
      ) : (
        <>
          <div className="kpi-grid" style={{ marginBottom: '0' }}>
            <MetricCard label="Active Users" value={stats.totalUsers} trend={{ pct: 0, dir: 'up' }} streaming={streaming} />
            <MetricCard label="Active Fund Accounts" value={stats.activeFunds} trend={{ pct: 0, dir: 'up' }} />
            <MetricCard label="Total Collections" value={formatPeso(stats.totalCollections)} trend={collectionsTrend} />
            <MetricCard label="Total Disbursements" value={formatPeso(stats.totalDisbursements)} trend={disbTrend} />
            <MetricCard label="Net Balance" value={formatPeso(stats.netBalance)} trend={netTrend} />
            <MetricCard label="System Health" value={wsConnected ? 'Operational' : 'Degraded'} health={wsConnected ? 'ok' : 'warn'} />
          </div>
        </>
      )}
      </section>

      {/* Enhanced Charts Section */}
      <section className="area-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '25px', marginBottom: '0' }}>
        
        {/* Collections vs Disbursements Trend */}
        <div className="chart-container" style={{ border: '2px solid #f0f0f0' }}>
          <div className="section-header">
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#000000', marginBottom: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-chart-area"></i> Collections vs Disbursements
            </h3>
            <div className="toggle-group">
              <button className={`toggle-btn ${viewMode === 'daily' ? 'active' : ''}`} onClick={() => setViewMode('daily')}>Daily</button>
              <button className={`toggle-btn ${viewMode === 'weekly' ? 'active' : ''}`} onClick={() => setViewMode('weekly')}>Weekly</button>
            </div>
          </div>
          {loading.charts ? (
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
                <i className="fas fa-chart-area fa-2x" style={{ marginBottom: '10px', display: 'block' }}></i>
                Loading Chart...
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={trendSource}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, '']} />
                <Legend />
                <Area type="monotone" dataKey="collections" stackId="1" stroke="#16a34a" fill="#16a34a" fillOpacity={0.3} />
                <Area type="monotone" dataKey="disbursements" stackId="2" stroke="#dc2626" fill="#dc2626" fillOpacity={0.3} />
                <Line type="monotone" dataKey="collections" stroke="#16a34a" strokeWidth={3} />
                <Line type="monotone" dataKey="disbursements" stroke="#dc2626" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Fund Distribution by Account Type */}
        <div className="chart-container" style={{ border: '2px solid #f0f0f0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#000000', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-chart-pie"></i> Fund Distribution by Account Type
          </h3>
          {loading.charts ? (
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
                <i className="fas fa-chart-pie fa-2x" style={{ marginBottom: '10px', display: 'block' }}></i>
                Loading Chart...
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  dataKey="value"
                  data={fundDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {fundDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GRAYS[index % GRAYS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, 'Balance']} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="legend-row" style={{ marginTop: 8 }}>
            {fundDistribution.map((entry, idx) => (
              <span key={entry.name} className="legend-item">
                <span className="legend-swatch" style={{ background: GRAYS[idx % GRAYS.length] }}></span>
                {entry.name} ({formatPeso(entry.value)})
              </span>
            ))}
          </div>
        </div>

        {/* Monthly Revenue Trend */}
        <div className="chart-container" style={{ border: '2px solid #f0f0f0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#000000', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-chart-line"></i> Cash Flow Trend (30 Days)
          </h3>
          {loading.charts ? (
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
                <i className="fas fa-chart-line fa-2x" style={{ marginBottom: '10px', display: 'block' }}></i>
                Loading Chart...
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cashFlow30}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`₱${Number(value).toLocaleString()}`, '']} />
                <Legend />
                <Area type="monotone" dataKey="net" stroke="#111827" fill="#111827" fillOpacity={0.15} name="Daily Net" />
                <Line type="monotone" dataKey="ma" stroke="#000000" strokeWidth={2} name="7D Moving Avg" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Department Performance */}
        <div className="chart-container" style={{ border: '2px solid #f0f0f0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#000000', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-building"></i> Department Transaction Volume
          </h3>
          {loading.charts ? (
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
                <i className="fas fa-building fa-2x" style={{ marginBottom: '10px', display: 'block' }}></i>
                Loading Chart...
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentStats.slice(0, 6)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" />
                <YAxis dataKey="department" type="category" width={80} />
                <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, '']} />
                <Legend />
                <Bar dataKey="collections" fill="#16a34a" name="Collections" />
                <Bar dataKey="disbursements" fill="#dc2626" name="Disbursements" />
              </BarChart>
            </ResponsiveContainer>
          )}
          
        </div>

        {/* Transaction Volume Heatmap */}
        <div className="chart-container" style={{ border: '2px solid #f0f0f0' }}>
          <div className="section-header">
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#000000', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-th"></i> Transaction Volume Heatmap (7x24)
            </h3>
          </div>
          <div className="heatmap-grid">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((label, idx) => (
              <React.Fragment key={label}>
                <div style={{ fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center' }}>{label}</div>
                {heatmap.grid[idx].hours.map((val, hIdx) => {
                  const level = Math.min(5, Math.ceil((val / heatmap.max) * 5)) || 1;
                  return <div key={`${idx}-${hIdx}`} className={`heatmap-cell level-${level}`} title={`${label} ${hIdx}:00 - ${val} tx`}></div>;
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

      </section>

      {/* Admin Data Tables */}
      <section className="area-tables" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '25px', marginBottom: '0' }}>
        
        {/* Recent Transactions */}
        <div style={{ background: '#ffffff', border: '2px solid #f0f0f0', borderRadius: '12px', padding: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #f0f0f0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#000000', margin: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-history"></i> Recent Transactions
            </h3>
            <span style={{ fontSize: '12px', color: '#666666' }}>Last 10 transactions</span>
          </div>
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e5e5e5' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '700', color: '#000000', fontSize: '12px' }}>ID</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '700', color: '#000000', fontSize: '12px' }}>Type</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '700', color: '#000000', fontSize: '12px' }}>Amount</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '700', color: '#000000', fontSize: '12px' }}>Department</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '700', color: '#000000', fontSize: '12px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length > 0 ? (
                  recentTransactions.map(transaction => (
                    <tr key={transaction.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px 8px', fontSize: '12px' }}>#{transaction.id}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          background: transaction.type === 'Collection' ? '#f0fdf4' : '#fef2f2',
                          color: transaction.type === 'Collection' ? '#166534' : '#991b1b',
                          border: `1px solid ${transaction.type === 'Collection' ? '#bbf7d0' : '#fecaca'}`
                        }}>
                          {transaction.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: '600', color: transaction.type === 'Collection' ? '#16a34a' : '#dc2626', fontSize: '12px' }}>
                        {transaction.type === 'Collection' ? '+' : '-'}₱{parseFloat(transaction.amount || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '12px', color: '#666666' }}>{transaction.department || 'N/A'}</td>
                      <td style={{ padding: '12px 8px', fontSize: '11px', color: '#999999' }}>
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#666666' }}>
                      <i className="fas fa-inbox" style={{ fontSize: '24px', color: '#cccccc', marginBottom: '10px', display: 'block' }}></i>
                      No recent transactions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Fund Accounts */}
        <div style={{ background: '#ffffff', border: '2px solid #f0f0f0', borderRadius: '12px', padding: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #f0f0f0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#000000', margin: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-trophy"></i> Top Fund Accounts
            </h3>
            <span style={{ fontSize: '12px', color: '#666666' }}>By balance</span>
          </div>
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {topAccounts.map((account, index) => (
              <div key={account.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px',
                marginBottom: '10px',
                background: '#fafafa',
                borderRadius: '8px',
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: index < 3 ? '#000000' : '#666666'
                  }}>
                    {index + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#000000', fontSize: '14px' }}>{account.name}</div>
                    <div style={{ fontSize: '11px', color: '#666666' }}>{account.code} • {account.account_type}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', color: '#16a34a', fontSize: '14px' }}>
                    ₱{parseFloat(account.current_balance || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Activity */}
        <div style={{ background: '#ffffff', border: '2px solid #f0f0f0', borderRadius: '12px', padding: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #f0f0f0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#000000', margin: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-users"></i> User Activity
            </h3>
            <span style={{ fontSize: '12px', color: '#666666' }}>Most active users</span>
          </div>
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {userActivity.slice(0, 8).map((user, index) => (
              <div key={user.name} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                marginBottom: '8px',
                borderRadius: '6px',
                border: '1px solid #f0f0f0'
              }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#000000', fontSize: '13px' }}>{user.name}</div>
                  <div style={{ fontSize: '11px', color: '#666666' }}>{user.role}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '600', color: '#2563eb', fontSize: '13px' }}>
                    {user.transactions} transactions
                  </div>
                  <div style={{ fontSize: '10px', color: '#999999' }}>
                    {user.lastActivity ? new Date(user.lastActivity).toLocaleDateString() : 'Never'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Override Requests */}
        <div style={{ background: '#ffffff', border: '2px solid #f0f0f0', borderRadius: '12px', padding: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #f0f0f0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#000000', margin: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-exclamation-triangle"></i> Pending Overrides
            </h3>
            <span style={{ fontSize: '12px', color: '#666666' }}>Requires approval</span>
          </div>
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {overrideRequests.length > 0 ? (
              overrideRequests.map((request, index) => (
                <div key={request.id} style={{
                  padding: '15px',
                  marginBottom: '10px',
                  background: '#fffbeb',
                  borderRadius: '8px',
                  border: '1px solid #fbbf24'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontWeight: '600', color: '#000000', fontSize: '13px' }}>
                      Transaction #{request.transaction_id}
                    </div>
                    <div style={{ fontSize: '10px', color: '#f59e0b', fontWeight: '600' }}>PENDING</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666666', marginBottom: '5px' }}>
                    {request.reason}
                  </div>
                  <div style={{ fontSize: '10px', color: '#999999' }}>
                    Requested: {new Date(request.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666666' }}>
                <i className="fas fa-check-circle" style={{ fontSize: '24px', color: '#16a34a', marginBottom: '10px', display: 'block' }}></i>
                No pending override requests
              </div>
            )}
          </div>
        </div>

      </section>

      {/* Bottom Analytics Row */}
      <section className="area-analytics">
        <div className="analytics-grid">
          <div className="chart-container" style={{ border: '2px solid #f0f0f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 8 }}><i className="fas fa-coins"></i> Revenue Analysis</h3>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Top revenue sources coming soon.</div>
          </div>
          <div className="chart-container" style={{ border: '2px solid #f0f0f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 8 }}><i className="fas fa-receipt"></i> Expense Tracking</h3>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Expense categories with trends coming soon.</div>
          </div>
          <div className="chart-container" style={{ border: '2px solid #f0f0f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 8 }}><i className="fas fa-gauge"></i> Collection Rate</h3>
            <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', fontWeight: 700 }}>36%</div>
          </div>
          <div className="chart-container" style={{ border: '2px solid #f0f0f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 8 }}><i className="fas fa-user-clock"></i> User Activity</h3>
            <div style={{ maxHeight: 140, overflowY: 'auto', fontSize: 12 }}>
              {userActivity.slice(0, 5).map(u => (
                <div key={u.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span>{u.name} ({u.role})</span>
                  <span style={{ color: '#6b7280' }}>{u.transactions} tx</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-container" style={{ border: '2px solid #f0f0f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 8 }}><i className="fas fa-bell"></i> System Alerts</h3>
            <div style={{ maxHeight: 140, overflowY: 'auto', fontSize: 12 }}>
              {auditLogs.slice(0, 6).map((log) => (
                <div key={log.id || log.created_at} style={{ padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ fontWeight: 600 }}>{log.action || 'Activity'}</div>
                  <div style={{ color: '#6b7280' }}>{new Date(log.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      </div>

    </div>
  );
  
};

// Enhanced KPI Card Component with Color Themes
const StatCard = ({ label, value, icon, color = 'primary' }) => {
  const colorClasses = {
    primary: { bg: '#eff6ff', border: '#2563eb', text: '#2563eb' },
    success: { bg: '#f0fdf4', border: '#16a34a', text: '#16a34a' },
    danger: { bg: '#fef2f2', border: '#dc2626', text: '#dc2626' },
    warning: { bg: '#fffbeb', border: '#f59e0b', text: '#f59e0b' },
    info: { bg: '#f0f9ff', border: '#0ea5e9', text: '#0ea5e9' },
    secondary: { bg: '#f8fafc', border: '#64748b', text: '#64748b' }
  };

  const colors = colorClasses[color] || colorClasses.primary;

  return (
    <div style={{
      background: '#ffffff',
      border: `2px solid #f0f0f0`,
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      transition: 'all 0.2s ease',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.target.style.borderColor = colors.border;
      e.target.style.transform = 'translateY(-2px)';
      e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
    }}
    onMouseLeave={(e) => {
      e.target.style.borderColor = '#f0f0f0';
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = 'none';
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px'
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#666666', fontSize: '14px', marginBottom: '5px', fontWeight: '500' }}>
          {label}
        </div>
        <div style={{ fontSize: '24px', fontWeight: '700', color: '#000000' }}>
          {value}
        </div>
      </div>
    </div>
  );
};

// New Metric Card with trends and health indicator
const MetricCard = ({ label, value, trend, health, streaming }) => {
  const trendDir = trend?.dir === 'down' ? 'down' : 'up';
  const trendColor = trendDir === 'up' ? '#16a34a' : '#dc2626';
  const trendArrow = trendDir === 'up' ? '↑' : '↓';
  const healthText = health === 'ok' ? 'Operational' : health === 'warn' ? 'Degraded' : '';
  const healthColor = health === 'ok' ? '#16a34a' : '#f59e0b';

  return (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        <span className="last-updated" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {streaming && <span className="realtime-dot" />}
        </span>
      </div>
      <div className="metric-value">{value}</div>
      {typeof trend?.pct === 'number' ? (
        <div className={`metric-trend ${trendDir}`} style={{ color: trendColor }}>
          {trendArrow} {trend.pct}%
        </div>
      ) : null}
      {healthText ? (
        <div className="metric-trend" style={{ color: healthColor }}>{healthText}</div>
      ) : null}
    </div>
  );
};

export default DashboardHome;