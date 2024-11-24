import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TimeComplexityChart = ({ complexity }) => {
  const generateData = () => {
    const data = [];
    const maxN = 10;
    
    for (let i = 1; i <= maxN; i++) {
      let value;
      switch (complexity) {
        case 'O(1)':
          value = 1;
          break;
        case 'O(log_n)':
          value = Math.log2(i);
          break;
        case 'O(n)':
          value = i;
          break;
        case 'O(n_log_n)':
          value = i * Math.log2(i);
          break;
        case 'O(n^2)':
          value = i * i;
          break;
        case 'O(n^3)':
          value = i * i * i;
          break;
        case 'O(2^n)':
          value = Math.pow(2, i);
          break;
        default:
          value = i;
      }
      data.push({ n: i, value });
    }
    return data;
  };

  return (
    <div className="w-full h-full p-6 bg-slate-800 rounded-lg">
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={generateData()} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="n" 
              stroke="#9CA3AF"
              domain={[1, 10]}
            />
            <YAxis 
              stroke="#9CA3AF"
              domain={[0, 'auto']}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
              formatter={(value) => value.toFixed(2)}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#4ADE80"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TimeComplexityChart;