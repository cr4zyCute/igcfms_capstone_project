import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

const AverageClearanceTime = ({ cheques }) => {
  const clearanceChartRef = useRef(null);
  const clearanceChartInstance = useRef(null);
  const [clearanceData, setClearanceData] = useState([]);

  // Calculate clearance time data
  const calculateClearanceData = () => {
    const last30Days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last30Days.push(date);
    }
    
    const clearanceByDate = last30Days.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const clearedCheques = cheques.filter(c => {
        if (c.status !== 'Cleared' || !c.date_cleared) return false;
        const clearedDate = new Date(c.date_cleared).toISOString().split('T')[0];
        return clearedDate === dateStr;
      });
      
      if (clearedCheques.length === 0) return { date: dateStr, avgDays: 0 };
      
      const totalDays = clearedCheques.reduce((sum, c) => {
        const issued = new Date(c.issue_date || c.created_at);
        const cleared = new Date(c.date_cleared);
        const days = Math.max(0, Math.floor((cleared - issued) / (1000 * 60 * 60 * 24)));
        return sum + days;
      }, 0);
      
      return {
        date: dateStr,
        avgDays: clearedCheques.length > 0 ? (totalDays / clearedCheques.length) : 0
      };
    });
    
    setClearanceData(clearanceByDate);
  };

  // Initialize clearance time chart
  const initializeClearanceChart = () => {
    if (!clearanceChartRef.current || clearanceData.length === 0) {
      return;
    }
    
    // Destroy existing chart
    if (clearanceChartInstance.current) {
      clearanceChartInstance.current.destroy();
    }
    
    const ctx = clearanceChartRef.current.getContext('2d');
    
    clearanceChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: clearanceData.map(d => {
          const date = new Date(d.date);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [{
          label: 'Avg Clearance Time (Days)',
          data: clearanceData.map(d => d.avgDays),
          borderColor: '#000000',
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#000000',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#000000',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#000000',
            borderWidth: 2,
            padding: 12,
            displayColors: false,
            titleFont: {
              size: 12,
              weight: 'bold'
            },
            bodyFont: {
              size: 11
            },
            callbacks: {
              label: function(context) {
                return `${context.parsed.y.toFixed(1)} days`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#d1d1d1',
              drawBorder: false,
              lineWidth: 1
            },
            border: {
              display: false
            },
            ticks: {
              color: '#000000',
              font: {
                size: 11,
                weight: '500'
              },
              padding: 8,
              callback: function(value) {
                return value + 'd';
              }
            }
          },
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            border: {
              display: false
            },
            ticks: {
              color: '#000000',
              font: {
                size: 9,
                weight: '500'
              },
              maxRotation: 45,
              minRotation: 45,
              padding: 4
            }
          }
        }
      }
    });
  };

  // Calculate clearance data when cheques change
  useEffect(() => {
    calculateClearanceData();
  }, [cheques]);

  // Initialize chart when clearance data changes
  useEffect(() => {
    if (clearanceData.length > 0) {
      initializeClearanceChart();
    }
    
    return () => {
      if (clearanceChartInstance.current) {
        clearanceChartInstance.current.destroy();
      }
    };
  }, [clearanceData]);

  // Calculate average clearance time
  const getAverageClearanceTime = () => {
    const clearedCheques = cheques.filter(c => c.status === 'Cleared' && c.date_cleared);
    if (clearedCheques.length === 0) return '0';
    const totalDays = clearedCheques.reduce((sum, c) => {
      const issued = new Date(c.issue_date || c.created_at);
      const cleared = new Date(c.date_cleared);
      const days = Math.max(0, Math.floor((cleared - issued) / (1000 * 60 * 60 * 24)));
      return sum + days;
    }, 0);
    return (totalDays / clearedCheques.length).toFixed(1);
  };

  return (
    <div className="ic-chart-card">
      <div className="ic-chart-header">
        <h3>Average Clearance Time</h3>
      </div>
      <div className="ic-chart-body">
        <div className="ic-chart-stats-row">
          <div className="ic-stat-column">
            <div className="ic-stat-label">Average</div>
            <div className="ic-stat-value-large">
              {getAverageClearanceTime()}d
            </div>
          </div>
          <div className="ic-stat-column">
            <div className="ic-stat-label">Cleared</div>
            <div className="ic-stat-value-large">
              {cheques.filter(c => c.status === 'Cleared').length}
            </div>
          </div>
          <div className="ic-stat-column">
            <div className="ic-stat-label">Pending</div>
            <div className="ic-stat-value-large">
              {cheques.filter(c => c.status !== 'Cleared').length}
            </div>
          </div>
        </div>
        <div className="ic-chart-visualization">
          <canvas ref={clearanceChartRef}></canvas>
        </div>
      </div>
    </div>
  );
};

export default AverageClearanceTime;
