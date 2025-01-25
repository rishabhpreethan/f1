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

// Get available drivers with their years
app.get('/api/drivers', async (req, res) => {
  const { year } = req.query;
  const db = new sqlite3.Database('./backend/sqlite.db');

  try {
    // First, get all available years
    db.all(`
      SELECT DISTINCT s.year
      FROM seasons s
      JOIN races r ON s.season_id = r.season_id
      JOIN race_results rr ON r.race_id = rr.race_id
      ORDER BY s.year DESC
    `, [], (yearErr, yearRows) => {
      if (yearErr) {
        console.error('Error fetching years:', yearErr);
        res.status(500).json({ error: 'Failed to fetch years' });
        return;
      }

      const years = yearRows.map(row => row.year);
      
      // Then get drivers, filtered by year if specified
      const yearFilter = year ? 'AND s.year = ?' : '';
      const params = year ? [year] : [];
      
      db.all(`
        SELECT DISTINCT 
          d.driver_id,
          d.code,
          d.forename,
          d.surname,
          d.nationality,
          GROUP_CONCAT(DISTINCT s.year) as years
        FROM drivers d
        JOIN race_results rr ON d.driver_id = rr.driver_id
        JOIN races r ON rr.race_id = r.race_id
        JOIN seasons s ON r.season_id = s.season_id
        WHERE 1=1 ${yearFilter}
        GROUP BY d.driver_id
        ORDER BY d.surname
      `, params, (err, rows) => {
        if (err) {
          console.error('Error fetching drivers:', err);
          res.status(500).json({ error: 'Failed to fetch drivers' });
          return;
        }
        
        // Process years into array for each driver
        const processedRows = rows.map(row => ({
          ...row,
          years: row.years.split(',').map(Number).sort((a, b) => b - a)
        }));
        
        res.json({
          years,
          drivers: processedRows
        });
      });
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      }
    });
  }
});

