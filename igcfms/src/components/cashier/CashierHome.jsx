import React, { useState, useEffect } from "react";
import "./css/cashierdashboard.css";
import axios from "axios";

const CashierHome = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    totalCollections: 0,
    totalDisbursements: 0,
    activeFunds: 0,
    todayTransactions: 0,
    pendingOverrides: 0,
    monthlyCollections: 0,
    weeklyDisbursements: 0,
    cashBalance: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [fundAccounts, setFundAccounts] = useState([]);
  const [error, setError] = useState("");

useEffect(() => {
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch dashboard KPIs
      const dashboardRes = await axios.get('http://localhost:8000/api/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Fetch fund accounts
      const fundsRes = await axios.get('http://localhost:8000/api/fund-accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const transactions = dashboardRes.data || [];
      const funds = fundsRes.data || [];
      
      // Calculate KPIs from actual data
      const today = new Date().toDateString();
      const thisMonth = new Date().getMonth();
      const thisWeek = getWeekStart();
      
      const todayTransactions = transactions.filter(tx => 
        new Date(tx.created_at).toDateString() === today
      );
      
      const monthlyCollections = transactions
        .filter(tx => tx.type === 'Collection' && new Date(tx.created_at).getMonth() === thisMonth)
        .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
        
      const weeklyDisbursements = transactions
        .filter(tx => tx.type === 'Disbursement' && new Date(tx.created_at) >= thisWeek)
        .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
      
      const totalCollections = transactions
        .filter(tx => tx.type === 'Collection')
        .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
        
      const totalDisbursements = transactions
        .filter(tx => tx.type === 'Disbursement')
        .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
      
      const cashBalance = funds
        .filter(fund => fund.account_type === 'Asset')
        .reduce((sum, fund) => sum + parseFloat(fund.current_balance || 0), 0);
      
      setKpis({
        totalCollections,
        totalDisbursements,
        activeFunds: funds.filter(fund => fund.is_active).length,
        todayTransactions: todayTransactions.length,
        pendingOverrides: 0, // This would need a separate API call
        monthlyCollections,
        weeklyDisbursements,
        cashBalance,
      });
      
      setTransactions(transactions.slice(0, 10)); // Show latest 10 transactions
      setFundAccounts(funds);
      setError("");
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError("Failed to load dashboard data");
      setKpis({
        totalCollections: 0,
        totalDisbursements: 0,
        activeFunds: 0,
        todayTransactions: 0,
        pendingOverrides: 0,
        monthlyCollections: 0,
        weeklyDisbursements: 0,
        cashBalance: 0,
      });
      setTransactions([]);
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
  
  fetchDashboardData();
}, []);

  if (loading) {
    return (
      <div className="cashier-spinner-container">
        <div className="cashier-spinner"></div>
        <div className="cashier-loading-text">Loading cashier dashboard...</div>
      </div>
    );
  }

  return (
    <div className="cashier-page">
      <div className="cashier-header">
        <h2 className="cashier-title">
          <i className="fas fa-cash-register"></i> Cashier Dashboard
        </h2>
        <p className="cashier-subtitle">Monitor transactions, fund accounts, and financial operations</p>
      </div>

      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {/* Primary KPIs */}
      <div className="cashier-kpi-row">
        <div className="cashier-kpi-card primary">
          <div className="kpi-icon">
            <i className="fas fa-arrow-up"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Total Collections</div>
            <div className="kpi-value">₱{kpis.totalCollections.toLocaleString()}</div>
          </div>
        </div>
        <div className="cashier-kpi-card danger">
          <div className="kpi-icon">
            <i className="fas fa-arrow-down"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Total Disbursements</div>
            <div className="kpi-value">₱{kpis.totalDisbursements.toLocaleString()}</div>
          </div>
        </div>
        <div className="cashier-kpi-card info">
          <div className="kpi-icon">
            <i className="fas fa-university"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Active Fund Accounts</div>
            <div className="kpi-value">{kpis.activeFunds}</div>
          </div>
        </div>
        <div className="cashier-kpi-card warning">
          <div className="kpi-icon">
            <i className="fas fa-calendar-day"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Today's Transactions</div>
            <div className="kpi-value">{kpis.todayTransactions}</div>
          </div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="cashier-kpi-row secondary">
        <div className="cashier-kpi-card">
          <div className="kpi-icon">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Monthly Collections</div>
            <div className="kpi-value">₱{kpis.monthlyCollections.toLocaleString()}</div>
          </div>
        </div>
        <div className="cashier-kpi-card">
          <div className="kpi-icon">
            <i className="fas fa-calendar-week"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Weekly Disbursements</div>
            <div className="kpi-value">₱{kpis.weeklyDisbursements.toLocaleString()}</div>
          </div>
        </div>
        <div className="cashier-kpi-card">
          <div className="kpi-icon">
            <i className="fas fa-money-bill-wave"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Cash Balance</div>
            <div className="kpi-value">₱{kpis.cashBalance.toLocaleString()}</div>
          </div>
        </div>
        <div className="cashier-kpi-card">
          <div className="kpi-icon">
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Pending Overrides</div>
            <div className="kpi-value">{kpis.pendingOverrides}</div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="cashier-table-card">
        <div className="table-header">
          <h3><i className="fas fa-history"></i> Recent Transactions</h3>
          <button className="refresh-btn" onClick={() => window.location.reload()}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
        <table className="cashier-table">
          <thead>
            <tr>
              <th><i className="fas fa-hashtag"></i> ID</th>
              <th><i className="fas fa-exchange-alt"></i> Type</th>
              <th><i className="fas fa-money-bill"></i> Amount</th>
              <th><i className="fas fa-user"></i> Recipient</th>
              <th><i className="fas fa-building"></i> Department</th>
              <th><i className="fas fa-calendar"></i> Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>#{tx.id}</td>
                  <td>
                    <span className={`tx-type ${tx.type === "Collection" ? "collection" : "disbursement"}`}>
                      {tx.type === "Collection" && <i className="fas fa-arrow-up"></i>}
                      {tx.type === "Disbursement" && <i className="fas fa-arrow-down"></i>}
                      {tx.type}
                    </span>
                  </td>
                  <td className={tx.type === "Collection" ? "amount-positive" : "amount-negative"}>
                    {tx.type === "Collection" ? "+" : "-"}₱{parseFloat(tx.amount || 0).toLocaleString()}
                  </td>
                  <td>{tx.recipient || 'N/A'}</td>
                  <td>{tx.department || 'N/A'}</td>
                  <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-tx">
                  <i className="fas fa-inbox"></i>
                  <p>No transactions found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Fund Accounts Summary */}
      <div className="cashier-table-card">
        <div className="table-header">
          <h3><i className="fas fa-university"></i> Fund Accounts Overview</h3>
        </div>
        <div className="funds-grid">
          {fundAccounts.slice(0, 6).map((fund) => (
            <div key={fund.id} className="fund-card">
              <div className="fund-header">
                <h4>{fund.name}</h4>
                <span className="fund-code">{fund.code}</span>
              </div>
              <div className="fund-balance">
                ₱{parseFloat(fund.current_balance || 0).toLocaleString()}
              </div>
              <div className="fund-type">{fund.account_type}</div>
              <div className="fund-department">{fund.department || 'No Department'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CashierHome;