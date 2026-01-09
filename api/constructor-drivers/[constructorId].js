import { sql } from '../_db.js';

export default async function handler(req, res) {
  try {
    const { constructorId } = req.query;
    const { year } = req.query;

    const yearFilter = year ? sql`AND s.year = ${year}` : sql``;

    const result = await sql`
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
      WHERE rr.constructor_id = ${constructorId} ${yearFilter}
      ORDER BY d.surname
    `;

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error in /api/constructor-drivers/[constructorId]:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
