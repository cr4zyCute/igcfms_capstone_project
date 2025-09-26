import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const MiniLineGraph = ({ data, accountId, accountName }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
      console.log(`Auto-refreshing graph for account ${accountId}`);
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [accountId]);
  
  
  
  if (!data || data.length === 0) {
    console.log(`No data for account ${accountId}`);
    return <div className="graph-placeholder">No transaction data available.</div>;
  }
  
 
  
  // Debug: Log each data point
  data.forEach((point, index) => {
    console.log(`Data point ${index}:`, {
      date: point.date,
      balance: point.balance,
      amount: point.amount,
      type: point.type
    });
  });
  
  // Ensure data has proper structure
  const validData = data.filter(d => d && d.date && (d.balance !== undefined || d.amount !== undefined));
  console.log(` Valid data points: ${validData.length}/${data.length}`);
  
  if (validData.length === 0) {
    console.log(`No valid data points for account ${accountId}`);
    return <div className="graph-placeholder">Invalid transaction data format.</div>;
  }
  
  // Sort transactions chronologically (oldest to newest) for sequential display
  const sortedData = validData.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Process data for bar chart with enhanced scaling and visibility
  const allAmounts = sortedData.map(point => Math.abs(parseFloat(point.amount) || 0));
  const maxAmount = Math.max(...allAmounts);
  const minAmount = Math.min(...allAmounts.filter(a => a > 0));
  
  const processedData = sortedData.map((point, index) => {
    const amount = parseFloat(point.amount) || 0;
    const absAmount = Math.abs(amount);
    const isCollection = point.type === 'Collection';
    
    // Logarithmic scaling for better visibility of all amounts
    const logMax = Math.log10(maxAmount);
    const logMin = Math.log10(Math.max(minAmount, 1));
    const logAmount = Math.log10(Math.max(absAmount, 1));
    
    // Normalize to 0-1 range, then scale to chart height
    const normalizedValue = (logAmount - logMin) / (logMax - logMin);
    const scaledValue = Math.max(normalizedValue * maxAmount, maxAmount * 0.05); // 5% minimum
    
    // Solid colors - green for collections, red for disbursements
    const color = isCollection ? '#22c55e' : '#ef4444'; // Solid green and red
    const baseColor = isCollection ? '#22c55e' : '#ef4444'; // Same for tooltip
    
    // Format amount for display
    const formattedAmount = absAmount >= 1000 
      ? `₱${(absAmount / 1000).toFixed(absAmount >= 10000 ? 0 : 1)}k`
      : `₱${absAmount.toLocaleString()}`;
    
    return {
      ...point,
      index: index,
      barValue: scaledValue, // Logarithmically scaled value
      originalAmount: amount, // Keep original amount for tooltip
      amount: amount,
      absAmount: absAmount,
      isCollection: isCollection,
      color: color, // Solid color
      baseColor: baseColor, // Same solid color for labels
      dateFormatted: new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      formattedAmount: formattedAmount,
      description: point.description || point.type,
      intensity: normalizedValue // Keep for reference
    };
  });
  
  console.log(`Processed data for Bar Chart:`, processedData);
  
  // Debug: Log the amounts and bar values
  const maxBarValue = Math.max(...processedData.map(d => d.barValue));
  const yAxisMax = Math.ceil(maxBarValue * 1.1);
  console.log(` Maximum amount in dataset: ₱${maxBarValue}`);
  console.log(`Y-axis max will be set to: ₱${yAxisMax}`);
  processedData.forEach((point, index) => {
    const percentage = (point.barValue / maxBarValue * 100).toFixed(1);
    console.log(`Bar ${index}: ${point.type} - Original: ₱${point.originalAmount}, Display: ₱${point.barValue}, Color: ${point.color}, Height: ${percentage}%`);
  });

  // Simple tooltip showing just the amount
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
          fontWeight: '600',
          border: 'none',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          zIndex: 1000,
          whiteSpace: 'nowrap'
        }}>
          {point.isCollection ? '+' : '-'}₱{point.absAmount.toLocaleString('en-US', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
          })}
        </div>
      );
    }
    return null;
  };

  // Fallback simple SVG bar chart
  const SimpleSVGGraph = () => {
    const maxAmount = Math.max(...processedData.map(d => Math.abs(d.barValue)));
    const barWidth = 260 / processedData.length - 2; // Width minus spacing
    
    return (
      <svg width="100%" height="80" style={{ position: 'absolute', top: 0, left: 0 }}>
        {/* Center line */}
        <line x1="10" y1="40" x2="270" y2="40" stroke="#e5e5e5" strokeWidth="1" />
        
        {/* Draw bars */}
        {processedData.map((point, index) => {
          const x = (index * (260 / processedData.length)) + 10;
          const barHeight = Math.abs(point.barValue) / maxAmount * 30; // Max 30px height
          const y = point.barValue > 0 ? 40 - barHeight : 40; // Above or below center line
          const fillColor = point.color;
          
          return (
            <rect
              key={`bar-${index}`}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={fillColor}
              rx="2"
              opacity="0.8"
            />
          );
        })}
      </svg>
    );
  };

  // Calculate dynamic width based on number of transactions
  const minBarWidth = 35; // Minimum width per bar (reduced slightly)
  const barSpacing = 6; // Space between bars
  const maxVisibleBars = 6; // Maximum bars that fit without scrolling
  const containerMaxWidth = 280; // Maximum width before scrolling
  
  // Always ensure bars are at least minBarWidth, force scrolling if needed
  const totalBarsWidth = processedData.length * (minBarWidth + barSpacing);
  const needsScroll = processedData.length > maxVisibleBars;
  const containerWidth = needsScroll ? totalBarsWidth : Math.min(containerMaxWidth, totalBarsWidth);
  
  console.log(` Bar calculation: ${processedData.length} bars, needsScroll: ${needsScroll}, containerWidth: ${containerWidth}`);

  return (
    <div style={{ 
      width: '100%', 
      height: '80px', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Debug info */}
      <div style={{
        position: 'absolute',
        top: '2px',
        left: '2px',
        fontSize: '9px',
        color: '#888',
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.8)',
        padding: '1px 3px',
        borderRadius: '3px'
      }}>
        {validData.length} transactions {needsScroll && ''}
      </div>
      
      {/* Scrollable container for bars */}
      <div 
        className="bar-chart-container"
        style={{
          width: '100%',
          height: '80px',
          overflowX: needsScroll ? 'scroll' : 'hidden',
          overflowY: 'hidden',
          paddingTop: '8px',
          cursor: needsScroll ? 'grab' : 'default'
        }}
        onMouseDown={(e) => {
          if (!needsScroll) return;
          e.preventDefault(); // Prevent text selection
          const container = e.currentTarget;
          container.style.cursor = 'grabbing';
          const startX = e.pageX;
          const scrollLeft = container.scrollLeft;

          const handleMouseMove = (e) => {
            e.preventDefault();
            const x = e.pageX;
            const walk = (x - startX) * 1.5; // Scroll speed multiplier
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
          document.addEventListener('mouseleave', handleMouseUp); // Handle mouse leaving window
        }}
        onWheel={(e) => {
          if (!needsScroll) return;
          const container = e.currentTarget;
          container.scrollLeft += e.deltaY; // Convert vertical scroll to horizontal
        }}
      >
        {/* Bar Chart - Fixed dimensions instead of ResponsiveContainer */}
        <div style={{ width: containerWidth, height: '80px' }}>
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
              radius={[3, 3, 0, 0]}
            >
              {processedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </div>
      </div>
      
      {/* Fallback SVG graph */}
      {!needsScroll && <SimpleSVGGraph />}
    </div>
  );
};

export default MiniLineGraph;
