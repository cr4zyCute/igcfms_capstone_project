import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const UserStatusDistribution = ({ kpiData }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) chartRef.current.destroy();

    const source = (kpiData?.roleDistribution && kpiData.roleDistribution.length)
      ? kpiData.roleDistribution
      : (kpiData?.statusDistribution || []);
    const labels = source.map((s) => s.status);
    const data = source.map((s) => s.count);
    const colors = source.map((s) => s.color);

    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { display: false },
        },
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
    <div className="um-card um-pie-card">
      <div className="um-card-header">
        <h3><i className="fas fa-chart-pie"></i> User Role Distribution</h3>
        <span className="um-subtext">Percentages and counts</span>
      </div>
      <div className="um-card-body">
        <div className="um-chart-placeholder um-pie-large" id="um-status-pie" aria-label="User Status Pie Chart">
          <canvas id="um-status-pie-canvas" ref={canvasRef}></canvas>
        </div>
        <ul className="um-legend">
          {((kpiData?.roleDistribution && kpiData.roleDistribution.length ? kpiData.roleDistribution : (kpiData?.statusDistribution || []))).map((s, idx) => (
            <li key={idx}>
              <span className="um-legend-dot" style={{ background: s.color }}></span>
              <span className="um-legend-label">{s.status}</span>
              <span className="um-legend-value">{s.count}</span>
              <span className="um-legend-pct">{s.percentage}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserStatusDistribution;
