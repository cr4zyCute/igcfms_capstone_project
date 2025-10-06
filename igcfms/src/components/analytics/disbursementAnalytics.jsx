import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';

const DisbursementTrends = ({ 
  receipts = [], 
  transactions = [], 
  disbursementPeriod = 'week',
  onPeriodChange 
}) => {
  const disbursementChartRef = useRef(null);
  const disbursementChartInstance = useRef(null);

  useEffect(() => {
    initializeDisbursementChart();
    
    return () => {
      if (disbursementChartInstance.current) {
        disbursementChartInstance.current.destroy();
      }
    };
  }, [receipts, transactions, disbursementPeriod]);

  const initializeDisbursementChart = () => {
    if (!disbursementChartRef.current) {
      console.log('Canvas ref not available');
      return;
    }
    
    if (!receipts.length) {
      console.log('No receipts data available');
      return;
    }

    console.log('Initializing disbursement chart...');
    const ctx = disbursementChartRef.current.getContext('2d');
    
    // Destroy existing chart
    if (disbursementChartInstance.current) {
      disbursementChartInstance.current.destroy();
    }
    
    // Prepare data based on disbursement period
    let chartData = [];
    let chartLabels = [];
    
    if (disbursementPeriod === 'week') {
      // Generate weekly data for the last 8 weeks
      const weeks = [];
      const now = new Date();
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
        const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000));
        
        const weekReceipts = receipts.filter(receipt => {
          const receiptDate = new Date(receipt.created_at);
          return receiptDate >= weekStart && receiptDate <= weekEnd;
        });
        
        const weekAmount = weekReceipts.reduce((sum, receipt) => {
          const transaction = transactions.find(t => t.id === receipt.transaction_id);
          return sum + (parseFloat(transaction?.amount) || 0);
        }, 0);
        
        weeks.push({
          label: `Week ${Math.ceil(weekStart.getDate() / 7)}`,
          amount: weekAmount
        });
      }
      chartLabels = weeks.map(w => w.label);
      chartData = weeks.map(w => w.amount);
    } else {
      // Monthly data (last 6 months)
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const monthReceipts = receipts.filter(receipt => {
          const receiptDate = new Date(receipt.created_at);
          return receiptDate >= monthDate && receiptDate < nextMonth;
        });
        
        const monthAmount = monthReceipts.reduce((sum, receipt) => {
          const transaction = transactions.find(t => t.id === receipt.transaction_id);
          return sum + (parseFloat(transaction?.amount) || 0);
        }, 0);
        
        months.push({
          label: monthDate.toLocaleDateString('en-US', { month: 'short' }),
          amount: monthAmount
        });
      }
      chartLabels = months.map(m => m.label);
      chartData = months.map(m => m.amount);
    }
    
    // Create enhanced gradient for vertical bars
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#60a5fa');
    gradient.addColorStop(0.5, '#3b82f6');
    gradient.addColorStop(1, '#2563eb');
    
    disbursementChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Disbursement Amount (₱)',
          data: chartData,
          backgroundColor: gradient,
          borderColor: '#3b82f6',
          borderWidth: 0,
          borderRadius: 8,
          borderSkipped: false,
          barThickness: disbursementPeriod === 'week' ? 40 : 50,
          maxBarThickness: 60,
          hoverBackgroundColor: '#60a5fa',
          hoverBorderColor: '#3b82f6',
          hoverBorderWidth: 2
        }]
      },
      options: {
        // Removed indexAxis to make bars vertical
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1800,
          easing: 'easeInOutCubic',
          delay: (context) => {
            let delay = 0;
            if (context.type === 'data' && context.mode === 'default') {
              delay = context.dataIndex * 100;
            }
            return delay;
          }
        },
        layout: {
          padding: {
            top: 10,
            bottom: 5,
            left: 5,
            right: 10
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleColor: '#f9fafb',
            bodyColor: '#e5e7eb',
            borderColor: '#3b82f6',
            borderWidth: 2,
            cornerRadius: 10,
            displayColors: true,
            padding: 12,
            titleFont: { 
              size: 13, 
              weight: 'bold',
              family: "'Inter', 'Segoe UI', sans-serif"
            },
            bodyFont: { 
              size: 12,
              weight: '500',
              family: "'Inter', 'Segoe UI', sans-serif"
            },
            callbacks: {
              title: (context) => `${context[0].label}`,
              label: (context) => ` Disbursed: ₱${context.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Amount (₱)',
              color: '#4b5563',
              font: {
                size: 13,
                weight: '700',
                family: "'Inter', 'Segoe UI', sans-serif"
              },
              padding: { top: 0, bottom: 10 }
            },
            ticks: {
              color: '#6b7280',
              font: { 
                size: 11,
                weight: '600'
              },
              padding: 8,
              callback: function(value) {
                if (value >= 1000000) {
                  return '₱' + (value / 1000000).toFixed(1) + 'M';
                } else if (value >= 1000) {
                  return '₱' + (value / 1000).toFixed(0) + 'K';
                }
                return '₱' + value.toLocaleString();
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.08)',
              lineWidth: 1,
              drawBorder: false,
              drawTicks: false
            },
            border: {
              display: false
            }
          },
          x: {
            title: {
              display: true,
              text: disbursementPeriod === 'week' ? 'Weekly Period' : 'Monthly Period',
              color: '#4b5563',
              font: {
                size: 13,
                weight: '700',
                family: "'Inter', 'Segoe UI', sans-serif"
              },
              padding: { top: 10, bottom: 0 }
            },
            ticks: {
              color: '#6b7280',
              font: { 
                size: 11,
                weight: '600'
              },
              padding: 8,
              maxRotation: 0,
              minRotation: 0
            },
            grid: {
              display: false,
              drawBorder: false
            },
            border: {
              display: false
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
    
    console.log('Disbursement chart created successfully!', {
      labels: chartLabels,
      data: chartData
    });
  };

  return (
    <div className="dashboard-box box-1">
      <div className="box-header">
        <div className="box-title-with-indicator">
          <h3 className="box-title">Disbursement Trends</h3>
        </div>
        <select 
          value={disbursementPeriod} 
          onChange={(e) => onPeriodChange && onPeriodChange(e.target.value)}
          className="period-selector"
        >
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
      </div>
      <div className="box-content">
        {!receipts.length ? (
          <div className="chart-loading">
            <i className="fas fa-chart-bar"></i>
            <span>Loading disbursements...</span>
          </div>
        ) : (
          <div className="chart-container-full">
            <canvas ref={disbursementChartRef} id="disbursementChart"></canvas>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisbursementTrends;
