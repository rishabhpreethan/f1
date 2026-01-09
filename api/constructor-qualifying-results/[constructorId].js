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
        q.position,
        q.q1_time AS q1,
        q.q2_time AS q2,
        q.q3_time AS q3
      FROM qualifying_results q
      JOIN races r ON q.race_id = r.race_id
      JOIN seasons s ON r.season_id = s.season_id
      JOIN drivers d ON q.driver_id = d.driver_id
      WHERE q.constructor_id = ${constructorId} ${yearFilter}
      ORDER BY s.year DESC, r.round ASC
    `;

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error in /api/constructor-qualifying-results/[constructorId]:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
