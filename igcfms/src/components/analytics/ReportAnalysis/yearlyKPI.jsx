import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import './css/yearlyKPI.css';

const YearlyKPI = ({ transactions = [] }) => {
  const mockCollections = 4800000;
  const mockDisbursements = 3650000;
  const mockNetBalance = mockCollections - mockDisbursements;
  const mockYoyGrowth = 8.5;
  const mockEfficiency = (mockDisbursements / mockCollections) * 100;

  const generateMockMonthlyData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames.map((month) => {
      const collections = Math.floor(Math.random() * 450000) + 250000;
      const disbursements = Math.floor(Math.random() * 320000) + 180000;
      return {
        month,
        collections,
        disbursements,
        netBalance: collections - disbursements
      };
    });
  };

  const generateMockGrowthData = () => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 4;
    let base = 3200000;
    return Array.from({ length: 5 }, (_, idx) => {
      const year = startYear + idx;
      base += Math.floor(Math.random() * 200000) - 50000;
      return {
        year: year.toString(),
        collections: Math.max(base, 2500000)
      };
    });
  };

  const [yearlyData, setYearlyData] = useState({
    totalCollections: mockCollections,
    totalDisbursements: mockDisbursements,
    yearlyNetBalance: mockNetBalance,
    yoyGrowth: mockYoyGrowth,
    costEfficiencyRatio: mockEfficiency
  });
  const [monthlyData, setMonthlyData] = useState(generateMockMonthlyData());
  const [growthTrendData, setGrowthTrendData] = useState(generateMockGrowthData());

  const monthlyBarRef = useRef(null);
  const netBalanceRef = useRef(null);
  const growthLineRef = useRef(null);

  const monthlyBarInstance = useRef(null);
  const netBalanceInstance = useRef(null);
  const growthLineInstance = useRef(null);

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      calculateYearlyData();
    }
  }, [transactions]);

  useEffect(() => {
    initializeMonthlyBarChart();
    return () => {
      if (monthlyBarInstance.current) {
        monthlyBarInstance.current.destroy();
      }
    };
  }, [monthlyData]);

  useEffect(() => {
    initializeNetBalanceChart();
    return () => {
      if (netBalanceInstance.current) {
        netBalanceInstance.current.destroy();
      }
    };
  }, [monthlyData]);

  useEffect(() => {
    initializeGrowthLineChart();
    return () => {
      if (growthLineInstance.current) {
        growthLineInstance.current.destroy();
      }
    };
  }, [growthTrendData]);

  const calculateYearlyData = () => {
    // Placeholder: when real transaction data is available, compute actual metrics here
    // For now we simply retain the mock data to keep charts populated
  };

  const initializeMonthlyBarChart = () => {
    if (!monthlyBarRef.current) return;

    const ctx = monthlyBarRef.current.getContext('2d');

    if (monthlyBarInstance.current) {
      monthlyBarInstance.current.destroy();
    }

    monthlyBarInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthlyData.map(d => d.month),
        datasets: [
          {
            label: 'Collections',
            data: monthlyData.map(d => d.collections),
            backgroundColor: '#10b981',
            borderRadius: 6,
            barThickness: 24
          },
          {
            label: 'Disbursements',
            data: monthlyData.map(d => d.disbursements),
            backgroundColor: '#ef4444',
            borderRadius: 6,
            barThickness: 24
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { size: 12, weight: '600' },
              color: '#111827',
              usePointStyle: true,
              padding: 16
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
              label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
            }
          }
        },
        scales: {
          x: {
            stacked: false,
            ticks: {
              color: '#1f2937',
              font: { size: 11, weight: '600' }
            },
            grid: {
              display: false
            }
          },
          y: {
            stacked: false,
            ticks: {
              color: '#1f2937',
              font: { size: 11, weight: '600' },
              callback: (value) => formatShortCurrency(value)
            },
            grid: {
              color: 'rgba(17, 24, 39, 0.08)',
              drawBorder: false
            }
          }
        }
      }
    });
  };

  const initializeNetBalanceChart = () => {
    if (!netBalanceRef.current) return;

    const ctx = netBalanceRef.current.getContext('2d');

    if (netBalanceInstance.current) {
      netBalanceInstance.current.destroy();
    }

    netBalanceInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthlyData.map(d => d.month),
        datasets: [
          {
            label: 'Net Balance',
            data: monthlyData.map(d => d.netBalance),
            backgroundColor: monthlyData.map(d => d.netBalance >= 0 ? '#10b981' : '#ef4444'),
            borderRadius: 6,
            barThickness: 28
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
              label: (context) => `Net Balance: ${formatCurrency(context.parsed.y)}`
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#1f2937',
              font: { size: 11, weight: '600' }
            },
            grid: {
              display: false
            }
          },
          y: {
            ticks: {
              color: '#1f2937',
              font: { size: 11, weight: '600' },
              callback: (value) => formatShortCurrency(value)
            },
            grid: {
              color: 'rgba(17, 24, 39, 0.08)',
              drawBorder: false
            }
          }
        }
      }
    });
  };

  const initializeGrowthLineChart = () => {
    if (!growthLineRef.current) return;

    const ctx = growthLineRef.current.getContext('2d');

    if (growthLineInstance.current) {
      growthLineInstance.current.destroy();
    }

    // Chart area background gradient plugin
    const chartAreaBackgroundPlugin = {
      id: 'chartAreaBackgroundPlugin',
      beforeDraw: (chart) => {
        const { ctx: pluginCtx, chartArea } = chart;
        if (!chartArea) return;
        const backgroundGradient = pluginCtx.createLinearGradient(
          chartArea.left,
          chartArea.top,
          chartArea.right,
          chartArea.bottom
        );
        backgroundGradient.addColorStop(0, '#ffffff');
        backgroundGradient.addColorStop(1, '#f3f4f6');
        pluginCtx.save();
        pluginCtx.fillStyle = backgroundGradient;
        pluginCtx.fillRect(
          chartArea.left,
          chartArea.top,
          chartArea.right - chartArea.left,
          chartArea.bottom - chartArea.top
        );
        pluginCtx.restore();
      }
    };

    // Value label plugin for data points
    const valueLabelPlugin = {
      id: 'valueLabelPlugin',
      afterDatasetsDraw: (chart) => {
        const { ctx: pluginCtx, data } = chart;
        const dataset = data.datasets[0];
        if (!dataset) return;
        const meta = chart.getDatasetMeta(0);
        pluginCtx.save();
        pluginCtx.font = "600 12px 'Inter', 'Segoe UI', sans-serif";
        pluginCtx.fillStyle = '#0f172a';
        pluginCtx.textAlign = 'center';
        pluginCtx.textBaseline = 'bottom';

        meta.data.forEach((point, index) => {
          const raw = dataset.data[index];
          if (raw === undefined || raw === null) return;
          const text = formatShortCurrency(raw);
          const x = point.x;
          const y = point.y - 8;
          pluginCtx.fillText(text, x, y);
        });

        pluginCtx.restore();
      }
    };

    growthLineInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: growthTrendData.map(d => d.year),
        datasets: [
          {
            label: 'Collections',
            data: growthTrendData.map(d => d.collections),
            borderColor: '#000000',
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
            borderWidth: 3,
            fill: true,
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 9,
            pointBackgroundColor: '#000000',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#111827',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1800,
          easing: 'easeInOutCubic',
          delay: (context) => {
            if (context.type === 'data' && context.mode === 'default') {
              return context.dataIndex * 100;
            }
            return 0;
          }
        },
        layout: {
          padding: {
            top: 24,
            bottom: 12,
            left: 14,
            right: 14
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
              title: (context) => `Year ${context[0].label}`,
              label: (context) => ` Collections: ${formatCurrency(context.parsed.y)}`
            }
          }
        },
        scales: {
          x: {
            title: {
              display: false
            },
            ticks: {
              color: '#1f2937',
              font: { size: 12, weight: '600' },
              padding: 10
            },
            grid: {
              color: 'rgba(17, 24, 39, 0.12)',
              lineWidth: 1,
              drawBorder: false,
              drawTicks: false
            },
            border: {
              display: true,
              color: '#d1d5db'
            }
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Collections (₱)',
              color: '#111827',
              font: {
                size: 13,
                weight: '700',
                family: "'Inter', 'Segoe UI', sans-serif"
              },
              padding: { top: 0, bottom: 10 }
            },
            ticks: {
              color: '#1f2937',
              font: { size: 11, weight: '600' },
              padding: 10,
              callback: (value) => formatShortCurrency(value)
            },
            grid: {
              color: 'rgba(17, 24, 39, 0.12)',
              lineWidth: 1,
              drawBorder: false,
              drawTicks: false
            },
            border: {
              display: true,
              color: '#d1d5db'
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      },
      plugins: [chartAreaBackgroundPlugin, valueLabelPlugin]
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatShortCurrency = (value) => {
    if (value >= 1000000) {
      return `₱${(value / 1000000).toFixed(1)}M`;
    }
    return `₱${(value / 1000).toFixed(0)}K`;
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="yearly-kpi-container">
      <div className="yearly-kpi-header">
        <i className="fas fa-calendar"></i>
        <h3>YEARLY REPORT (Management & Planning)</h3>
      </div>
      
      {/* KPI Metrics */}
      <div className="yearly-kpi-metrics">
        <div className="kpi-metric-small">
          <div className="metric-label">Total Collections YTD</div>
          <div className="metric-value collections">
            {formatCurrency(yearlyData.totalCollections)}
          </div>
        </div>
        
        <div className="kpi-metric-small">
          <div className="metric-label">Total Disbursements YTD</div>
          <div className="metric-value disbursements">
            {formatCurrency(yearlyData.totalDisbursements)}
          </div>
        </div>
        
        <div className="kpi-metric-small">
          <div className="metric-label">Yearly Net Balance</div>
          <div className="metric-value net-balance">
            {formatCurrency(yearlyData.yearlyNetBalance)}
          </div>
        </div>
        
        <div className="kpi-metric-small">
          <div className="metric-label">Year-over-Year Growth</div>
          <div className={`metric-value ${yearlyData.yoyGrowth >= 0 ? 'growth-positive' : 'growth-negative'}`}>
            {formatPercentage(yearlyData.yoyGrowth)}
          </div>
        </div>
        
        <div className="kpi-metric-small">
          <div className="metric-label">Cost Efficiency Ratio</div>
          <div className="metric-value efficiency">
            {yearlyData.costEfficiencyRatio.toFixed(1)}%
          </div>
        </div>
      </div>
      
      {/* Graphs Section */}
      <div className="yearly-graphs">
        {/* Bar Chart: Monthly Collections vs Disbursements */}
        <div className="graph-container bar-chart-container">
          <h4>Collections vs Disbursements (per month)</h4>
          <div className="chart-wrapper">
            <canvas ref={monthlyBarRef}></canvas>
          </div>
        </div>
        
        {/* Stacked Bar Chart: Yearly Net Balance */}
        <div className="graph-container stacked-chart-container">
          <h4>Stacked Chart: Yearly Net Balance</h4>
          <div className="chart-wrapper">
            <canvas ref={netBalanceRef}></canvas>
          </div>
        </div>
        
        {/* Line Chart: Year-over-Year Growth Trend */}
        <div className="graph-container growth-chart-container">
          <div className="chart-wrapper" style={{ position: 'relative' }}>
            <h4 style={{ position: 'absolute', top: '3px', left: '56%', margin: 0, zIndex: 10, fontSize: '13px', fontWeight: '700', color: '#111827', letterSpacing: '0.5px' }}>YEAR-OVER-YEAR GROWTH TREND</h4>
            <canvas ref={growthLineRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YearlyKPI;
