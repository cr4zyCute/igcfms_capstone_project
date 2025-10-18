import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const OutstandingChequesRatio = ({ cheques }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Calculate outstanding ratio
  const calculateOutstandingRatio = () => {
    if (cheques.length === 0) return { rate: 0, outstanding: 0, cleared: 0, total: 0 };
    
    const total = cheques.length;
    // Outstanding = issued but not cleared within 30 days
    const outstanding = cheques.filter(c => {
      if (c.status === 'Cleared') return false;
      const issueDate = new Date(c.issue_date || c.created_at);
      const today = new Date();
      const daysDiff = Math.floor((today - issueDate) / (1000 * 60 * 60 * 24));
      return daysDiff > 30;
    }).length;
    
    const cleared = cheques.filter(c => c.status === 'Cleared').length;
    const rate = (outstanding / total) * 100;
    
    return { rate, outstanding, cleared, total };
  };

  const { rate, outstanding, cleared, total } = calculateOutstandingRatio();

  // Get color based on rate
  const getColor = () => {
    if (rate <= 3) return { primary: '#10b981', secondary: '#d1fae5' }; // Green
    if (rate <= 5) return { primary: '#f59e0b', secondary: '#fef3c7' }; // Yellow
    return { primary: '#ef4444', secondary: '#fee2e2' }; // Red
  };

  const colors = getColor();

  // Initialize vertical bar chart with real data
  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    const pending = total - cleared - outstanding;

    // Calculate monthly data for the last 4 months
    const monthlyData = [];
    const today = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
      const year = monthDate.getFullYear();
      
      const monthCheques = cheques.filter(c => {
        const chequeDate = new Date(c.issue_date || c.created_at);
        return chequeDate.getMonth() === monthDate.getMonth() && 
               chequeDate.getFullYear() === monthDate.getFullYear();
      });
      
      monthlyData.push({
        label: `${monthName} ${year}`,
        count: monthCheques.length
      });
    }

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthlyData.map(d => d.label),
        datasets: [{
          label: 'Cheques Issued',
          data: monthlyData.map(d => d.count),
          backgroundColor: [
            '#e5e5e5', // Light gray
            '#b3b3b3', // Medium gray
            '#666666', // Dark gray
            '#000000'  // Black
          ],
          borderRadius: 6,
          barThickness: 40
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#d1d1d1',
              drawBorder: false
            },
            ticks: {
              color: '#000000',
              font: {
                size: 10
              },
              stepSize: 1
            }
          },
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              color: '#000000',
              font: {
                size: 9
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#1f2937',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#374151',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: function(context) {
                const value = context.parsed.y || 0;
                return `Cheques: ${value}`;
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [cheques, cleared, outstanding, total, colors]);

  return (
    <div className="ic-analytics-card">
      <div className="ic-analytics-content-horizontal">
        <div className="ic-outstanding-container">
          {/* Top - Stats and Legend Side by Side */}
          <div className="ic-outstanding-top">
            <div className="ic-outstanding-stats-section">
              <div className="ic-outstanding-rate" style={{ color: '#000000' }}>
                {rate.toFixed(1)}%
              </div>
              <div className="ic-outstanding-label">OUTSTANDING</div>
              <div className="ic-outstanding-status" style={{ 
                color: rate <= 3 ? '#10b981' : rate <= 5 ? '#f59e0b' : '#ef4444',
                fontSize: '11px',
                fontWeight: '600',
                marginTop: '6px'
              }}>
                {rate <= 3 ? '✓ Excellent' : rate <= 5 ? '⚠ Monitor' : '⚠ Action Required'}
              </div>
            </div>
            
            <div className="ic-outstanding-legend-section">
              <div className="ic-outstanding-mini-legend">
                <div className="ic-mini-legend-item">
                  <span className="ic-mini-dot" style={{ backgroundColor: '#e5e5e5' }}></span>
                  <span className="ic-mini-text">Cleared</span>
                  <span className="ic-mini-value">{cleared}</span>
                </div>
                <div className="ic-mini-legend-item">
                  <span className="ic-mini-dot" style={{ backgroundColor: '#b3b3b3' }}></span>
                  <span className="ic-mini-text">Outstanding</span>
                  <span className="ic-mini-value">{outstanding}</span>
                </div>
                <div className="ic-mini-legend-item">
                  <span className="ic-mini-dot" style={{ backgroundColor: '#666666' }}></span>
                  <span className="ic-mini-text">Pending</span>
                  <span className="ic-mini-value">{total - cleared - outstanding}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom - Chart */}
          <div className="ic-outstanding-bottom">
            <div className="ic-outstanding-chart-full">
              <canvas ref={chartRef}></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutstandingChequesRatio;
