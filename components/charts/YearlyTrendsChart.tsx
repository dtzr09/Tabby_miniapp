import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Typography, Box, Stack } from '@mui/material';

interface Category {
  name: string;
  emoji: string;
  color: string;
}

interface YearlyTrendsChartProps {
  data: any[];
  categories: Category[];
  year: string;
}

export default function YearlyTrendsChart({ data, categories, year }: YearlyTrendsChartProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Yearly trends</Typography>
      <Typography sx={{ color: '#b0bec5', fontSize: 14, mb: 1 }}>{year}</Typography>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
          <XAxis dataKey="month" tick={{ fill: '#b0bec5', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip contentStyle={{ background: '#232c3b', border: 'none', color: '#fff' }} />
          {categories.map((cat) => (
            <Bar key={cat.name} dataKey={cat.name} fill={cat.color} barSize={20} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <Box sx={{ mt: 2 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
          {categories.map((cat) => (
            <Box key={cat.name} sx={{ display: 'flex', alignItems: 'center', mr: 2, mb: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: cat.color, mr: 1 }} />
              <Typography sx={{ fontSize: 14 }}>{cat.emoji} {cat.name}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>
      <Typography sx={{ color: '#42a5f5', textTransform: 'none', fontWeight: 600, fontSize: 16, mt: 1, cursor: 'pointer' }}>
        « 2024
      </Typography>
    </Box>
  );
}
