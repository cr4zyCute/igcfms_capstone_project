import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Chart from 'chart.js/auto';
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
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const calculateDailyData = () => {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Filter today's transactions
    const todayTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.created_at).toISOString().split('T')[0];
      return transactionDate === today;
    });
    
    // Use mock data if no transactions available
    const useMockData = todayTransactions.length === 0;
    
    if (useMockData) {
      // Mock data for demonstration
      const mockCollections = 125000;
      const mockDisbursements = 87500;
      
      setDailyData({
        totalCollections: mockCollections,
        totalDisbursements: mockDisbursements,
        netBalance: mockCollections - mockDisbursements,
        totalTransactions: 24,
        pendingApprovals: 3
      });
      
      // Mock hourly data with realistic distribution
      const mockHourlyData = [
        { hour: 0, transactions: 0 },
        { hour: 1, transactions: 0 },
        { hour: 2, transactions: 0 },
        { hour: 3, transactions: 0 },
        { hour: 4, transactions: 0 },
        { hour: 5, transactions: 0 },
        { hour: 6, transactions: 1 },
        { hour: 7, transactions: 2 },
        { hour: 8, transactions: 4 },
        { hour: 9, transactions: 5 },
        { hour: 10, transactions: 3 },
        { hour: 11, transactions: 2 },
        { hour: 12, transactions: 1 },
        { hour: 13, transactions: 3 },
        { hour: 14, transactions: 4 },
        { hour: 15, transactions: 2 },
        { hour: 16, transactions: 1 },
        { hour: 17, transactions: 0 },
        { hour: 18, transactions: 0 },
        { hour: 19, transactions: 0 },
        { hour: 20, transactions: 0 },
        { hour: 21, transactions: 0 },
        { hour: 22, transactions: 0 },
        { hour: 23, transactions: 0 }
      ];
      
      setHourlyData(mockHourlyData);
    } else {
      // Calculate totals from real data
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
    }
  };

  useEffect(() => {
    // Always calculate data (will use mock data if no transactions)
    calculateDailyData();
  }, [transactions]);

  useEffect(() => {
    if (hourlyData.length > 0) {
      initializeChart();
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [hourlyData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const initializeChart = () => {
    if (!chartRef.current) {
      console.log('Canvas ref not available');
      return;
    }

    // Wait for canvas to be properly mounted
    setTimeout(() => {
      if (!chartRef.current) {
        console.log('Canvas ref not available after timeout');
        return;
      }

      const ctx = chartRef.current.getContext('2d');

      // Destroy existing chart
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Prepare chart data
      const chartLabels = hourlyData.map(d => `${d.hour}:00`);
      const chartData = hourlyData.map(d => d.transactions);

      // Monochrome gradient (black to light gray)
      const gradient = ctx.createLinearGradient(0, 0, 0, chartRef.current?.clientHeight || 250);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.05)');

      // Border gradient
      const borderGradient = ctx.createLinearGradient(0, 0, chartRef.current?.clientWidth || 400, 0);
      borderGradient.addColorStop(0, '#000000');
      borderGradient.addColorStop(1, '#000000');

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: chartLabels,
          datasets: [{
            label: 'Transactions per hour',
            data: chartData,
            borderColor: borderGradient,
            backgroundColor: gradient,
            borderWidth: 3,
            fill: 'start',
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: '#0f172a',
            pointBorderColor: '#f9fafb',
            pointBorderWidth: 2,
            pointHitRadius: 12,
            spanGaps: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1400,
            easing: 'easeInOutCubic'
          },
          layout: {
            padding: {
              top: 16,
              bottom: 8,
              left: 8,
              right: 16
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#111827',
              titleColor: '#f9fafb',
              bodyColor: '#f3f4f6',
              borderColor: '#0f172a',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: false,
              padding: 12,
              titleFont: { size: 12, weight: '700' },
              bodyFont: { size: 11, weight: '500' },
              callbacks: {
                title: (context) => context[0].label,
                label: (context) => `Transactions: ${context.parsed.y}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: '#1f2937',
                font: { size: 11, weight: '600' },
                padding: 10,
                precision: 0
              },
              grid: {
                color: 'rgba(17, 24, 39, 0.08)',
                drawBorder: false,
                tickLength: 0
              }
            },
            x: {
              ticks: {
                color: '#1f2937',
                font: { size: 11, weight: '600' },
                padding: 8,
                maxRotation: 0,
                minRotation: 0
              },
              grid: {
                color: 'rgba(17, 24, 39, 0.06)',
                drawBorder: false,
                tickLength: 0
              }
            }
          },
          elements: {
            line: {
              borderJoinStyle: 'round'
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });

      console.log('Daily transactions chart created', { chartLabels, chartData });
    }, 100);
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
      
      {/* Chart Section with Summary Box */}
      <div className="daily-chart-section">
        {/* Left Summary Box */}
        <div className="daily-summary-box">
          <h4>Daily Report Status</h4>
          
          {/* Role Report Status */}
          <div className="role-cards-container">
            {/* Disburser */}
            <div className="role-card">
              <div className="role-card-header">
                <div className="role-card-title">
                  <i className="fas fa-hand-holding-usd"></i>
                  <span>Disburser</span>
                </div>
                <div className="role-status-indicator active"></div>
              </div>
              <div className="role-card-content">
                <span className="role-card-label">Reports Sent</span>
                <span className="role-card-value active">3</span>
              </div>
            </div>

            {/* Collector */}
            <div className="role-card">
              <div className="role-card-header">
                <div className="role-card-title">
                  <i className="fas fa-coins"></i>
                  <span>Collector</span>
                </div>
                <div className="role-status-indicator active"></div>
              </div>
              <div className="role-card-content">
                <span className="role-card-label">Reports Sent</span>
                <span className="role-card-value active">5</span>
              </div>
            </div>

            {/* Cashier */}
            <div className="role-card">
              <div className="role-card-header">
                <div className="role-card-title">
                  <i className="fas fa-cash-register"></i>
                  <span>Cashier</span>
                </div>
                <div className="role-status-indicator inactive"></div>
              </div>
              <div className="role-card-content">
                <span className="role-card-label">Reports Sent</span>
                <span className="role-card-value inactive">0</span>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="summary-stats">
            <div className="summary-stat-row">
              <span className="summary-stat-label">Total Reports Today</span>
              <span className="summary-stat-value">8</span>
            </div>
            <div className="summary-stat-row">
              <span className="summary-stat-label">Active Roles</span>
              <span className="summary-stat-value small success">2/3</span>
            </div>
          </div>
        </div>

        {/* Right Chart Container */}
        <div className="daily-chart-container">
          <h4>Transactions Per Hour (Daily Activity Trend)</h4>
          <div className="chart-container">
            <canvas ref={chartRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyKPI;