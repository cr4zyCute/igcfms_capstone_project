import React, { useMemo, useState } from 'react';
import './css/TrendChart.css';

const TrendChart = React.memo(({ collectionsData, disbursementsData }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const chartData = useMemo(() => {
    if (!collectionsData || !disbursementsData || collectionsData.length === 0) {
      return null;
    }

    // Get max values for dual-axis scaling with 0 in center
    const maxCollection = Math.max(...collectionsData.map(d => d.value), 1);
    const maxDisbursement = Math.max(...disbursementsData.map(d => d.value), 1);
    
    // Use the larger of the two for symmetric scaling
    const maxValue = Math.max(maxCollection, maxDisbursement);
    const minValue = -maxValue; // Symmetric range around 0
    const range = maxValue - minValue || 1;

    // SVG dimensions
    const width = 800;
    const height = 250;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Create points for collections line (above center)
    const collectionPoints = collectionsData.map((item, index) => {
      const x = padding.left + (index / (collectionsData.length - 1 || 1)) * chartWidth;
      const y = padding.top + chartHeight - ((item.value - minValue) / range) * chartHeight;
      return { x, y, value: item.value, date: item.date, type: 'collection' };
    });

    // Create points for disbursements line (using actual positive values)
    const disbursementPointsAll = disbursementsData.map((item, index) => {
      const x = padding.left + (index / (disbursementsData.length - 1 || 1)) * chartWidth;
      const y = padding.top + chartHeight - ((item.value - minValue) / range) * chartHeight;
      return { x, y, value: item.value, date: item.date, type: 'disbursement', originalIndex: index };
    });
    
    // Always show disbursements line if there's data
    const hasMeaningfulDisbursements = disbursementsData && disbursementsData.length > 0;
    
    // Use all points for line display, but only show line if there are meaningful values
    const disbursementPoints = disbursementPointsAll;

    // Calculate center Y position (where 0 is)
    const centerY = padding.top + chartHeight - ((0 - minValue) / range) * chartHeight;

    // Y-axis labels (9 ticks, centered around 0)
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
      disbursementPointsAll,
      hasMeaningfulDisbursements,
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

  const { collectionPoints, disbursementPoints, disbursementPointsAll, hasMeaningfulDisbursements, yTicks, xTicks, width, height, padding, chartWidth, chartHeight, centerY } = chartData;

  // Helper function to check if collection and disbursement values are the same at a given index
  const hasSameValues = (index) => {
    if (!collectionsData || !disbursementsData || index >= collectionsData.length || index >= disbursementsData.length) {
      return false;
    }
    return Math.abs(collectionsData[index].value - disbursementsData[index].value) < 0.01;
  };

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

        {/* Disbursements area fill (below center) - only show if there are meaningful values */}
        {hasMeaningfulDisbursements && (
          <polygon
            points={`${padding.left},${centerY} ${disbursementPoints.map(p => `${p.x},${p.y}`).join(' ')} ${padding.left + chartWidth},${centerY}`}
            fill="rgba(234, 67, 53, 0.15)"
          />
        )}

        {/* Collections line */}
        <polyline
          points={collectionPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#1b5e20"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Disbursements line - only show if there are meaningful values */}
        {hasMeaningfulDisbursements && (
          <polyline
            points={disbursementPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#b71c1c"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Hover areas and visible dots for collections */}
        {collectionPoints.map((point, index) => (
          <g key={`col-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="8"
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredPoint({ ...point, index, type: 'collection' })}
              onMouseLeave={() => setHoveredPoint(null)}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r="2"
              fill="#1b5e20"
              style={{ pointerEvents: 'none' }}
            />
          </g>
        ))}

        {/* Hover areas and visible dots for disbursements */}
        {hasMeaningfulDisbursements && disbursementPointsAll.map((point, index) => (
          <g key={`dis-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="8"
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredPoint({ ...point, index, type: 'disbursement' })}
              onMouseLeave={() => setHoveredPoint(null)}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r="2"
              fill="#b71c1c"
              style={{ pointerEvents: 'none' }}
            />
          </g>
        ))}

        {/* Color-coded tooltips - Smart positioning to stay within chart bounds */}
        {hoveredPoint && (() => {
          const hoveredIndex = hoveredPoint.index;
          
          // Ensure we have valid coordinates from the hovered point
          const pointX = hoveredPoint.x;
          const pointY = hoveredPoint.y;
          
          // Chart boundaries
          const chartLeft = padding.left;
          const chartRight = padding.left + chartWidth;
          const chartTop = padding.top;
          const chartBottom = padding.top + chartHeight;
          
          // Tooltip dimensions
          const tooltipWidth = 70;
          const tooltipHeight = 18;
          
          // Smart positioning functions
          const getTooltipX = (centerX) => {
            let x = centerX - tooltipWidth / 2;
            if (x < chartLeft) x = chartLeft;
            if (x + tooltipWidth > chartRight) x = chartRight - tooltipWidth;
            return x;
          };
          
          const getTooltipY = (centerY, preferTop = true) => {
            if (preferTop) {
              // Try to place above first
              const topY = centerY - tooltipHeight - 8;
              if (topY >= chartTop) return topY;
              // If can't fit above, place below
              return centerY + 8;
            } else {
              // Try to place below first
              const bottomY = centerY + 8;
              if (bottomY + tooltipHeight <= chartBottom) return bottomY;
              // If can't fit below, place above
              return centerY - tooltipHeight - 8;
            }
          };
          
          // Check if values are the same at this index
          if (hasSameValues(hoveredIndex) && hasMeaningfulDisbursements && hoveredIndex < collectionPoints.length && hoveredIndex < disbursementPointsAll.length) {
            // Dual tooltips - Collections (green) on top, Disbursements (red) on bottom
            const disbursementPoint = disbursementPointsAll[hoveredIndex];
            
            // Smart positioning for dual tooltips
            const topTooltipY = getTooltipY(pointY, true);
            const bottomTooltipY = getTooltipY(pointY, false);
            const tooltipX = getTooltipX(pointX);
            
            return (
              <g style={{ pointerEvents: 'none' }}>
                {/* Collections tooltip (dark green, top) */}
                <rect
                  x={tooltipX}
                  y={topTooltipY}
                  width={tooltipWidth}
                  height={tooltipHeight}
                  fill="#1b5e20"
                  rx="3"
                  opacity="0.95"
                />
                <text
                  x={tooltipX + tooltipWidth / 2}
                  y={topTooltipY + 12}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="8"
                  fontWeight="700"
                >
                  ₱{hoveredPoint.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </text>
                
                {/* Disbursements tooltip (dark red, bottom) */}
                <rect
                  x={tooltipX}
                  y={bottomTooltipY}
                  width={tooltipWidth}
                  height={tooltipHeight}
                  fill="#b71c1c"
                  rx="3"
                  opacity="0.95"
                />
                <text
                  x={tooltipX + tooltipWidth / 2}
                  y={bottomTooltipY + 12}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="8"
                  fontWeight="700"
                >
                  ₱{disbursementPoint.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </text>
              </g>
            );
          } else {
            // Single tooltip - color and position based on line type
            const tooltipX = getTooltipX(pointX);
            
            if (hoveredPoint.type === 'collection') {
              // Collections: Dark green tooltip, prefer top
              const tooltipY = getTooltipY(pointY, true);
              
              return (
                <g style={{ pointerEvents: 'none' }}>
                  <rect
                    x={tooltipX}
                    y={tooltipY}
                    width={tooltipWidth}
                    height={tooltipHeight}
                    fill="#1b5e20"
                    rx="3"
                    opacity="0.95"
                  />
                  <text
                    x={tooltipX + tooltipWidth / 2}
                    y={tooltipY + 12}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="8"
                    fontWeight="700"
                  >
                    ₱{hoveredPoint.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </text>
                </g>
              );
            } else {
              // Disbursements: Dark red tooltip, prefer bottom
              const tooltipY = getTooltipY(pointY, false);
              
              return (
                <g style={{ pointerEvents: 'none' }}>
                  <rect
                    x={tooltipX}
                    y={tooltipY}
                    width={tooltipWidth}
                    height={tooltipHeight}
                    fill="#b71c1c"
                    rx="3"
                    opacity="0.95"
                  />
                  <text
                    x={tooltipX + tooltipWidth / 2}
                    y={tooltipY + 12}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="8"
                    fontWeight="700"
                  >
                    ₱{hoveredPoint.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </text>
                </g>
              );
            }
          }
        })()}

        {/* Legend */}
        <g transform={`translate(${padding.left + 20}, ${padding.top - 10})`}>
          <circle cx="0" cy="0" r="4" fill="#1b5e20" />
          <text x="10" y="4" fontSize="12" fill="#666">Collections</text>
          
          <circle cx="100" cy="0" r="4" fill="#b71c1c" />
          <text x="110" y="4" fontSize="12" fill="#666">Disbursements</text>
        </g>
      </svg>
    </div>
  );
});

TrendChart.displayName = 'TrendChart';

export default TrendChart;
