import React, { useState } from 'react';
import './css/totalminigraph.css';

const TotalMiniGraph = ({ overrideRequests = [] }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Use real data from override requests
  const dailyData = overrideRequests.reduce((acc, item) => {
    const date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += 1;
    return acc;
  }, {});
  
  // Get last 7 days
  const sortedDates = Object.keys(dailyData).slice(-7);
  const values = sortedDates.map(date => dailyData[date]);
  const dates = sortedDates;
  
  if (values.length === 0) {
    return <div className="no-graph-data">No data available</div>;
  }
  
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;
  
  const width = 700;
  const height = 120;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 10;
  const paddingBottom = 25;
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  const points = values.map((value, index) => {
    const x = paddingLeft + (index / (values.length - 1 || 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((value - minValue) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');
  
  // Calculate Y-axis labels
  const yAxisSteps = 5;
  const yAxisLabels = [];
  for (let i = 0; i <= yAxisSteps; i++) {
    const value = minValue + (range * i / yAxisSteps);
    yAxisLabels.push(Math.round(value));
  }
  
  return (
    <div className="total-mini-graph-container">
      <svg viewBox={`0 0 ${width} ${height}`} className="mini-graph-svg" preserveAspectRatio="none">
        {/* Grid lines */}
        {yAxisLabels.map((label, index) => {
          const y = paddingTop + chartHeight - (index / yAxisSteps) * chartHeight;
          return (
            <line
              key={`grid-${index}`}
              x1={paddingLeft}
              y1={y}
              x2={width - paddingRight}
              y2={y}
              stroke="#e5e5e5"
              strokeWidth="1"
            />
          );
        })}
        
        {/* Y-axis labels */}
        {yAxisLabels.map((label, index) => {
          const y = paddingTop + chartHeight - (index / yAxisSteps) * chartHeight;
          return (
            <text
              key={`ylabel-${index}`}
              x={paddingLeft - 10}
              y={y + 4}
              textAnchor="end"
              fill="#666666"
              fontSize="11"
              fontWeight="500"
            >
              {label}
            </text>
          );
        })}
        
        {/* Area fill */}
        <polygon
          points={`${paddingLeft},${paddingTop + chartHeight} ${points} ${paddingLeft + chartWidth},${paddingTop + chartHeight}`}
          fill="rgba(0, 0, 0, 0.08)"
        />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {values.map((value, index) => {
          const x = paddingLeft + (index / (values.length - 1 || 1)) * chartWidth;
          const y = paddingTop + chartHeight - ((value - minValue) / range) * chartHeight;
          return (
            <g key={index}>
              <circle
                cx={x}
                cy={y}
                r="10"
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPoint({ index, value, date: dates[index], x, y })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="#000000"
                style={{ pointerEvents: 'none' }}
              />
            </g>
          );
        })}
        
        {/* X-axis labels (dates) */}
        {dates.map((date, index) => {
          const x = paddingLeft + (index / (values.length - 1 || 1)) * chartWidth;
          return (
            <text
              key={`xlabel-${index}`}
              x={x}
              y={height - 5}
              textAnchor="middle"
              fill="#666666"
              fontSize="10"
              fontWeight="500"
            >
              {date}
            </text>
          );
        })}
        
        {/* Tooltip */}
        {hoveredPoint && (() => {
          const isTopHalf = hoveredPoint.y < height / 2;
          const tooltipY = isTopHalf ? hoveredPoint.y + 10 : hoveredPoint.y - 28;
          const textY = isTopHalf ? hoveredPoint.y + 22 : hoveredPoint.y - 16;
          
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect
                x={hoveredPoint.x - 30}
                y={tooltipY}
                width="60"
                height="22"
                fill="#4a5568"
                rx="4"
                opacity="0.95"
              />
              <text
                x={hoveredPoint.x}
                y={textY}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="11"
                fontWeight="700"
              >
                {hoveredPoint.date}
              </text>
              <text
                x={hoveredPoint.x}
                y={textY + 10}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="10"
                fontWeight="600"
              >
                {hoveredPoint.value} requests
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
};

export default TotalMiniGraph;
