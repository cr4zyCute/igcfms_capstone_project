import React, { useState, useEffect } from "react";
import "./css/disburserdashboard.css";
import axios from "axios";

const DisburserHome = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [disbursementStats, setDisbursementStats] = useState({
    todayDisbursements: 0,
    weeklyDisbursements: 0,
    monthlyDisbursements: 0,
    totalDisbursements: 0,
    pendingApprovals: 0,
    approvedDisbursements: 0,
    averageDisbursement: 0,
    topDepartment: "",
  });
  const [recentDisbursements, setRecentDisbursements] = useState([]);
  const [disbursementsByDepartment, setDisbursementsByDepartment] = useState([]);
  const [disbursementsByCategory, setDisbursementsByCategory] = useState([]);
  const [dailyDisbursementTrend, setDailyDisbursementTrend] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [fundBalances, setFundBalances] = useState([]);

  useEffect(() => {
    const fetchDisburserData = async () => {
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

        // Fetch transactions (disbursements only), fund accounts, and override requests
        const [transactionsRes, fundsRes, overrideRes] = await Promise.all([
          axios.get('http://localhost:8000/api/transactions', { headers }),
          axios.get('http://localhost:8000/api/fund-accounts', { headers }),
          axios.get('http://localhost:8000/api/override-requests', { headers }).catch(() => ({ data: [] }))
        ]);

        const allTransactions = transactionsRes.data || [];
        const allFunds = fundsRes.data || [];
        const allOverrides = overrideRes.data || [];

        // Filter only disbursement transactions
        const disbursements = allTransactions.filter(tx => tx.type === 'Disbursement');

        // Calculate date ranges
        const today = new Date().toDateString();
        const weekStart = getWeekStart();
        const monthStart = getMonthStart();

        // Calculate disbursement statistics
        const todayDisbursements = disbursements
          .filter(tx => new Date(tx.created_at).toDateString() === today)
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

        const weeklyDisbursements = disbursements
          .filter(tx => new Date(tx.created_at) >= weekStart)
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

        const monthlyDisbursements = disbursements
          .filter(tx => new Date(tx.created_at) >= monthStart)
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

        const totalDisbursements = disbursements
          .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

        const averageDisbursement = disbursements.length > 0 ? totalDisbursements / disbursements.length : 0;

        // Override/approval statistics
        const pendingApprovals = allOverrides.filter(req => req.status === 'pending').length;
        const approvedDisbursements = allOverrides.filter(req => req.status === 'approved').length;

        // Find top disbursement department
        const departmentTotals = {};
        disbursements.forEach(tx => {
          const dept = tx.department || 'Other';
          departmentTotals[dept] = (departmentTotals[dept] || 0) + parseFloat(tx.amount || 0);
        });
        const topDepartment = Object.keys(departmentTotals).reduce((a, b) => 
          departmentTotals[a] > departmentTotals[b] ? a : b, 'None');

        setDisbursementStats({
          todayDisbursements,
          weeklyDisbursements,
          monthlyDisbursements,
          totalDisbursements,
          pendingApprovals,
          approvedDisbursements,
          averageDisbursement,
          topDepartment,
        });

        // Disbursements by department for charts
        const departmentData = Object.entries(departmentTotals).map(([department, amount]) => ({
          department,
          amount,
          count: disbursements.filter(tx => (tx.department || 'Other') === department).length
        })).sort((a, b) => b.amount - a.amount);
        setDisbursementsByDepartment(departmentData);

        // Disbursements by category
        const categoryTotals = {};
        disbursements.forEach(tx => {
          const category = tx.category || 'Operational';
          categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(tx.amount || 0);
        });
        const categoryData = Object.entries(categoryTotals).map(([category, amount]) => ({
          category,
          amount,
          count: disbursements.filter(tx => (tx.category || 'Operational') === category).length
        })).sort((a, b) => b.amount - a.amount);
        setDisbursementsByCategory(categoryData);

        // Daily disbursement trend (last 7 days)
        const dailyTrend = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toDateString();
          
          const dayDisbursements = disbursements
            .filter(tx => new Date(tx.created_at).toDateString() === dateStr)
            .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
          
          dailyTrend.push({
            date: date.toLocaleDateString(),
            amount: dayDisbursements,
            count: disbursements.filter(tx => new Date(tx.created_at).toDateString() === dateStr).length
          });
        }
        setDailyDisbursementTrend(dailyTrend);

        // Recent disbursements (last 10)
        const recentData = disbursements
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 10);
        setRecentDisbursements(recentData);

        // Pending override requests
        const pendingData = allOverrides
          .filter(req => req.status === 'pending')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 8);
        setPendingRequests(pendingData);

        // Fund balances (focus on expense and asset accounts)
        const relevantFunds = allFunds
          .filter(fund => fund.account_type === 'Expense' || fund.account_type === 'Asset')
          .sort((a, b) => parseFloat(b.current_balance || 0) - parseFloat(a.current_balance || 0))
          .slice(0, 8);
        setFundBalances(relevantFunds);

      } catch (err) {
        console.error('Disburser dashboard error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load disburser data');
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

    fetchDisburserData();
  }, []);

  if (loading) {
    return (
      <div className="disburser-spinner-container">
        <div className="disburser-spinner"></div>
        <div className="disburser-loading-text">Loading disburser dashboard...</div>
      </div>
    );
  }

  return (
    <div className="disburser-page">
      <div className="disburser-header">
        <h2 className="disburser-title">
          <i className="fas fa-money-check-alt"></i> Disbursing Officer Dashboard
        </h2>
        <p className="disburser-subtitle">Monitor disbursements, approvals, and fund management</p>
      </div>

      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {/* Disbursement KPIs */}
      <div className="disburser-kpi-row">
        <div className="disburser-kpi-card primary">
          <div className="kpi-icon">
            <i className="fas fa-calendar-day"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Today's Disbursements</div>
            <div className="kpi-value">₱{disbursementStats.todayDisbursements.toLocaleString()}</div>
          </div>
        </div>
        <div className="disburser-kpi-card danger">
          <div className="kpi-icon">
            <i className="fas fa-calendar-week"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Weekly Disbursements</div>
            <div className="kpi-value">₱{disbursementStats.weeklyDisbursements.toLocaleString()}</div>
          </div>
        </div>
        <div className="disburser-kpi-card warning">
          <div className="kpi-icon">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Monthly Disbursements</div>
            <div className="kpi-value">₱{disbursementStats.monthlyDisbursements.toLocaleString()}</div>
          </div>
        </div>
        <div className="disburser-kpi-card info">
          <div className="kpi-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Total Disbursements</div>
            <div className="kpi-value">₱{disbursementStats.totalDisbursements.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="disburser-kpi-row secondary">
        <div className="disburser-kpi-card">
          <div className="kpi-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Pending Approvals</div>
            <div className="kpi-value">{disbursementStats.pendingApprovals}</div>
          </div>
        </div>
        <div className="disburser-kpi-card">
          <div className="kpi-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Approved Requests</div>
            <div className="kpi-value">{disbursementStats.approvedDisbursements}</div>
          </div>
        </div>
        <div className="disburser-kpi-card">
          <div className="kpi-icon">
            <i className="fas fa-calculator"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Average Disbursement</div>
            <div className="kpi-value">₱{disbursementStats.averageDisbursement.toLocaleString()}</div>
          </div>
        </div>
        <div className="disburser-kpi-card">
          <div className="kpi-icon">
            <i className="fas fa-building"></i>
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Top Department</div>
            <div className="kpi-value">{disbursementStats.topDepartment}</div>
          </div>
        </div>
      </div>

      {/* Data Tables and Analytics */}
      <div className="disburser-data-grid">
        
        {/* Recent Disbursements */}
        <div className="disburser-table-card">
          <div className="table-header">
            <h3><i className="fas fa-history"></i> Recent Disbursements</h3>
            <span className="table-subtitle">Latest disbursement transactions</span>
          </div>
          <div className="table-container">
            <table className="disburser-table">
              <thead>
                <tr>
                  <th><i className="fas fa-hashtag"></i> ID</th>
                  <th><i className="fas fa-money-bill"></i> Amount</th>
                  <th><i className="fas fa-tag"></i> Category</th>
                  <th><i className="fas fa-building"></i> Department</th>
                  <th><i className="fas fa-user"></i> Recipient</th>
                  <th><i className="fas fa-calendar"></i> Date</th>
                </tr>
              </thead>
              <tbody>
                {recentDisbursements.length > 0 ? (
                  recentDisbursements.map((disbursement) => (
                    <tr key={disbursement.id}>
                      <td>#{disbursement.id}</td>
                      <td className="amount-negative">₱{parseFloat(disbursement.amount || 0).toLocaleString()}</td>
                      <td>{disbursement.category || 'N/A'}</td>
                      <td>{disbursement.department || 'N/A'}</td>
                      <td>{disbursement.recipient || 'N/A'}</td>
                      <td>{new Date(disbursement.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-data">
                      <i className="fas fa-inbox"></i>
                      <p>No recent disbursements found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disbursements by Department */}
        <div className="disburser-table-card">
          <div className="table-header">
            <h3><i className="fas fa-chart-pie"></i> Disbursements by Department</h3>
            <span className="table-subtitle">Spending breakdown by department</span>
          </div>
          <div className="department-grid">
            {disbursementsByDepartment.slice(0, 6).map((department, index) => (
              <div key={department.department} className="department-card">
                <div className="department-header">
                  <h4>{department.department}</h4>
                  <span className="department-count">{department.count} disbursements</span>
                </div>
                <div className="department-amount">₱{department.amount.toLocaleString()}</div>
                <div className="department-bar">
                  <div 
                    className="department-progress" 
                    style={{ 
                      width: `${(department.amount / disbursementsByDepartment[0]?.amount) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Disbursement Trend */}
        <div className="disburser-table-card">
          <div className="table-header">
            <h3><i className="fas fa-chart-area"></i> Daily Disbursement Trend</h3>
            <span className="table-subtitle">Last 7 days spending pattern</span>
          </div>
          <div className="trend-container">
            {dailyDisbursementTrend.map((day, index) => (
              <div key={day.date} className="trend-day">
                <div className="trend-bar-container">
                  <div 
                    className="trend-bar disbursement" 
                    style={{ 
                      height: `${Math.max((day.amount / Math.max(...dailyDisbursementTrend.map(d => d.amount))) * 100, 5)}%` 
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

        {/* Pending Approval Requests */}
        <div className="disburser-table-card">
          <div className="table-header">
            <h3><i className="fas fa-clock"></i> Pending Approval Requests</h3>
            <span className="table-subtitle">Requests requiring approval</span>
          </div>
          <div className="requests-container">
            {pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <span className="request-id">Request #{request.id}</span>
                    <span className="request-status pending">PENDING</span>
                  </div>
                  <div className="request-details">
                    <div className="request-reason">{request.reason || 'Override request'}</div>
                    <div className="request-transaction">Transaction #{request.transaction_id}</div>
                  </div>
                  <div className="request-date">{new Date(request.created_at).toLocaleDateString()}</div>
                  <div className="request-actions">
                    <button className="approve-btn">
                      <i className="fas fa-check"></i> Approve
                    </button>
                    <button className="reject-btn">
                      <i className="fas fa-times"></i> Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">
                <i className="fas fa-check-circle"></i>
                <p>No pending approval requests.</p>
              </div>
            )}
          </div>
        </div>

        {/* Fund Balances */}
        <div className="disburser-table-card">
          <div className="table-header">
            <h3><i className="fas fa-university"></i> Fund Account Balances</h3>
            <span className="table-subtitle">Available funds for disbursement</span>
          </div>
          <div className="funds-container">
            {fundBalances.map((fund) => (
              <div key={fund.id} className="fund-balance-card">
                <div className="fund-info">
                  <div className="fund-name">{fund.name}</div>
                  <div className="fund-code">{fund.code} • {fund.account_type}</div>
                </div>
                <div className="fund-balance">
                  <div className="balance-amount">₱{parseFloat(fund.current_balance || 0).toLocaleString()}</div>
                  <div className={`balance-status ${parseFloat(fund.current_balance || 0) > 100000 ? 'healthy' : 'low'}`}>
                    {parseFloat(fund.current_balance || 0) > 100000 ? 'Healthy' : 'Low Balance'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disbursement Categories */}
        <div className="disburser-table-card">
          <div className="table-header">
            <h3><i className="fas fa-tags"></i> Disbursement Categories</h3>
            <span className="table-subtitle">Spending by category type</span>
          </div>
          <div className="category-grid">
            {disbursementsByCategory.slice(0, 4).map((category, index) => (
              <div key={category.category} className="category-card">
                <div className="category-header">
                  <h4>{category.category}</h4>
                  <span className="category-count">{category.count} transactions</span>
                </div>
                <div className="category-amount">₱{category.amount.toLocaleString()}</div>
                <div className="category-bar">
                  <div 
                    className="category-progress disbursement" 
                    style={{ 
                      width: `${(category.amount / disbursementsByCategory[0]?.amount) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DisburserHome;