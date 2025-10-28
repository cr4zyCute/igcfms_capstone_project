import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import './css/monthlyKPI.css';

const MonthlyKPI = ({ transactions = [] }) => {
  const [monthlyData, setMonthlyData] = useState({
    totalCollections: 0,
    totalDisbursements: 0,
    collectionRate: 0,
    target: 0,
    approvedCount: 0,
    rejectedCount: 0,
    avgProcessingTime: 0
  });
  const [dailyData, setDailyData] = useState([]);
  const [approvalData, setApprovalData] = useState([]);
  const [processingTimeData, setProcessingTimeData] = useState([]);
  const [hasMonthlyTransactions, setHasMonthlyTransactions] = useState(false);

  // Chart refs
  const lineChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const lineChartInstance = useRef(null);
  const pieChartInstance = useRef(null);
  const barChartInstance = useRef(null);

  useEffect(() => {
    calculateMonthlyData();
  }, [transactions]);

  useEffect(() => {
    if (dailyData.length > 0) {
      initializeLineChart();
    } else if (lineChartInstance.current) {
      lineChartInstance.current.destroy();
      lineChartInstance.current = null;
    }
    return () => {
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
      }
    };
  }, [dailyData]);

  useEffect(() => {
    if (approvalData.length > 0) {
      initializePieChart();
    } else if (pieChartInstance.current) {
      pieChartInstance.current.destroy();
      pieChartInstance.current = null;
    }
    return () => {
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
      }
    };
  }, [approvalData]);

  useEffect(() => {
    if (processingTimeData.length > 0) {
      initializeBarChart();
    } else if (barChartInstance.current) {
      barChartInstance.current.destroy();
      barChartInstance.current = null;
    }
    return () => {
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }
    };
  }, [processingTimeData]);

  const calculateMonthlyData = () => {
    // Get current month dates
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.created_at);
      return !Number.isNaN(transactionDate.getTime()) && transactionDate >= firstDay && transactionDate <= lastDay;
    });

    setHasMonthlyTransactions(monthTransactions.length > 0);

    if (monthTransactions.length === 0) {
      setMonthlyData({
        totalCollections: 0,
        totalDisbursements: 0,
        collectionRate: 0,
        target: 0,
        approvedCount: 0,
        rejectedCount: 0,
        avgProcessingTime: 0
      });
      setDailyData([]);
      setApprovalData([]);
      setProcessingTimeData([]);
      return;
    }

    const collections = monthTransactions
      .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'collection')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

    const disbursements = monthTransactions
      .filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'disbursement')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

    const approved = monthTransactions.filter(t => (t.status || '').toLowerCase() === 'approved').length
      || monthTransactions.filter(t => (t.approval_status || '').toLowerCase() === 'approved').length;
    const rejected = monthTransactions.filter(t => (t.status || t.approval_status || '').toLowerCase() === 'rejected').length;

    const target = monthTransactions.reduce((sum, t) => {
      const targetAmount = parseFloat(t.target_amount || t.monthly_target);
      return sum + (Number.isFinite(targetAmount) ? targetAmount : 0);
    }, 0);

    const fallbackTarget = target > 0
      ? target
      : collections > 0
        ? collections * 1.1
        : disbursements > 0
          ? disbursements * 1.1
          : 0;

    const collectionRate = fallbackTarget > 0 ? (collections / fallbackTarget) * 100 : 0;

    const processingTimes = monthTransactions
      .filter(t => t.processed_at && t.created_at)
      .map(t => {
        const created = new Date(t.created_at);
        const processed = new Date(t.processed_at);
        return (processed - created) / (1000 * 60 * 60);
      })
      .filter(time => Number.isFinite(time) && time >= 0);

    const avgProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0;

    setMonthlyData({
      totalCollections: collections,
      totalDisbursements: disbursements,
      collectionRate,
      target: fallbackTarget,
      approvedCount: approved,
      rejectedCount: rejected,
      avgProcessingTime
    });

    const dailyMap = {};
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dailyMap[dateKey] = { date: dateKey, collections: 0, disbursements: 0 };
    }

    monthTransactions.forEach(t => {
      const dateKey = new Date(t.created_at).toISOString().split('T')[0];
      if (dailyMap[dateKey]) {
        const amount = Math.abs(parseFloat(t.amount) || 0);
        const kind = (t.transaction_type || t.type || '').toLowerCase();
        if (kind === 'collection') {
          dailyMap[dateKey].collections += amount;
        } else if (kind === 'disbursement') {
          dailyMap[dateKey].disbursements += amount;
        }
      }
    });

    const normalizedDailyData = Object.values(dailyMap)
      .map(d => ({
        date: new Date(d.date).getDate(),
        collections: d.collections,
        disbursements: d.disbursements
      }))
      .filter(d => d.collections > 0 || d.disbursements > 0);
    setDailyData(normalizedDailyData);

    let approvals = [];
    if (approved > 0) approvals.push({ name: 'Approved', value: approved, color: '#166534' });
    if (rejected > 0) approvals.push({ name: 'Rejected', value: rejected, color: '#991b1b' });
    if (approvals.length === 0 && monthTransactions.length > 0) {
      const collectionCount = monthTransactions.filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'collection').length;
      const disbursementCount = monthTransactions.filter(t => (t.transaction_type || t.type || '').toLowerCase() === 'disbursement').length;
      if (collectionCount > 0) approvals.push({ name: 'Collections', value: collectionCount, color: '#166534' });
      if (disbursementCount > 0) approvals.push({ name: 'Disbursements', value: disbursementCount, color: '#991b1b' });
      if (approvals.length === 0) {
        approvals.push({ name: 'Transactions', value: monthTransactions.length, color: '#3b82f6' });
      }
    }
    setApprovalData(approvals);

    const deptMap = monthTransactions.reduce((acc, t) => {
      const departmentName = t.department || t.department_name;
      const processedAtRaw = t.processed_at || t.updated_at;
      if (processedAtRaw && t.created_at && departmentName) {
        const created = new Date(t.created_at);
        const processed = new Date(processedAtRaw);
        const hours = (processed - created) / (1000 * 60 * 60);
        if (!Number.isFinite(hours) || hours < 0) {
          return acc;
        }
        const dept = departmentName;
        if (!acc[dept]) {
          acc[dept] = { total: 0, count: 0 };
        }
        acc[dept].total += hours;
        acc[dept].count += 1;
      }
      return acc;
    }, {});

    let processingData = Object.entries(deptMap)
      .map(([department, value]) => ({ department, avgTime: value.total / value.count }))
      .filter(item => Number.isFinite(item.avgTime));
    if (processingData.length === 0 && monthTransactions.length > 0) {
      const deptCounts = monthTransactions.reduce((acc, t) => {
        const dept = t.department || t.department_name || 'Unspecified';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {});
      processingData = Object.entries(deptCounts).map(([department, count]) => ({
        department,
        avgTime: count
      }));
    }
    setProcessingTimeData(processingData);
  };

  const initializeLineChart = () => {
    if (!lineChartRef.current) return;

    setTimeout(() => {
      if (!lineChartRef.current) return;

      const ctx = lineChartRef.current.getContext('2d');

      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
      }

      const labels = dailyData.map(d => `Day ${d.date}`);
      const collectionsData = dailyData.map(d => d.collections);
      const disbursementsData = dailyData.map(d => d.disbursements);

      lineChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Collections',
              data: collectionsData,
              borderColor: '#166534',
              backgroundColor: 'rgba(22, 101, 52, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0,
              pointRadius: 3,
              pointHoverRadius: 6,
              pointBackgroundColor: '#166534',
              pointBorderColor: '#fff',
              pointBorderWidth: 2
            },
            {
              label: 'Disbursements',
              data: disbursementsData,
              borderColor: '#991b1b',
              backgroundColor: 'rgba(153, 27, 27, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0,
              pointRadius: 3,
              pointHoverRadius: 6,
              pointBackgroundColor: '#991b1b',
              pointBorderColor: '#fff',
              pointBorderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1400,
            easing: 'easeInOutCubic'
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
              padding: 12,
              callbacks: {
                label: (context) => `${context.dataset.label}: ₱${context.parsed.y.toLocaleString()}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: '#1f2937',
                font: { size: 11, weight: '600' },
                callback: (value) => `₱${(value / 1000).toFixed(0)}K`
              },
              grid: {
                color: 'rgba(17, 24, 39, 0.08)',
                drawBorder: false
              }
            },
            x: {
              ticks: {
                color: '#1f2937',
                font: { size: 11, weight: '600' },
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 10
              },
              grid: {
                color: 'rgba(17, 24, 39, 0.06)',
                drawBorder: false
              }
            }
          }
        }
      });
    }, 100);
  };

  const initializePieChart = () => {
    if (!pieChartRef.current || approvalData.length === 0) return;

    setTimeout(() => {
      if (!pieChartRef.current) return;

      const ctx = pieChartRef.current.getContext('2d');

      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
      }

      pieChartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: approvalData.map(d => d.name),
          datasets: [{
            data: approvalData.map(d => d.value),
            backgroundColor: approvalData.map(d => d.color),
            borderWidth: 3,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1400,
            easing: 'easeInOutCubic'
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 13, weight: '600' },
                color: '#111827',
                padding: 20,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: '#111827',
              titleColor: '#f9fafb',
              bodyColor: '#f3f4f6',
              borderColor: '#0f172a',
              borderWidth: 1,
              cornerRadius: 8,
              padding: 12,
              callbacks: {
                label: (context) => `${context.label}: ${context.parsed}`
              }
            }
          }
        }
      });
    }, 150);
  };

  const initializeBarChart = () => {
    if (!barChartRef.current || processingTimeData.length === 0) return;

    setTimeout(() => {
      if (!barChartRef.current) return;

      const ctx = barChartRef.current.getContext('2d');

      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }

      const labels = processingTimeData.map(d => d.department);
      const data = processingTimeData.map(d => d.avgTime);

      barChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Avg Time (hours)',
            data,
            backgroundColor: '#000000',
            borderColor: '#000000',
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1400,
            easing: 'easeInOutCubic'
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
              padding: 12,
              callbacks: {
                label: (context) => `${context.parsed.y.toFixed(1)} hours`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: '#1f2937',
                font: { size: 11, weight: '600' },
                callback: (value) => `${value}h`
              },
              grid: {
                color: 'rgba(17, 24, 39, 0.08)',
                drawBorder: false
              }
            },
            x: {
              ticks: {
                color: '#1f2937',
                font: { size: 11, weight: '600' }
              },
              grid: {
                display: false
              }
            }
          }
        }
      });
    }, 100);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const safeRate = Number.isFinite(monthlyData.collectionRate) ? monthlyData.collectionRate : 0;
  const gaugeFillWidth = `${Math.min(Math.max(safeRate, 0), 100)}%`;
  const hasTarget = Number.isFinite(monthlyData.target) && monthlyData.target > 0;

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

      {!hasMonthlyTransactions && (
        <div className="empty-state">No monthly data available for this period.</div>
      )}

      {/* Graphs Section */}
      <div className="monthly-graphs">
        {/* Line Chart: Daily Collections vs Disbursements */}
        <div className="graph-container line-chart-container">
          <h4>Daily Collections vs Disbursements</h4>
          <div className="chart-wrapper">
            {dailyData.length > 0 ? (
              <canvas ref={lineChartRef}></canvas>
            ) : (
              <div className="empty-state">No daily trend data to display.</div>
            )}
          </div>
        </div>

        {/* Pie Chart: Approved vs Rejected */}
        <div className="graph-container pie-chart-container">
          <h4>Approved vs Rejected</h4>
          <div className="chart-wrapper">
            {approvalData.length > 0 ? (
              <canvas ref={pieChartRef}></canvas>
            ) : (
              <div className="empty-state">No approval distribution data available.</div>
            )}
          </div>
        </div>

        {/* Bar Chart: Processing Time by Department */}
        <div className="graph-container bar-chart-container">
          <h4>Avg Processing Time by Department</h4>
          <div className="chart-wrapper">
            {processingTimeData.length > 0 ? (
              <canvas ref={barChartRef}></canvas>
            ) : (
              <div className="empty-state">No processing time records available.</div>
            )}
          </div>
        </div>

        {/* Gauge: Collection Rate */}
        <div className="graph-container gauge-container">
          <h4>Collection Rate Target</h4>
          {hasTarget ? (
            <div className="gauge-wrapper">
              <div className="gauge">
                <div
                  className="gauge-fill"
                  style={{
                    width: gaugeFillWidth,
                    backgroundColor: monthlyData.collectionRate >= 90 ? '#166534' : monthlyData.collectionRate >= 70 ? '#f59e0b' : '#991b1b'
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
          ) : (
            <div className="empty-state">No collection target data defined.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyKPI;
