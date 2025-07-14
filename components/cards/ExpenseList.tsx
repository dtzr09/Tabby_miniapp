import { List, ListItem, Typography, Box } from '@mui/material';

export interface Transaction {
  description: string;
  date: string;
  amount: number;
  currency?: string;
}

interface ExpenseListProps {
  transactions: Transaction[];
}

export default function ExpenseList({ transactions }: ExpenseListProps) {
  return (
    <List sx={{ width: '100%' }}>
      {transactions.map((tx, idx) => (
        <ListItem key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0 }}>
          <Box>
            <Typography sx={{ fontWeight: 600 }}>{tx.description}</Typography>
            <Typography sx={{ color: '#b0bec5', fontSize: 14 }}>{tx.date}</Typography>
          </Box>
          <Typography sx={{ fontWeight: 600, color: '#90caf9' }}>{tx.amount > 0 ? '+' : ''}{tx.amount} {tx.currency || 'USD'}</Typography>
        </ListItem>
      ))}
    </List>
  );
}
