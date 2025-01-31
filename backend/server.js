import express from 'express';
import cors from 'cors';
import { createUser, loginUser } from '../src/utils/auth.js';
import sqlite3 from 'sqlite3';
import ChatService from './chat_service.js';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Initialize chat service with API key
const chatService = new ChatService(process.env.GROQ_API_KEY || "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");

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.post('/api/register', async (req, res) => {
  try {
    console.log('Register request body:', req.body);
    const { email, username, password } = req.body;
    
    if (!email || !username || !password) {
      console.log('Missing fields:', { email: !!email, username: !!username, password: !!password });
      return res.status(400).json({ 
        success: false, 
        error: `Please provide all required fields: ${[
          !email && 'email',
          !username && 'username',
          !password && 'password'
        ].filter(Boolean).join(', ')}` 
      });
    }

    const result = await createUser({ email, username, password });
    console.log('Create user result:', result);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Server error in /api/register:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    console.log('Login request body:', req.body);
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('Missing fields:', { email: !!email, password: !!password });
      return res.status(400).json({ 
        success: false, 
        error: `Please provide ${!email ? 'email' : ''} ${!password ? 'password' : ''}`.trim()
      });
    }

    const result = await loginUser({ email, password });
    console.log('Login result:', result);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('Server error in /api/login:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// Get all drivers
app.get('/api/drivers', async (req, res) => {
  try {
    const db = new sqlite3.Database('./backend/sqlite.db');
    
    db.all(`
      SELECT 
        driver_id as driverId,
        forename || ' ' || surname as name
      FROM drivers
      ORDER BY surname
    `, [], (err, rows) => {
      if (err) {
        console.error('Error fetching drivers:', err);
        res.status(500).json({ error: 'Failed to fetch drivers' });
        return;
      }
      res.json(rows);
    });

    db.close();
  } catch (error) {
    console.error('Server error in /api/drivers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get driver statistics
app.get('/api/driver-stats/:driverId', async (req, res) => {
  const { driverId } = req.params;
  console.log('Fetching stats for driver:', driverId);
  
  const db = new sqlite3.Database('./backend/sqlite.db');

  try {
    // Get points progression (including sprint points)
    const pointsQuery = `
      SELECT 
        r.round,
        r.name as raceName,
        COALESCE(rr.points, 0) as race_points,
        COALESCE(sr.points, 0) as sprint_points,
        COALESCE(rr.points, 0) + COALESCE(sr.points, 0) as points,
        COALESCE(rr.position, 0) as position
      FROM races r
      LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.driver_id = ?
      LEFT JOIN sprint_results sr ON r.race_id = sr.race_id AND sr.driver_id = ?
      GROUP BY r.round
      ORDER BY r.round
    `;

    // Get race positions
    const positionsQuery = `
      SELECT 
        r.round,
        r.name as raceName,
        COALESCE(rr.position, 0) as position
      FROM races r
      LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.driver_id = ?
      GROUP BY r.round
      ORDER BY r.round
    `;

    // Get season stats
    const statsQuery = `
      WITH LatestRace AS (
        SELECT MAX(r.race_id) as race_id
        FROM races r
      ),
      DriverPoints AS (
        SELECT 
          d.driver_id,
          SUM(rr.points) as total_points
        FROM race_results rr
        JOIN drivers d ON rr.driver_id = d.driver_id
        GROUP BY d.driver_id
      ),
      DriverStandings AS (
        SELECT 
          driver_id,
          total_points,
          RANK() OVER (ORDER BY total_points DESC) as championship_position
        FROM DriverPoints
      )
      SELECT 
        COUNT(CASE WHEN rr.position = 1 THEN 1 END) as wins,
        COUNT(CASE WHEN rr.position <= 3 THEN 1 END) as podiums,
        COUNT(CASE WHEN rr.status = 'DNF' THEN 1 END) as dnf,
        ds.championship_position
      FROM race_results rr
      JOIN DriverStandings ds ON rr.driver_id = ds.driver_id
      WHERE rr.driver_id = ?
      GROUP BY rr.driver_id;
    `;

    // Get qualifying vs race positions
    const qualifyingVsRaceQuery = `
      SELECT 
        r.round,
        r.name as raceName,
        COALESCE(q.position, 20) as qualifying_position,
        COALESCE(rr.position, 20) as race_position,
        COALESCE(rr.position, 20) - COALESCE(q.position, 20) as positions_gained
      FROM races r
      LEFT JOIN qualifying_results q ON r.race_id = q.race_id AND q.driver_id = ?
      LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.driver_id = ?
      ORDER BY r.round
    `;

    // Get teammate comparison data
    const teammateComparisonQuery = `
      WITH SelectedDriverConstructor AS (
        -- Get the constructor for the selected driver
        SELECT DISTINCT rr.constructor_id
        FROM race_results rr
        WHERE rr.driver_id = ?
        ORDER BY rr.race_id DESC
        LIMIT 1
      )
      SELECT 
        r.round,
        r.name as raceName,
        d.code as driver_code,
        rr.position
      FROM races r
      JOIN race_results rr ON r.race_id = rr.race_id
      JOIN SelectedDriverConstructor sdc ON rr.constructor_id = sdc.constructor_id
      JOIN drivers d ON rr.driver_id = d.driver_id
      ORDER BY r.round, rr.position
    `;
    
    // Using promises to handle database queries
    const getPoints = () => {
      return new Promise((resolve, reject) => {
        db.all(pointsQuery, [driverId, driverId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };

    const getPositions = () => {
      return new Promise((resolve, reject) => {
        db.all(positionsQuery, [driverId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };

    const getStats = () => {
      return new Promise((resolve, reject) => {
        db.get(statsQuery, [driverId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    };

    const getQualifyingVsRace = () => {
      return new Promise((resolve, reject) => {
        db.all(qualifyingVsRaceQuery, [driverId, driverId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };

    const getTeammateComparison = () => {
      return new Promise((resolve, reject) => {
        db.all(teammateComparisonQuery, [driverId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };

    // Execute all queries and wait for results
    Promise.all([getPoints(), getPositions(), getStats(), getQualifyingVsRace(), getTeammateComparison()])
      .then(([pointsData, positionsData, statsData, qualifyingVsRaceData, teammateComparisonData]) => {
        res.json({
          pointsProgression: pointsData,
          racePositions: positionsData,
          stats: statsData,
          qualifyingVsRace: qualifyingVsRaceData,
          teammateComparison: teammateComparisonData
        });
      })
      .catch(error => {
        console.error('Database query error:', error);
        res.status(500).json({ error: 'Database query failed', details: error.message });
      })
      .finally(() => {
        // Close the database connection after all queries are done
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          }
        });
      });

  } catch (error) {
    console.error('Server error in /api/driver-stats:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
    // Close the database in case of error
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      }
    });
  }
});

// Get qualifying results for a driver
app.get('/api/qualifying-results/:driverId', async (req, res) => {
  const { driverId } = req.params;
  const db = new sqlite3.Database('./backend/sqlite.db');

  try {
    const query = `
      SELECT 
        r.round,
        r.name as race_name,
        qr.position,
        qr.q1_time,
        qr.q2_time,
        qr.q3_time,
        c.name as constructor_name
      FROM qualifying_results qr
      JOIN races r ON qr.race_id = r.race_id
      JOIN constructors c ON qr.constructor_id = c.constructor_id
      WHERE qr.driver_id = ?
      ORDER BY r.round
    `;

    db.all(query, [driverId], (err, rows) => {
      if (err) {
        console.error('Error fetching qualifying results:', err);
        res.status(500).json({ error: 'Failed to fetch qualifying results' });
        return;
      }
      res.json(rows);
    });
  } catch (error) {
    console.error('Server error in /api/qualifying-results:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    db.close();
  }
});

// Get race results for a driver
app.get('/api/race-results/:driverId', async (req, res) => {
  const { driverId } = req.params;
  const db = new sqlite3.Database('./backend/sqlite.db');

  try {
    const query = `
      SELECT 
        r.round,
        r.name as race_name,
        rr.grid,
        rr.position,
        rr.points,
        rr.laps,
        rr.status,
        rr.time,
        rr.fastest_lap,
        rr.fastest_lap_time,
        c.name as constructor_name
      FROM race_results rr
      JOIN races r ON rr.race_id = r.race_id
      JOIN constructors c ON rr.constructor_id = c.constructor_id
      WHERE rr.driver_id = ?
      ORDER BY r.round
    `;

    db.all(query, [driverId], (err, rows) => {
      if (err) {
        console.error('Error fetching race results:', err);
        res.status(500).json({ error: 'Failed to fetch race results' });
        return;
      }
      res.json(rows);
    });
  } catch (error) {
    console.error('Server error in /api/race-results:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    db.close();
  }
});

// Add chat query endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        // Generate SQL query
        const sqlQuery = await chatService.generateQuery(prompt);
        
        // Execute the query
        const queryResult = await chatService.executeQuery(sqlQuery);
        
        // Generate human-like response
        const response = await chatService.generateResponse(prompt, queryResult);
        
        res.json({
            success: true,
            queryResult,
            response,
            sqlQuery
        });
    } catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal server error' 
        });
    }
});

// Generate ECharts options
app.post('/api/generate-echarts', async (req, res) => {
  try {
    const { queryResult } = req.body;
    if (!queryResult) {
      return res.status(400).json({ success: false, error: 'Query result is required' });
    }
    
    const echartsOptions = await chatService.generateEchartOptions(queryResult);
    res.json({ success: true, data: echartsOptions });
  } catch (error) {
    console.error('Error generating ECharts options:', error);
    res.status(500).json({ success: false, error: 'Failed to generate ECharts options' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
