import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import './css/dailyKPI.css';

const DailyKPI = ({ transactions = [], reports = [] }) => {
  const [dailyData, setDailyData] = useState({
    totalCollections: 0,
    totalDisbursements: 0,
    netBalance: 0,
    totalTransactions: 0,
    pendingApprovals: 0
  });
  const [hourlyData, setHourlyData] = useState([]);
  const [hasDailyTransactions, setHasDailyTransactions] = useState(false);
  const [roleSummary, setRoleSummary] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalRecords: 0,
    activeRoles: 0,
    totalReportsGenerated: 0
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [historyData, setHistoryData] = useState([]);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const calculateDailyData = () => {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Filter today's transactions
    const todayTransactions = transactions.filter(t => {
      const createdAt = new Date(t.created_at || t.createdAt || t.created_at_local);
      if (Number.isNaN(createdAt.getTime())) return false;
      const transactionDate = createdAt.toISOString().split('T')[0];
      return transactionDate === today;
    });
    
    const hasTransactions = todayTransactions.length > 0;
    setHasDailyTransactions(hasTransactions);

    const collections = todayTransactions
      .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'collection')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

    const disbursements = todayTransactions
      .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'disbursement')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

    const pending = todayTransactions.filter(t => (t.status || '').toLowerCase() === 'pending').length;

    setDailyData({
      totalCollections: collections,
      totalDisbursements: disbursements,
      netBalance: collections - disbursements,
      totalTransactions: todayTransactions.length,
      pendingApprovals: pending
    });

    const hourlyBuckets = Array.from({ length: 24 }, (_, hour) => ({ hour, transactions: 0 }));

    todayTransactions.forEach(t => {
      const createdAt = new Date(t.created_at || t.createdAt);
      if (!Number.isNaN(createdAt.getTime())) {
        const hour = createdAt.getHours();
        if (hourlyBuckets[hour]) {
          hourlyBuckets[hour].transactions += 1;
        }
      }
    });

    const computedHourlyData = hourlyBuckets.filter(bucket => bucket.transactions > 0);
    setHourlyData(computedHourlyData.length > 0 ? computedHourlyData : hourlyBuckets);

    // Filter today's reports
    const todayReports = reports.filter(r => {
      const generatedAt = new Date(r.generated_at || r.createdAt || r.created_at);
      if (Number.isNaN(generatedAt.getTime())) return false;
      const reportDate = generatedAt.toISOString().split('T')[0];
      return reportDate === today;
    });

    // Combine transactions and reports for role tracking
    const rolesMap = {};

    // Track transaction activity by role
    todayTransactions.forEach(transaction => {
      const role = transaction.user_role
        || transaction.role
        || transaction.user?.role
        || transaction.creator?.role
        || transaction.created_by_role
        || 'Unspecified';
      
      if (!rolesMap[role]) {
        rolesMap[role] = { transactions: 0, reports: 0 };
      }
      rolesMap[role].transactions += 1;
    });

    // Track report generation activity by role
    todayReports.forEach(report => {
      const userData = report.generated_by && typeof report.generated_by === 'object'
        ? report.generated_by
        : null;
      const role = userData?.role || report.user_role || 'Unspecified';
      
      if (!rolesMap[role]) {
        rolesMap[role] = { transactions: 0, reports: 0 };
      }
      rolesMap[role].reports += 1;
    });

    let roleList = Object.entries(rolesMap)
      .map(([role, counts]) => ({ 
        role, 
        count: counts.transactions + counts.reports,
        transactions: counts.transactions,
        reports: counts.reports
      }))
      .sort((a, b) => b.count - a.count);

    if (roleList.length === 0 && todayTransactions.length > 0) {
      const typeCounts = todayTransactions.reduce((acc, t) => {
        const kind = (t.transaction_type || t.type || 'Transaction').toLowerCase();
        const label = kind === 'collection' ? 'Collections' : kind === 'disbursement' ? 'Disbursements' : 'Transactions';
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {});
      roleList = Object.entries(typeCounts)
        .map(([role, count]) => ({ role, count, transactions: count, reports: 0 }))
        .sort((a, b) => b.count - a.count);
    }

    setRoleSummary(roleList);
    setSummaryStats({
      totalRecords: todayTransactions.length,
      activeRoles: roleList.length,
      totalReportsGenerated: todayReports.length
    });
  };

  useEffect(() => {
    // Always calculate data (will use mock data if no transactions)
    calculateDailyData();
  }, [transactions, reports]);

  useEffect(() => {
    if (hourlyData.length > 0) {
      initializeChart();
    } else if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
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

  const handleOpenHistory = () => {
    setShowHistoryModal(true);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setSelectedDate(yesterday.toISOString().split('T')[0]);
    loadHistoryData(yesterday.toISOString().split('T')[0]);
  };

  const handleCloseHistory = () => {
    setShowHistoryModal(false);
    setHistoryData([]);
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    loadHistoryData(newDate);
  };

  const loadHistoryData = (date) => {
    if (!date) return;
    
    const dateTransactions = transactions.filter(t => {
      const createdAt = new Date(t.created_at || t.createdAt || t.created_at_local);
      if (Number.isNaN(createdAt.getTime())) return false;
      const transactionDate = createdAt.toISOString().split('T')[0];
      return transactionDate === date;
    });

    setHistoryData(dateTransactions);
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

    }, 100);
  };

  return (
    <div className="daily-kpi-container">
      <div className="daily-kpi-header">
        <div className="header-left">
          <i className="fas fa-calendar-day"></i>
          <h3>DAILY REPORT (Operational Monitoring)</h3>
        </div>
        <button className="history-button" onClick={handleOpenHistory}>
          <i className="fas fa-history"></i>
          History
        </button>
      </div>
      
      <div className="daily-kpi-metrics">
        <div className="kpi-metric-card">
          <div className="metric-info">
            <div className="metric-label">Total Collections</div>
            <div className="metric-value collections">
              {formatCurrency(dailyData.totalCollections)}
            </div>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="metric-info">
            <div className="metric-label">Total Disbursements</div>
            <div className="metric-value disbursements">
              {formatCurrency(dailyData.totalDisbursements)}
            </div>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="metric-info">
            <div className="metric-label">Net Balance</div>
            <div className="metric-value net-balance">
              {formatCurrency(dailyData.netBalance)}
            </div>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="metric-info">
            <div className="metric-label">Total Transactions</div>
            <div className="metric-value transactions">
              {dailyData.totalTransactions}
            </div>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="metric-info">
            <div className="metric-label">Pending Approvals</div>
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
          
          <div className="role-cards-container">
            {roleSummary.length > 0 ? (
              roleSummary.map(({ role, count, transactions, reports }) => (
                <div className="role-card" key={role}>
                  <div className="role-card-header">
                    <div className="role-card-title">
                      <span>{role}</span>
                    </div>
                    <div className={`role-status-indicator ${count > 0 ? 'active' : 'inactive'}`}></div>
                  </div>
                  <div className="role-card-content">
                    <div className="role-card-stats">
                      <div className="role-stat-item">
                        <span className="role-card-label">Transactions</span>
                        <span className={`role-card-value ${transactions > 0 ? 'active' : 'inactive'}`}>{transactions || 0}</span>
                      </div>
                      <div className="role-stat-item">
                        <span className="role-card-label">Reports Generated</span>
                        <span className={`role-card-value ${reports > 0 ? 'active' : 'inactive'}`}>{reports || 0}</span>
                      </div>
                    </div>
                    <div className="role-card-total">
                      <span className="role-card-label">Total Activity</span>
                      <span className={`role-card-value total ${count > 0 ? 'active' : 'inactive'}`}>{count}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state small">No roles recorded activity today.</div>
            )}
          </div>

          <div className="summary-stats">
            <div className="summary-stat-row">
              <span className="summary-stat-label">Total Transactions Today</span>
              <span className="summary-stat-value">{summaryStats.totalRecords}</span>
            </div>
            <div className="summary-stat-row">
              <span className="summary-stat-label">Reports Generated Today</span>
              <span className="summary-stat-value">{summaryStats.totalReportsGenerated}</span>
            </div>
            <div className="summary-stat-row">
              <span className="summary-stat-label">Active Roles</span>
              <span className="summary-stat-value small success">{summaryStats.activeRoles}</span>
            </div>
          </div>
        </div>

        {/* Right Chart Container */}
        <div className="daily-chart-container">
          <h4>Transactions Per Hour (Daily Activity Trend)</h4>
          <div className="chart-container">
            {hasDailyTransactions && hourlyData.length > 0 ? (
              <canvas ref={chartRef}></canvas>
            ) : (
              <div className="empty-state">No hourly transaction activity recorded today.</div>
            )}
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="history-modal-overlay" onClick={handleCloseHistory}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-header">
              <h3>
                <i className="fas fa-history"></i>
                Transaction History
              </h3>
              <button className="close-button" onClick={handleCloseHistory}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="history-modal-body">
              <div className="date-selector">
                <label htmlFor="history-date">Select Date:</label>
                <input
                  type="date"
                  id="history-date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="history-summary">
                <div className="history-summary-item">
                  <span className="label">Total Transactions:</span>
                  <span className="value">{historyData.length}</span>
                </div>
                <div className="history-summary-item">
                  <span className="label">Collections:</span>
                  <span className="value collections">
                    {formatCurrency(
                      historyData
                        .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'collection')
                        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0)
                    )}
                  </span>
                </div>
                <div className="history-summary-item">
                  <span className="label">Disbursements:</span>
                  <span className="value disbursements">
                    {formatCurrency(
                      historyData
                        .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'disbursement')
                        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0)
                    )}
                  </span>
                </div>
              </div>

              <div className="history-table-container">
                {historyData.length > 0 ? (
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((transaction, index) => {
                        const createdAt = new Date(transaction.created_at || transaction.createdAt);
                        const timeStr = !Number.isNaN(createdAt.getTime()) 
                          ? createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                          : 'N/A';
                        const type = (transaction.transaction_type || transaction.type || 'N/A').toLowerCase();
                        const status = transaction.status || 'N/A';
                        const department = transaction.department || transaction.department_name || 'N/A';
                        
                        return (
                          <tr key={transaction.id || index}>
                            <td>{timeStr}</td>
                            <td>
                              <span className={`type-badge ${type}`}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </span>
                            </td>
                            <td className="amount">{formatCurrency(Math.abs(parseFloat(transaction.amount) || 0))}</td>
                            <td>
                              <span className={`status-badge ${status.toLowerCase()}`}>
                                {status}
                              </span>
                            </td>
                            <td>{department}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">No transactions found for the selected date.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyKPI;