import { sql } from '../_db.js';

export default async function handler(req, res) {
  try {
    const { constructorId } = req.query;
    const { year } = req.query;

    const yearFilter = year ? sql`AND s.year = ${year}` : sql``;

    const result = await sql`
      SELECT 
        r.round,
        r.name AS "raceName",
        d.forename || ' ' || d.surname AS "driverName",
        sr.position,
        sr.points,
        sr.grid,
        sr.status
      FROM races r
      JOIN seasons s ON r.season_id = s.season_id
      JOIN sprint_results sr ON r.race_id = sr.race_id
      JOIN race_results rr ON r.race_id = rr.race_id AND rr.driver_id = sr.driver_id
      JOIN drivers d ON sr.driver_id = d.driver_id
      WHERE rr.constructor_id = ${constructorId} ${yearFilter}
      ORDER BY s.year, r.round, sr.position
    `;

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error in /api/constructor-sprint-results/[constructorId]:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
