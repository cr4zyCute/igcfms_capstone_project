import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './css/dailyKPI.css';

const DailyKPI = ({ transactions = [] }) => {
  const [dailyData, setDailyData] = useState({
    totalCollections: 0,
    totalDisbursements: 0,
    netBalance: 0,
    totalTransactions: 0,
    pendingApprovals: 0
  });
  const [hourlyData, setHourlyData] = useState([]);

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      calculateDailyData();
    }
  }, [transactions]);

  const calculateDailyData = () => {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Filter today's transactions
    const todayTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.created_at).toISOString().split('T')[0];
      return transactionDate === today;
    });
    
    // Calculate totals
    const collections = todayTransactions
      .filter(t => t.transaction_type === 'collection')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    const disbursements = todayTransactions
      .filter(t => t.transaction_type === 'disbursement')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    const pending = todayTransactions.filter(t => t.status === 'pending').length;
    
    setDailyData({
      totalCollections: collections,
      totalDisbursements: disbursements,
      netBalance: collections - disbursements,
      totalTransactions: todayTransactions.length,
      pendingApprovals: pending
    });
    
    // Prepare hourly data for line chart
    const hourlyMap = {};
    for (let h = 0; h < 24; h++) {
      hourlyMap[h] = { hour: h, transactions: 0 };
    }
    
    todayTransactions.forEach(t => {
      const hour = new Date(t.created_at).getHours();
      hourlyMap[hour].transactions += 1;
    });
    
    setHourlyData(Object.values(hourlyMap));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="daily-kpi-container">
      <div className="daily-kpi-header">
        <i className="fas fa-calendar-day"></i>
        <h3>DAILY REPORT (Operational Monitoring)</h3>
      </div>
      
      <div className="daily-kpi-metrics">
        <div className="kpi-metric-card">
          <div className="metric-icon collections-icon">
            <i className="fas fa-coins"></i>
          </div>
          <div className="metric-info">
            <div className="metric-label">Total Collections Today</div>
            <div className="metric-value collections">
              {formatCurrency(dailyData.totalCollections)}
            </div>
          </div>
        </div>
        
        <div className="kpi-metric-card">
          <div className="metric-icon disbursements-icon">
            <i className="fas fa-money-bill-wave"></i>
          </div>
          <div className="metric-info">
            <div className="metric-label">Total Disbursements Today</div>
            <div className="metric-value disbursements">
              {formatCurrency(dailyData.totalDisbursements)}
            </div>
          </div>
        </div>
        
        <div className="kpi-metric-card">
          <div className="metric-icon balance-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="metric-info">
            <div className="metric-label">Net Balance Today</div>
            <div className="metric-value net-balance">
              {formatCurrency(dailyData.netBalance)}
            </div>
          </div>
        </div>
        
        <div className="kpi-metric-card">
          <div className="metric-icon transactions-icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <div className="metric-info">
            <div className="metric-label">Total Transactions Today</div>
            <div className="metric-value transactions">
              {dailyData.totalTransactions}
            </div>
          </div>
        </div>
        
        <div className="kpi-metric-card">
          <div className="metric-icon pending-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="metric-info">
            <div className="metric-label">Pending Approvals Today</div>
            <div className="metric-value pending">
              {dailyData.pendingApprovals}
            </div>
          </div>
        </div>
      </div>
      
      {/* Hourly Transactions Chart */}
      <div className="daily-chart-container">
        <h4>Transactions Per Hour (Daily Activity Trend)</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" label={{ value: 'Hour', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Transactions', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Line type="monotone" dataKey="transactions" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DailyKPI;