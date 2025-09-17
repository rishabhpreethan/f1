import { sql } from '../_db.js';

export default async function handler(req, res) {
  try {
    const { constructorId } = req.query;

    const result = await sql`
      WITH ConstructorStanding AS (
        SELECT 
          constructor_id,
          SUM(points) AS total_points,
          RANK() OVER (ORDER BY SUM(points) DESC) AS championship_position
        FROM race_results
        GROUP BY constructor_id
      )
      SELECT 
        c.*,
        cs.championship_position,
        cs.total_points
      FROM constructors c
      LEFT JOIN ConstructorStanding cs ON c.constructor_id = cs.constructor_id
      WHERE c.constructor_id = ${constructorId}
      LIMIT 1
    `;

    res.status(200).json(result.rows[0] || null);
  } catch (err) {
    console.error('Error in /api/constructor-profile/[constructorId]:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
