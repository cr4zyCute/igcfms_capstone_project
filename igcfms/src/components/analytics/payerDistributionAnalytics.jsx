import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';

const PayerDistributionAnalytics = ({ 
  analyticsData = { isLoading: false, error: null, payerDistribution: [] }
}) => {
  const distributionChartRef = useRef(null);
  const distributionChartInstance = useRef(null);

  useEffect(() => {
    initializeDistributionChart();
    
    return () => {
      if (distributionChartInstance.current) {
        distributionChartInstance.current.destroy();
      }
    };
  }, [analyticsData.payerDistribution]);

  const initializeDistributionChart = () => {
    if (!distributionChartRef.current) return;
    
    // Wait for the canvas to be properly mounted
    setTimeout(() => {
      if (!distributionChartRef.current || !analyticsData.payerDistribution.length) return;

      const ctx = distributionChartRef.current.getContext('2d');
      // Destroy existing chart
      if (distributionChartInstance.current) {
        distributionChartInstance.current.destroy();
      }

      const baseColors = ['#0f172a', '#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb'];
      const hoverPalette = ['#111c2d', '#253149', '#3a465d', '#4a576d', '#627083', '#8b94a3', '#e2e5eb', '#f1f3f7'];
      const backgroundColors = baseColors.slice(0, analyticsData.payerDistribution.length);
      const hoverColors = backgroundColors.map((_, index) => hoverPalette[index] || '#111827');

      distributionChartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: analyticsData.payerDistribution.map(d => d.name),
          datasets: [{
            label: 'Receipts by Payer',
            data: analyticsData.payerDistribution.map(d => d.count),
            backgroundColor: backgroundColors,
            hoverBackgroundColor: hoverColors,
            borderColor: '#e2e8f0',
            borderWidth: 3,
            hoverBorderColor: '#0f172a',
            hoverBorderWidth: 4,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1500,
            easing: 'easeInOutQuart'
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: '#3b82f6',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: true,
              titleFont: { size: 12, weight: 'bold' },
              bodyFont: { size: 11 },
              callbacks: {
                title: (context) => context[0].label,
                label: (context) => {
                  const dataPoint = analyticsData.payerDistribution[context.dataIndex];
                  return [
                    `Receipts: ${dataPoint.count}`,
                    `Amount: ₱${dataPoint.amount.toLocaleString()}`,
                    `Share: ${dataPoint.percentage}%`
                  ];
                }
              }
            }
          },
          interaction: {
            intersect: false
          },
          onHover: (event, activeElements) => {
            event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
          }
        }
      });
    }, 100); // setTimeout delay
  };

  return (
    <div className="dashboard-box box-2 box-2-dark-theme">
      <div className="box-header box-2-dark-header">
        <h3 className="box-title">Box 2</h3>
        <span className="box-subtitle">TOP 3 PAYERS</span>
      </div>
      <div className="box-content">
        {analyticsData.isLoading ? (
          <div className="chart-loading">
            <i className="fas fa-chart-pie"></i>
            <span>Loading distribution...</span>
          </div>
        ) : analyticsData.error ? (
          <div className="chart-error">
            <i className="fas fa-exclamation-triangle"></i>
            <span>Failed to load chart</span>
          </div>
        ) : (
          <div className="box-2-layout">
            <div className="box-2-chart-section">
              <canvas ref={distributionChartRef} id="distributionChart"></canvas>
            </div>
            <div className="box-2-payers-section">
              <h4 className="box-2-payers-title">TOP 3 PAYERS</h4>
              {analyticsData.payerDistribution.slice(0, 3).map((payer, index) => (
                <div key={index} className="box-2-payer-row">
                  <div className="box-2-payer-left">
                    <div className={`box-2-badge badge-${index + 1}`}>#{index + 1}</div>
                    <div className="box-2-payer-name" title={payer.fullName}>{payer.fullName}</div>
                  </div>
                  <div className="box-2-payer-right">
                    <span className="box-2-amount">₱{payer.amount.toLocaleString()}</span>
                    <span className="box-2-receipts">{payer.count} receipts</span>
                    <span className="box-2-percentage">{payer.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayerDistributionAnalytics;