import { sql } from '../_db.js';

export default async function handler(req, res) {
  try {
    const { constructorId } = req.query;
    const { year } = req.query;

    const yearFilter = year ? sql`AND s.year = ${year}` : sql``;

    const result = await sql`
      SELECT 
        d.forename || ' ' || d.surname AS driver_name,
        r.round,
        r.name AS race_name,
        COALESCE(rr.points, 0) AS race_points,
        COALESCE(sr.points, 0) AS sprint_points,
        COALESCE(rr.points, 0) + COALESCE(sr.points, 0) AS total_points
      FROM races r
      JOIN seasons s ON r.season_id = s.season_id
      JOIN race_results rr ON r.race_id = rr.race_id
      LEFT JOIN sprint_results sr ON r.race_id = sr.race_id AND sr.driver_id = rr.driver_id
      JOIN drivers d ON rr.driver_id = d.driver_id
      WHERE rr.constructor_id = ${constructorId} ${yearFilter}
      ORDER BY s.year, r.round, d.surname
    `;

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error in /api/constructor-driver-points/[constructorId]:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
