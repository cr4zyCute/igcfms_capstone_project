import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, PieChart, Pie, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import './css/monthlyKPI.css';

const MonthlyKPI = ({ transactions = [] }) => {
  const [monthlyData, setMonthlyData] = useState({
    totalCollections: 0,
    totalDisbursements: 0,
    collectionRate: 0,
    target: 1000000, // Default target, can be fetched from backend
    approvedCount: 0,
    rejectedCount: 0,
    avgProcessingTime: 0
  });
  const [dailyData, setDailyData] = useState([]);
  const [approvalData, setApprovalData] = useState([]);
  const [processingTimeData, setProcessingTimeData] = useState([]);

  useEffect(() => {
    console.log('MonthlyKPI - Received transactions:', transactions?.length || 0);
    if (transactions && transactions.length > 0) {
      calculateMonthlyData();
    }
  }, [transactions]);

  const calculateMonthlyData = () => {
    // Get current month dates
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
    console.log('MonthlyKPI - Date range:', firstDay, 'to', lastDay);
      
      // Filter this month's transactions
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.created_at);
        return transactionDate >= firstDay && transactionDate <= lastDay;
      });
      
      console.log('MonthlyKPI - This month transactions:', monthTransactions.length);
      console.log('MonthlyKPI - Sample transaction:', monthTransactions[0]);
      
      // Calculate totals
      const collections = monthTransactions
        .filter(t => t.transaction_type === 'collection')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      const disbursements = monthTransactions
        .filter(t => t.transaction_type === 'disbursement')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      // Calculate approval distribution
      const approved = monthTransactions.filter(t => t.status === 'approved').length;
      const rejected = monthTransactions.filter(t => t.status === 'rejected').length;
      
      // Calculate collection rate
      const target = 1000000; // This should come from backend
      const collectionRate = target > 0 ? (collections / target) * 100 : 0;
      
      // Calculate average processing time
      const processingTimes = monthTransactions
        .filter(t => t.processed_at && t.created_at)
        .map(t => {
          const created = new Date(t.created_at);
          const processed = new Date(t.processed_at);
          return (processed - created) / (1000 * 60 * 60); // hours
        });
      const avgProcessingTime = processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        : 0;
      
      const calculatedData = {
        totalCollections: collections,
        totalDisbursements: disbursements,
        collectionRate: collectionRate,
        target: target,
        approvedCount: approved,
        rejectedCount: rejected,
        avgProcessingTime: avgProcessingTime
      };
      
      console.log('MonthlyKPI - Calculated data:', calculatedData);
      
      setMonthlyData(calculatedData);
      
      // Prepare daily data for line chart
      const dailyMap = {};
      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        dailyMap[dateKey] = { date: dateKey, collections: 0, disbursements: 0 };
      }
      
      monthTransactions.forEach(t => {
        const dateKey = new Date(t.created_at).toISOString().split('T')[0];
        if (dailyMap[dateKey]) {
          if (t.transaction_type === 'collection') {
            dailyMap[dateKey].collections += parseFloat(t.amount || 0);
          } else if (t.transaction_type === 'disbursement') {
            dailyMap[dateKey].disbursements += parseFloat(t.amount || 0);
          }
        }
      });
      
      setDailyData(Object.values(dailyMap).map(d => ({
        date: new Date(d.date).getDate(),
        collections: d.collections,
        disbursements: d.disbursements
      })));
      
      // Prepare approval data for pie chart
      setApprovalData([
        { name: 'Approved', value: approved, color: '#10b981' },
        { name: 'Rejected', value: rejected, color: '#ef4444' }
      ]);
      
      // Prepare processing time data by department
      const deptMap = {};
      monthTransactions.forEach(t => {
        if (t.processed_at && t.created_at && t.department) {
          const dept = t.department;
          const created = new Date(t.created_at);
          const processed = new Date(t.processed_at);
          const hours = (processed - created) / (1000 * 60 * 60);
          
          if (!deptMap[dept]) {
            deptMap[dept] = { total: 0, count: 0 };
          }
          deptMap[dept].total += hours;
          deptMap[dept].count += 1;
        }
      });
      
      const processingData = Object.keys(deptMap).map(dept => ({
        department: dept,
        avgTime: deptMap[dept].total / deptMap[dept].count
      }));
      
      setProcessingTimeData(processingData);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getGaugeColor = (rate) => {
    if (rate >= 90) return '#10b981';
    if (rate >= 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="monthly-kpi-container">
      <div className="monthly-kpi-header">
        <div className="header-left">
          <i className="fas fa-calendar-alt"></i>
          <h3>MONTHLY REPORT (Performance Evaluation)</h3>
        </div>
        <div className="header-legend">
          <span className="legend-item">
            <span className="legend-dot collections-dot"></span>
            Collections
          </span>
          <span className="legend-item">
            <span className="legend-dot disbursements-dot"></span>
            Disbursements
          </span>
        </div>
      </div>
      
      {/* KPI Metrics */}
      <div className="monthly-kpi-metrics">
        <div className="kpi-metric-small">
          <div className="metric-label">Total Collections</div>
          <div className="metric-value collections">
            {formatCurrency(monthlyData.totalCollections)}
          </div>
        </div>
        
        <div className="kpi-metric-small">
          <div className="metric-label">Total Disbursements</div>
          <div className="metric-value disbursements">
            {formatCurrency(monthlyData.totalDisbursements)}
          </div>
        </div>
        
        <div className="kpi-metric-small">
          <div className="metric-label">Collection Rate</div>
          <div className="metric-value rate">
            {monthlyData.collectionRate.toFixed(1)}%
          </div>
        </div>
        
        <div className="kpi-metric-small">
          <div className="metric-label">Avg Processing Time</div>
          <div className="metric-value time">
            {monthlyData.avgProcessingTime.toFixed(1)}h
          </div>
        </div>
      </div>
      
      {/* Graphs Section */}
      <div className="monthly-graphs">
        {/* Line Chart: Daily Collections vs Disbursements */}
        <div className="graph-container line-chart-container">
          <h4>Daily Collections vs Disbursements</h4>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: '600' }} />
                <Line type="monotone" dataKey="collections" stroke="#10b981" strokeWidth={3} name="Collections" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="disbursements" stroke="#ef4444" strokeWidth={3} name="Disbursements" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Pie Chart: Approved vs Rejected */}
        <div className="graph-container pie-chart-container">
          <h4>Approved vs Rejected</h4>
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={approvalData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {approvalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Bar Chart: Processing Time by Department */}
        <div className="graph-container bar-chart-container">
          <h4>Avg Processing Time by Department</h4>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processingTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="department" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip formatter={(value) => `${value.toFixed(1)}h`} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Bar dataKey="avgTime" fill="#000000" name="Hours" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Gauge: Collection Rate */}
        <div className="graph-container gauge-container">
          <h4>Collection Rate Target</h4>
          <div className="gauge-wrapper">
            <div className="gauge">
              <div 
                className="gauge-fill" 
                style={{ 
                  width: `${Math.min(monthlyData.collectionRate, 100)}%`
                }}
              ></div>
            </div>
            <div className="gauge-value">
              {monthlyData.collectionRate.toFixed(1)}%
            </div>
            <div className="gauge-label">
              {formatCurrency(monthlyData.totalCollections)} / {formatCurrency(monthlyData.target)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyKPI;
