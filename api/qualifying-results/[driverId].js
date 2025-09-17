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
          qr.position,
          qr.q1_time,
          qr.q2_time,
          qr.q3_time,
          c.name AS constructor_name
        FROM qualifying_results qr
        JOIN races r ON qr.race_id = r.race_id
        JOIN seasons s ON r.season_id = s.season_id
        JOIN constructors c ON qr.constructor_id = c.constructor_id
        WHERE qr.driver_id = ${driverId} AND s.year = ${year}
        ORDER BY r.round
      `;
    } else {
      result = await sql`
        SELECT 
          r.round,
          r.name AS race_name,
          qr.position,
          qr.q1_time,
          qr.q2_time,
          qr.q3_time,
          c.name AS constructor_name
        FROM qualifying_results qr
        JOIN races r ON qr.race_id = r.race_id
        JOIN constructors c ON qr.constructor_id = c.constructor_id
        WHERE qr.driver_id = ${driverId}
        ORDER BY r.round
      `;
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error in /api/qualifying-results/[driverId]:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
