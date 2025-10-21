import React, { useMemo, useState } from 'react';
import './css/TrendChart.css';

const TrendChart = React.memo(({ collectionsData, disbursementsData }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const chartData = useMemo(() => {
    if (!collectionsData || !disbursementsData || collectionsData.length === 0) {
      return null;
    }

    // Get max value for scaling with centered 0
    const allValues = [
      ...collectionsData.map(d => d.value),
      ...disbursementsData.map(d => -d.value) // Negative for disbursements
    ];
    const maxValue = Math.max(...allValues.map(Math.abs), 1);
    const minValue = -maxValue; // Symmetric range
    const range = maxValue - minValue || 1;

    // SVG dimensions
    const width = 800;
    const height = 250;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Create points for collections line (positive values, above center)
    const collectionPoints = collectionsData.map((item, index) => {
      const x = padding.left + (index / (collectionsData.length - 1 || 1)) * chartWidth;
      const y = padding.top + chartHeight - ((item.value - minValue) / range) * chartHeight;
      return { x, y, value: item.value, date: item.date, type: 'collection' };
    });

    // Create points for disbursements line (negative values, below center)
    const disbursementPoints = disbursementsData.map((item, index) => {
      const x = padding.left + (index / (disbursementsData.length - 1 || 1)) * chartWidth;
      const negativeValue = -item.value; // Make negative to go below center
      const y = padding.top + chartHeight - ((negativeValue - minValue) / range) * chartHeight;
      return { x, y, value: item.value, date: item.date, type: 'disbursement' };
    });

    // Calculate center Y position (where 0 is)
    const centerY = padding.top + chartHeight - ((0 - minValue) / range) * chartHeight;

    // Y-axis labels (9 ticks, centered at 0)
    const yTicks = [];
    for (let i = 0; i <= 8; i++) {
      const value = minValue + (range * i / 8);
      const y = padding.top + chartHeight - (i / 8) * chartHeight;
      yTicks.push({ value, y, isZero: Math.abs(value) < 0.01 });
    }

    // X-axis labels (show every 5th day)
    const xTicks = collectionsData
      .filter((_, index) => index % 5 === 0 || index === collectionsData.length - 1)
      .map((item, index, arr) => {
        const originalIndex = collectionsData.indexOf(item);
        const x = padding.left + (originalIndex / (collectionsData.length - 1 || 1)) * chartWidth;
        const date = new Date(item.date);
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        return { x, label };
      });

    return {
      collectionPoints,
      disbursementPoints,
      yTicks,
      xTicks,
      width,
      height,
      padding,
      chartWidth,
      chartHeight,
      centerY
    };
  }, [collectionsData, disbursementsData]);

  if (!chartData) {
    return <div className="no-chart-data">No data available</div>;
  }

  const { collectionPoints, disbursementPoints, yTicks, xTicks, width, height, padding, chartWidth, chartHeight, centerY } = chartData;

  return (
    <div className="trend-chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="trend-chart-svg">
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <line
            key={`grid-${i}`}
            x1={padding.left}
            y1={tick.y}
            x2={padding.left + chartWidth}
            y2={tick.y}
            stroke={tick.isZero ? "#666" : "#e0e0e0"}
            strokeWidth={tick.isZero ? "2" : "1"}
            strokeDasharray={tick.isZero ? "" : "4,4"}
          />
        ))}

        {/* Y-axis */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartHeight}
          stroke="#666"
          strokeWidth="2"
        />

        {/* X-axis (at center/zero line) */}
        <line
          x1={padding.left}
          y1={centerY}
          x2={padding.left + chartWidth}
          y2={centerY}
          stroke="#666"
          strokeWidth="2"
        />

        {/* Y-axis labels */}
        {yTicks.map((tick, i) => (
          <text
            key={`y-label-${i}`}
            x={padding.left - 10}
            y={tick.y + 4}
            textAnchor="end"
            fontSize="10"
            fill={tick.isZero ? "#000" : "#666"}
            fontWeight={tick.isZero ? "bold" : "normal"}
          >
            {tick.isZero ? "₱0" : `₱${(Math.abs(tick.value) / 1000).toFixed(0)}k`}
          </text>
        ))}

        {/* X-axis labels */}
        {xTicks.map((tick, i) => (
          <text
            key={`x-label-${i}`}
            x={tick.x}
            y={padding.top + chartHeight + 20}
            textAnchor="middle"
            fontSize="10"
            fill="#666"
          >
            {tick.label}
          </text>
        ))}

        {/* Collections area fill (above center) */}
        <polygon
          points={`${padding.left},${centerY} ${collectionPoints.map(p => `${p.x},${p.y}`).join(' ')} ${padding.left + chartWidth},${centerY}`}
          fill="rgba(52, 168, 83, 0.15)"
        />

        {/* Disbursements area fill (below center) */}
        <polygon
          points={`${padding.left},${centerY} ${disbursementPoints.map(p => `${p.x},${p.y}`).join(' ')} ${padding.left + chartWidth},${centerY}`}
          fill="rgba(234, 67, 53, 0.15)"
        />

        {/* Collections line */}
        <polyline
          points={collectionPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#34a853"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Disbursements line */}
        <polyline
          points={disbursementPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#ea4335"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Invisible hover areas for collections */}
        {collectionPoints.map((point, index) => (
          <circle
            key={`col-hover-${index}`}
            cx={point.x}
            cy={point.y}
            r="8"
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredPoint({ ...point, index })}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}

        {/* Invisible hover areas for disbursements */}
        {disbursementPoints.map((point, index) => (
          <circle
            key={`dis-hover-${index}`}
            cx={point.x}
            cy={point.y}
            r="8"
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredPoint({ ...point, index })}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}

        {/* Visible dots only on hover */}
        {hoveredPoint && (
          <>
            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r="6"
              fill={hoveredPoint.type === 'collection' ? '#34a853' : '#ea4335'}
              stroke="#fff"
              strokeWidth="3"
            />
            {/* Tooltip */}
            <g>
              <rect
                x={hoveredPoint.x - 70}
                y={hoveredPoint.y - 50}
                width="140"
                height="40"
                fill="rgba(0, 0, 0, 0.85)"
                rx="6"
                ry="6"
              />
              <text
                x={hoveredPoint.x}
                y={hoveredPoint.y - 32}
                textAnchor="middle"
                fontSize="11"
                fill="#fff"
                fontWeight="bold"
              >
                {new Date(hoveredPoint.date).toLocaleDateString()}
              </text>
              <text
                x={hoveredPoint.x}
                y={hoveredPoint.y - 18}
                textAnchor="middle"
                fontSize="13"
                fill={hoveredPoint.type === 'collection' ? '#34a853' : '#ea4335'}
                fontWeight="bold"
              >
                ₱{hoveredPoint.value.toLocaleString()}
              </text>
            </g>
          </>
        )}

        {/* Legend */}
        <g transform={`translate(${padding.left + 20}, ${padding.top - 10})`}>
          <circle cx="0" cy="0" r="4" fill="#34a853" />
          <text x="10" y="4" fontSize="12" fill="#666">Collections</text>
          
          <circle cx="100" cy="0" r="4" fill="#ea4335" />
          <text x="110" y="4" fontSize="12" fill="#666">Disbursements</text>
        </g>
      </svg>
    </div>
  );
});

TrendChart.displayName = 'TrendChart';

export default TrendChart;
