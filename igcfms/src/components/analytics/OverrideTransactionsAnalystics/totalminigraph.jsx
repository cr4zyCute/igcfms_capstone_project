import React, { useState } from 'react';
import './css/totalminigraph.css';

const TotalMiniGraph = ({ overrideRequests = [] }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Use real data from override requests - HOURLY for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Filter requests from today only
  const todayRequests = overrideRequests.filter(item => {
    const requestDate = new Date(item.created_at);
    return requestDate >= today && requestDate < tomorrow;
  });

  // Group by hour (0-23)
  const hourlyData = {};
  for (let hour = 0; hour < 24; hour++) {
    hourlyData[hour] = 0;
  }

  todayRequests.forEach(item => {
    const hour = new Date(item.created_at).getHours();
    hourlyData[hour] += 1;
  });

  // Get all 24 hours
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const values = hours.map(hour => hourlyData[hour]);
  const dates = hours.map(hour => {
    // Format as 12-hour time: 12am, 1am, 2am... 12pm, 1pm...
    if (hour === 0) return '12am';
    if (hour < 12) return `${hour}am`;
    if (hour === 12) return '12pm';
    return `${hour - 12}pm`;
  });
  
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
              fill="#374151"
              fontSize="13"
              fontWeight="600"
              fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
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
        
        {/* X-axis labels (hours) - show every 3 hours */}
        {dates.map((date, index) => {
          const x = paddingLeft + (index / (values.length - 1 || 1)) * chartWidth;
          // Show labels for 12am, 3am, 6am, 9am, 12pm, 3pm, 6pm, 9pm
          const shouldShow = index % 3 === 0;
          if (!shouldShow) return null;
          
          return (
            <text
              key={`xlabel-${index}`}
              x={x}
              y={height - 5}
              textAnchor="middle"
              fill="#374151"
              fontSize="12"
              fontWeight="600"
              fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
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
                fontSize="12"
                fontWeight="700"
                fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
              >
                {hoveredPoint.date}
              </text>
              <text
                x={hoveredPoint.x}
                y={textY + 10}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="11"
                fontWeight="600"
                fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
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
