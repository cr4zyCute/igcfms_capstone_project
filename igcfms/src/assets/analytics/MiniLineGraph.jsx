import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const MiniLineGraph = ({ data, accountId, accountName, globalMaxAmount }) => {
  const processedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const validData = data
      .filter((point) => point && point.date && point.amount !== undefined)
      .map((point) => ({ ...point }));

    if (validData.length === 0) {
      return [];
    }

    const sortedData = [...validData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const allAmounts = sortedData.map((point) => Math.abs(parseFloat(point.amount) || 0));
    const positiveAmounts = allAmounts.filter((value) => value > 0);
    const localMaxAmount = positiveAmounts.length > 0 ? Math.max(...positiveAmounts) : 1;
    const localMinAmount = positiveAmounts.length > 0 ? Math.min(...positiveAmounts) : 1;
    const scalingMax = Math.max(Number.parseFloat(globalMaxAmount) || 0, localMaxAmount);
    const scalingMin = Math.min(localMinAmount, scalingMax);

    return sortedData.map((point, index) => {
      const amount = parseFloat(point.amount) || 0;
      const absAmount = Math.abs(amount);
      const isCollection = (point.type || '').toLowerCase() === 'collection';

      const logMax = Math.log10(Math.max(scalingMax, 1));
      const logMin = Math.log10(Math.max(scalingMin, 1));
      const logAmount = Math.log10(Math.max(absAmount, 1));
      const logRange = logMax - logMin;

      const normalizedValue = absAmount === 0
        ? 0
        : logRange <= 0
          ? 1
          : (logAmount - logMin) / logRange;

      const scaledValue = Math.max(normalizedValue * scalingMax, scalingMax * 0.08);

      return {
        ...point,
        index,
        absAmount,
        barValue: scaledValue,
        isCollection,
        color: isCollection ? '#22c55e' : '#ef4444',
        shortDate: new Date(point.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        dateFormatted: new Date(point.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        description: point.description || point.type || '',
      };
    });
  }, [data]);

  if (processedData.length === 0) {
    return <div className="graph-placeholder">No transaction data available.</div>;
  }

  const maxBarValue = processedData.reduce(
    (max, point) => Math.max(max, point.barValue),
    0
  );
  const yAxisMax = Math.max(maxBarValue * 1.1, 1);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      
      return (
        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          color: '#ffffff',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          border: 'none',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          zIndex: 1000,
          whiteSpace: 'nowrap'
        }}>
          {point.isCollection ? '+' : '-'}₱{point.absAmount.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </div>
      );
    }
    return null;
  };

  const minBarWidth = 36;
  const barSpacing = 6;
  const maxVisibleBars = 6;
  const containerMaxWidth = 280;

  const totalBarsWidth = processedData.length * (minBarWidth + barSpacing);
  const needsScroll = processedData.length > maxVisibleBars;
  const containerWidth = needsScroll
    ? totalBarsWidth
    : Math.min(containerMaxWidth, Math.max(totalBarsWidth, minBarWidth));

  const handleMouseDown = (e) => {
    if (!needsScroll) return;
    e.preventDefault();
    const container = e.currentTarget;
    container.style.cursor = 'grabbing';
    const startX = e.pageX;
    const scrollLeft = container.scrollLeft;

    const handleMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      const walk = (moveEvent.pageX - startX) * 1.5;
      container.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
      container.style.cursor = 'grab';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp);
  };

  const handleWheel = (e) => {
    if (!needsScroll) return;
    const container = e.currentTarget;
    container.scrollLeft += e.deltaY;
  };

  return (
    <div
      style={{
        width: '100%',
        height: '120px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Scrollable container for bars */}
      <div 
        className="bar-chart-container"
        style={{
          width: '100%',
          height: '120px',
          overflowX: needsScroll ? 'scroll' : 'hidden',
          overflowY: 'hidden',
          paddingTop: '8px',
          paddingBottom: '20px',
          cursor: needsScroll ? 'grab' : 'default',
        }}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        {/* Bar Chart - Fixed dimensions instead of ResponsiveContainer */}
        <div style={{ width: containerWidth, minHeight: '100px' }}>
          <BarChart 
            width={containerWidth}
            height={80}
            data={processedData} 
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            barCategoryGap={barSpacing}
          >
            <XAxis 
              dataKey="index" 
              hide
            />
            <YAxis 
              hide 
              domain={[0, yAxisMax]}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Bars with individual colors and fixed width */}
            <Bar 
              dataKey="barValue"
              minPointSize={6}
              radius={[3, 3, 0, 0]}
            >
              {processedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
          <div
            style={{
              display: 'flex',
              gap: `${barSpacing}px`,
              marginTop: '12px',
              paddingRight: needsScroll ? '10px' : 0,
            }}
          >
            {processedData.map((entry, index) => (
              <div
                key={`label-${index}`}
                style={{
                  width: `${minBarWidth}px`,
                  flex: '0 0 auto',
                  textAlign: 'center',
                  fontSize: '10px',
                  color: '#6b7280',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  transform: 'rotate(-22deg)',
                  transformOrigin: 'center top',
                }}
              >
                {entry.shortDate}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniLineGraph;
