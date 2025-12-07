import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const NewUsersOverTime = ({ kpiData }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    if (chartRef.current) chartRef.current.destroy();

    const gradientFill = ctx.createLinearGradient(0, 0, 0, canvasRef.current?.clientHeight || 220);
    gradientFill.addColorStop(0, 'rgba(17, 17, 17, 0.42)');
    gradientFill.addColorStop(1, 'rgba(17, 17, 17, 0.08)');

    const borderGradient = ctx.createLinearGradient(0, 0, canvasRef.current?.clientWidth || 320, 0);
    borderGradient.addColorStop(0, '#0f0f0f');
    borderGradient.addColorStop(1, '#3a3a3a');

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: kpiData?.newUsersOverTime?.labels || [],
        datasets: [
          {
            label: 'New Users',
            data: kpiData?.newUsersOverTime?.series || [],
            borderColor: borderGradient,
            backgroundColor: gradientFill,
            borderWidth: 3,
            fill: 'start',
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: '#111111',
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
          padding: { top: 16, bottom: 10, left: 10, right: 16 },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111111',
            titleColor: '#f5f5f5',
            bodyColor: '#d9d9d9',
            borderColor: '#333333',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: (context) => context[0].label,
              label: (context) => `New users: ${context.parsed.y}`,
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
        <h3><i className="fas fa-chart-line"></i> New Users Over Time</h3>
        <span className="um-subtext">{kpiData?.newUsersOverTime?.granularity === 'monthly' ? 'Monthly' : 'Daily'} registrations</span>
      </div>
      <div className="um-card-body">
        <div className="um-chart-placeholder" id="um-new-users" aria-label="New Users Chart">
          <canvas id="um-new-users-canvas" ref={canvasRef}></canvas>
        </div>
      </div>
    </div>
  );
};

export default NewUsersOverTime;
