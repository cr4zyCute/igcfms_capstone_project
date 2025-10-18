import React, { useState } from 'react';

const ChequeMiniGraph = ({ cheques }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Group cheques by date and calculate daily totals
  const dailyData = cheques.reduce((acc, item) => {
    const date = new Date(item.issue_date || item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const amount = parseFloat(item.amount || 0);
    
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += Math.abs(amount);
    return acc;
  }, {});
  
  // Get last 7 days of data
  const sortedDates = Object.keys(dailyData).slice(-7);
  const values = sortedDates.map(date => dailyData[date]);
  const dates = sortedDates;
  
  if (values.length === 0) {
    return <div className="ic-no-graph-data">No data available</div>;
  }
  
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;
  
  // Create SVG points - dynamic width based on data points
  const pointWidth = 50; // Width per data point
  const width = Math.max(values.length * pointWidth, 300);
  const height = 50;
  const padding = 10;
  const paddingBottom = 2;
  
  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1 || 1)) * (width - padding * 2);
    const y = padding + (height - padding - paddingBottom) - ((value - minValue) / range) * (height - padding - paddingBottom);
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="ic-mini-graph-svg" preserveAspectRatio="xMidYMid meet">
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke="#000000"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Data points with hover */}
      {values.map((value, index) => {
        const x = padding + (index / (values.length - 1 || 1)) * (width - padding * 2);
        const y = padding + (height - padding - paddingBottom) - ((value - minValue) / range) * (height - padding - paddingBottom);
        return (
          <g key={index}>
            <circle
              cx={x}
              cy={y}
              r="8"
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredPoint({ index, value, date: dates[index], x, y })}
              onMouseLeave={() => setHoveredPoint(null)}
            />
            <circle
              cx={x}
              cy={y}
              r="2"
              fill="#000000"
              style={{ pointerEvents: 'none' }}
            />
          </g>
        );
      })}
      
      {/* Tooltip - position based on dot location */}
      {hoveredPoint && (() => {
        // If dot is in top half, show tooltip below; if in bottom half, show above
        const isTopHalf = hoveredPoint.y < height / 2;
        const tooltipY = isTopHalf ? hoveredPoint.y + 8 : hoveredPoint.y - 22;
        const textY = isTopHalf ? hoveredPoint.y + 20 : hoveredPoint.y - 10;
        
        return (
          <g style={{ pointerEvents: 'none' }}>
            <rect
              x={hoveredPoint.x - 25}
              y={tooltipY}
              width="50"
              height="18"
              fill="#000000"
              rx="3"
              opacity="0.95"
            />
            <text
              x={hoveredPoint.x}
              y={textY}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="7"
              fontWeight="700"
            >
              ₱{hoveredPoint.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </text>
          </g>
        );
      })()}
    </svg>
  );
};

export default ChequeMiniGraph;
