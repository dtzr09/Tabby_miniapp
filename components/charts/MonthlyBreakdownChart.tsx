import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Typography, Box, Button } from '@mui/material';

interface MonthlyBreakdownChartProps {
  data: { name: string; value: number; emoji: string }[];
  month: string;
  onPrevMonth?: () => void;
}

export default function MonthlyBreakdownChart({ data, month, onPrevMonth }: MonthlyBreakdownChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const percent = total > 0 ? Math.round((data[0].value / total) * 100) : 0;
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Monthly breakdown</Typography>
      <Typography sx={{ color: '#b0bec5', fontSize: 14, mb: 1 }}>{month}</Typography>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label={false}>
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill="#42a5f5" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <Box sx={{ textAlign: 'center', mt: -10 }}>
        <Typography sx={{ fontSize: 18 }}>{data[0].emoji} {data[0].name}</Typography>
        <Typography sx={{ color: '#b0bec5', fontSize: 16 }}>{percent}%</Typography>
      </Box>
      <Button variant="text" sx={{ color: '#42a5f5', textTransform: 'none', fontWeight: 600, fontSize: 16, mt: 1 }} onClick={onPrevMonth}>
        « June
      </Button>
    </Box>
  );
}
