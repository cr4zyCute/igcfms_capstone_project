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
    <div className="pie-chart-wrapper" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'flex-start',
      gap: '40px',
      padding: '24px 20px',
      position: 'relative',
      minHeight: '220px'
    }}>
      {/* Pie Chart - Left Side */}
      <div style={{ 
        flex: '0 0 180px', 
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
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
              fontSize: '32px', 
              color: '#d1d5db', 
              marginBottom: '8px' 
            }}></i>
            <p style={{ 
              fontSize: '11px', 
              color: '#9ca3af', 
              fontWeight: '500',
              margin: 0,
              textAlign: 'center'
            }}>
              No data
            </p>
          </div>
        )}
        <svg width="180" height="180" viewBox={`0 0 ${svgSize} ${svgSize}`} className="pie-svg">
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

            cumulativePercentage += item.percent;

            return (
              <path
                key={index}
                d={pathData}
                fill={item.color}
                stroke="#ffffff"
                strokeWidth="2.5"
                style={{ 
                  filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05))'
                }}
              />
            );
          })}
        </svg>
      </div>

      {/* Legend with Progress Bars - Right Side */}
      <div style={{ 
        flex: '1', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '18px',
        paddingRight: '10px'
      }}>
        {data.map((item, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px'
          }}>
            {/* Label and Percentage */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '2px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '14px', 
                  height: '14px', 
                  backgroundColor: item.color,
                  borderRadius: '3px',
                  flexShrink: 0,
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                }}></div>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#1f2937',
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  letterSpacing: '-0.01em'
                }}>
                  {item.label}
                </span>
              </div>
              <span style={{ 
                fontSize: '14px', 
                fontWeight: '700', 
                color: '#111827',
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                minWidth: '50px',
                textAlign: 'right'
              }}>
                {item.percent.toFixed(1)}%
              </span>
            </div>
            
            {/* Progress Bar */}
            <div style={{ 
              width: '100%', 
              height: '6px', 
              backgroundColor: '#f3f4f6',
              borderRadius: '3px',
              overflow: 'hidden',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ 
                width: `${item.percent}%`, 
                height: '100%', 
                backgroundColor: item.color,
                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: '3px'
              }}></div>
            </div>
            
            {/* Count */}
            <span style={{ 
              fontSize: '12px', 
              color: '#6b7280',
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
              fontWeight: '500'
            }}>
              {item.count} request{item.count !== 1 ? 's' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequestDistributionPieG;
