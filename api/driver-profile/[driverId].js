import { sql } from '../_db.js';

export default async function handler(req, res) {
  try {
    const { driverId } = req.query;

    const result = await sql`
      WITH last_result AS (
        SELECT rr.*
        FROM race_results rr
        JOIN races ra ON rr.race_id = ra.race_id
        WHERE rr.driver_id = ${driverId}
        ORDER BY ra.date DESC
        LIMIT 1
      )
      SELECT 
        d.*,
        c.name AS constructor_name,
        c.nationality AS constructor_nationality,
        lr.position AS current_position,
        lr.points AS current_points
      FROM drivers d
      LEFT JOIN last_result lr ON d.driver_id = lr.driver_id
      LEFT JOIN constructors c ON lr.constructor_id = c.constructor_id
      WHERE d.driver_id = ${driverId}
      LIMIT 1
    `;

    res.status(200).json(result.rows[0] || null);
  } catch (err) {
    console.error('Error in /api/driver-profile/[driverId]:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
