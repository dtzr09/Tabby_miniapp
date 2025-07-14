import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Typography, Box } from '@mui/material';

interface MonthlyProgressChartProps {
  data: { date: string; value: number }[];
}

export default function MonthlyProgressChart({ data }: MonthlyProgressChartProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Monthly progress</Typography>
      <Typography sx={{ color: '#b0bec5', fontSize: 14, mb: 1 }}>July</Typography>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fill: '#b0bec5', fontSize: 12 }} axisLine={false} tickLine={false} interval={1} angle={-35} dy={20} height={40} />
          <YAxis hide domain={[0, 10]} />
          <Tooltip contentStyle={{ background: '#232c3b', border: 'none', color: '#fff' }} />
          <Line type="monotone" dataKey="value" stroke="#ef5da8" strokeWidth={3} dot={{ r: 5, fill: '#ef5da8' }} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
