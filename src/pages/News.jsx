import React from 'react';
import { Container, Typography, Card, CardContent, Grid } from '@mui/material';

const News = () => {
  const dummyNews = [
    {
      id: 1,
      title: "Hamilton Signs with Ferrari for 2025",
      content: "Lewis Hamilton makes a shocking move to Ferrari for the 2025 season.",
      date: "Feb 8, 2024"
    },
    {
      id: 2,
      title: "Red Bull Unveils RB20",
      content: "Red Bull Racing reveals their 2024 challenger with innovative design features.",
      date: "Feb 7, 2024"
    },
    {
      id: 3,
      title: "New Sprint Format Announced",
      content: "F1 introduces revised sprint race format for the 2024 season.",
      date: "Feb 6, 2024"
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Latest F1 News
      </Typography>
      <Grid container spacing={3}>
        {dummyNews.map((news) => (
          <Grid item xs={12} md={4} key={news.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {news.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {news.content}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {news.date}
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
