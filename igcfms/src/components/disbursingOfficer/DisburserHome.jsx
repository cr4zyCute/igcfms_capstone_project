import React, { useState, useEffect } from "react";
import "./css/disburserdashboard.css";
import axios from "axios";
import OverrideRequestTrendanalaytics from "../analytics/OverrideTransactionsAnalystics/OverrideRequestTrendanalaytics";
import ChequeReconciliationRate from "../analytics/chequeAnalysis/ChequeReconciliationRate";
import OutstandingChequesRatio from "../analytics/chequeAnalysis/OutstandingChequesRatio";
import { useCheques } from "../../hooks/useCheques";

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
  
  const [overrideRequests, setOverrideRequests] = useState([]);
  const { data: cheques = [] } = useCheques();
const [fundBalances, setFundBalances] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    dpo: {
      average: 0,
      last30Average: 0,
      last7Average: 0,
      latest: 0,
      sampleSize: 0,
      trend: []
    },
    paymentAccuracy: {
      rate: 0,
      errors: 0,
      total: 0,
      pending: 0,
      resolved: 0
    },
    vendorPerformance: {
    },
    paymentMethods: {
      total: 0,
      breakdown: []
    }
  });
const overrideTotal = overrideRequests.length;
  const overridePending = overrideRequests.filter(req => req.status === "pending").length;
  const overrideApproved = overrideRequests.filter(req => req.status === "approved").length;
  const overrideRejected = overrideRequests.filter(req => req.status === "rejected").length;

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
          axios.get('/api/transactions', { headers }),
          axios.get('/api/fund-accounts', { headers }),
          axios.get('/api/override-requests', { headers }).catch(() => ({ data: [] }))
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

        // Create a mapping of fund account IDs to names
        const fundAccountMap = {};
        allFunds.forEach(fund => {
          fundAccountMap[fund.id] = fund.name;
        });

        // Recent disbursements (last 10) with fund account names
        const recentData = disbursements
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 10)
          .map(tx => ({
            ...tx,
            fundAccountName: fundAccountMap[tx.fund_account_id] || 'N/A'
          }));
        setRecentDisbursements(recentData);

        // Pending override requests
        const pendingData = allOverrides
          .filter(req => req.status === 'pending')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 8);
        setPendingRequests(pendingData);
        
        setOverrideRequests(allOverrides);
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
      <div style={{ padding: '30px' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#000000', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <i className="fas fa-hand-holding-usd"></i> Disbursing Officer Dashboard
          </h2>
        
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
                  <i className="fas fa-chart-line fa-2x" style={{ marginBottom: '10px', display: 'block' }}></i>
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
    <div className="disburser-page">
      <div className="disburser-header">
        <h2 className="disburser-title">
          <i className="fas fa-money-check-alt"></i> Disbursing Officer Dashboard
        </h2>
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
   

      {/* Override Status KPIs */}
      <div className="disburser-kpi-row secondary">
        <div className="disburser-kpi-card">
          <div className="kpi-icon"><i className="fas fa-list"></i></div>
          <div className="kpi-content">
            <div className="kpi-label">Total Overrides</div>
            <div className="kpi-value">{overrideTotal}</div>
          </div>
        </div>
        <div className="disburser-kpi-card">
          <div className="kpi-icon"><i className="fas fa-hourglass-half"></i></div>
          <div className="kpi-content">
            <div className="kpi-label">Pending Review</div>
            <div className="kpi-value">{overridePending}</div>
          </div>
        </div>
        <div className="disburser-kpi-card">
          <div className="kpi-icon"><i className="fas fa-check-circle"></i></div>
          <div className="kpi-content">
            <div className="kpi-label">Approved</div>
            <div className="kpi-value">{overrideApproved}</div>
          </div>
        </div>
        <div className="disburser-kpi-card">
          <div className="kpi-icon"><i className="fas fa-times-circle"></i></div>
          <div className="kpi-content">
            <div className="kpi-label">Rejected</div>
            <div className="kpi-value">{overrideRejected}</div>
          </div>
        </div>
      </div>      {/* Data Tables and Analytics */}
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
                  <th><i className="fas fa-piggy-bank"></i> Funds Account Name</th>
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
                      <td>{disbursement.fundAccountName}</td>
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
    


      </div>

      {/* Analytics Charts Grid */}
      <div className="disburser-data-grid">
        <div className="disburser-table-card" style={{ height: '320px' }}>
          <div className="table-header">
            <h3><i className="fas fa-donut-chart"></i> Cheque Reconciliation Rate</h3>
            <span className="table-subtitle">Cleared cheques matched vs total</span>
          </div>
          <div style={{ height: '240px' }}>
            <ChequeReconciliationRate cheques={cheques} />
          </div>
        </div>

        <div className="disburser-table-card" style={{ height: '320px' }}>
          <div className="table-header">
            <h3><i className="fas fa-bars"></i> Outstanding Cheques Ratio</h3>
            <span className="table-subtitle">Issued but not cleared over 30 days</span>
          </div>
          <div style={{ height: '240px' }}>
            <OutstandingChequesRatio cheques={cheques} />
          </div>
        </div>
      </div>

      {/* Override Transactions Chart - Bottom Section */}
      <div className="disburser-table-card" style={{ marginTop: '10%' }}>
        <div className="table-header">
          <h3><i className="fas fa-chart-line"></i> Override Transactions</h3>
          <span className="table-subtitle">Volume trend</span>
        </div>
        <div style={{ height: '280px' }}>
          <OverrideRequestTrendanalaytics overrideRequests={overrideRequests} isLoading={loading} error={error} />
        </div>
      </div>



    </div>
  );
};

export default DisburserHome;
