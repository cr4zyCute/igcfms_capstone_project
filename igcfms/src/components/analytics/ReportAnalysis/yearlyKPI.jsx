import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import './css/yearlyKPI.css';

const YearlyKPI = ({ transactions = [] }) => {
  const [yearlyData, setYearlyData] = useState({
    totalCollections: 0,
    totalDisbursements: 0,
    yearlyNetBalance: 0,
    yoyGrowth: 0,
    costEfficiencyRatio: 0
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [growthTrendData, setGrowthTrendData] = useState([]);

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      calculateYearlyData();
    }
  }, [transactions]);

  const calculateYearlyData = () => {
    // Get current year dates
    const now = new Date();
    const currentYear = now.getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);
      
      // Filter current year transactions
      const yearTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.created_at);
        return transactionDate >= yearStart && transactionDate <= yearEnd;
      });
      
      // Filter previous year transactions for YoY comparison
      const prevYearStart = new Date(currentYear - 1, 0, 1);
      const prevYearEnd = new Date(currentYear - 1, 11, 31, 23, 59, 59);
      const prevYearTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.created_at);
        return transactionDate >= prevYearStart && transactionDate <= prevYearEnd;
      });
      
      // Calculate current year totals
      const collections = yearTransactions
        .filter(t => t.transaction_type === 'collection')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      const disbursements = yearTransactions
        .filter(t => t.transaction_type === 'disbursement')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      // Calculate previous year totals
      const prevCollections = prevYearTransactions
        .filter(t => t.transaction_type === 'collection')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      // Calculate YoY growth
      const yoyGrowth = prevCollections > 0 
        ? ((collections - prevCollections) / prevCollections) * 100 
        : 0;
      
      // Calculate cost efficiency ratio
      const costEfficiencyRatio = collections > 0 
        ? (disbursements / collections) * 100 
        : 0;
      
      setYearlyData({
        totalCollections: collections,
        totalDisbursements: disbursements,
        yearlyNetBalance: collections - disbursements,
        yoyGrowth: yoyGrowth,
        costEfficiencyRatio: costEfficiencyRatio
      });
      
      // Prepare monthly data for bar chart
      const monthlyMap = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let m = 0; m < 12; m++) {
        monthlyMap[m] = {
          month: monthNames[m],
          collections: 0,
          disbursements: 0,
          netBalance: 0
        };
      }
      
      yearTransactions.forEach(t => {
        const month = new Date(t.created_at).getMonth();
        const amount = parseFloat(t.amount || 0);
        
        if (t.transaction_type === 'collection') {
          monthlyMap[month].collections += amount;
        } else if (t.transaction_type === 'disbursement') {
          monthlyMap[month].disbursements += amount;
        }
      });
      
      // Calculate net balance for each month
      Object.keys(monthlyMap).forEach(m => {
        monthlyMap[m].netBalance = monthlyMap[m].collections - monthlyMap[m].disbursements;
      });
      
      setMonthlyData(Object.values(monthlyMap));
      
      // Prepare growth trend data (last 5 years)
      const growthData = [];
      for (let y = currentYear - 4; y <= currentYear; y++) {
        const yearStart = new Date(y, 0, 1);
        const yearEnd = new Date(y, 11, 31, 23, 59, 59);
        
        const yearTrans = transactions.filter(t => {
          const transactionDate = new Date(t.created_at);
          return transactionDate >= yearStart && transactionDate <= yearEnd;
        });
        
        const yearCollections = yearTrans
          .filter(t => t.transaction_type === 'collection')
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        
        growthData.push({
          year: y.toString(),
          collections: yearCollections
        });
      }
      
      setGrowthTrendData(growthData);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="yearly-kpi-container">
      <div className="yearly-kpi-header">
        <i className="fas fa-calendar"></i>
        <h3>YEARLY REPORT (Management & Planning)</h3>
      </div>
      
      {/* KPI Metrics */}
      <div className="yearly-kpi-metrics">
        <div className="kpi-metric-small">
          <div className="metric-label">Total Collections YTD</div>
          <div className="metric-value collections">
            {formatCurrency(yearlyData.totalCollections)}
          </div>
        </div>
        
        <div className="kpi-metric-small">
          <div className="metric-label">Total Disbursements YTD</div>
          <div className="metric-value disbursements">
            {formatCurrency(yearlyData.totalDisbursements)}
          </div>
        </div>
        
        <div className="kpi-metric-small">
          <div className="metric-label">Yearly Net Balance</div>
          <div className="metric-value net-balance">
            {formatCurrency(yearlyData.yearlyNetBalance)}
          </div>
        </div>
        
        <div className="kpi-metric-small">
          <div className="metric-label">Year-over-Year Growth</div>
          <div className={`metric-value ${yearlyData.yoyGrowth >= 0 ? 'growth-positive' : 'growth-negative'}`}>
            {formatPercentage(yearlyData.yoyGrowth)}
          </div>
        </div>
        
        <div className="kpi-metric-small">
          <div className="metric-label">Cost Efficiency Ratio</div>
          <div className="metric-value efficiency">
            {yearlyData.costEfficiencyRatio.toFixed(1)}%
          </div>
        </div>
      </div>
      
      {/* Graphs Section */}
      <div className="yearly-graphs">
        {/* Bar Chart: Monthly Collections vs Disbursements */}
        <div className="graph-container bar-chart-container">
          <h4>Collections vs Disbursements (per month)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="collections" fill="#10b981" name="Collections" />
              <Bar dataKey="disbursements" fill="#ef4444" name="Disbursements" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Stacked Bar Chart: Yearly Net Balance */}
        <div className="graph-container stacked-chart-container">
          <h4>Stacked Chart: Yearly Net Balance</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="netBalance" fill="#10b981" name="Net Balance" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Line Chart: Year-over-Year Growth Trend */}
        <div className="graph-container growth-chart-container">
          <h4>Year-over-Year Growth Trend</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={growthTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="collections" stroke="#3b82f6" strokeWidth={3} name="Collections" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default YearlyKPI;
