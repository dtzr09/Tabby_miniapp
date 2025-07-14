import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Typography, Box } from '@mui/material';

interface YearlyOverviewChartProps {
  data: { month: string; value: number }[];
  year: string;
}

export default function YearlyOverviewChart({ data, year }: YearlyOverviewChartProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Yearly overview</Typography>
      <Typography sx={{ color: '#b0bec5', fontSize: 14, mb: 1 }}>{year}</Typography>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
          <XAxis dataKey="month" tick={{ fill: '#b0bec5', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis hide domain={[0, 10]} />
          <Tooltip contentStyle={{ background: '#232c3b', border: 'none', color: '#fff' }} />
          <Bar dataKey="value" fill="#ef5da8" barSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
