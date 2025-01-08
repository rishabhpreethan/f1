import { Box, Container, Grid, Paper, Typography } from '@mui/material';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const lineChartData = {
    labels: ['Race 1', 'Race 2', 'Race 3', 'Race 4', 'Race 5'],
    datasets: [
      {
        label: 'Verstappen',
        data: [25, 18, 25, 25, 18],
        borderColor: '#FF1801',
        tension: 0.1,
      },
      {
        label: 'Hamilton',
        data: [18, 25, 18, 15, 25],
        borderColor: '#00D2BE',
        tension: 0.1,
      },
    ],
  };

  const barChartData = {
    labels: ['Red Bull', 'Mercedes', 'Ferrari', 'McLaren', 'Aston Martin'],
    datasets: [
      {
        label: 'Constructor Points',
        data: [220, 198, 180, 145, 130],
        backgroundColor: '#FF1801',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#FFFFFF',
        },
      },
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#FFFFFF',
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#FFFFFF',
        },
      },
    },
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '90vh', py: 4 }}>
      <Container>
        <Typography variant="h3" sx={{ mb: 4, color: 'text.primary' }}>
          Season Analytics
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                bgcolor: 'background.paper',
                borderRadius: 0,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                Driver Performance Trend
              </Typography>
              <Line data={lineChartData} options={chartOptions} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                bgcolor: 'background.paper',
                borderRadius: 0,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                Constructor Standings
              </Typography>
              <Bar data={barChartData} options={chartOptions} />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Analytics;
