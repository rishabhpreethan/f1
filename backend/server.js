import express from 'express';
import cors from 'cors';
import { createUser, loginUser } from '../src/utils/auth.js';
import sqlite3 from 'sqlite3';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
      SELECT 
        COUNT(CASE WHEN rr.position = 1 THEN 1 END) as wins,
        COUNT(CASE WHEN rr.position <= 3 THEN 1 END) as podiums,
        COUNT(CASE WHEN rr.position = 0 THEN 1 END) as dnfs
      FROM races r
      LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.driver_id = ?
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

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
