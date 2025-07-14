import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import SettingsIcon from '@mui/icons-material/Settings';
import LabelIcon from '@mui/icons-material/Label';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useState } from 'react';

export default function AppHeader() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <AppBar position="static" sx={{ bgcolor: '#181f2a', boxShadow: 'none', borderBottom: '1px solid #232c3b' }}>
      <Toolbar sx={{ minHeight: 56, px: 1 }}>
        <StarBorderIcon sx={{ color: '#42a5f5', mr: 1 }} />
        <Typography variant="h6" sx={{ flex: 1, textAlign: 'center', fontWeight: 600, letterSpacing: 0.5 }}>
          Cointry - expense tracker
        </Typography>
        <Box>
          <IconButton onClick={handleMenu} sx={{ color: '#42a5f5' }}>
            <MenuIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={open} onClose={handleClose} PaperProps={{ sx: { bgcolor: '#232c3b', color: '#90caf9' } }}>
            <MenuItem onClick={handleClose}><SettingsIcon sx={{ mr: 1 }} /> Settings</MenuItem>
            <MenuItem onClick={handleClose}><LabelIcon sx={{ mr: 1 }} /> Categories</MenuItem>
            <MenuItem onClick={handleClose}><HelpOutlineIcon sx={{ mr: 1 }} /> Help</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