// Get driver stats
app.get('/api/driver-stats/:driverId', async (req, res) => {
  const { driverId } = req.params;
  const { year } = req.query;
  console.log('Fetching stats for driver:', driverId, 'year:', year);
  
  const db = new sqlite3.Database('./backend/sqlite.db');

  const yearFilter = year ? 'AND s.year = ?' : '';

  try {
    // Using promises to handle database queries
    const getPoints = () => {
      return new Promise((resolve, reject) => {
        const params = year ? [driverId, driverId, year] : [driverId, driverId];
        db.all(`
          SELECT 
            r.round,
            r.name as raceName,
            COALESCE(rr.points, 0) as race_points,
            COALESCE(sr.points, 0) as sprint_points,
            COALESCE(rr.points, 0) + COALESCE(sr.points, 0) as points
          FROM races r
          JOIN seasons s ON r.season_id = s.season_id
          LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.driver_id = ?
          LEFT JOIN sprint_results sr ON r.race_id = sr.race_id AND sr.driver_id = ?
          WHERE 1=1 ${yearFilter}
          ORDER BY s.year, r.round
        `, params, (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        });
      });
    };

    const getPositions = () => {
      return new Promise((resolve, reject) => {
        const params = year ? [driverId, year] : [driverId];
        db.all(`
          SELECT 
            r.round,
            r.name as raceName,
            rr.position as position,
            rr.grid as grid
          FROM races r
          JOIN seasons s ON r.season_id = s.season_id
          LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.driver_id = ?
          WHERE 1=1 ${yearFilter}
          ORDER BY s.year, r.round
        `, params, (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        });
      });
    };

    const getStats = () => {
      return new Promise((resolve, reject) => {
        const params = year ? [driverId, driverId, year] : [driverId, driverId];
        db.get(`
          SELECT 
            COUNT(DISTINCT r.race_id) as totalRaces,
            COUNT(CASE WHEN rr.position = 1 THEN 1 END) as wins,
            COUNT(CASE WHEN rr.position <= 3 THEN 1 END) as podiums,
            COUNT(CASE WHEN rr.position <= 10 THEN 1 END) as pointFinishes,
            COUNT(CASE WHEN rr.position IS NOT NULL THEN 1 END) as finishedRaces,
            ROUND(AVG(CASE WHEN rr.position IS NOT NULL THEN rr.position END), 2) as avgFinishPosition,
            SUM(COALESCE(rr.points, 0) + COALESCE(sr.points, 0)) as totalPoints
          FROM races r
          JOIN seasons s ON r.season_id = s.season_id
          LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.driver_id = ?
          LEFT JOIN sprint_results sr ON r.race_id = sr.race_id AND sr.driver_id = ?
          WHERE 1=1 ${yearFilter}
        `, params, (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });
    };

    const getQualifyingVsRace = () => {
      return new Promise((resolve, reject) => {
        const params = year ? [driverId, driverId, year] : [driverId, driverId];
        db.all(`
          SELECT 
            r.round,
            r.name as raceName,
            COALESCE(q.position, 20) as qualifying_position,
            COALESCE(rr.position, 20) as race_position,
            COALESCE(rr.position, 20) - COALESCE(q.position, 20) as positions_gained
          FROM races r
          JOIN seasons s ON r.season_id = s.season_id
          LEFT JOIN qualifying_results q ON r.race_id = q.race_id AND q.driver_id = ?
          LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.driver_id = ?
          WHERE 1=1 ${yearFilter}
          ORDER BY s.year, r.round
        `, params, (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        });
      });
    };

    const getTeammateComparison = () => {
      return new Promise((resolve, reject) => {
        const params = year ? [driverId, year] : [driverId];
        db.all(`
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
          JOIN seasons s ON r.season_id = s.season_id
          JOIN race_results rr ON r.race_id = rr.race_id
          JOIN SelectedDriverConstructor sdc ON rr.constructor_id = sdc.constructor_id
          JOIN drivers d ON rr.driver_id = d.driver_id
          WHERE 1=1 ${yearFilter}
          ORDER BY s.year, r.round
        `, params, (err, rows) => {
          if (err) reject(err);
          resolve(rows);
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

// Get driver profile data
app.get('/api/driver-profile/:driverId', async (req, res) => {
  const { driverId } = req.params;
  const db = new sqlite3.Database('./backend/sqlite.db');

  try {
    const query = `
      SELECT 
        d.*,
        c.name as constructor_name,
        c.nationality as constructor_nationality,
        r.position as current_position,
        r.points as current_points
      FROM drivers d
      LEFT JOIN (
        SELECT rr.*
        FROM race_results rr
        JOIN races ra ON rr.race_id = ra.race_id
        WHERE rr.driver_id = ?
        ORDER BY ra.date DESC
        LIMIT 1
      ) r ON d.driver_id = r.driver_id
      LEFT JOIN constructors c ON r.constructor_id = c.constructor_id
      WHERE d.driver_id = ?
    `;

    db.get(query, [driverId, driverId], (err, row) => {
      if (err) {
        console.error('Error fetching driver profile:', err);
        res.status(500).json({ error: 'Failed to fetch driver profile' });
        return;
      }
      res.json(row);
    });
  } catch (error) {
    console.error('Server error in /api/driver-profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    db.close();
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
      WITH RaceFastestLaps AS (
        SELECT 
          race_id,
          MIN(fastest_lap_time) as race_fastest_lap
        FROM race_results
        WHERE fastest_lap_time IS NOT NULL
        GROUP BY race_id
      )
      SELECT 
        r.round,
        r.name as race_name,
        rr.grid,
        rr.position,
        rr.points,
        rr.laps,
        rr.status,
        rr.time,
        rr.fastest_lap_time,
        CASE 
          WHEN rr.fastest_lap_time = rfl.race_fastest_lap THEN 1 
          ELSE 0 
        END as fastest_lap,
        c.name as constructor_name
      FROM race_results rr
      JOIN races r ON rr.race_id = r.race_id
      JOIN constructors c ON rr.constructor_id = c.constructor_id
      LEFT JOIN RaceFastestLaps rfl ON rr.race_id = rfl.race_id
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

// Get sprint results for a driver
app.get('/api/sprint-results/:driverId', async (req, res) => {
  const { driverId } = req.params;
  const db = new sqlite3.Database('./backend/sqlite.db');

  try {
    const query = `
      SELECT 
        r.round,
        r.name as race_name,
        sr.position,
        sr.points,
        c.name as constructor_name
      FROM sprint_results sr
      JOIN races r ON sr.race_id = r.race_id
      JOIN race_results rr ON sr.race_id = rr.race_id AND sr.driver_id = rr.driver_id
      JOIN constructors c ON rr.constructor_id = c.constructor_id
      WHERE sr.driver_id = ?
      ORDER BY r.round
    `;

    db.all(query, [driverId], (err, rows) => {
      if (err) {
        console.error('Error fetching sprint results:', err);
        res.status(500).json({ error: 'Failed to fetch sprint results' });
        return;
      }
      res.json(rows);
    });
  } catch (error) {
    console.error('Server error in /api/sprint-results:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    db.close();
  }
});

// Get constructor points progression
app.get('/api/constructor-stats/:constructorId', async (req, res) => {
  const { constructorId } = req.params;
  const { year } = req.query;
  console.log('Fetching stats for constructor:', constructorId, 'year:', year);
  
  const db = new sqlite3.Database('./backend/sqlite.db');

  try {
    // Get points progression
    const getPoints = () => {
      return new Promise((resolve, reject) => {
        const yearFilter = year ? 'AND s.year = ?' : '';
        const params = [constructorId, constructorId];  
        if (year) {
          params.push(year);  
        }

        db.all(`
          SELECT 
            r.round,
            r.name as raceName,
            COALESCE(rr.points, 0) as race_points,
            COALESCE(sr.points, 0) as sprint_points,
            COALESCE(rr.points, 0) + COALESCE(sr.points, 0) as points
          FROM races r
          JOIN seasons s ON r.season_id = s.season_id
          LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.constructor_id = ?
          LEFT JOIN sprint_results sr ON r.race_id = sr.race_id AND sr.constructor_id = ?
          WHERE 1=1 ${yearFilter}
          ORDER BY s.year, r.round
        `, params, (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        });
      });
    };

    // Get season stats
    const getStats = () => {
      return new Promise((resolve, reject) => {
        const yearFilter = year ? 'AND s.year = ?' : '';
        const params = [constructorId, constructorId];  
        if (year) {
          params.push(year);  
        }

        db.get(`
          SELECT 
            COUNT(DISTINCT r.race_id) as totalRaces,
            COUNT(CASE WHEN rr.position = 1 THEN 1 END) as wins,
            COUNT(CASE WHEN rr.position <= 3 THEN 1 END) as podiums,
            COUNT(CASE WHEN rr.position <= 10 THEN 1 END) as pointFinishes,
            COUNT(CASE WHEN rr.position IS NOT NULL THEN 1 END) as finishedRaces,
            ROUND(AVG(CASE WHEN rr.position IS NOT NULL THEN rr.position END), 2) as avgFinishPosition,
            SUM(COALESCE(rr.points, 0) + COALESCE(sr.points, 0)) as totalPoints
          FROM races r
          JOIN seasons s ON r.season_id = s.season_id
          LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.constructor_id = ?
          LEFT JOIN sprint_results sr ON r.race_id = sr.race_id AND sr.constructor_id = ?
          WHERE 1=1 ${yearFilter}
        `, params, (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });
    };

    Promise.all([getPoints(), getStats()])
      .then(([pointsData, statsData]) => {
        res.json({
          pointsProgression: pointsData,
          stats: statsData
        });
      })
      .catch(error => {
        console.error('Database query error:', error);
        res.status(500).json({ error: 'Database query failed' });
      });

  } catch (error) {
    console.error('Server error in /api/constructor-stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    db.close();
  }
});

app.get('/api/constructor-driver-points/:constructorId', async (req, res) => {
  const { constructorId } = req.params;
  const { year } = req.query;
  const db = new sqlite3.Database('./backend/sqlite.db');

  const yearFilter = year ? 'AND s.year = ?' : '';
  const params = year ? [constructorId, year] : [constructorId];

  try {
    db.all(`
      SELECT 
        d.forename || ' ' || d.surname as driver_name,
        r.round,
        r.name as race_name,
        COALESCE(rr.points, 0) as race_points,
        COALESCE(sr.points, 0) as sprint_points,
        COALESCE(rr.points, 0) + COALESCE(sr.points, 0) as total_points
      FROM races r
      JOIN seasons s ON r.season_id = s.season_id
      JOIN race_results rr ON r.race_id = rr.race_id
      LEFT JOIN sprint_results sr ON r.race_id = sr.race_id AND sr.driver_id = rr.driver_id
      JOIN drivers d ON rr.driver_id = d.driver_id
      WHERE rr.constructor_id = ? ${yearFilter}
      ORDER BY s.year, r.round, d.surname
    `, params, (err, rows) => {
      if (err) {
        console.error('Error fetching constructor driver points:', err);
        res.status(500).json({ error: 'Failed to fetch constructor driver points' });
        return;
      }
      res.json(rows);
    });
  } catch (error) {
    console.error('Server error in /api/constructor-driver-points:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available constructors with their years
app.get('/api/constructors', async (req, res) => {
  const { year } = req.query;
  const db = new sqlite3.Database('./backend/sqlite.db');

  try {
    // First, get all available years
    db.all(`
      SELECT DISTINCT s.year
      FROM seasons s
      JOIN races r ON s.season_id = r.season_id
      JOIN race_results rr ON r.race_id = rr.race_id
      ORDER BY s.year DESC
    `, [], (yearErr, yearRows) => {
      if (yearErr) {
        console.error('Error fetching years:', yearErr);
        res.status(500).json({ error: 'Failed to fetch years' });
        return;
      }

      const years = yearRows.map(row => row.year);
      
      // Then get constructors, filtered by year if specified
      const yearFilter = year ? 'AND s.year = ?' : '';
      const params = year ? [year] : [];
      
      db.all(`
        SELECT DISTINCT 
          c.constructor_id,
          c.name,
          c.nationality,
          GROUP_CONCAT(DISTINCT s.year) as years
        FROM constructors c
        JOIN race_results rr ON c.constructor_id = rr.constructor_id
        JOIN races r ON rr.race_id = r.race_id
        JOIN seasons s ON r.season_id = s.season_id
        WHERE 1=1 ${yearFilter}
        GROUP BY c.constructor_id
        ORDER BY c.name
      `, params, (err, rows) => {
        if (err) {
          console.error('Error fetching constructors:', err);
          res.status(500).json({ error: 'Failed to fetch constructors' });
          return;
        }
        
        // Process years into array for each constructor
        const processedRows = rows.map(row => ({
          ...row,
          years: row.years.split(',').map(Number).sort((a, b) => b - a)
        }));
        
        res.json({
          years,
          constructors: processedRows
        });
      });
    });
  } catch (error) {
    console.error('Error fetching constructors:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      }
    });
  }
});

// Get constructor profile
app.get('/api/constructor-profile/:constructorId', async (req, res) => {
  const { constructorId } = req.params;
  const db = new sqlite3.Database('./backend/sqlite.db');

  try {
    const query = `
      WITH ConstructorStanding AS (
        SELECT 
          constructor_id,
          SUM(points) as total_points,
          RANK() OVER (ORDER BY SUM(points) DESC) as championship_position
        FROM race_results
        GROUP BY constructor_id
      )
      SELECT 
        c.*,
        cs.championship_position,
        cs.total_points
      FROM constructors c
      LEFT JOIN ConstructorStanding cs ON c.constructor_id = cs.constructor_id
      WHERE c.constructor_id = ?
    `;

    db.get(query, [constructorId], (err, row) => {
      if (err) {
        console.error('Error fetching constructor profile:', err);
        res.status(500).json({ error: 'Failed to fetch constructor profile' });
        return;
      }
      res.json(row);
    });
  } catch (error) {
    console.error('Server error in /api/constructor-profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    db.close();
  }
});

// Get constructor drivers
app.get('/api/constructor-drivers/:constructorId', async (req, res) => {
  const { constructorId } = req.params;
  const { year } = req.query;
  const db = new sqlite3.Database('./backend/sqlite.db');

  try {
    const yearFilter = year ? 'AND s.year = ?' : '';
    const params = year ? [constructorId, year] : [constructorId];

    db.all(`
      SELECT DISTINCT 
        d.driver_id,
        d.code,
        d.forename,
        d.surname,
        d.nationality,
        d.url
      FROM drivers d
      JOIN race_results rr ON d.driver_id = rr.driver_id
      JOIN races r ON rr.race_id = r.race_id
      JOIN seasons s ON r.season_id = s.season_id
      WHERE rr.constructor_id = ? ${yearFilter}
      ORDER BY d.surname
    `, params, (err, rows) => {
      if (err) {
        console.error('Error fetching constructor drivers:', err);
        res.status(500).json({ error: 'Failed to fetch constructor drivers' });
        return;
      }
      res.json(rows);
    });
  } catch (error) {
    console.error('Error in /api/constructor-drivers:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    db.close();
  }
});

// Get constructor race results
app.get('/api/constructor-race-results/:constructorId', async (req, res) => {
  const { constructorId } = req.params;
  const { year } = req.query;
  const db = new sqlite3.Database('./backend/sqlite.db');

  const yearFilter = year ? 'AND s.year = ?' : '';
  const params = year ? [constructorId, year] : [constructorId];

  try {
    db.all(`
      SELECT 
        r.round,
        r.name as raceName,
        d.forename || ' ' || d.surname as driverName,
        rr.position,
        rr.points,
        rr.grid,
        rr.status
      FROM races r
      JOIN seasons s ON r.season_id = s.season_id
      JOIN race_results rr ON r.race_id = rr.race_id
      JOIN drivers d ON rr.driver_id = d.driver_id
      WHERE rr.constructor_id = ? ${yearFilter}
      ORDER BY s.year, r.round, rr.position
    `, params, (err, rows) => {
      if (err) {
        console.error('Error fetching race results:', err);
        res.status(500).json({ error: 'Failed to fetch race results' });
        return;
      }
      res.json(rows);
    });
  } catch (error) {
    console.error('Server error in /api/constructor-race-results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get constructor qualifying results
app.get('/api/constructor-qualifying-results/:constructorId', async (req, res) => {
  const { constructorId } = req.params;
  const { year } = req.query;
  const db = new sqlite3.Database('./backend/sqlite.db');

  try {
    const yearFilter = year ? 'AND s.year = ?' : '';
    const params = [constructorId, ...(year ? [year] : [])];

    db.all(`
      SELECT 
        r.round,
        r.name as raceName,
        d.forename || ' ' || d.surname as driverName,
        q.position,
        q.q1_time as q1,
        q.q2_time as q2,
        q.q3_time as q3
      FROM qualifying_results q
      JOIN races r ON q.race_id = r.race_id
      JOIN seasons s ON r.season_id = s.season_id
      JOIN drivers d ON q.driver_id = d.driver_id
      WHERE q.constructor_id = ? ${yearFilter}
      ORDER BY s.year DESC, r.round ASC
    `, params, (err, rows) => {
      if (err) {
        console.error('Error fetching qualifying results:', err);
        res.status(500).json({ error: 'Failed to fetch qualifying results' });
        return;
      }
      res.json(rows);
    });
  } catch (error) {
    console.error('Server error in /api/constructor-qualifying-results:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    db.close();
  }
});

// Get constructor sprint results
app.get('/api/constructor-sprint-results/:constructorId', async (req, res) => {
  const { constructorId } = req.params;
  const { year } = req.query;
  const db = new sqlite3.Database('./backend/sqlite.db');

  const yearFilter = year ? 'AND s.year = ?' : '';
  const params = year ? [constructorId, year] : [constructorId];

  try {
    db.all(`
      SELECT 
        r.round,
        r.name as raceName,
        d.forename || ' ' || d.surname as driverName,
        sr.position,
        sr.points,
        sr.grid,
        sr.status
      FROM races r
      JOIN seasons s ON r.season_id = s.season_id
      JOIN sprint_results sr ON r.race_id = sr.race_id
      JOIN race_results rr ON r.race_id = rr.race_id AND rr.driver_id = sr.driver_id
      JOIN drivers d ON sr.driver_id = d.driver_id
      WHERE rr.constructor_id = ? ${yearFilter}
      ORDER BY s.year, r.round, sr.position
    `, params, (err, rows) => {
      if (err) {
        console.error('Error fetching sprint results:', err);
        res.status(500).json({ error: 'Failed to fetch sprint results' });
        return;
      }
      res.json(rows);
    });
  } catch (error) {
    console.error('Server error in /api/constructor-sprint-results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
