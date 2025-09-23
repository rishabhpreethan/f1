# F1 Insider

**A comprehensive Formula 1 data visualization and analysis platform built with React, Vite, and serverless APIs. Track drivers, races, statistics, and more with real-time data integration.**

F1 Insider is a modern web application for Formula 1 enthusiasts, providing detailed insights into drivers, races, standings, and historical data. Built with React and Vite for fast performance, it features a responsive design and serverless backend for scalable data fetching.
![Analytics](<analytics.png>)
![News](<news.png>)
## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Deployment](#deployment)
- [API Endpoints](#api-endpoints)
- [Data Sources](#data-sources)
- [Contributing](#contributing)
- [License](#license)

## Overview

F1-Blog-React is your go-to platform for all things Formula 1. Whether you're a casual fan or a data analyst, this app provides comprehensive access to driver statistics, race results, standings, and historical data. With a clean, responsive interface and real-time updates, you can explore the world of F1 like never before.

### Key Benefits
- **Comprehensive Data**: Access detailed driver profiles, race results, and season standings.
- **Real-time Updates**: Serverless APIs ensure up-to-date information.
- **Responsive Design**: Optimized for desktop and mobile devices.
- **Fast Performance**: Built with Vite for quick loading and smooth interactions.
- **Scalable Architecture**: Serverless backend handles traffic efficiently.

### Use Cases
- **Fan Engagement**: Follow your favorite drivers and teams.
- **Data Analysis**: Dive deep into statistics and trends.
- **Research**: Historical data for articles or personal projects.
- **Social Sharing**: Share insights and comparisons.

## Features

### Core Functionality
- **Driver Profiles**: Detailed information on all F1 drivers, including career stats and achievements.
- **Race Results**: Complete results from past and current races, with lap times and positions.
- **Standings**: Current driver and constructor standings with point breakdowns.
- **Historical Data**: Access to historical seasons, races, and driver performances.
- **Search and Filter**: Quickly find specific drivers, races, or seasons.
- **Data Visualization**: Charts and graphs for better understanding of statistics.
- **Responsive UI**: Seamless experience on all devices.

### Technical Highlights
- **Serverless APIs**: Scalable data fetching using Vercel serverless functions.
- **Database Integration**: PostgreSQL for reliable data storage and querying.
- **Authentication**: Secure access with JWT-based authentication.
- **Real-time Data**: Up-to-date F1 data from external APIs.
- **Error Handling**: Robust error management for a smooth user experience.
- **Performance Optimization**: Lazy loading, caching, and optimized queries.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │    │  Serverless APIs │    │   PostgreSQL    │
│                 │────│                  │────│                 │
│ • Frontend UI   │    │ • Data Fetching  │    │ • Data Storage  │
│ • Vite Build    │    │ • API Routes     │    │ • Queries       │
│ • Components    │    │ • Authentication │    │ • Indexing      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         └──────────────│    External     │
                        │   F1 APIs       │
                        │                 │
                        │ • Ergast API    │
                        │ • Real-time Data│
                        └─────────────────┘
```

### Data Flow
1. User interacts with the React frontend.
2. Frontend calls serverless API routes for data.
3. API routes query PostgreSQL or external F1 APIs.
4. Data is processed and returned to the frontend.
5. Frontend renders the data with charts and tables.

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes (Serverless Functions)
- **Database**: PostgreSQL (Vercel Postgres)
- **Authentication**: JWT with bcrypt
- **Deployment**: Vercel (free tier)
- **Data Sources**: Ergast F1 API, custom data fetchers
- **Charts**: Chart.js or Recharts for visualizations
- **State Management**: React Context and Hooks

## Quick Start

### Prerequisites
- Node.js 18+
- Vercel account (for deployment)
- GitHub account (for version control)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd f1-blog-react
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   # Database
   POSTGRES_URL="your-postgres-url"
   POSTGRES_PRISMA_URL="your-prisma-url" # Optional
   
   # Authentication
   JWT_SECRET="your-secret-key"
   
   # External APIs (if needed)
   F1_API_KEY="your-api-key" # Optional
   ```

4. **Initialize the database**
   ```bash
   npm run db:setup
   ```
   
   This will run the database schema and seed initial data.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:5173](http://localhost:5173) (or the port shown in the terminal)

### Development Tips
- Use `npm run build` to check for build errors.
- Run `npm run preview` to preview the production build.
- Use browser dev tools for debugging.

## Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel.
2. Set environment variables in Vercel Project Settings.
3. Deploy automatically on push to main branch.
4. The app will be available at your Vercel URL.

### Database Setup
1. Create a Vercel Postgres database from your Vercel project dashboard.
2. Copy the connection URLs to your environment variables.
3. Run the init script to set up the schema.

### Notes
- Frontend calls relative API URLs like `/api/drivers`.
- Serverless functions use `@vercel/postgres`.
- Original Express server is for reference.

## API Endpoints

- `GET /api/drivers` - List all drivers
- `GET /api/drivers/[driverId]` - Get driver details
- `GET /api/races` - List races
- `GET /api/races/[raceId]` - Get race details
- `GET /api/standings` - Current standings
- `GET /api/historical/[season]` - Historical data for a season
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### API Usage Examples
```bash
# Get all drivers
curl http://localhost:3000/api/drivers

# Get a specific driver
curl http://localhost:3000/api/drivers/max_verstappen

# Get race results
curl http://localhost:3000/api/races/2023/1
```

## Data Sources

- **Ergast F1 API**: Primary source for F1 data (drivers, races, results).
- **Custom Fetchers**: Scripts to fetch and process data.
- **Database**: PostgreSQL for storing and querying data efficiently.

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit changes: `git commit -m 'Add amazing feature'`.
4. Push to branch: `git push origin feature/amazing-feature`.
5. Open a Pull Request.

### Guidelines
- Use TypeScript for type safety.
- Follow the existing code style.
- Write tests for new features.
- Update documentation for changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

For questions or support, please open an issue on GitHub.
