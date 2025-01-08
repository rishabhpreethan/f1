import { Box, Typography, Button, Container, Grid } from '@mui/material';
import { motion } from 'framer-motion';

const Home = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        sx={{
          height: '100vh',
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url("/f1-hero.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Container maxWidth="xl">
          <Typography
            variant="h1"
            component={motion.h1}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            sx={{
              color: 'text.primary',
              fontWeight: 800,
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
              mb: 2,
              maxWidth: '800px',
            }}
          >
            EXPERIENCE F1
            <Box component="span" sx={{ color: 'primary.main', display: 'block' }}>LIKE NEVER BEFORE</Box>
          </Typography>
          <Typography
            variant="h5"
            component={motion.p}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            sx={{ color: 'text.secondary', mb: 4, maxWidth: '600px' }}
          >
            Your ultimate source for F1 news, analysis, and community
          </Typography>
          <Button
            component={motion.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            variant="contained"
            color="primary"
            size="large"
            sx={{ py: 2, px: 6 }}
          >
            READ LATEST
          </Button>
        </Container>
      </Box>

      {/* Featured Content */}
      <Container maxWidth="xl" sx={{ py: 12 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box
              component={motion.div}
              whileHover={{ scale: 1.02 }}
              sx={{
                p: 4,
                bgcolor: 'background.paper',
                borderRadius: 2,
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Latest News</Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Stay updated with the most recent F1 developments and race results.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box
              component={motion.div}
              whileHover={{ scale: 1.02 }}
              sx={{
                p: 4,
                bgcolor: 'background.paper',
                borderRadius: 2,
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Race Analysis</Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Deep dive into race strategies, technical insights, and performance data.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box
              component={motion.div}
              whileHover={{ scale: 1.02 }}
              sx={{
                p: 4,
                bgcolor: 'background.paper',
                borderRadius: 2,
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Community</Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Join discussions with fellow F1 enthusiasts and share your thoughts.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;
