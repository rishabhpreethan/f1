import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { Link } from 'react-router-dom';
import SpeedIcon from '@mui/icons-material/Speed';

const Navbar = () => {
  // Auth removed; only navigation links remain

  return (
    <AppBar 
      position="static" 
      sx={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        height: '48px',
        zIndex: 1000,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar 
          sx={{ 
            minHeight: '48px !important',
            py: 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <SpeedIcon sx={{ color: 'primary.main', mr: 1, fontSize: '2rem' }} />
            <Typography
              variant="h6"
              component={Link}
              to="/analytics"
              sx={{
                textDecoration: 'none',
                color: 'text.primary',
                fontWeight: 700,
                letterSpacing: '0.02em',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              F1 INSIDER
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <Button
              component={Link}
              to="/blog"
              sx={{
                color: 'text.primary',
                fontWeight: 500,
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              Blog
            </Button>
            {/* Chat removed */}
            <Button
              component={Link}
              to="/analytics"
              sx={{
                color: 'text.primary',
                fontWeight: 500,
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              Analytics
            </Button>
            <Button
              component={Link}
              to="/news"
              sx={{
                color: 'text.primary',
                fontWeight: 500,
                '&:hover': {
                  color: 'primary.main',

                },
              }}
            >
              News
            </Button>
            {/* Login/Logout removed */}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
