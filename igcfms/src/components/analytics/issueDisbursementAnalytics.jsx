import React, { useRef, useEffect, useMemo } from 'react';
import Chart from 'chart.js/auto';

const IssueDisbursementTrends = ({
  disbursements = [],
  transactions = [],
  disbursementPeriod = 'week',
  onPeriodChange
}) => {
  const disbursementChartRef = useRef(null);
  const disbursementChartInstance = useRef(null);

  const transactionMap = useMemo(() => {
    const map = new Map();
    transactions.forEach((tx) => {
      const id = Number(tx?.id);
      if (!Number.isNaN(id)) {
        map.set(id, tx);
      }
    });
    return map;
  }, [transactions]);

  const getDisbursementDate = (disbursement) => {
    const dateSource = disbursement?.issued_at || disbursement?.created_at || disbursement?.updated_at;
    if (!dateSource) return null;
    const date = new Date(dateSource);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  useEffect(() => {
    initializeDisbursementChart();

    return () => {
      if (disbursementChartInstance.current) {
        disbursementChartInstance.current.destroy();
      }
    };
  }, [disbursements, disbursementPeriod, transactionMap]);

  const initializeDisbursementChart = () => {
    if (!disbursementChartRef.current) {
      return;
    }

    if (!disbursements.length) {
      return;
    }

    const ctx = disbursementChartRef.current.getContext('2d');

    if (disbursementChartInstance.current) {
      disbursementChartInstance.current.destroy();
    }

    let chartData = [];
    let chartLabels = [];

    if (disbursementPeriod === 'week') {
      const weeks = [];
      const now = new Date();
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

        const weekDisbursements = disbursements.filter((disbursement) => {
          const disbursementDate = getDisbursementDate(disbursement);
          if (!disbursementDate) return false;
          return disbursementDate >= weekStart && disbursementDate <= weekEnd;
        });

        const weekAmount = weekDisbursements.reduce((sum, disbursement) => {
          const transaction = transactionMap.get(Number(disbursement?.transaction_id));
          return sum + (parseFloat(transaction?.amount) || 0);
        }, 0);

        weeks.push({
          order: 8 - i,
          label: `W${8 - i}`,
          amount: weekAmount,
        });
      }

      const sortedWeeks = weeks.sort((a, b) => a.order - b.order);
      chartLabels = sortedWeeks.map((week) => week.label);
      chartData = sortedWeeks.map((week) => week.amount);
    } else {
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const monthDisbursements = disbursements.filter((disbursement) => {
          const disbursementDate = getDisbursementDate(disbursement);
          if (!disbursementDate) return false;
          return disbursementDate >= monthDate && disbursementDate < nextMonth;
        });

        const monthAmount = monthDisbursements.reduce((sum, disbursement) => {
          const transaction = transactionMap.get(Number(disbursement?.transaction_id));
          return sum + (parseFloat(transaction?.amount) || 0);
        }, 0);

        months.push({
          label: monthDate.toLocaleDateString('en-US', { month: 'short' }),
          amount: monthAmount,
        });
      }

      chartLabels = months.map((month) => month.label);
      chartData = months.map((month) => month.amount);
    }

    const sanitizedValues = chartData.map((value) => (value < 0 ? 0 : value));
    chartData = sanitizedValues;

    const gradient = ctx.createLinearGradient(0, 0, 480, 0);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(0.45, '#1f2937');
    gradient.addColorStop(1, '#111827');

    const formatAxisValue = (value) => {
      if (Math.abs(value) >= 1000000) {
        return `₱${(value / 1000000).toFixed(1)}M`;
      }
      if (Math.abs(value) >= 1000) {
        return `₱${Math.round(value / 1000)}K`;
      }
      return `₱${Number(value).toLocaleString()}`;
    };

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
        pluginCtx.textBaseline = 'middle';

        meta.data.forEach((bar, index) => {
          const raw = dataset.data[index];
          if (raw === undefined || raw === null) return;
          const text = formatAxisValue(raw);
          const isPositive = raw >= 0;
          const offset = 14;
          pluginCtx.textAlign = isPositive ? 'left' : 'right';
          const chartArea = chart.chartArea || {};
          const maxX = (chartArea.right ?? bar.x) - 10;
          const minX = (chartArea.left ?? bar.x) + 8;
          const x = isPositive
            ? Math.min(bar.x + offset, maxX)
            : Math.max(bar.x - offset, minX);
          const y = bar.y;
          pluginCtx.fillText(text, x, y);
        });

        pluginCtx.restore();
      }
    };

    disbursementChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Disbursement Amount (₱)',
          data: chartData,
          backgroundColor: gradient,
          borderColor: '#0f172a',
          borderWidth: 1,
          borderRadius: 0,
          borderSkipped: false,
          indexAxis: 'y',
          barThickness: disbursementPeriod === 'week' ? 46 : 54,
          maxBarThickness: 68,
          categoryPercentage: 0.95,
          barPercentage: 0.95,
          hoverBackgroundColor: '#1f2937',
          hoverBorderColor: '#111827',
          hoverBorderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
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
            top: 8,
            bottom: 12,
            left: 14,
            right: 26
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
              title: (context) => `${context[0].label}`,
              label: (context) => ` Disbursed: ${formatAxisValue(context.parsed.x)}`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Amount (₱)',
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
              font: {
                size: 11,
                weight: '600'
              },
              padding: 10,
              callback: (value) => formatAxisValue(value)
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
            offset: false,
            title: {
              display: true,
              text: disbursementPeriod === 'week' ? '' : 'Monthly Period',
              color: '#111827',
              font: {
                size: 13,
                weight: '700',
                family: "'Inter', 'Segoe UI', sans-serif"
              },
              padding: { top: 10, bottom: 0 }
            },
            ticks: {
              color: '#1f2937',
              font: {
                size: 12,
                weight: '600'
              },
              padding: 4,
              align: 'start',
              crossAlign: 'near',
              maxRotation: 0,
              minRotation: 0
            },
            grid: {
              color: 'rgba(17, 24, 39, 0.06)',
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

  return (
    <div className="dashboard-box box-1">
      <div className="box-header">
        <div className="box-title-with-indicator">
          <h3 className="box-title">Disbursement trends</h3>
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
        {!disbursements.length ? (
          <div className="chart-loading">
            <i className="fas fa-chart-bar"></i>
            <span>Loading disbursements...</span>
          </div>
        ) : (
          <div className="chart-container-full">
            <canvas ref={disbursementChartRef} id="issueDisbursementChart"></canvas>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueDisbursementTrends;
