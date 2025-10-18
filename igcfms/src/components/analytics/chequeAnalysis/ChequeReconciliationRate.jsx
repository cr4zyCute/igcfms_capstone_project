import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const ChequeReconciliationRate = ({ cheques }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Calculate reconciliation rate
  const calculateReconciliationRate = () => {
    const clearedCheques = cheques.filter(c => c.status === 'Cleared');
    if (clearedCheques.length === 0) return { rate: 0, reconciled: 0, total: 0 };
    
    // Assuming cheques with reconciled = 1 or reconciled = true are reconciled
    const reconciledCheques = clearedCheques.filter(c => c.reconciled === 1 || c.reconciled === true).length;
    const total = clearedCheques.length;
    const rate = (reconciledCheques / total) * 100;
    
    return { rate, reconciled: reconciledCheques, total };
  };

  const { rate, reconciled, total } = calculateReconciliationRate();

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
    const unreconciled = total - reconciled;

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Reconciled', 'Unmatched'],
        datasets: [{
          data: [reconciled, unreconciled],
          backgroundColor: ['#e5e5e5', '#b3b3b3'],
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
  }, [cheques, reconciled, total, colors]);

  return (
    <div className="ic-analytics-card">
      <div className="ic-analytics-content-horizontal">
        <div className="ic-reconciliation-container">
          {/* Top - Stats and Legend Side by Side */}
          <div className="ic-reconciliation-top">
            <div className="ic-reconciliation-stats-section">
              <div className="ic-reconciliation-rate" style={{ color: '#000000' }}>
                {rate.toFixed(1)}%
              </div>
              <div className="ic-reconciliation-label">RECONCILED</div>
              <div className="ic-reconciliation-status" style={{ 
                color: rate >= 99 ? '#10b981' : rate >= 98 ? '#f59e0b' : '#ef4444',
                fontSize: '11px',
                fontWeight: '600',
                marginTop: '6px'
              }}>
                {rate >= 99 ? '✓ Excellent' : rate >= 98 ? '⚠ Monitor' : '⚠ Action Required'}
              </div>
            </div>
            
            <div className="ic-reconciliation-legend-section">
              <div className="ic-reconciliation-mini-legend">
                <div className="ic-mini-legend-item">
                  <span className="ic-mini-dot" style={{ backgroundColor: '#e5e5e5' }}></span>
                  <span className="ic-mini-text">Reconciled</span>
                  <span className="ic-mini-value">{reconciled}</span>
                </div>
                <div className="ic-mini-legend-item">
                  <span className="ic-mini-dot" style={{ backgroundColor: '#b3b3b3' }}></span>
                  <span className="ic-mini-text">Unmatched</span>
                  <span className="ic-mini-value">{total - reconciled}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom - Chart */}
          <div className="ic-reconciliation-bottom">
            <div className="ic-reconciliation-chart">
              <canvas ref={chartRef}></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChequeReconciliationRate;
