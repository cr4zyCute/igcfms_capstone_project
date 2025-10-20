import React from 'react';
import './css/RequestDistributionPieG.css';

const RequestDistributionPieG = ({ overrideRequests = [] }) => {
  // Use real data from override requests
  const pendingCount = overrideRequests.filter(req => req.status === 'pending').length;
  const approvedCount = overrideRequests.filter(req => req.status === 'approved').length;
  const rejectedCount = overrideRequests.filter(req => req.status === 'rejected').length;
  const total = overrideRequests.length || 1;

  const pendingPercent = (pendingCount / total) * 100;
  const approvedPercent = (approvedCount / total) * 100;
  const rejectedPercent = (rejectedCount / total) * 100;

  // Calculate pie slices
  let currentAngle = 0;
  const createSlice = (percent) => {
    const angle = (percent / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;

    const x1 = 100 + 80 * Math.cos(startRad);
    const y1 = 100 + 80 * Math.sin(startRad);
    const x2 = 100 + 80 * Math.cos(endRad);
    const y2 = 100 + 80 * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    return `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  const svgSize = 240;
  const radius = 70;
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;
  const padding = 40; // Padding for labels

  const data = [
    { label: 'Pending', percent: pendingPercent, color: '#1a1a1a', count: pendingCount },
    { label: 'Approved', percent: approvedPercent, color: '#4a4a4a', count: approvedCount },
    { label: 'Rejected', percent: rejectedPercent, color: '#7a7a7a', count: rejectedCount }
  ].filter(item => item.count > 0);

  let cumulativePercentage = 0;

  return (
    <div className="pie-chart-wrapper" style={{ position: 'relative' }}>
      {/* Show "No Data" message if there are no override requests */}
      {(overrideRequests.length === 0 || data.length === 0) && (
        <div style={{ 
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 10,
          pointerEvents: 'none'
        }}>
          <i className="fas fa-chart-pie" style={{ 
            fontSize: '48px', 
            color: '#d1d5db', 
            marginBottom: '16px' 
          }}></i>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            fontWeight: '500',
            margin: 0,
            textAlign: 'center',
            whiteSpace: 'nowrap'
          }}>
            No override requests data available
          </p>
          <p style={{ 
            fontSize: '12px', 
            color: '#9ca3af', 
            margin: '8px 0 0 0',
            textAlign: 'center',
            whiteSpace: 'nowrap'
          }}>
            Data will appear here once override requests are created
          </p>
        </div>
      )}
      <svg width="100%" height="100%" viewBox={`${-padding} ${-padding} ${svgSize + padding * 2} ${svgSize + padding * 2}`} className="pie-svg">
        {data.map((item, index) => {
          const startAngle = (cumulativePercentage / 100) * 2 * Math.PI - Math.PI / 2;
          const endAngle = ((cumulativePercentage + item.percent) / 100) * 2 * Math.PI - Math.PI / 2;
          
          const x1 = centerX + radius * Math.cos(startAngle);
          const y1 = centerY + radius * Math.sin(startAngle);
          const x2 = centerX + radius * Math.cos(endAngle);
          const y2 = centerY + radius * Math.sin(endAngle);
          
          const largeArcFlag = item.percent > 50 ? 1 : 0;
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');

          // Calculate label position
          const labelAngle = startAngle + (endAngle - startAngle) / 2;
          const labelRadius = radius + 35;
          const labelX = centerX + labelRadius * Math.cos(labelAngle);
          const labelY = centerY + labelRadius * Math.sin(labelAngle);

          cumulativePercentage += item.percent;

          return (
            <g key={index}>
              <path
                d={pathData}
                fill={item.color}
                stroke="#ffffff"
                strokeWidth="3"
              />
              {/* Label outside the pie */}
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fontWeight="600"
                fill="#374151"
              >
                <tspan x={labelX} dy="0">{item.label}</tspan>
                <tspan x={labelX} dy="14">{item.percent.toFixed(1)}%</tspan>
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default RequestDistributionPieG;
