import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "./css/disburserdashboard.css";

const DisburserKPIs = () => {
  const [disbursementStats, setDisbursementStats] = useState({
    todayDisbursements: 0,
    weeklyDisbursements: 0,
    monthlyDisbursements: 0,
    totalDisbursements: 0,
    pendingApprovals: 0,
    approvedDisbursements: 0,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError("");
        const token = localStorage.getItem('token');
        if (!token) {
          setError("Authentication required. Please log in.");
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        const [transactionsRes, overrideRes] = await Promise.all([
          axios.get('/api/transactions', { headers }),
          axios.get('/api/override-requests', { headers }).catch(() => ({ data: [] })),
        ]);

        const allTransactions = transactionsRes.data || [];
        const allOverrides = overrideRes.data || [];

        const disbursements = allTransactions.filter(tx => tx.type === 'Disbursement');

        const today = new Date().toDateString();
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

        const weekStart = getWeekStart();
        const monthStart = getMonthStart();

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

        const pendingApprovals = allOverrides.filter(req => req.status === 'pending').length;
        const approvedDisbursements = allOverrides.filter(req => req.status === 'approved').length;

        setDisbursementStats({
          todayDisbursements,
          weeklyDisbursements,
          monthlyDisbursements,
          totalDisbursements,
          pendingApprovals,
          approvedDisbursements,
        });
      } catch (err) {
        console.error('Disburser KPIs error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load KPI data');
      }
    };

    fetchStats();
  }, []);

  return (
    <>
      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

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
      </div>
    </>
  );
};

export default DisburserKPIs;
