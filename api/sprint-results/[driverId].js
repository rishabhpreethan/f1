import { sql } from '../_db.js';

export default async function handler(req, res) {
  try {
    const { driverId } = req.query;
    const { year } = req.query;

    let result;
    if (year) {
      result = await sql`
        SELECT 
          r.round,
          r.name AS race_name,
          sr.position,
          sr.points,
          c.name AS constructor_name
        FROM sprint_results sr
        JOIN races r ON sr.race_id = r.race_id
        JOIN seasons s ON r.season_id = s.season_id
        JOIN race_results rr ON sr.race_id = rr.race_id AND sr.driver_id = rr.driver_id
        JOIN constructors c ON rr.constructor_id = c.constructor_id
        WHERE sr.driver_id = ${driverId} AND s.year = ${year}
        ORDER BY r.round
      `;
    } else {
      result = await sql`
        SELECT 
          r.round,
          r.name AS race_name,
          sr.position,
          sr.points,
          c.name AS constructor_name
        FROM sprint_results sr
        JOIN races r ON sr.race_id = r.race_id
        JOIN seasons s ON r.season_id = s.season_id
        JOIN race_results rr ON sr.race_id = rr.race_id AND sr.driver_id = rr.driver_id
        JOIN constructors c ON rr.constructor_id = c.constructor_id
        WHERE sr.driver_id = ${driverId}
        ORDER BY r.round
      `;
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error in /api/sprint-results/[driverId]:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
