import { Box, Container, Grid, Card, CardContent, CardMedia, Typography, Chip } from '@mui/material';
import { motion } from 'framer-motion';

const blogPosts = [
  {
    title: "Hamilton's Quest for the 8th Title",
    excerpt: "Analyzing Lewis Hamilton's journey towards breaking the all-time championship record...",
    image: "/blog-1.jpg",
    category: "Driver Focus",
    date: "Jan 8, 2025"
  },
  {
    title: "Evolution of F1 Aerodynamics",
    excerpt: "A deep dive into how F1 car aerodynamics have transformed over the decades...",
    image: "/blog-2.jpg",
    category: "Technical",
    date: "Jan 7, 2025"
  },
  {
    title: "Rising Stars of F1",
    excerpt: "Spotlight on the upcoming talents making waves in Formula 1...",
    image: "/blog-3.jpg",
    category: "Analysis",
    date: "Jan 6, 2025"
  }
];

const Blog = () => {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '90vh', py: 4 }}>
      <Container>
        <Typography variant="h3" sx={{ mb: 4, color: 'text.primary' }}>
          Latest Posts
        </Typography>
        <Grid container spacing={4}>
          {blogPosts.map((post, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                component={motion.div}
                whileHover={{ scale: 1.02 }}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'background.paper',
                  borderRadius: 0,
                  '&:hover': {
                    boxShadow: '0 0 10px rgba(255,24,1,0.3)',
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={post.image}
                  alt={post.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={post.category}
                      size="small"
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: 0,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ ml: 1, color: 'text.secondary' }}
                    >
                      {post.date}
                    </Typography>
                  </Box>
                  <Typography
                    gutterBottom
                    variant="h5"
                    component="h2"
                    sx={{ color: 'text.primary' }}
                  >
                    {post.title}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary' }}>
                    {post.excerpt}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Blog;
