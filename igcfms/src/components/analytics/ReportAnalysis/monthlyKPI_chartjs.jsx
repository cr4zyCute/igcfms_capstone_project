import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import './css/monthlyKPI.css';

const MonthlyKPI = ({ transactions = [] }) => {
  // Initialize with mock data
  const mockCollections = 850000;
  const mockDisbursements = 620000;
  const mockTarget = 1000000;
  
  const [monthlyData, setMonthlyData] = useState({
    totalCollections: mockCollections,
    totalDisbursements: mockDisbursements,
    collectionRate: (mockCollections / mockTarget) * 100,
    target: mockTarget,
    approvedCount: 45,
    rejectedCount: 5,
    avgProcessingTime: 2.5
  });
  
  // Initialize daily data with mock values
  const generateMockDailyData = () => {
    const data = [];
    for (let day = 1; day <= 30; day++) {
      data.push({
        date: day,
        collections: Math.floor(Math.random() * 40000) + 20000,
        disbursements: Math.floor(Math.random() * 30000) + 15000
      });
    }
    return data;
  };
  
  const [dailyData, setDailyData] = useState(generateMockDailyData());
  const [approvalData, setApprovalData] = useState([
    { name: 'Approved', value: 45, color: '#10b981' },
    { name: 'Rejected', value: 5, color: '#ef4444' }
  ]);
  const [processingTimeData, setProcessingTimeData] = useState([
    { department: 'Finance', avgTime: 2.3 },
    { department: 'Admin', avgTime: 3.1 },
    { department: 'Operations', avgTime: 1.8 },
    { department: 'HR', avgTime: 2.7 },
    { department: 'IT', avgTime: 2.1 }
  ]);

  // Chart refs
  const lineChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const lineChartInstance = useRef(null);
  const pieChartInstance = useRef(null);
  const barChartInstance = useRef(null);

  useEffect(() => {
    if (dailyData.length > 0) {
      initializeLineChart();
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
    }
    return () => {
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }
    };
  }, [processingTimeData]);

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
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 6,
              pointBackgroundColor: '#10b981',
              pointBorderColor: '#fff',
              pointBorderWidth: 2
            },
            {
              label: 'Disbursements',
              data: disbursementsData,
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 6,
              pointBackgroundColor: '#ef4444',
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
              display: true,
              position: 'top',
              labels: {
                font: { size: 12, weight: '600' },
                color: '#111827',
                usePointStyle: true,
                padding: 15
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
    if (!pieChartRef.current) return;

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
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 12, weight: '600' },
                color: '#111827',
                padding: 15,
                usePointStyle: true
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
    }, 100);
  };

  const initializeBarChart = () => {
    if (!barChartRef.current) return;

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
    }).format(amount);
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
          <div className="chart-wrapper" style={{ height: '280px', position: 'relative', padding: '10px' }}>
            <canvas ref={lineChartRef}></canvas>
          </div>
        </div>
        
        {/* Pie Chart: Approved vs Rejected */}
        <div className="graph-container pie-chart-container">
          <h4>Approved vs Rejected</h4>
          <div className="chart-wrapper" style={{ height: '220px', position: 'relative', padding: '10px' }}>
            <canvas ref={pieChartRef}></canvas>
          </div>
        </div>
        
        {/* Bar Chart: Processing Time by Department */}
        <div className="graph-container bar-chart-container">
          <h4>Avg Processing Time by Department</h4>
          <div className="chart-wrapper" style={{ height: '280px', position: 'relative', padding: '10px' }}>
            <canvas ref={barChartRef}></canvas>
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
                  width: `${Math.min(monthlyData.collectionRate, 100)}%`,
                  backgroundColor: monthlyData.collectionRate >= 90 ? '#10b981' : monthlyData.collectionRate >= 70 ? '#f59e0b' : '#ef4444'
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
