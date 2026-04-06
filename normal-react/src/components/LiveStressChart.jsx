import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const LiveStressChart = ({ data }) => (
  <div style={{ width: '100%', minWidth: 320, height: 220, minHeight: 120 }}>
    <ResponsiveContainer width="100%" height={220} minWidth={320} minHeight={120}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#9333ea" strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default LiveStressChart;
