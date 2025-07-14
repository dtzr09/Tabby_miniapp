import AppHeader from '../../components/navigation/AppHeader';
import ExpenseSummaryCard from '../../components/cards/ExpenseSummaryCard';
import ExpenseList, { Transaction } from '../../components/cards/ExpenseList';
import MonthlyProgressChart from '../../components/charts/MonthlyProgressChart';
import MonthlyBreakdownChart from '../../components/charts/MonthlyBreakdownChart';
import YearlyOverviewChart from '../../components/charts/YearlyOverviewChart';
import YearlyTrendsChart from '../../components/charts/YearlyTrendsChart';
import CategoryLegend from '../../components/charts/CategoryLegend';
import { Box, Typography } from '@mui/material';

const monthlyProgressData = [
  { date: '1 Jul, Tu', value: 0 },
  { date: '3 Jul, Th', value: 0 },
  { date: '5 Jul, Sa', value: 0 },
  { date: '7 Jul, Mo', value: 0 },
  { date: '9 Jul, We', value: 0 },
  { date: '11 Jul, Fr', value: 0 },
  { date: '13 Jul, Su', value: 10 },
];
const monthlyBreakdownData = [
  { name: 'Outside food', value: 10, emoji: '🍔' },
];
const yearlyOverviewData = [
  { month: 'July', value: 10 },
];
const yearlyTrendsData = [
  { month: 'January', 'Outside food': 0 },
  { month: 'February', 'Outside food': 0 },
  { month: 'March', 'Outside food': 0 },
  { month: 'April', 'Outside food': 0 },
  { month: 'May', 'Outside food': 0 },
  { month: 'June', 'Outside food': 0 },
  { month: 'July', 'Outside food': 10 },
  { month: 'August', 'Outside food': 0 },
  { month: 'September', 'Outside food': 0 },
  { month: 'October', 'Outside food': 0 },
  { month: 'November', 'Outside food': 0 },
  { month: 'December', 'Outside food': 0 },
];
const categories = [
  { name: 'Outside food', emoji: '🍔', color: '#42a5f5' },
  { name: 'Groceries', emoji: '🥬', color: '#66bb6a' },
  { name: 'Household', emoji: '🪜', color: '#ffe082' },
  { name: 'Clothes and shoes', emoji: '👠', color: '#ec407a' },
  { name: 'Health and beauty', emoji: '💊', color: '#ab47bc' },
  { name: 'Commuting', emoji: '🚌', color: '#ffb300' },
  { name: 'Mobile and Internet', emoji: '📱', color: '#5c6bc0' },
  { name: 'Housing and utilities', emoji: '🏠', color: '#cddc39' },
  { name: 'Entertainment', emoji: '🎭', color: '#8d6e63' },
  { name: 'Other', emoji: '⚪', color: '#bdbdbd' },
];
const transactions: Transaction[] = [
  { description: 'coffee', date: 'Jul 14, 2025, Monday', amount: -10, currency: 'USD' },
];

export default function Home() {
  return (
    <Box sx={{ bgcolor: '#181f2a', minHeight: '100vh', color: '#fff', fontFamily: 'inherit', p: 0, m: 0 }}>
      <AppHeader />
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, px: { xs: 1, sm: 0 } }}>
        <ExpenseSummaryCard total={-10} income={0} expenses={10} month="July" />
        <Box sx={{ width: '100%', maxWidth: 400, mb: 2 }}>
          <ExpenseList transactions={transactions} />
        </Box>
        <Box sx={{ width: '100%', maxWidth: 400, mb: 2 }}>
          <MonthlyProgressChart data={monthlyProgressData} />
        </Box>
        <Box sx={{ width: '100%', maxWidth: 400, mb: 2 }}>
          <MonthlyBreakdownChart data={monthlyBreakdownData} month="July" />
        </Box>
        <Box sx={{ width: '100%', maxWidth: 400, mb: 2 }}>
          <YearlyOverviewChart data={yearlyOverviewData} year="2025" />
        </Box>
        <Box sx={{ width: '100%', maxWidth: 400, mb: 2 }}>
          <YearlyTrendsChart data={yearlyTrendsData} categories={[categories[0]]} year="2025" />
        </Box>
        <Box sx={{ width: '100%', maxWidth: 400, mb: 2 }}>
          <CategoryLegend categories={categories} />
        </Box>
        <Typography sx={{ color: '#90caf9', mt: 2, mb: 2, fontWeight: 600, fontSize: 18, textAlign: 'center' }}>
          @cointrybot
        </Typography>
      </Box>
    </Box>
  );
}
