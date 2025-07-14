import { Box, Typography, Stack } from '@mui/material';

interface Category {
  name: string;
  emoji: string;
  color: string;
}

interface CategoryLegendProps {
  categories: Category[];
}

export default function CategoryLegend({ categories }: CategoryLegendProps) {
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
      {categories.map((cat) => (
        <Box key={cat.name} sx={{ display: 'flex', alignItems: 'center', mr: 2, mb: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: cat.color, mr: 1 }} />
          <Typography sx={{ fontSize: 14 }}>{cat.emoji} {cat.name}</Typography>
        </Box>
      ))}
    </Stack>
  );
}
