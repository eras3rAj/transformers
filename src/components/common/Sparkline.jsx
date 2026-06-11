import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const Sparkline = ({ data, dataKey = 'value', color = '#3b82f6', width = 100, height = 30 }) => {
  // If data is empty or invalid, return a placeholder
  if (!data || !data.length) {
    return <div style={{ width, height, backgroundColor: 'var(--bg-secondary)', borderRadius: '4px' }} />;
  }

  // Format data for Recharts if it's just an array of numbers
  const chartData = typeof data[0] === 'number' 
    ? data.map((val, i) => ({ [dataKey]: val, index: i }))
    : data;

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={2} 
            dot={false} 
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Sparkline;
