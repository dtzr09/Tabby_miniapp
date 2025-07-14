import { Card, CardContent, Typography, Divider, Box } from '@mui/material';

interface ExpenseSummaryCardProps {
  total: number;
  income: number;
  expenses: number;
  month: string;
}

export default function ExpenseSummaryCard({ total, income, expenses, month }: ExpenseSummaryCardProps) {
  return (
    <Card sx={{ bgcolor: '#232c3b', color: '#fff', minWidth: 320, maxWidth: 400, width: '100%', borderRadius: 3, boxShadow: 3 }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
        <Typography variant="h2" sx={{ fontWeight: 700, color: '#fff' }}>
          {total > 0 ? '+' : ''}{total} <Typography component="span" variant="h6" sx={{ color: '#90caf9' }}>USD</Typography>
        </Typography>
        <Typography sx={{ color: '#b0bec5', mt: 1, mb: 2 }}>
          income {income} - expenses {expenses}
        </Typography>
        <Typography sx={{ color: '#78909c', fontSize: 18, mb: 2 }}>
          for {month}
        </Typography>
        <Divider sx={{ width: '100%', mb: 2, bgcolor: '#263043' }} />
        <Box sx={{ width: '100%' }}>
          {/* Placeholder for children, e.g. transaction list or actions */}
        </Box>
      </CardContent>
    </Card>
  );
}
