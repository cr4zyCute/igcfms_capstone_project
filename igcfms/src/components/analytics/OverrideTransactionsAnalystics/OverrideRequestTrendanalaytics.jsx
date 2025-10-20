import React, { useRef, useEffect, useState, useMemo } from 'react';
import Chart from 'chart.js/auto';
import './css/OverrideRequestTrendanalaytics.css';

const OverrideRequestTrendanalaytics = ({ 
  overrideRequests = [],
  isLoading = false,
  error = null
}) => {
  const [timeRange, setTimeRange] = useState('daily'); // 'hourly', 'daily', 'weekly', 'monthly'
  const [showKPIs, setShowKPIs] = useState(true);
  const [showBars, setShowBars] = useState(true);
  const [showLine, setShowLine] = useState(true);

  const lineChartRef = useRef(null);
  const lineChartInstance = useRef(null);

  useEffect(() => {
    if (!isLoading && !error) {
      initializeLineChart();
    }
    
    return () => {
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
      }
    };
  }, [overrideRequests, isLoading, error, timeRange, showBars, showLine]);

  const getRequestDate = (request) => {
    const dateSource = request?.created_at || request?.createdAt;
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

    setTimeout(() => {
      if (!lineChartRef.current) {
        console.log('Canvas ref not available after timeout');
        return;
      }

      const ctx = lineChartRef.current.getContext('2d');
      
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
      }

      // Use real data from override requests
      const dayInMs = 24 * 60 * 60 * 1000;
      const today = normalizeDate(new Date());
      const requestDates = overrideRequests
        .map(getRequestDate)
        .filter((date) => date !== null)
        .map((date) => normalizeDate(date))
        .sort((a, b) => a - b);

      const requestCountsByDay = overrideRequests.reduce((map, request) => {
        const requestDate = getRequestDate(request);
        if (!requestDate) return map;
        const normalized = normalizeDate(requestDate);
        const key = formatDateKey(normalized);
        map.set(key, (map.get(key) || 0) + 1);
        return map;
      }, new Map());

      let labels = [];
      let dataPoints = [];

      if (requestDates.length === 0) {
        labels.push(today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        dataPoints.push(0);
      } else {
        const startDate = requestDates[0];
        const endDate = today > requestDates[requestDates.length - 1] ? today : requestDates[requestDates.length - 1];
        const totalDays = Math.max(0, Math.round((endDate - startDate) / dayInMs));

        for (let i = 0; i <= totalDays; i++) {
          const currentDate = new Date(startDate.getTime() + i * dayInMs);
          const key = formatDateKey(currentDate);
          labels.push(currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
          dataPoints.push(requestCountsByDay.get(key) || 0);
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
              label: 'Requests per day',
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
                label: (context) => `Requests: ${context.parsed.y}`
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

      console.log('Request timeline chart created', { labels, dataPoints });
    }, 100);
  };

  return (
    <div className="ot-timeline-box">
      <div className="ot-timeline-header">
        <div className="ot-timeline-title-group">
          <h3 className="ot-timeline-title">
            <i className="fas fa-chart-bar"></i>
            Override Transactions – Bar Graph Analysis
            <i 
              className="fas fa-info-circle" 
              style={{ marginLeft: '8px', fontSize: '14px', color: '#6b7280', cursor: 'help' }}
              title="Tracks override requests over time. Helps detect unusual spikes (system issues), efficiency trends, and volume patterns. Essential for monitoring manual overrides that may indicate fraud risks or emergency adjustments."
            ></i>
          </h3>
          <p className="ot-timeline-subtitle">Monitor override volume and status distribution by time period</p>
        </div>
        
        <div className="ot-timeline-controls">
          <div className="time-range-selector">
            <button 
              className={`time-range-btn ${timeRange === 'hourly' ? 'active' : ''}`}
              onClick={() => setTimeRange('hourly')}
              title="View hourly trends for same-day monitoring"
            >
              Hourly
            </button>
            <button 
              className={`time-range-btn ${timeRange === 'daily' ? 'active' : ''}`}
              onClick={() => setTimeRange('daily')}
              title="View daily trends for workload analysis"
            >
              Daily
            </button>
            <button 
              className={`time-range-btn ${timeRange === 'weekly' ? 'active' : ''}`}
              onClick={() => setTimeRange('weekly')}
              title="View weekly trends for process consistency"
            >
              Weekly
            </button>
            <button 
              className={`time-range-btn ${timeRange === 'monthly' ? 'active' : ''}`}
              onClick={() => setTimeRange('monthly')}
              title="View monthly trends for management reporting"
            >
              Monthly
            </button>
          </div>
        </div>
      </div>
      <div className="ot-timeline-content">
        {isLoading ? (
          <div className="ot-timeline-loading">
            <i className="fas fa-exchange-alt"></i>
            <span>Loading request timeline...</span>
          </div>
        ) : error ? (
          <div className="ot-timeline-error">
            <i className="fas fa-exclamation-triangle"></i>
            <span>Failed to load data</span>
          </div>
        ) : (
          <div className="ot-timeline-chart-container" style={{ 
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

export default OverrideRequestTrendanalaytics;
