import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const ActiveUsersTrend = ({ kpiData }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    if (chartRef.current) chartRef.current.destroy();

    const gradientFill = ctx.createLinearGradient(0, 0, 0, canvasRef.current?.clientHeight || 240);
    gradientFill.addColorStop(0, 'rgba(34, 34, 34, 0.38)');
    gradientFill.addColorStop(1, 'rgba(34, 34, 34, 0.08)');

    const borderGradient = ctx.createLinearGradient(0, 0, canvasRef.current?.clientWidth || 360, 0);
    borderGradient.addColorStop(0, '#1a1a1a');
    borderGradient.addColorStop(1, '#4a4a4a');

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: kpiData?.activeUsersTrend?.labels || [],
        datasets: [
          {
            label: 'Active Users',
            data: kpiData?.activeUsersTrend?.series || [],
            borderColor: borderGradient,
            backgroundColor: gradientFill,
            borderWidth: 3,
            fill: 'start',
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: '#222222',
            pointBorderColor: '#f5f5f5',
            pointBorderWidth: 2,
            pointHitRadius: 12,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 18, bottom: 12, left: 10, right: 20 },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1a1a',
            titleColor: '#f5f5f5',
            bodyColor: '#d9d9d9',
            borderColor: '#4d4d4d',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: (context) => context[0].label,
              label: (context) => `Active users: ${context.parsed.y}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(0, 0, 0, 0.08)', drawBorder: false },
            ticks: {
              color: '#1a1a1a',
              font: { size: 11, weight: '600' },
              maxRotation: 0,
              minRotation: 0,
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              color: '#1a1a1a',
              font: { size: 11, weight: '600' },
              padding: 8,
            },
            grid: { color: 'rgba(0, 0, 0, 0.08)', drawBorder: false },
          },
        },
        elements: { line: { borderJoinStyle: 'round' } },
        interaction: { intersect: false, mode: 'index' },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [kpiData]);

  return (
    <div className="um-card um-side-card">
      <div className="um-card-header">
        <h3><i className="fas fa-wave-square"></i> Active Users Trend</h3>
        <span className="um-subtext">Monthly active users (approx.)</span>
      </div>
      <div className="um-card-body">
        <div className="um-chart-placeholder" id="um-active-trend" aria-label="Active Users Trend Chart">
          <canvas id="um-active-trend-canvas" ref={canvasRef}></canvas>
        </div>
      </div>
    </div>
  );
};

export default ActiveUsersTrend;
