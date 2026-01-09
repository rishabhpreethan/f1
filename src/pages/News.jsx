import React, { useState, useEffect } from 'react';
import { Container, Typography, Card, CardContent, Grid, CardMedia, Link, CircularProgress, Box } from '@mui/material';
import axios from 'axios';

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get('https://newsdata.io/api/1/news', {
          params: {
            apikey: 'pub_68416a66ad266452db6eaa610193ecf2fbf92',
            q: 'F1',
            language: 'en'
          }
        });

        if (response.data.results) {
          setNews(response.data.results);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch news. Please try again later.');
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography color="error" align="center">
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Latest F1 News
      </Typography>
      <Grid container spacing={3}>
        {news.map((article, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {article.image_url && (
                <CardMedia
                  component="img"
                  height="200"
                  image={article.image_url}
                  alt={article.title}
                  sx={{ objectFit: 'cover' }}
                />
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  <Link 
                    href={article.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    sx={{ 
                      textDecoration: 'none', 
                      color: 'inherit',
                      '&:hover': { color: 'primary.main' } 
                    }}
                  >
                    {article.title}
                  </Link>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {article.description ? article.description.slice(0, 200) + '...' : 'No description available'}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {new Date(article.pubDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Source: {article.source_id}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default News;
