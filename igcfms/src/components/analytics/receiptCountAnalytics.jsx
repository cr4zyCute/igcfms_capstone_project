import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';

const ReceiptCountAnalytics = ({ 
  receipts = [], 
  analyticsData = { isLoading: false, error: null }
}) => {
  const lineChartRef = useRef(null);
  const lineChartInstance = useRef(null);

  useEffect(() => {
    // Only initialize chart if not loading and no error
    if (!analyticsData.isLoading && !analyticsData.error) {
      initializeLineChart();
    }
    
    return () => {
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
      }
    };
  }, [receipts, analyticsData.isLoading, analyticsData.error]);

  const getReceiptDate = (receipt) => {
    const dateSource = receipt?.issued_at || receipt?.created_at || receipt?.updated_at;
    if (!dateSource) return null;
    const parsed = new Date(dateSource);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const normalizeDate = (date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const initializeLineChart = () => {
    if (!lineChartRef.current) {
      console.log('Canvas ref not available');
      return;
    }

    // Wait for canvas to be properly mounted
    setTimeout(() => {
      if (!lineChartRef.current) {
        console.log('Canvas ref not available after timeout');
        return;
      }

      const ctx = lineChartRef.current.getContext('2d');
      
      // Destroy existing chart
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
      }

      const dayInMs = 24 * 60 * 60 * 1000;
      const today = normalizeDate(new Date());
      const receiptDates = receipts
        .map(getReceiptDate)
        .filter((date) => date !== null)
        .map((date) => normalizeDate(date))
        .sort((a, b) => a - b);

      const receiptCountsByDay = receipts.reduce((map, receipt) => {
        const receiptDate = getReceiptDate(receipt);
        if (!receiptDate) return map;
        const normalized = normalizeDate(receiptDate);
        const key = formatDateKey(normalized);
        map.set(key, (map.get(key) || 0) + 1);
        return map;
      }, new Map());

      const labels = [];
      const dataPoints = [];

      if (receiptDates.length === 0) {
        labels.push(today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        dataPoints.push(0);
      } else {
        const startDate = receiptDates[0];
        const endDate = today > receiptDates[receiptDates.length - 1] ? today : receiptDates[receiptDates.length - 1];
        const totalDays = Math.max(0, Math.round((endDate - startDate) / dayInMs));

        for (let i = 0; i <= totalDays; i++) {
          const currentDate = new Date(startDate.getTime() + i * dayInMs);
          const key = formatDateKey(currentDate);
          labels.push(currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
          dataPoints.push(receiptCountsByDay.get(key) || 0);
        }
      }

      const maxValue = dataPoints.reduce((max, value) => Math.max(max, value), 0);
      const gradientFill = ctx.createLinearGradient(0, 0, 0, lineChartRef.current?.clientHeight || 260);
      gradientFill.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
      gradientFill.addColorStop(1, 'rgba(0, 0, 0, 0.05)');

      const borderGradient = ctx.createLinearGradient(0, 0, lineChartRef.current?.clientWidth || 320, 0);
      borderGradient.addColorStop(0, '#000000');
      borderGradient.addColorStop(1, '#000000');

      lineChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Receipts per day',
              data: dataPoints,
              borderColor: borderGradient,
              backgroundColor: gradientFill,
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
                label: (context) => `Receipts: ${context.parsed.y}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              suggestedMax: maxValue === 0 ? 3 : undefined,
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

      console.log('Receipt count chart created', { labels, dataPoints });
    }, 100); // Close setTimeout
  };

  return (
    <div className="dashboard-box box-3">
      <div className="box-header">
        <div className="box-title-with-indicator">
          <h3 className="box-title">Issued Receipts Summary</h3>
        </div>
      </div>
      <div className="box-content">
        {analyticsData.isLoading ? (
          <div className="chart-loading">
            <i className="fas fa-receipt"></i>
            <span>Loading receipt count...</span>
          </div>
        ) : analyticsData.error ? (
          <div className="chart-error">
            <i className="fas fa-exclamation-triangle"></i>
            <span>Failed to load data</span>
          </div>
        ) : (
          <div className="chart-container" style={{ 
            height: '250px', 
            width: '100%',
            position: 'relative',
            padding: '10px'
          }}>
            <canvas 
              ref={lineChartRef}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%' 
              }}
            ></canvas>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptCountAnalytics;
