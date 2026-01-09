import { sql } from '../_db.js';

export default async function handler(req, res) {
  try {
    const { driverId } = req.query;
    const { year } = req.query;

    let result;
    if (year) {
      result = await sql`
        WITH RaceFastestLaps AS (
          SELECT 
            race_id,
            MIN(fastest_lap_time) AS race_fastest_lap
          FROM race_results
          WHERE fastest_lap_time IS NOT NULL
          GROUP BY race_id
        )
        SELECT 
          r.round,
          r.name AS race_name,
          rr.grid,
          rr.position,
          rr.points,
          rr.laps,
          rr.status,
          rr.time,
          rr.fastest_lap_time,
          CASE WHEN rr.fastest_lap_time = rfl.race_fastest_lap THEN 1 ELSE 0 END AS fastest_lap,
          c.name AS constructor_name
        FROM race_results rr
        JOIN races r ON rr.race_id = r.race_id
        JOIN seasons s ON r.season_id = s.season_id
        JOIN constructors c ON rr.constructor_id = c.constructor_id
        LEFT JOIN RaceFastestLaps rfl ON rr.race_id = rfl.race_id
        WHERE rr.driver_id = ${driverId} AND s.year = ${year}
        ORDER BY r.round
      `;
    } else {
      result = await sql`
        WITH RaceFastestLaps AS (
          SELECT 
            race_id,
            MIN(fastest_lap_time) AS race_fastest_lap
          FROM race_results
          WHERE fastest_lap_time IS NOT NULL
          GROUP BY race_id
        )
        SELECT 
          r.round,
          r.name AS race_name,
          rr.grid,
          rr.position,
          rr.points,
          rr.laps,
          rr.status,
          rr.time,
          rr.fastest_lap_time,
          CASE WHEN rr.fastest_lap_time = rfl.race_fastest_lap THEN 1 ELSE 0 END AS fastest_lap,
          c.name AS constructor_name
        FROM race_results rr
        JOIN races r ON rr.race_id = r.race_id
        JOIN seasons s ON r.season_id = s.season_id
        JOIN constructors c ON rr.constructor_id = c.constructor_id
        LEFT JOIN RaceFastestLaps rfl ON rr.race_id = rfl.race_id
        WHERE rr.driver_id = ${driverId}
        ORDER BY r.round
      `;
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error in /api/race-results/[driverId]:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
