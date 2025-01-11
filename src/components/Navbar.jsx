import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import SpeedIcon from '@mui/icons-material/Speed';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

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
              to="/"
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
            <Button
              component={Link}
              to="/chat"
              sx={{
                color: 'text.primary',
                fontWeight: 500,
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              Chat
            </Button>
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
            {token ? (
              <Button
                onClick={handleLogout}
                sx={{
                  color: 'text.primary',
                  fontWeight: 500,
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
                startIcon={<PersonOutlineIcon />}
              >
                Logout
              </Button>
            ) : (
              <Button
                component={Link}
                to="/login"
                variant="contained"
                color="primary"
                startIcon={<PersonOutlineIcon />}
                sx={{
                  fontWeight: 500,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: 'none',
                  },
                }}
              >
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
