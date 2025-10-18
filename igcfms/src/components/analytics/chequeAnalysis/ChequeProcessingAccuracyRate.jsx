import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const ChequeProcessingAccuracyRate = ({ cheques }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Calculate accuracy rate
  const calculateAccuracyRate = () => {
    if (cheques.length === 0) return { rate: 0, correct: 0, total: 0 };
    
    // Assuming cheques without error_flag or error_flag = 0 are correctly processed
    const correctlyProcessed = cheques.filter(c => !c.error_flag || c.error_flag === 0).length;
    const total = cheques.length;
    const rate = (correctlyProcessed / total) * 100;
    
    return { rate, correct: correctlyProcessed, total };
  };

  const { rate, correct, total } = calculateAccuracyRate();

  // Get color based on rate
  const getColor = () => {
    if (rate >= 99) return { primary: '#10b981', secondary: '#d1fae5' }; // Green
    if (rate >= 98) return { primary: '#f59e0b', secondary: '#fef3c7' }; // Yellow
    return { primary: '#ef4444', secondary: '#fee2e2' }; // Red
  };

  const colors = getColor();

  // Initialize donut chart
  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    const errors = total - correct;

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Correct', 'Errors'],
        datasets: [{
          data: [correct, errors],
          backgroundColor: ['#000000', '#4b5563'],
          borderWidth: 0,
          cutout: '70%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${value} (${percentage}%)`;
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
  }, [cheques, correct, total, colors]);

  return (
    <div className="ic-analytics-card">
      <div className="ic-analytics-content-horizontal">
        <div className="ic-accuracy-container">
          {/* Top - Stats and Legend Side by Side */}
          <div className="ic-accuracy-top">
            <div className="ic-accuracy-stats-section">
              <div className="ic-accuracy-rate" style={{ color: '#000000' }}>
                {rate.toFixed(1)}%
              </div>
              <div className="ic-accuracy-label">ACCURACY</div>
              <div className="ic-accuracy-status" style={{ 
                color: rate >= 99 ? '#10b981' : rate >= 98 ? '#f59e0b' : '#ef4444',
                fontSize: '11px',
                fontWeight: '600',
                marginTop: '6px'
              }}>
                {rate >= 99 ? '✓ Excellent' : rate >= 98 ? '⚠ Monitor' : '⚠ Action Required'}
              </div>
            </div>
            
            <div className="ic-accuracy-legend-section">
              <div className="ic-accuracy-mini-legend">
                <div className="ic-mini-legend-item">
                  <span className="ic-mini-dot" style={{ backgroundColor: '#000000' }}></span>
                  <span className="ic-mini-text">Correct</span>
                  <span className="ic-mini-value">{correct}</span>
                </div>
                <div className="ic-mini-legend-item">
                  <span className="ic-mini-dot" style={{ backgroundColor: '#4b5563' }}></span>
                  <span className="ic-mini-text">Errors</span>
                  <span className="ic-mini-value">{total - correct}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom - Chart */}
          <div className="ic-accuracy-bottom">
            <div className="ic-accuracy-chart">
              <canvas ref={chartRef}></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChequeProcessingAccuracyRate;
