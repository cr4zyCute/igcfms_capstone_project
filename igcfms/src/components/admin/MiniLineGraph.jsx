import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const MiniLineGraph = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="graph-placeholder">No transaction data available.</div>;
  }

  // Custom tooltip for the graph
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className={`label ${point.type === 'Collection' ? 'income' : 'expense'}`}>
            {`${point.type}: ₱${Math.abs(point.amount).toLocaleString()}`}
          </p>
          <p className="date">{new Date(point.date).toLocaleDateString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={80}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -40, bottom: 5 }}>
        <XAxis dataKey="date" hide />
        <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
        <Tooltip content={<CustomTooltip />} />
        
        {/* Line segments for income and expenses */}
        {data.map((entry, index) => {
          if (index === 0) return null;
          const prevEntry = data[index - 1];
          const isIncome = entry.type === 'Collection';
          const strokeColor = isIncome ? '#22c55e' : '#ef4444'; // Muted green/red

          return (
            <Line
              key={index}
              type="monotone"
              dataKey="balance"
              stroke={strokeColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              data={data.slice(index - 1, index + 1)}
            />
          );
        })}

        {/* Reference line at y=0 */}
        <ReferenceLine y={0} stroke="#e5e5e5" strokeDasharray="3 3" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MiniLineGraph;
